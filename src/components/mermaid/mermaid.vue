<template lang="pug">
v-card.graph-card(:class='{ fullscreen: fullscreen }')
  v-card-title.pl-0.py-0
    v-toolbar(dense, flat)
      v-btn(icon, @click='toggleFullscreen' v-tooltip='"Toggle Fullscreen"')
        v-icon(v-show='fullscreen') mdi-fullscreen-exit
        v-icon(v-show='!fullscreen') mdi-fullscreen
      v-toolbar-title Diagram
      v-spacer

      v-btn(icon, @click='zoomReset' v-tooltip='"Reset Zoom"')
        v-icon mdi-image-filter-center-focus
      v-menu(offset-y, :close-on-content-click='false')
        template(v-slot:activator='{ on }')
          v-btn(icon, v-on='on' v-tooltip='"Style"')
            v-icon mdi-brush
        v-card.pa-2
          v-select.curve-select(
            v-model='graph.config.theme',
            :items='themes',
            label='Theme',
            hide-details,
            prepend-icon='mdi-palette',
            single-line,
            solo,
            flat,
            dense
          )
          v-divider
          v-select.curve-select(
            v-show='code.startsWith("graph")',
            v-model='graph.config.flowchart.curve',
            :items='curves',
            label='Curves',
            hide-details,
            prepend-icon='mdi-chart-timeline-variant',
            single-line,
            solo,
            flat,
            dense
          )
      v-btn(icon, @click='copyPng()' v-tooltip='"Copy as PNG to Clipboard"')
        v-icon mdi-camera
      v-btn(color='primary', icon, @click='saveSvg()' v-tooltip='"Save SVG"')
        v-icon mdi-floppy

  v-card-text.mermaid-container.pt-0
    #mermaid
      svg(xmlns='http://www.w3.org/2000/svg')
        g(ref='mermaidView', v-html='svg')
      .tmp
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
      maxZoom: 9,
      minZoom: 0.4,
      zoomScaleSensitivity: 1,
      zoomDoubleClickSpeed: 3,

      textSelection: false,
      smoothScroll: false,
    },
  }
  fullscreen = false

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

  toggleFullscreen() {
    this.fullscreen = !this.fullscreen
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

  svgToPng(svgElement) {
    return new Promise((res, rej) => {
      const image = new Image()
      const svgBlob =
        'data:image/svg+xml;base64,' + window.btoa(svgElement.outerHTML)

      image.crossOrigin = 'anonymous'
      image.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = svgElement.viewBox.baseVal.width
        canvas.height = svgElement.viewBox.baseVal.height
        const context = canvas.getContext('2d') as CanvasRenderingContext2D
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0)
        canvas.toBlob((blob) => res(blob))
      }

      image.src = svgBlob
    })
  }
  async copyPng() {
    const svgElement = document.getElementById('mermaidSvG')
    if (svgElement) {
      //@ts-ignore
      navigator.clipboard.write([
        //@ts-ignore
        new ClipboardItem({
          'image/png': await this.svgToPng(svgElement),
        }),
      ])
    }
  }

  insertSvg(svgCode, bindFunctions) {
    svgCode = svgCode
      .replace(/class="title"/g, '')
      .replace(/Times New Roman/g, 'verdana')
      .replace(/<br>/g, '<br/>')
      .replace(/#eaeaea|#eee/g, '#fff')
      .replace(/#999/g, '#111')
      .replace(/black/g, '#55d')
      .replace(/#mermaidSvG\{/g, '#mermaidSvG{line-height:13px;')
      .replace(/\/svg" height=".*viewBox/g, '/svg" viewBox')

    this.graph.svg = svgCode
  }

  applyZoom() {
    this.zoom.instance = panzoom(
      this.$refs.mermaidView as SVGElement,
      this.zoom.config,
    )
    //@ts-ignore
    this.global1.pz = this.zoom.instance
  }
  updateMermaid(code) {
    if (code.length <= 0) return
    try {
      if (document.querySelector('#dmermaidSvG')) {
        document
          .querySelectorAll('#dmermaidSvG')
          .forEach((e) => e?.parentNode?.removeChild(e))
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
.graph-card.fullscreen
  position fixed
  top 0
  right 0
  bottom 0
  left 0
  z-index 6

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

#mermaidSvG *
  letter-spacing normal
  line-height 1em
</style>