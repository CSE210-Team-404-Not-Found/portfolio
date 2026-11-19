import { useState, type FormEvent } from 'react'
import type { Editor } from '@tiptap/core'
import { EditorDialog } from './EditorDialog.tsx'
import { isYoutubeUrl } from './extensions.ts'

export function VideoDialog({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [position] = useState(editor.state.selection.to)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  function apply(event: FormEvent) {
    event.preventDefault()
    event.stopPropagation()
    const src = url.trim()
    if (!isYoutubeUrl(src)) { setError('Use a valid YouTube video URL. Other video providers are not supported yet.'); return }
    editor.chain().focus().insertContentAt(position, { type: 'youtube', attrs: { src } }).run()
    onClose()
  }
  return <EditorDialog title="Add video" onClose={onClose}>
    <form onSubmit={apply}>
      <label htmlFor="editor-video-url">Video URL</label>
      <input id="editor-video-url" data-dialog-autofocus value={url} onChange={event => setUrl(event.target.value)} placeholder="Paste a video link" aria-invalid={Boolean(error)} aria-describedby="editor-video-help" />
      <p id="editor-video-help" className="dialog-hint">Currently supports YouTube links.</p>
      {error && <p role="alert">{error}</p>}
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="dialog-primary" disabled={!url.trim()}>Insert video</button></footer>
    </form>
  </EditorDialog>
}
