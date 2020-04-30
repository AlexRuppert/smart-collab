<template lang="pug">
  v-card.room-card.py-3
    v-row.mx-3
      v-menu(:close-on-content-click='false' nudge-bottom offset-y transition='scroll-y-transition' z-index='99999999')
        template(v-slot:activator='{ on }')
          v-btn.mr-3.text-none(dark :color='user.color' v-on='on' max-width='200px' depressed)
            v-icon(left) mdi-account
            | {{user.name}}
        v-card.user-config-menu
          v-card-text
            v-text-field(label='Name' maxlength='18' :color='user.color' v-model='user.name' clearable spellcheck='false')
            .color-selection
              v-btn.ma-1(v-for='color in swatches' :color='color' fab small @click='user.color=color')
              v-btn.random.ma-1(color='#fff' fab small @click='user.color = generateColor()')
                v-icon mdi-dice-3-outline
      v-menu(nudge-bottom offset-y transition='scroll-y-transition' z-index='99999999')
        template(v-slot:activator='{ on }')
          v-btn.text-none(v-show='room.connected' text v-on='on' max-width='200px')
            v-icon(left) mdi-account-group
            | {{users.length}} Users
        v-list(max-width='350px' dense)
          v-list-item.pl-2(v-for='(user, index) in users' :key='index' :color='user.color' dense @click='')
            v-list-item-avatar.my-0.mr-1
              v-icon(:color='user.color') mdi-account
            v-list-item-title {{user.name}}
      v-spacer
      .buttons
        v-dialog(v-model='dialogs.create' max-width=500 z-index='99999999')
          template(v-slot:activator='{ on }')
            v-btn.mr-3(v-show='!room.connected' @click='createMode' text color='primary')
              v-icon(left) mdi-account-group-outline
              | New
          v-card
            v-card-title(primary-title) Create New Room
            v-card-text
              v-row
                v-col.d-flex
                  v-text-field.mr-4(label='Room' disabled v-model='room.name' @keydown.enter='connect("create")')
                  v-btn.random.mt-2(icon @click='generateRoom')
                    v-icon mdi-dice-3-outline
              v-row
                v-col
                  v-text-field(label='Password' ref='password' v-model='room.password' 
                    clearable type='password' @keydown.enter='connect("create")')
            v-divider.mt-5
            v-card-actions
              v-spacer
              v-btn(text @click='cancelMode') Cancel
              v-btn(color='primary' text @click='connect("create")') Connect
        v-dialog(v-model='dialogs.join' max-width=500 z-index='99999999')
          template(v-slot:activator='{ on }')
            v-btn.mr-3(v-show='!room.connected' @click='joinMode' text color='primary')
              v-icon(left) mdi-location-enter
              | Join
          v-card
            v-card-title(primary-title) Join Room
            v-card-text
              v-row
                v-col
                  v-text-field(label='Room' clearable v-model='room.name' @keydown.enter='connect("join")')
              v-row
                v-col
                  v-text-field(label='Password' ref='password' v-model='room.password' clearable
                    type='password' @keydown.enter='connect("join")')
            v-divider.mt-5
            v-card-actions
              v-spacer
              v-btn(text @click='cancelMode') Cancel
              v-btn(color='primary' text @click='connect("join")') Connect
              
        v-btn.ml-3(v-show='room.connected' text color='primary' @click='copyRoom')
          v-icon(left) mdi-share-variant
          | Share
        v-btn.ml-3(v-show='room.connected' text @click='disconnect')
          | Disconnect
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { StoreType } from '@/store'
import { v4 as uuidv4 } from 'uuid'
import copy from 'copy-text-to-clipboard'

@Component({ store: ['room', 'user'] })
export default class RoomComponent extends Vue {
  name = 'RoomComponent'
  $store!: StoreType
  swatches = [
    '#FF5722',
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FF9800',
    '#607D8B',
  ]
  @Watch('$store.user', { deep: true })
  onUserchanged() {
    localStorage.userName = this.$store.user.name
    localStorage.userColor = this.$store.user.color
    this.$store.sync.setUser(this.$store.user)
  }
  dialogs = {
    create: false,
    join: false,
  }

  users = [] as Array<{ name: string; color: string }>

  cancelMode() {
    this.dialogs.create = this.dialogs.join = false
  }
  createMode() {
    this.dialogs.join = false
    this.dialogs.create = true
    this.focusPassword()
    this.generateRoom()
  }
  joinMode() {
    this.dialogs.join = true
    this.dialogs.create = false
    //TODO
    this.focusPassword()
    //this.connect('join')
  }
  focusPassword() {
    setTimeout(() => {
      if (this.$store.room.password.length <= 0) {
        ;(this.$refs.password as HTMLInputElement).focus()
      }
    }, 200)
  }

  updateRouter() {
    if (this.$route.query.room !== this.$store.room.name) {
      this.$router.push({ query: { room: this.$store.room.name } })
    }
  }
  copyRoom() {
    this.updateRouter()
    copy(window.location.href)
    this.$emit('notify', 'Link copied to clipboard!')
  }
  generateRoom() {
    this.$store.room.name = uuidv4()
  }
  generateColor() {
    return this.swatches[Math.floor(Math.random() * this.swatches.length)]
  }

  applyRoomName() {
    if (typeof this.$route.query?.room === 'string') {
      this.$store.room.name = this.$route.query.room
      this.joinMode()
    }
  }

  connect(mode: 'create' | 'join') {
    this.cancelMode()
    this.$store.room.connected = true
    this.updateRouter()

    this.$store.sync.connect(this.$store.room)

    this.$emit('connected', { created: mode === 'create' })
  }

  disconnect() {
    this.$store.room.connected = false
    this.$store.sync.disconnect()
    this.$emit('disconnected')
  }

  initRoom() {
    ;(this.$store.user.name =
      localStorage?.userName ??
      'Unknown' + Math.floor(Math.random() * 100) + 1),
      (this.$store.user.color = localStorage?.userColor ?? this.generateColor())

    setInterval(() => {
      this.users = this.$store.sync.getUsers()
    }, 1000)
  }

  mounted() {
    this.applyRoomName()
    this.initRoom()
  }
}
</script>
<style lang="stylus" scoped>
.toolbar
  overflow hidden
  transition all 0.1s ease-in-out

.color-selection
  display flex
  flex-wrap wrap
  justify-content center
  max-width 210px

.random
  transition transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)

  &:active
    transform rotate(-50deg)

.room-name-container
  display flex
  width 100%

.user-list
  display flex
  flex-wrap wrap
  justify-content center
</style>


