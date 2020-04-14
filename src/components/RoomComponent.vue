<template lang="pug">
  v-card.room-card
    v-toolbar.toolbar(flat :extension-height='extensionHeight')
      
      template(v-slot:extension)
        .room-name-container.mb-2(v-show='extensionHeight>0')
          v-text-field.room-name.mr-3(label='Room' :disabled='isCreateMode' v-model='room.name' solo flat hide-details dense height='20' clearable)
          v-btn.mr-3(v-show='isCreateMode' outlined height='40' @click='')
            v-icon mdi-content-copy
          v-btn(outlined color='primary' height='40' @click='connect()')
            v-icon(left) mdi-lan-connect
            | Connect
      v-menu(:close-on-content-click='false' nudge-bottom offset-y transition='scroll-y-transition')
        template(v-slot:activator='{ on }')
          v-btn.text-none(outlined :color='user.color' v-on='on' max-width='200px' height='40')
            v-avatar.mr-2(size='16' :color='user.color')
            | {{user.name}}
        v-card.user-config-menu
          v-card-text
            v-text-field(label='Name' maxlength='18' :color='user.color' v-model='user.name' clearable spellcheck='false')
            .color-selection
              v-btn.ma-1(v-for='color in swatches' :color='color' fab small @click='user.color=color')
              v-btn.random.ma-1(color='#fff' fab small @click='user.color = generateColor()')
                v-icon mdi-dice-3-outline
      v-spacer
      v-btn.mr-3(v-show='!room.connected' outlined height='40' @click='createMode()' )
        v-icon(left) mdi-account-group-outline
        | Create
      v-btn(v-show='!room.connected' outlined height='40' @click='mode="join"')
        v-icon(left) mdi-location-enter
        | Join
      v-btn.ml-3(v-show='room.connected' outlined height='40' @click='disconnect()')
        v-icon(left) mdi-lan-disconnect
        | Disconnect
      
  </template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { v4 as uuidv4 } from 'uuid'
@Component
export default class RoomComponent extends Vue {
  name = 'RoomComponent'
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

  mode = 'none'
  room = {
    name: '',
    connected: false,
  }
  user = {
    name: 'Unknown' + Math.floor(Math.random() * 100) + 1,
    color: '#fab',
  }
  createMode() {
    this.mode = 'create'
    this.generateRoom()
  }

  get isCreateMode() {
    return this.mode === 'create'
  }
  generateRoom() {
    this.room.name = uuidv4()
  }
  generateColor() {
    return this.swatches[Math.floor(Math.random() * this.swatches.length)]
  }
  get extensionHeight() {
    return this.mode === 'none' ? '0' : '50'
  }
  connect() {
    this.room.connected = true
    this.mode = 'none'
  }

  disconnect() {
    this.room.connected = false
  }

  initRoom() {
    this.user.color = this.generateColor()
  }

  mounted() {
    this.initRoom()
  }
}
</script>
<style lang="stylus" scoped>
.toolbar {
  overflow: hidden;
  transition: all 0.1s ease-in-out;
}

.color-selection {
  display: flex;
  flex-wrap: wrap;
  max-width: 210px;
  justify-content: center;

  .random {
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &:active {
      transform: rotate(-50deg);
    }
  }
}

.room-name-container {
  display: flex;
  width: 100%;

  .room-name {
    border: 1px solid #333;
  }
}
</style>

<style lang="stylus"></style>
