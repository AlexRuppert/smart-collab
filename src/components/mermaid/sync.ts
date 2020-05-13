import Sync from '@/shared/sync'
import { CodeMirrorBinding } from 'y-codemirror'

export default class StickyNotesSync extends Sync {
  binding: any

  addBinding(editor: any, options: any) {
    this.removeBinding()

    const text = this.ydoc.getText('codemirror')
    if (options.created) {
      text.insert(0, editor.doc.getValue())
    }
    return new CodeMirrorBinding(text, editor, this.provider.awareness)
  }
  removeBinding() {
    if (!this.binding) return
    try {
      this.binding?.destroy()
      this.binding = null
    } catch {}
  }
}
