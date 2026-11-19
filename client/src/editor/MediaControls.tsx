import { useEffect, useRef, useState } from 'react'
import type { Editor, JSONContent } from '@tiptap/core'
import { insertMediaFile, MAX_MEDIA_SIZE, readDataUrl, validateMedia, walkDocument } from './media.ts'
import { ImagePlus, Mic, Square, Box, FileUp, Download, Video } from 'lucide-react'
import { VideoDialog } from './VideoDialog.tsx'

type Props = {
  editor: Editor | null
  disabled: boolean
  onError: (message: string | undefined) => void
  onBusyChange: (busy: boolean) => void
}
export function MediaControls({ editor, disabled, onError, onBusyChange }: Props) {
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const modelInput = useRef<HTMLInputElement>(null)
  const jsonInput = useRef<HTMLInputElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
      stream.current?.getTracks().forEach(track => track.stop())
    }
  }, [])
  useEffect(() => { onBusyChange(busy || recording) }, [busy, recording, onBusyChange])

  async function addFile(file?: File) {
    if (!file || !editor) return
    setBusy(true)
    onError(undefined)
    try { await insertMediaFile(editor, file) }
    catch (error) { onError(error instanceof Error ? error.message : 'Could not add this file.') }
    finally { setBusy(false) }
  }

  async function recordAudio() {
    if (recorder.current?.state === 'recording') {
      setBusy(true)
      recorder.current.stop()
      return
    }
    if (!editor) return
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      onError('Microphone recording is unavailable in this browser. Try Chrome or Safari.')
      return
    }
    setBusy(true)
    onError(undefined)
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current) { audioStream.getTracks().forEach(track => track.stop()); return }
      stream.current = audioStream
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported?.(type))
      const activeRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined)
      recorder.current = activeRecorder
      const chunks: Blob[] = []
      let size = 0
      let failed = false
      activeRecorder.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); size += event.data.size }
        if (size > MAX_MEDIA_SIZE && activeRecorder.state === 'recording') activeRecorder.stop()
      }
      activeRecorder.onerror = () => { failed = true }
      activeRecorder.onstop = async () => {
        clearTimeout(timer.current)
        audioStream.getTracks().forEach(track => track.stop())
        if (!mounted.current) return
        setRecording(false)
        setBusy(true)
        try {
          const audio = new Blob(chunks, { type: activeRecorder.mimeType || chunks[0]?.type })
          if (failed || !audio.size) throw new Error('No audio was recorded. Please try again.')
          if (audio.size > MAX_MEDIA_SIZE) throw new Error('Recording exceeds 10 MB. Try a shorter recording.')
          const node = { type: 'audioRecording', attrs: { src: await readDataUrl(audio) } }
          const candidate = editor.getJSON()
          candidate.content = [...(candidate.content ?? []), node]
          validateMedia(candidate)
          if (!editor.isDestroyed) editor.chain().focus().insertContentAt(editor.state.selection.to, node).run()
        } catch (error) { onError(error instanceof Error ? error.message : 'Could not insert audio.') }
        finally { recorder.current = null; setBusy(false) }
      }
      activeRecorder.start(1000)
      timer.current = setTimeout(() => { if (activeRecorder.state === 'recording') activeRecorder.stop() }, 120_000)
      setRecording(true)
    } catch (error) {
      stream.current?.getTracks().forEach(track => track.stop())
      onError(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Microphone access was denied. You can allow it and try again.' : 'Could not start recording. Check your microphone.')
    } finally { if (mounted.current) setBusy(false) }
  }

  async function importJson(file?: File) {
    if (!editor || !file) return
    setBusy(true)
    onError(undefined)
    try {
      if (!/\.json$/i.test(file.name) || file.size > 30 * 1024 * 1024) throw new Error('Choose a Tiptap JSON file, up to 30 MB.')
      const json: JSONContent = JSON.parse(await file.text())
      const document = editor.schema.nodeFromJSON(json)
      if (document.type !== editor.schema.topNodeType) throw new Error('Expected a Tiptap document.')
      document.check()
      const content = document.toJSON() as JSONContent
      validateMedia(content)
      // Imported data belongs to a new document/account; never reuse another record’s blob references.
      let hasModel = false
      walkDocument(content, node => {
        if (node.attrs) delete node.attrs.mediaCid
        if (node.type === 'model3d') hasModel = true
      })
      const candidate = editor.isEmpty ? content : { type: 'doc', content: [...(editor.getJSON().content ?? []), ...(content.content ?? [])] }
      validateMedia(candidate)
      if (hasModel) await import('@google/model-viewer')
      if (editor.isEmpty) editor.commands.setContent(content, { errorOnInvalidContent: true })
      else editor.chain().focus().insertContentAt(editor.state.selection.to, content.content ?? []).run()
    } catch (error) { onError(error instanceof Error ? `Could not import: ${error.message}` : 'Could not import this document.') }
    finally { setBusy(false) }
  }

  function downloadJson() {
    if (!editor) return
    const content = editor.getJSON()
    walkDocument(content, node => { if (node.attrs) delete node.attrs.mediaCid })
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'portfolio.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const locked = disabled || busy || recording || !editor
  return <div className="project-media-controls">
    <div className="project-toolbar" role="group" aria-label="Add media">
      <button type="button" disabled={locked} onClick={() => imageInput.current?.click()}><ImagePlus size={18} aria-hidden="true" />Add image</button>
      <button type="button" disabled={disabled || busy || !editor} onClick={() => void recordAudio()}>{recording ? <Square size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}{recording ? 'Stop recording' : 'Record audio'}</button>
      <button type="button" disabled={locked} onClick={() => modelInput.current?.click()}><Box size={18} aria-hidden="true" />Add 3D model</button>
      <button type="button" disabled={locked} onMouseDown={event => event.preventDefault()} onClick={() => setVideoDialogOpen(true)}><Video size={18} aria-hidden="true" />Add video</button>
      <button type="button" disabled={locked} onClick={() => jsonInput.current?.click()}><FileUp size={18} aria-hidden="true" />Import JSON</button>
      <button type="button" disabled={locked} onClick={downloadJson}><Download size={18} aria-hidden="true" />Download JSON</button>
      <input ref={imageInput} aria-label="Body image" hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => { void addFile(event.target.files?.[0]); event.target.value = '' }} />
      <input ref={modelInput} aria-label="3D model file" hidden type="file" accept=".glb" onChange={event => { void addFile(event.target.files?.[0]); event.target.value = '' }} />
      <input ref={jsonInput} aria-label="Import document" hidden type="file" accept=".json" onChange={event => { void importJson(event.target.files?.[0]); event.target.value = '' }} />
    </div>
    {videoDialogOpen && editor && <VideoDialog editor={editor} onClose={() => setVideoDialogOpen(false)} />}
    <p className="project-editor-hint" role={recording || busy ? 'status' : undefined}>{recording ? 'Recording… Stop when you’re done (maximum 2 minutes).' : busy ? 'Preparing media…' : 'Drop images into the description, or paste a YouTube link. Images: 1 MB each, up to 5. Audio / GLB: 10 MB each; 20 MB total.'}</p>
  </div>
}
