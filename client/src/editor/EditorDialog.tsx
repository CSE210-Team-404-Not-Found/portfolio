import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function EditorDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    dialog.querySelector<HTMLInputElement>('[data-dialog-autofocus]')?.focus()
    return () => { if (typeof dialog.close === 'function') dialog.close() }
  }, [])
  return createPortal(<dialog ref={ref} className="editor-dialog" aria-label={title}
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="editor-dialog-panel">
      <header><h2>{title}</h2><button type="button" className="editor-icon-button" aria-label="Close dialog" title="Close" onClick={onClose}><X size={20} aria-hidden="true" /></button></header>
      {children}
    </div>
  </dialog>, document.body)
}
