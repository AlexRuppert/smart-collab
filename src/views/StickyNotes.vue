<template lang="pug">
  v-container.container(fluid)
    RoomComponent.room(@connected='onConnected' @notify='onNotify')
    StickyNotesComponent
    v-snackbar(v-model='toaster.enabled' top :timeout='2000') {{ toaster.text }}
      v-btn(dark icon @click='toaster.enabled = false') 
        v-icon mdi-close
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { StoreType } from '@/store'

import Sync from '@/shared/sync'

import StickyNotesComponent from '@/components/StickyNotesComponent.vue'

import RoomComponent from '@/components/RoomComponent.vue'
@Component({
  components: { StickyNotesComponent, RoomComponent },
  store: ['title'],
})
export default class StickyNotes extends Vue {
  name = 'StickyNotes'
  $store!: StoreType
  toaster = {
    enabled: false,
    text: '',
  }

  onNotify(text) {
    this.toaster = {
      enabled: true,
      text,
    }
  }

  onConnected(options) {}
  mounted() {
    this.$store.title = 'Sticky Notes'
  }
}
</script>

<style lang="stylus" scoped>
.container
  position absolute
  top 0
  right 0
  bottom 0
  left 0
  display grid
  height 100%
  column-gap 10px
  row-gap 10px
  grid-template-columns minmax(0, 1fr)
  grid-template-rows auto minmax(0, 1fr)
  grid-template-areas 'room' 'sticky'

.room
  grid-area room

.sticky-notes
  grid-area sticky
</style>

<style lang="stylus"></style>