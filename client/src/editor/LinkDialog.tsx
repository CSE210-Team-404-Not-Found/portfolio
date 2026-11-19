import { useState, type FormEvent } from 'react'
import { getMarkRange, type Editor } from '@tiptap/core'
import { EditorDialog } from './EditorDialog.tsx'

export function LinkDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [range] = useState(() => getMarkRange(editor.state.selection.$from, editor.schema.marks.link) ?? { from: editor.state.selection.from, to: editor.state.selection.to })
  const [originalText] = useState(() => editor.state.doc.textBetween(range.from, range.to, ' '))
  const [text, setText] = useState(originalText)
  const [url, setUrl] = useState(String(editor.getAttributes('link').href ?? ''))
  const [error, setError] = useState('')
  const hasLink = editor.isActive('link')
  function apply(event: FormEvent) {
    event.preventDefault()
    event.stopPropagation()
    const href = url.trim()
    try {
      const parsed = new URL(href)
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) throw new Error('Invalid link')
    } catch { setError('Use an http://, https://, or mailto: link.'); return }
    const label = text.trim() || href
    const chain = editor.chain().focus().setTextSelection(range)
    if (range.from !== range.to && text === originalText) chain.setLink({ href }).run()
    else chain.insertContent({ type: 'text', text: label, marks: [{ type: 'link', attrs: { href } }] }).unsetMark('link').run()
    onClose()
  }
  return <EditorDialog title={hasLink ? 'Edit link' : 'Add link'} onClose={onClose}>
    <form onSubmit={apply}>
      <label htmlFor="editor-link-text">Text</label>
      <input id="editor-link-text" value={text} onChange={event => setText(event.target.value)} placeholder="Text to display" />
      <label htmlFor="editor-link-url">Link URL</label>
      <input id="editor-link-url" data-dialog-autofocus value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com" aria-invalid={Boolean(error)} aria-describedby={error ? 'editor-link-error' : undefined} />
      {error && <p id="editor-link-error" role="alert">{error}</p>}
      <footer>
        {hasLink && <button type="button" className="dialog-remove-link" onClick={() => { editor.chain().focus().setTextSelection(range).unsetLink().run(); onClose() }}>Remove link</button>}
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" className="dialog-primary" disabled={!url.trim()}>Apply link</button>
      </footer>
    </form>
  </EditorDialog>
}
