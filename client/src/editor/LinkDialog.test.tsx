import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Editor } from '@tiptap/core'
import { projectExtensions } from './extensions.ts'
import { LinkDialog } from './LinkDialog.tsx'

let editor: Editor
function createEditor() {
  editor = new Editor({ extensions: projectExtensions(), content: '<p>My project link</p>' })
  return editor
}
afterEach(() => { cleanup(); editor?.destroy() })

describe('LinkDialog selection', () => {
  it('preserves selected text and applies the link to that selection', () => {
    createEditor().commands.setTextSelection({ from: 1, to: 11 })
    const close = vi.fn()
    render(<LinkDialog editor={editor} onClose={close} />)
    expect((screen.getByLabelText('Text') as HTMLInputElement).value).toBe('My project')
    fireEvent.change(screen.getByLabelText('Link URL'), { target: { value: 'https://example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply link' }))
    expect(editor.getHTML()).toContain('href="https://example.com">My project</a> link')
    expect(editor.getText()).toBe('My project link')
    expect(close).toHaveBeenCalledOnce()
  })

  it('edits and removes the whole existing link when the cursor is inside it', () => {
    createEditor().commands.setContent('<p><a href="https://old.example">Existing link</a> after</p>')
    editor.commands.setTextSelection(5)
    const close = vi.fn()
    const view = render(<LinkDialog editor={editor} onClose={close} />)
    expect((screen.getByLabelText('Text') as HTMLInputElement).value).toBe('Existing link')
    expect((screen.getByLabelText('Link URL') as HTMLInputElement).value).toBe('https://old.example')
    fireEvent.change(screen.getByLabelText('Link URL'), { target: { value: 'https://new.example' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply link' }))
    expect(editor.getHTML()).toContain('href="https://new.example">Existing link</a> after')
    view.unmount()
    editor.commands.setTextSelection(5)
    render(<LinkDialog editor={editor} onClose={close} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove link' }))
    expect(editor.getHTML()).toBe('<p>Existing link after</p>')
  })
})
