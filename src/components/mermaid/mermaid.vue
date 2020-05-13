<template lang="pug">
  v-card.graph-card 
    v-card-title.pl-0.py-0
      v-toolbar(dense flat)
        v-toolbar-title Diagram
        v-spacer
        v-btn(icon @click='zoomReset')
          v-icon mdi-image-filter-center-focus
        v-menu(offset-y :close-on-content-click='false')
          template(v-slot:activator='{ on }')
            v-btn(icon v-on='on')
              v-icon mdi-brush
          v-card.pa-2
            v-select.curve-select(v-model='graph.config.theme' :items='themes'
              label='Theme' hide-details prepend-icon='mdi-palette' single-line solo flat dense)
            v-divider
            v-select.curve-select(v-show='code.startsWith("graph")' v-model='graph.config.flowchart.curve' :items='curves'
              label='Curves' hide-details prepend-icon='mdi-chart-timeline-variant' single-line solo flat dense)
        v-btn(color='primary' icon @click='saveSvg()')
          v-icon mdi-floppy
        
    v-card-text.mermaid-container.pt-0
      #mermaid
        svg(xmlns="http://www.w3.org/2000/svg")
          g(ref='mermaidView' v-html='svg')
          
    
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import mermaid from 'mermaid'
import FileSaver from 'file-saver'
import panzoom from 'panzoom'

@Component
export default class Mermaid extends Vue {
  name = 'Mermaid'

  @Prop({
    default: ``,
  })
  code!: string
  curves = [
    { text: 'Linear', value: 'linear' },
    { text: 'Step After', value: 'stepAfter' },
    { text: 'Step Before', value: 'stepBefore' },
    { text: 'Curved', value: 'basis' },
  ]

  themes = [
    { text: 'Default', value: 'default' },
    { text: 'Forest', value: 'forest' },
    { text: 'Dark', value: 'dark' },
    { text: 'Neutral', value: 'neutral' },
  ]

  graph = {
    instance: mermaid,
    config: {
      startOnLoad: false,
      theme: 'neutral',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'linear',
      },
    },
    svg: '',
  }
  zoom = {
    instance: null as any | null,
    last: { x: 0, y: 0, zoom: 1 },
    config: {
      maxZoom: 3,
      minZoom: 0.4,
      zoomScaleSensitivity: 1,
      zoomDoubleClickSpeed: 3,

      textSelection: false,
      smoothScroll: false,
    },
  }
  get svg() {
    if (this.code.length <= 0) {
      return `<rect x="0" ry="0" x="0" y="0" width="2" height="2" opacity="0"></rect>`
    }
    return this.graph.svg
  }
  @Watch('graph.config', { deep: true })
  onConfigChanged(value: any, oldValue: any) {
    this.initGraph()
  }
  @Watch('code')
  onCodeChanged(value: string, oldValue: string) {
    this.updateMermaid(this.code)
  }

  zoomReset() {
    this.zoom.instance.zoomAbs(0, 0, 1)
    this.zoom.instance.moveTo(0, 0)
  }
  saveSvg() {
    const fileName = `${new Date().toISOString().substr(0, 10)} - export.svg`
    let blob = new Blob([this.graph.svg], {
      type: 'image/svg+xml;charset=utf-8',
    })
    FileSaver.saveAs(blob, fileName)
  }

  insertSvg(svgCode, bindFunctions) {
    svgCode = svgCode
      .replace(/class="title"/g, '')
      .replace(/Times New Roman/g, 'trebuchet ms')
      .replace(/#eaeaea|#eee/g, '#fff')

    this.graph.svg = svgCode
  }

  applyZoom() {
    this.zoom.instance = panzoom(
      this.$refs.mermaidView as SVGElement,
      this.zoom.config,
    )

    //this.global1.pz = this.zoom.instance
  }
  updateMermaid(code) {
    if (code.length <= 0) return
    try {
      if (document.querySelector('#dmermaidSvG')) {
        document
          .querySelectorAll('#dmermaidSvG')
          .forEach(e => e?.parentNode?.removeChild(e))
        this.initGraph()
        return
      }
      mermaid.parse(code)
      mermaid.mermaidAPI.render('mermaidSvG', code, this.insertSvg)
      this.$emit('parseResult', { success: true, error: {} })
    } catch (err) {
      if (!err?.str) {
        err = { str: 'unknown error' }
      }
      this.$emit('parseResult', { success: false, error: { ...err } })
    }
  }
  initGraph() {
    this.graph.instance.mermaidAPI.initialize(this.graph.config)
    this.updateMermaid(this.code)
  }

  mounted() {
    this.initGraph()

    setTimeout(() => {
      this.applyZoom()
    }, 10)
  }
}
</script>

<style lang="stylus" scoped>
.mermaid-container
  height 100%

.graph-card
  display flex
  flex-direction column
</style>
<style lang="stylus">
#mermaid
  height 100%
  // justify-content: center
  user-select none

  svg
    min-height 400px
    width 100% !important
    height 100%
    border 1px solid #f0f0f0
</style>