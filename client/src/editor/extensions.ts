import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'

export function isYoutubeUrl(value: string) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const host = url.hostname.replace(/^(www\.|m\.)/, '')
    const id = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'youtube-nocookie.com'].includes(host) ? (url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(embed|shorts)\//.test(url.pathname) ? url.pathname.split('/')[2] : '') : ''
    return /^[a-zA-Z0-9_-]{11}$/.test(id ?? '')
  } catch { return false }
}
function mediaAttributes() {
  return { src: { default: null }, alt: { default: '' }, mediaCid: { default: null, rendered: false } }
}
const ProjectImage = Image.extend({
  addAttributes() { return { ...this.parent?.(), mediaCid: { default: null, rendered: false } } },
}).configure({ allowBase64: true })
const AudioRecording = Node.create({
  name: 'audioRecording', group: 'block', atom: true,
  addAttributes: mediaAttributes,
  parseHTML: () => [{ tag: 'audio[src]' }],
  renderHTML: ({ HTMLAttributes }) => ['audio', mergeAttributes(HTMLAttributes, { controls: '', preload: 'metadata', 'aria-label': 'Audio recording' })],
})
const Model = Node.create({
  name: 'model3d', group: 'block', atom: true,
  addAttributes: mediaAttributes,
  parseHTML: () => [{ tag: 'model-viewer[src]' }],
  renderHTML: ({ HTMLAttributes }) => ['model-viewer', mergeAttributes(HTMLAttributes, { 'camera-controls': '', 'disable-pan': '', 'touch-action': 'pan-y', alt: HTMLAttributes.alt || 'Interactive 3D model' })],
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('model-viewer')
      dom.contentEditable = 'false'
      dom.setAttribute('src', node.attrs.src)
      dom.setAttribute('alt', node.attrs.alt || 'Interactive 3D model')
      dom.setAttribute('camera-controls', '')
      dom.setAttribute('disable-pan', '')
      dom.setAttribute('touch-action', 'pan-y')
      dom.addEventListener('dragstart', event => event.preventDefault())
      return { dom, stopEvent: () => true, ignoreMutation: () => true }
    }
  },
})
export function projectExtensions() {
  return [StarterKit.configure({
    heading: { levels: [2, 3] }, blockquote: false, code: false, codeBlock: false,
    hardBreak: false, horizontalRule: false, strike: false, underline: false,
    link: {
      openOnClick: false, autolink: false, linkOnPaste: false,
      isAllowedUri: url => /^(https?:\/\/|mailto:)/i.test(url),
      HTMLAttributes: { target: null, rel: 'noopener noreferrer' },
    },
  }), ProjectImage, Youtube.configure({ nocookie: true }), AudioRecording, Model]
}
