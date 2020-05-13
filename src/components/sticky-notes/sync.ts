import Sync from '@/shared/sync'
import { NoteUpdateEventTypes, SyncEventTypes } from './types'
export default class StickyNotesSync extends Sync {
  binding: any

  addBinding(networkUpdate, localUpdateRegister, initialNotes: any[]) {
    this.removeBinding()

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
        case NoteUpdateEventTypes.create:
          notes.set(event.note.id, event.note)
          break
        case NoteUpdateEventTypes.delete:
          notes.delete(event.note.id)
          break
        case NoteUpdateEventTypes.input:
        case NoteUpdateEventTypes.dragEnd:
        case NoteUpdateEventTypes.move:
        case NoteUpdateEventTypes.color:
          notes.set(event.note.id, event.note)
          break
        case SyncEventTypes.pointerMove:
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
          type: SyncEventTypes.pointerMove,
          pointer: {
            id: key,
            user: getUser(key),
            position: pointers.get(key).position,
          },
        })
      })
    })

    if (initialNotes.length > 0) {
      initialNotes.forEach(note => {
        notes.set(note.id, note)
      })
    } else {
      notes.forEach(note => {
        networkUpdate({ type: SyncEventTypes.create, note })
      })
    }
    notes.observe(event => {
      if (event.transaction.local) return

      //@ts-ignore
      event.changes.keys.forEach((value, key) => {
        //console.log(value, notes.get(key))
        if (value.action === 'add') {
          networkUpdate({ type: SyncEventTypes.create, note: notes.get(key) })
        } else if (value.action === 'delete') {
          networkUpdate({ type: SyncEventTypes.delete, note: { id: key } })
        } else if (value.action === 'update') {
          const note = notes.get(key)
          networkUpdate({ type: SyncEventTypes.update, note })
        }
      })
    })

    localUpdateRegister(updateFunction)
  }
  removeBinding() {
    if (!this.binding) return
    try {
      this.binding?.destroy()
      this.binding = null
    } catch {}
  }
}
