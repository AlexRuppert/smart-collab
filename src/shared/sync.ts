import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc/src/y-webrtc.js'

export default abstract class Sync {
  ydoc!: Y.Doc
  provider: any
  bindings: any = {}
  bindingsToConnect: any = {}
  user = { name: 'Unknown', color: 'ff00aa' }

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

    this.setUser(this.user)
    console.info(`Connected to ${room.name}`)
  }

  disconnect() {
    this.removeBinding()
    this.provider?.disconnect()
    this.provider?.destroy()
    this.ydoc?.destroy()
    console.info(`Disconnected`)
  }

  abstract removeBinding()
}
