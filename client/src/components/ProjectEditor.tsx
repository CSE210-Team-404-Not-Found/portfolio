import { useEffect, useState, type FormEvent } from 'react'
import {
  Client,
  getBlobCidString,
  getBlobMime,
  XrpcResponseError,
  type DidString,
} from '@atproto/lex'
import projectLexicon, { type Main as ProjectRecord } from '../lexicons/com/at-folio/temp/project.js'

type ProjectItem = {
  uri: string
  value: ProjectRecord
}

type ProjectFields = {
  title: string
  summary: string
  tiptapJson: string
  tiptapHtml: string
}

const EMPTY_FIELDS: ProjectFields = { title: '', summary: '', tiptapJson: '', tiptapHtml: '' }
const MAX_THUMBNAIL_SIZE = 1024 * 1024
const MAX_DOCUMENT_SIZE = 500_000
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

/** A small, route-free panel for exercising project record CRUD on the signed-in account. */
export function ProjectEditor({ did }: { did: string }) {
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
    try {
      const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
      const client = new Client(await restoreOAuthSession(did))
      const readTextBlob = async (ref: NonNullable<ProjectRecord['tiptapJson']>) => {
        const cid = getBlobCidString(ref)
        if (!cid) return ''
        const response = await client.getBlob(did as DidString, cid)
        return new TextDecoder().decode(response.body)
      }
      const [tiptapJson, tiptapHtml] = await Promise.all([
        project.value.tiptapJson ? readTextBlob(project.value.tiptapJson) : '',
        project.value.tiptapHtml ? readTextBlob(project.value.tiptapHtml) : '',
      ])
      setFields({ title: project.value.title, summary: project.value.summary, tiptapJson, tiptapHtml })
      setThumbnail(project.value.thumbnail)
      setThumbnailUrl(undefined)
      setThumbnailPreview(undefined)
      setThumbnailFile(undefined)
      if (project.value.thumbnail) {
        const cid = getBlobCidString(project.value.thumbnail)
        if (cid) {
          const response = await client.getBlob(did as DidString, cid)
          const blob = new Blob([response.body.slice().buffer as ArrayBuffer], { type: getBlobMime(project.value.thumbnail) })
          setThumbnailUrl(URL.createObjectURL(blob))
        }
      }
      setEditingUri(project.uri)
    } catch {
      setError('Could not open this project for editing.')
    }
  }

  function resetForm() {
    setFields(EMPTY_FIELDS)
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
    setSaving(true)
    setError(undefined)
    setNotice(undefined)
    try {
      const jsonText = fields.tiptapJson.trim()
      const htmlText = fields.tiptapHtml.trim()
      if (jsonText) JSON.parse(jsonText)
      if (new TextEncoder().encode(jsonText).byteLength > MAX_DOCUMENT_SIZE || new TextEncoder().encode(htmlText).byteLength > MAX_DOCUMENT_SIZE) {
        throw new Error('document-too-large')
      }
      const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
      const client = new Client(await restoreOAuthSession(did))
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
      if (cause instanceof SyntaxError) setError('Tiptap JSON must be valid JSON.')
      else if (cause instanceof Error && cause.message === 'document-too-large') setError('Tiptap JSON and HTML must each be 500 KB or smaller.')
      else if (cause instanceof XrpcResponseError && [401, 403].includes(cause.status)) {
        setError('This session cannot write project records or upload these files. Sign out and sign in again to grant project access.')
      } else setError('Could not save the project. Check the required fields and try again.')
    } finally {
      setSaving(false)
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
      <h2 id="project-editor-title">Project records</h2>
      <p className="project-editor-hint">Create, read, update, and delete records in your project collection.</p>
      <form className="project-form" onSubmit={(event) => void saveProject(event)}>
        <label htmlFor="project-title">Title</label>
        <input id="project-title" required maxLength={100} value={fields.title} onChange={(event) => setFields({ ...fields, title: event.target.value })} />
        <label htmlFor="project-summary">Summary</label>
        <textarea id="project-summary" required maxLength={200} rows={3} value={fields.summary} onChange={(event) => setFields({ ...fields, summary: event.target.value })} />
        <label htmlFor="project-thumbnail">Thumbnail (optional, up to 1 MB)</label>
        <input id="project-thumbnail" type="file" accept="image/*" onChange={(event) => chooseThumbnail(event.target.files?.[0])} />
        {(thumbnailPreview || thumbnailUrl) && <img className="project-thumbnail-preview" src={thumbnailPreview ?? thumbnailUrl} alt="Project thumbnail preview" />}
        <label htmlFor="project-tiptap-json">Tiptap JSON (optional, up to 500 KB)</label>
        <textarea id="project-tiptap-json" className="project-code" rows={8} value={fields.tiptapJson} onChange={(event) => setFields({ ...fields, tiptapJson: event.target.value })} placeholder='{"type":"doc","content":[]}' />
        <label htmlFor="project-tiptap-html">Tiptap HTML (optional, up to 500 KB)</label>
        <textarea id="project-tiptap-html" className="project-code" rows={6} value={fields.tiptapHtml} onChange={(event) => setFields({ ...fields, tiptapHtml: event.target.value })} />
        <div className="project-form-actions">
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingUri ? 'Update project' : 'Create project'}</button>
          {editingUri && <button type="button" onClick={resetForm} disabled={saving}>Cancel edit</button>}
        </div>
      </form>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="profile-editor-notice" role="status">{notice}</p>}
      <h3>Your projects</h3>
      {loading ? <p>Loading projects…</p> : projects.length === 0 ? <p>No project records yet.</p> : (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.uri}>
              {projectThumbnailUrls[project.uri] && (
                <img className="project-list-thumbnail" src={projectThumbnailUrls[project.uri]} alt={`${project.value.title} thumbnail`} />
              )}
              <div className="project-list-details"><strong>{project.value.title}</strong><p>{project.value.summary}</p></div>
              <div className="project-item-actions">
                <button type="button" onClick={() => void editProject(project)}>Edit</button>
                <button type="button" onClick={() => void deleteProject(project.uri)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
