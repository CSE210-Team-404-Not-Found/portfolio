import { EditorContent, useEditor } from '@tiptap/react'
import type { JSONContent } from '@tiptap/core'
import { projectExtensions } from './extensions.ts'

export function ProjectPreview({ title, summary, cover, author, content, onClose }: {
  title: string; summary: string; cover?: string; author: string; content: JSONContent; onClose: () => void
}) {
  const editor = useEditor({ extensions: projectExtensions(), content, editable: false, editorProps: { attributes: { class: 'project-description preview-description' } } })
  return <article className="project-preview" aria-label="Project preview">
    <div className="preview-topbar"><span>PROJECT PREVIEW · NOT PUBLISHED</span><button type="button" onClick={onClose}>Back to editor</button></div>
    <header className={`preview-hero${cover ? ' has-cover' : ''}`}>
      {cover && <img className="preview-cover" src={cover} alt="" />}
      <div className="preview-hero-content"><p className="preview-eyebrow">PORTFOLIO / PROJECT</p><h1>{title.trim() || 'Untitled project'}</h1><p className="preview-summary">{summary.trim() || 'Your project summary will appear here.'}</p><div className="preview-author"><span className="preview-avatar" aria-hidden="true">{author.replace(/^@/, '').slice(0, 1).toUpperCase()}</span><div><span className="preview-eyebrow">AUTHOR</span><p>{author}</p></div></div></div>
    </header>
    <div className="preview-body"><EditorContent editor={editor} />{editor?.isEmpty && <p className="project-editor-hint">Your project content will appear here.</p>}</div>
    <footer className="preview-footer">Made with ATFolio</footer>
  </article>
}
