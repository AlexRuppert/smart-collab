<template lang="pug">
  v-container.container(fluid)
    RoomComponent.room(:sync='sync' @connected='onConnected' @notify='onNotify')
    EditorComponent.editor(@input='onCodeChanged' :errors='mermaidParsingErrors' @editor='onEditorInitialized')
    MermaidComponent.graph(:code='code' @parseResult='onMermaidParsingResult')
    v-snackbar(v-model='toaster.enabled' top :timeout='2000') {{ toaster.text }}
      v-btn(dark icon @click='toaster.enabled = false') 
        v-icon mdi-close
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { StoreType } from '@/store'

import Sync from '@/components/mermaid/sync'
import MermaidComponent from '@/components/mermaid/mermaid.vue'
import EditorComponent from '@/components/mermaid/editor.vue'
import RoomComponent from '@/components/room/room.vue'
@Component({
  components: { MermaidComponent, EditorComponent, RoomComponent },
  store: ['title'],
})
export default class Mermaid extends Vue {
  name = 'Mermaid'
  $store!: StoreType
  code = ''
  editor: any
  mermaidParsingErrors: any[] = []
  toaster = {
    enabled: false,
    text: '',
  }
  sync = new Sync()
  onNotify(text) {
    this.toaster = {
      enabled: true,
      text,
    }
  }
  onCodeChanged(code) {
    this.code = code
  }
  onMermaidParsingResult(result) {
    if (result.success) {
      this.mermaidParsingErrors = []
    } else {
      this.mermaidParsingErrors = [result.error]
    }
  }

  onEditorInitialized(editor) {
    this.editor = editor
  }
  onConnected(options) {
    this.sync.addBinding(this.editor, options)
  }
  mounted() {
    this.$store.title = 'Mermaid Swarm'
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
  grid-template-columns 1fr 1fr 1fr
  grid-template-rows auto 1fr 1fr

  @media (min-width: 1264px)
    grid-template-areas 'room room room' 'editor graph graph' 'editor graph graph'

  @media (max-width: 1264px)
    grid-template-areas 'room room room' 'editor editor editor' 'graph graph graph'

.editor
  grid-area editor

.room
  grid-area room

.graph
  grid-area graph
</style>

<style lang="stylus"></style>