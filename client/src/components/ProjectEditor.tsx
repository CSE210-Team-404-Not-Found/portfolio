import { useEffect, useState, type FormEvent } from 'react'
import {
  Client,
  getBlobCidString,
  getBlobMime,
  XrpcResponseError,
  type DidString,
} from '@atproto/lex'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { Heading2, Heading3, Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import { LinkDialog } from '../editor/LinkDialog.tsx'
import { generateHTML } from '@tiptap/core'
import { projectExtensions, isYoutubeUrl } from '../editor/extensions.ts'
import { MediaControls } from '../editor/MediaControls.tsx'
import { ProjectPreview } from '../editor/ProjectPreview.tsx'
import { hydrateDocument, insertMediaFile, MAX_DOCUMENT_SIZE, prepareDocument, validateMedia, walkDocument, type MediaRef } from '../editor/media.ts'
import projectLexicon, { type Main as ProjectRecord } from '../lexicons/com/at-folio/temp/project.js'

type ProjectItem = {
  uri: string
  value: ProjectRecord
}

type ProjectFields = {
  title: string
  summary: string
}

const EMPTY_FIELDS: ProjectFields = { title: '', summary: '' }
const MAX_THUMBNAIL_SIZE = 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

/** Basic project editing, backed by the signed-in account’s project records. */
export function ProjectEditor({ did, authorName = did }: { did: string; authorName?: string }) {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [projectThumbnailUrls, setProjectThumbnailUrls] = useState<Record<string, string>>({})
  const [fields, setFields] = useState<ProjectFields>(EMPTY_FIELDS)
  const [thumbnail, setThumbnail] = useState<ProjectRecord['thumbnail']>()
  const [thumbnailUrl, setThumbnailUrl] = useState<string>()
  const [thumbnailFile, setThumbnailFile] = useState<File>()
  const [thumbnailPreview, setThumbnailPreview] = useState<string>()
  const [editingUri, setEditingUri] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [reload, setReload] = useState(0)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [mediaRefs, setMediaRefs] = useState<MediaRef[]>([])
  const [mediaBusy, setMediaBusy] = useState(false)
  const [opening, setOpening] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const editor = useEditor({
    extensions: projectExtensions(),
    content: '',
    editorProps: {
      handlePaste: (view, event) => {
        if (!view.editable) return false
        const src = event.clipboardData?.getData('text/plain').trim()
        if (!src || !isYoutubeUrl(src)) return false
        const node = view.state.schema.nodes.youtube.create({ src })
        view.dispatch(view.state.tr.replaceSelectionWith(node))
        return true
      },
      handleDrop: (view, event, moved) => {
        const file = event.dataTransfer?.files[0]
        if (moved || !file) return false
        event.preventDefault()
        if (!view.editable || mediaBusy || opening) return true
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        setMediaBusy(true)
        setError(undefined)
        if (editor) void insertMediaFile(editor, file, position).catch(error => setError(error instanceof Error ? error.message : 'Could not add this file.')).finally(() => setMediaBusy(false))
        return true
      },
      attributes: {
        role: 'textbox',
        'aria-label': 'Description',
        'aria-multiline': 'true',
        class: 'project-description',
      },
    },
  })
  const formatting = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      heading: editor?.isActive('heading', { level: 2 }) ?? false,
      subheading: editor?.isActive('heading', { level: 3 }) ?? false,
      bulletList: editor?.isActive('bulletList') ?? false,
      orderedList: editor?.isActive('orderedList') ?? false,
      link: editor?.isActive('link') ?? false,
    }),
  })

  useEffect(() => {
    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl)
    }
  }, [thumbnailUrl])

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [thumbnailPreview])

  useEffect(() => {
    let active = true
    let previewUrls: string[] = []
    async function loadProjects() {
      setLoading(true)
      setError(undefined)
      try {
        const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
        const client = new Client(await restoreOAuthSession(did))
        const result: ProjectItem[] = []
        for await (const item of client.listAll(projectLexicon)) {
          if (item.valid) result.push({ uri: item.uri, value: item.value })
        }
        if (active) setProjects(result)
        const urls: Record<string, string> = {}
        await Promise.all(result.map(async (project) => {
          const ref = project.value.thumbnail
          const cid = ref && getBlobCidString(ref)
          if (!cid) return
          try {
            const response = await client.getBlob(did as DidString, cid)
            const image = new Blob([response.body.slice().buffer as ArrayBuffer], { type: getBlobMime(ref) })
            urls[project.uri] = URL.createObjectURL(image)
          } catch {
            // Keep the project preview visible if its optional thumbnail is unavailable.
          }
        }))
        previewUrls = Object.values(urls)
        if (active) setProjectThumbnailUrls(urls)
        else previewUrls.forEach(URL.revokeObjectURL)
      } catch {
        if (active) setError('Could not load projects. Check your connection and try again.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadProjects()
    return () => {
      active = false
      previewUrls.forEach(URL.revokeObjectURL)
    }
  }, [did, reload])

  async function editProject(project: ProjectItem) {
    setError(undefined)
    setNotice(undefined)
    setOpening(true)
    editor?.setEditable(false)
    try {
      const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
      const client = new Client(await restoreOAuthSession(did))
      const readTextBlob = async (ref: NonNullable<ProjectRecord['tiptapJson']>) => {
        const cid = getBlobCidString(ref)
        if (!cid) return ''
        const response = await client.getBlob(did as DidString, cid)
        return new TextDecoder().decode(response.body)
      }
      const jsonText = project.value.tiptapJson ? await readTextBlob(project.value.tiptapJson) : ''
      if (!editor) return
      const document = jsonText ? await hydrateDocument(JSON.parse(jsonText), client, did, project.value.media ?? []) : { type: 'doc', content: [{ type: 'paragraph' }] }
      let hasModel = false
      walkDocument(document, node => { if (node.type === 'model3d') hasModel = true })
      if (hasModel) await import('@google/model-viewer')
      let coverUrl: string | undefined
      if (project.value.thumbnail) {
        try {
          const cid = getBlobCidString(project.value.thumbnail)
          if (cid) {
            const response = await client.getBlob(did as DidString, cid)
            coverUrl = URL.createObjectURL(new Blob([response.body.slice().buffer as ArrayBuffer], { type: getBlobMime(project.value.thumbnail) }))
          }
        } catch { /* An unavailable cover should not prevent editing the project. */ }
      }
      editor.commands.setContent(document, { errorOnInvalidContent: true })
      setMediaRefs(project.value.media ?? [])
      setFields({ title: project.value.title, summary: project.value.summary })
      setLinkDialogOpen(false)
      setThumbnail(project.value.thumbnail)
      setThumbnailUrl(coverUrl)
      setThumbnailPreview(undefined)
      setThumbnailFile(undefined)
      setEditingUri(project.uri)
    } catch {
      setError('Could not open this project for editing. Check the connection and document format.')
    } finally {
      setOpening(false)
      editor?.setEditable(true)
    }
  }

  function resetForm() {
    setFields(EMPTY_FIELDS)
    editor?.commands.clearContent()
    setMediaRefs([])
    setPreviewing(false)
    setLinkDialogOpen(false)
    setEditingUri(undefined)
    setThumbnail(undefined)
    setThumbnailUrl(undefined)
    setThumbnailFile(undefined)
    setThumbnailPreview(undefined)
    setError(undefined)
    setNotice(undefined)
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor || mediaBusy || opening) return
    setSaving(true)
    editor.setEditable(false)
    setError(undefined)
    setNotice(undefined)
    try {
      if (!fields.title.trim() || !fields.summary.trim()) {
        throw new Error('required-fields')
      }
      if (editor.getText().length > 20_000) throw new Error('description-too-long')
      const draft = editor.getJSON()
      validateMedia(draft)
      const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
      const session = await restoreOAuthSession(did)
      const client = new Client(session)
      let hasMedia = false
      walkDocument(draft, node => { if (['image', 'audioRecording', 'model3d'].includes(node.type ?? '')) hasMedia = true })
      const pds = hasMedia ? (await session.getTokenInfo()).aud : window.location.origin
      const prepared = await prepareDocument(draft, client, did, pds, mediaRefs)
      const jsonText = JSON.stringify(prepared.document)
      const htmlText = generateHTML(prepared.document, projectExtensions())
      if (new TextEncoder().encode(jsonText).byteLength > MAX_DOCUMENT_SIZE || new TextEncoder().encode(htmlText).byteLength > MAX_DOCUMENT_SIZE) {
        throw new Error('document-too-large')
      }
      const uploadedThumbnail = thumbnailFile
        ? (await client.uploadBlob(thumbnailFile, { encoding: thumbnailFile.type as ImageMimeType })).body.blob
        : undefined
      const uploadedJson = jsonText
        ? (await client.uploadBlob(new Blob([jsonText], { type: 'application/json' }), { encoding: 'application/json' })).body.blob
        : undefined
      const uploadedHtml = htmlText
        ? (await client.uploadBlob(new Blob([htmlText], { type: 'text/html' }), { encoding: 'text/html' })).body.blob
        : undefined
      const value: ProjectRecord = {
        $type: 'com.at-folio.temp.project',
        title: fields.title.trim(),
        summary: fields.summary.trim(),
        descriptionFormat: 'tiptap-media-v1',
        ...(prepared.media.length ? { media: prepared.media } : {}),
        ...(uploadedThumbnail ?? thumbnail ? { thumbnail: uploadedThumbnail ?? thumbnail } : {}),
        ...(uploadedJson ? { tiptapJson: uploadedJson } : {}),
        ...(uploadedHtml ? { tiptapHtml: uploadedHtml } : {}),
      }
      const wasEditing = Boolean(editingUri)
      if (editingUri) {
        const rkey = editingUri.slice(editingUri.lastIndexOf('/') + 1)
        await client.put(projectLexicon, value, { rkey, validateRequest: true })
      } else {
        await client.create(projectLexicon, value, { validateRequest: true })
      }
      resetForm()
      setNotice(wasEditing ? 'Project updated.' : 'Project created.')
      setReload((current) => current + 1)
    } catch (cause) {
      if (cause instanceof Error && cause.message === 'required-fields') setError('Enter a title and summary.')
      else if (cause instanceof Error && cause.message === 'description-too-long') setError('Description must be 20,000 characters or fewer.')
      else if (cause instanceof Error && cause.message === 'document-too-large') setError('Description is too large to save (500 KB limit).')
      else if (cause instanceof XrpcResponseError && [401, 403].includes(cause.status)) {
        setError('This session cannot write project records or upload these files. Sign out and sign in again to grant project access.')
      } else setError(cause instanceof Error && !('status' in cause) ? cause.message : 'Could not save the project. Check the required fields and try again.')
    } finally {
      setSaving(false)
      editor.setEditable(true)
    }
  }

  async function deleteProject(uri: string) {
    setError(undefined)
    setNotice(undefined)
    try {
      const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
      const client = new Client(await restoreOAuthSession(did))
      await client.delete(projectLexicon, { rkey: uri.slice(uri.lastIndexOf('/') + 1) })
      if (editingUri === uri) resetForm()
      setNotice('Project deleted.')
      setReload((current) => current + 1)
    } catch (cause) {
      if (cause instanceof XrpcResponseError && [401, 403].includes(cause.status)) {
        setError('This session cannot delete project records. Sign out and sign in again to grant project access.')
      } else setError('Could not delete the project. Check your connection and try again.')
    }
  }

  function chooseThumbnail(file?: File) {
    if (!file) return
    if (!IMAGE_TYPES.has(file.type)) {
      setError('Choose a JPEG, PNG, WebP, or GIF thumbnail.')
      return
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      setError('Thumbnails must be 1 MB or smaller.')
      return
    }
    setError(undefined)
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  return (
    <section className="project-editor" aria-labelledby="project-editor-title">
      <div className="project-heading"><div><p className="preview-eyebrow">YOUR WORKSPACE</p><h2 id="project-editor-title">Project editor</h2></div><button type="button" disabled={!editor || saving || opening || mediaBusy} onClick={() => setPreviewing(!previewing)}>{previewing ? 'Edit project' : 'Preview project'}</button></div>
      {previewing && editor && <ProjectPreview title={fields.title} summary={fields.summary} cover={thumbnailPreview ?? thumbnailUrl} author={authorName} content={editor.getJSON()} onClose={() => setPreviewing(false)} />}
      <p className="project-editor-hint">Tell the story of your project. Save it to your portfolio when you’re ready.</p>
      <form className="project-form" hidden={previewing} onSubmit={(event) => void saveProject(event)}>
        <fieldset className="project-fields" disabled={saving || opening}>
        <label htmlFor="project-title">Title</label>
        <input id="project-title" required maxLength={100} value={fields.title} onChange={(event) => setFields({ ...fields, title: event.target.value })} />
        <label htmlFor="project-summary">Summary</label>
        <textarea id="project-summary" required maxLength={200} rows={3} value={fields.summary} onChange={(event) => setFields({ ...fields, summary: event.target.value })} />
        <label htmlFor="project-thumbnail">Thumbnail (optional, up to 1 MB)</label>
        <input id="project-thumbnail" type="file" accept="image/*" onChange={(event) => chooseThumbnail(event.target.files?.[0])} />
        {(thumbnailPreview || thumbnailUrl) && <img className="project-thumbnail-preview" src={thumbnailPreview ?? thumbnailUrl} alt="Project thumbnail preview" />}
        <span id="project-description-label" className="project-field-label">Description</span>
        <div className="project-rich-text" aria-labelledby="project-description-label">
          <div className="project-toolbar" role="group" aria-label="Text formatting">
            <button type="button" className="editor-icon-button" aria-label="Heading" title="Heading" aria-pressed={formatting?.heading} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={20} aria-hidden="true" /></button>
            <button type="button" className="editor-icon-button" aria-label="Subheading" title="Subheading" aria-pressed={formatting?.subheading} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={20} aria-hidden="true" /></button>
            <button type="button" className="editor-icon-button" aria-label="Bold" title="Bold" aria-pressed={formatting?.bold} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={20} aria-hidden="true" /></button>
            <button type="button" className="editor-icon-button" aria-label="Italic" title="Italic" aria-pressed={formatting?.italic} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={20} aria-hidden="true" /></button>
            <button type="button" className="editor-icon-button" aria-label="Bullet list" title="Bullet list" aria-pressed={formatting?.bulletList} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={20} aria-hidden="true" /></button>
            <button type="button" className="editor-icon-button" aria-label="Numbered list" title="Numbered list" aria-pressed={formatting?.orderedList} onMouseDown={event => event.preventDefault()} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={20} aria-hidden="true" /></button>
            <span className="editor-toolbar-divider" aria-hidden="true" />
            <button type="button" className="editor-icon-button" aria-label="Add link" title="Add or edit link" aria-pressed={formatting?.link} onMouseDown={event => event.preventDefault()} onClick={() => setLinkDialogOpen(true)}><LinkIcon size={20} aria-hidden="true" /></button>
          </div>
          <EditorContent editor={editor} />
        </div>
        <MediaControls editor={editor} disabled={saving || opening} onError={setError} onBusyChange={setMediaBusy} />
        <p className="project-editor-hint">Select text to format it or add a link. Description limit: 20,000 characters.</p>
        <p className="project-editor-hint">Saving writes this project to your public AT Protocol account. Copies may remain after deletion.</p>
        <div className="project-form-actions">
          <button type="submit" disabled={saving || opening || mediaBusy || !editor}>{saving ? 'Saving…' : editingUri ? 'Update project' : 'Create project'}</button>
          {editingUri && <button type="button" onClick={resetForm} disabled={saving || opening || mediaBusy}>Cancel edit</button>}
        </div>
        </fieldset>
      </form>
      {linkDialogOpen && editor && <LinkDialog editor={editor} onClose={() => setLinkDialogOpen(false)} />}
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="profile-editor-notice" role="status">{notice}</p>}
      <h3>Your projects</h3>
      {loading ? <p>Loading projects…</p> : projects.length === 0 ? <p>No projects yet.</p> : (
        <ul className="project-list project-cards">
          {projects.map((project) => (
            <li key={project.uri}>
              {projectThumbnailUrls[project.uri] && (
                <img className="project-list-thumbnail" src={projectThumbnailUrls[project.uri]} alt={`${project.value.title} thumbnail`} />
              )}
              <div className="project-list-details"><strong>{project.value.title}</strong><p>{project.value.summary}</p></div>
              <div className="project-item-actions">
                <button type="button" disabled={saving || opening || mediaBusy} onClick={() => void editProject(project)}>Edit</button>
                <button type="button" disabled={saving || opening || mediaBusy} onClick={() => void deleteProject(project.uri)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
