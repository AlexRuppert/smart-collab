import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc/src/y-webrtc.js'
import { CodeMirrorBinding } from 'y-codemirror'

export default class Sync {
  ydoc!: Y.Doc
  provider: any
  bindings: any = {}
  bindingsToConnect: any = {}
  user = { name: 'Unknown', color: 'ff00aa' }
  constructor() {
    setInterval(() => {
      this.addBindings()
    }, 200)
  }
  setUser(user = { name: 'Unknown', color: 'ff00aa' }) {
    this.user = user
    this.provider?.awareness?.setLocalStateField('user', user)
  }

  getUsers() {
    return Array.from(
      this.provider?.awareness?.states?.values() ?? [],
    ).map((u: any) => ({ name: u.user.name, color: u.user.color }))
  }

  connect(room: { name: string; password: string }) {
    if (this.provider?.connected) {
      this.disconnect()
    }

    this.ydoc = new Y.Doc()
    this.provider = new WebrtcProvider(room.name, this.ydoc, {
      password: room.password,
      //signaling: ['ws://localhost:4444'],
    })
    this.provider.on('connect', () => console.log('asd'))
    this.addBindings()
    this.setUser(this.user)
    console.info(`Connected to ${room.name}`)
  }

  disconnect() {
    this.removeBindings()
    this.provider?.disconnect()
    this.provider?.destroy()
    this.ydoc?.destroy()
    console.info(`Disconnected`)
  }

  removeBindings() {
    this.removeMermaidBinding()
  }
  addBindings() {
    if (this.provider?.connected) {
      for (let binding in this.bindingsToConnect) {
        if (typeof this.bindingsToConnect[binding] === 'function') {
          this.bindings[binding] = this.bindingsToConnect[binding]()
          console.log('mermaid binding')
        }
        delete this.bindingsToConnect[binding]
      }
    }
  }
  addMermaidBinding(editor: any, options: any) {
    this.bindings.mermaid?.destroy()
    //window.aw = this.provider.awareness
    this.bindingsToConnect.mermaid = () => {
      try {
        const text = this.ydoc.getText('codemirror')
        if (options.created) {
          text.insert(0, editor.doc.getValue())
        }
        return new CodeMirrorBinding(text, editor, this.provider.awareness)
      } catch (error) {
        console.error(error)
      }
      return null
    }

    this.addBindings()
  }
  removeMermaidBinding() {
    this.bindingsToConnect.mermaid = null
    try {
      this.bindings.mermaid?.destroy()
      this.bindings.mermaid = null
    } catch {}
  }
}
