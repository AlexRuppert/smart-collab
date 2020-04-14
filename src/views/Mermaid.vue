<template lang="pug">
  v-container.container(fluid)
    RoomComponent.room
    EditorComponent.editor(@input='onCodeChanged' :errors='mermaidParsingErrors')
    MermaidComponent.graph(:code='code' @parseResult='onMermaidParsingResult')

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { StoreType } from '@/store'

import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc/src/y-webrtc.js'
import { CodeMirrorBinding } from 'y-codemirror'

import MermaidComponent from '@/components/MermaidComponent.vue'
import EditorComponent from '@/components/EditorComponent.vue'
import RoomComponent from '@/components/RoomComponent.vue'
@Component({
  components: { MermaidComponent, EditorComponent, RoomComponent },
  store: ['title'],
})
export default class Mermaid extends Vue {
  name = 'Mermaid'
  $store!: StoreType
  code = ''
  mermaidParsingErrors: any[] = []
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

  initSync() {
    const ydoc = new Y.Doc()
    const yText = ydoc.getText('codemirror')
    /*const provider = new WebrtcProvider(
      'wss://demos.yjs.dev',

      ydoc,
      { password: 'test' },
    )
    provider.awareness.setLocalStateField('user', {
      name: 'Anonymous',
      color: '#ff0000',
    })*/
    //const binding = new CodeMirrorBinding(yText, editor, provider.awareness)

    // provider.connect()
  }

  mounted() {
    this.$store.title = 'Mermaid Swarm'

    this.initSync()
  }
}
</script>

<style lang="stylus" scoped>
.container {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  top: 0;
  display: grid;
  column-gap: 10px;
  row-gap: 10px;
  height: 100%;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr 1fr;

  @media (min-width: 1264px) {
    grid-template-areas: 'room room' 'editor graph' 'editor graph';
  }

  @media (max-width: 1264px) {
    grid-template-areas: 'room room' 'editor editor' 'graph graph';
  }
}

.editor {
  grid-area: editor;
}

.room {
  grid-area: room;
}

.graph {
  grid-area: graph;
}
</style>

<style lang="stylus"></style>