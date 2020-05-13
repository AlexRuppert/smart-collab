<template lang="pug">
  v-card.room-card.py-3
    v-row.mx-3
      User(:sync='sync')
      UserList(:sync='sync' :connected='room.connected')
      v-spacer
      .buttons
        div(v-show='!room.connected')
          v-btn.mr-3( @click.stop='create' text color='primary')
            v-icon(left) mdi-account-group-outline
            | New
          v-btn.mr-3(v-show='!room.connected' @click.stop='join' text color='primary')
            v-icon(left) mdi-location-enter
            | Join
        
        div(v-show='room.connected')
          v-btn.ml-3(text color='primary' @click='copyRoom')
            v-icon(left) mdi-share-variant
            | Share
          v-btn.ml-3(text @click='disconnect')
            | Disconnect
    v-dialog.dialog(v-model='dialogs.open' max-width=500 z-index=99999999)
      v-card
        v-card-title(primary-title) {{dialogs.mode==='create'?'Create New Room':'Join Room'}}
        v-card-text
          v-row
            v-col.d-flex
              v-text-field.mr-4(label='Room' disabled v-model='room.name' @keydown.enter='connect(dialogs.mode)')
              v-btn.random.mt-2(v-show='dialogs.mode==="create"' icon @click='generateRoom')
                v-icon mdi-dice-3-outline
          v-row
            v-col
              v-text-field(label='Password' ref='password' v-model='room.password'
                clearable type='password' @keydown.enter='connect(dialogs.mode)')
        v-divider.mt-5
        v-card-actions
          v-spacer
          v-btn(text @click='cancel') Cancel
          v-btn(color='primary' text @click='connect(dialogs.mode)') Connect
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { v4 as uuidv4 } from 'uuid'
import copy from 'copy-text-to-clipboard'
import User from '@/components/room/user.vue'
import UserList from '@/components/room/userList.vue'
import Sync from '@/shared/sync'
@Component({ components: { User, UserList } })
export default class Room extends Vue {
  name = 'Room'
  dialogs = {
    mode: 'none' as 'none' | 'join' | 'create',
    open: false,
  }
  room = { name: '', password: '', connected: false }

  @Prop()
  sync!: Sync

  cancel() {
    this.dialogs.open = false
  }
  create() {
    this.dialogs.open = true
    this.dialogs.mode = 'create'
    this.focusPassword()
    this.generateRoom()
  }
  join() {
    this.dialogs.open = true
    this.dialogs.mode = 'join'
    this.focusPassword()
    //this.connect('join')
  }
  focusPassword() {
    setTimeout(() => {
      if (this.room.password.length <= 0) {
        ;(this.$refs.password as HTMLInputElement)?.focus()
      }
    }, 100)
  }
  updateRouter() {
    if (this.$route.query.room !== this.room.name) {
      this.$router.push({ query: { room: this.room.name } })
    }
  }
  copyRoom() {
    this.updateRouter()
    copy(window.location.href)
    this.$emit('notify', 'Link copied to clipboard!')
  }
  generateRoom() {
    this.room.name = uuidv4()
  }

  loadRoom() {
    if (typeof this.$route.query?.room === 'string') {
      this.room.name = this.$route.query.room
      this.join()
    }
  }

  connect(mode: 'create' | 'join') {
    this.cancel()
    this.updateRouter()
    this.room.connected = true
    this.sync.connect(this.room)

    this.$emit('connected', { created: mode === 'create' })
  }

  disconnect() {
    this.room.connected = false
    this.sync.disconnect()
    this.$emit('disconnected')
  }

  mounted() {
    this.loadRoom()
  }
}
</script>