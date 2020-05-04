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
      signaling: ['ws://localhost:4444'],
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
          console.log('binding created')
        }
        delete this.bindingsToConnect[binding]
      }
    }
  }
  addStickyNotesBinding(networkUpdate, localUpdateRegister, options: any) {
    this.bindings.stickyNotes?.destroy()
    //window.aw = this.provider.awareness
    this.bindingsToConnect.stickyNotes = () => {
      try {
        const notes = this.ydoc.getMap('notes')
        const pointers = this.ydoc.getMap('pointers')
        const clientId = this.ydoc.clientID

        const getUser = clientId =>
          this.provider?.awareness.getStates().get(+clientId)?.user ?? {
            name: 'Unknown',
            color: '#000',
          }

        const updateFunction = event => {
          //console.dir(this.provider?.awareness.getStates().get(clientId))
          switch (event.type) {
            case 'create':
              notes.set(event.note.id, event.note)
              break
            case 'delete':
              notes.delete(event.note.id)
              break
            case 'input':
            case 'dragEnd':
            case 'move':
            case 'color':
              notes.set(event.note.id, event.note)
              break
            case 'pointerMove':
              pointers.set(clientId.toString(), event.pointer)
              break
            default:
              break
          }
        }
        pointers.observe(event => {
          if (event.transaction.local) return
          //@ts-ignore
          event.changes.keys.forEach((value, key) => {
            networkUpdate({
              type: 'pointerMove',
              pointer: {
                id: key,
                user: getUser(key),
                position: pointers.get(key).position,
              },
            })
          })
        })
        notes.observe(event => {
          if (event.transaction.local) return

          //@ts-ignore
          event.changes.keys.forEach((value, key) => {
            //console.log(value, notes.get(key))
            if (value.action === 'add') {
              networkUpdate({ type: 'create', note: notes.get(key) })
            } else if (value.action === 'delete') {
              networkUpdate({ type: 'delete', note: { id: key } })
            } else if (value.action === 'update') {
              const note = notes.get(key)
              networkUpdate({ type: 'update', note })
              // networkUpdate({ type: 'input', note })
              //networkUpdate({ type: 'dragEnd', note })
            }
          })
        })

        localUpdateRegister(updateFunction)
      } catch (error) {
        console.error(error)
      }

      return null
    }

    this.addBindings()
  }
  removeStickyNotesBinding() {
    this.bindingsToConnect.stickyNotes = null
    try {
      this.bindings.stickyNotes?.destroy()
      this.bindings.stickyNotes = null
    } catch {}
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
