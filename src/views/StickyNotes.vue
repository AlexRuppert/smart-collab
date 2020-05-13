<template lang="pug">
  v-container.container(fluid)
    RoomComponent.room(:sync='sync' @connected='onConnected' @notify='onNotify')
    StickyNotesComponent(ref='stickyNotes' @update='onLocalUpdate')
    v-snackbar(v-model='toaster.enabled' top :timeout='2000') {{ toaster.text }}
      v-btn(dark icon @click='toaster.enabled = false') 
        v-icon mdi-close
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { StoreType } from '@/store'
import Sync from '@/components/sticky-notes/sync'
import StickyNotesComponent from '@/components/sticky-notes/stickyNotes.vue'
import RoomComponent from '@/components/room/room.vue'
@Component({
  components: { StickyNotesComponent, RoomComponent },
  store: ['title'],
})
export default class StickyNotes extends Vue {
  name = 'StickyNotes'
  $store!: StoreType

  sync = new Sync()
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
  localUpdateObject = {
    update: event => {},
  }

  onNetworkUpdate(event) {
    const stickyNotes = this.$refs.stickyNotes as StickyNotesComponent
    stickyNotes!.update(event)
  }
  onLocalUpdate(event) {
    if (this.localUpdateObject) this.localUpdateObject.update(event)
  }
  onConnected(options) {
    const stickyNotes = this.$refs.stickyNotes as StickyNotesComponent
    let initialNotes
    if (!options.created) {
      stickyNotes.clearNotes()
    }

    this.sync.addBinding(
      this.onNetworkUpdate,
      updateFn => (this.localUpdateObject.update = updateFn),
      stickyNotes.notes,
    )
  }
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