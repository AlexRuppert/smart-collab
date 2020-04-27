<template lang="pug">
  v-card
    v-card-title.pl-0.py-0
      v-toolbar(dense flat)
        v-toolbar-title Notes
        v-spacer
        v-btn(icon @click='zoomReset')
          v-icon mdi-image-filter-center-focus
        //v-btn(icon @click='$refs.fileElement.click()')
          v-icon mdi-cloud-upload-outline
        //v-btn(icon @click='')
          v-icon mdi-cloud-download-outline
        v-btn(color='primary' icon @click='snapshot')
          v-icon mdi-camera
    v-card-text.canvas-container.pb-0(ref='canvasContainer')
      .canvas(ref='canvas' data-pan :style='canvasStyle')
        .note-selection(:class='{ selected: isNoteSelecting}' data-html2canvas-ignore)
          Note(v-for='note in noteSelection' :key='note.id' :id='note.id' :type='note.type' :color='note.color'
            :zIndex='note.zIndex' :position='note.position'
            @dragStart='onNoteSelectionDragStart' @dragEnd='onNoteSelectionDragEnd')
        Note(v-for='note in notes' :key='note.id' :id='note.id' :type='note.type' v-model='note.value' :color='note.color'
          :zIndex='note.zIndex' :isOverBin='note.isOverBin' :dimensions='canvasDimensions' :zoomScale='canvas.scale' :position='note.position' @moved='onNoteMoved'
          @dragStart='onNoteDragStart' @dragEnd='onNoteDragStop')
      .bin-container(ref='bin' :class='binClass' data-html2canvas-ignore)
        v-icon.bin.ui-element {{isOverBin?'mdi-delete-empty':'mdi-delete'}}
          
        
    input(ref='fileElement' type='file' style='display:none' @change='importContent')
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import FileSaver from 'file-saver'
import Note from '@/components/Note.vue'
import { NoteColors, NoteTypes } from '@/components/Note.vue'
import interact from 'interactjs'
import { generateUID, clamp } from '@/shared/utils.ts'
import _ from 'lodash'
import html2canvas from 'html2canvas'
import panzoom from 'pan-zoom'

type NoteParameters = {
  id: string
  value: string
  color: NoteColors
  type: NoteTypes
  zIndex: number
  isOverBin: boolean
  position: {
    x: number
    y: number
    rotation: number
  }
}

type NoteConfig = {
  value?: string
  color?: NoteColors
  type?: NoteTypes
  position?: {
    x?: number
    y?: number
    rotation?: number
  }
}
@Component({
  components: { Note },
})
export default class StickyNotesComponent extends Vue {
  name = 'StickyNotesComponent'

  notes = [] as NoteParameters[]
  noteSelection = [] as NoteParameters[]
  isOverBin = false
  isNoteSelecting = false
  canvasDimensions = 3000
  zoom = {
    instance: null as any | null,
    pause: false,
    config: {
      maxZoom: 1.2,
      minZoom: 0.3,
      zoomScaleSensitivity: 1,
      zoomDoubleClickSpeed: 3,

      smoothScroll: false,
    },
  }

  findNote(id): NoteParameters | undefined {
    return this.notes.find(note => note.id === id)
  }
  createNote(options: NoteConfig) {
    const defaultOptions = {
      value: '',
      color: NoteColors.yellow,
      type: NoteTypes.default,
      position: {
        x: 0,
        y: 0,
        rotation: 0,
      },
    }

    options = _.defaultsDeep(options, defaultOptions)
    const note = {
      id: generateUID(),
      value: options.value,
      color: options.color,
      zIndex: this.highestZindex,
      isOverBin: false,
      position: options.position,
    }

    this.notes.push(note as NoteParameters)

    return note
  }

  deleteNote(id) {
    this.notes = this.notes.filter(note => note.id !== id)
  }

  get binClass() {
    const classes = [] as string[]

    if (this.isOverBin) {
      classes.push('drag-over')
    }
    return classes
  }
  get highestZindex() {
    return this.notes.reduce((acc, val) => Math.max(acc, val.zIndex), 0) + 1
  }
  onNoteSelectionDragStart(note) {
    this.isNoteSelecting = true
    const newNote = this.createNote({
      color: note.color,
      position: { x: note.position.x, y: 0 },
    })
  }
  onNoteSelectionDragEnd(note) {
    this.isNoteSelecting = false
  }
  onNoteDragStart(note) {
    const foundNote = this.findNote(note.id)
    if (!foundNote) return

    const highestZindex = this.highestZindex
    if (foundNote.zIndex + 1 < highestZindex) {
      foundNote.zIndex = highestZindex
    }
  }
  onNoteMoved(note) {
    /*const foundNote = this.findNote(note.id)
    if (foundNote) foundNote.position = note.innerPosition*/
  }
  onNoteDragStop(note) {
    const foundNote = this.findNote(note.id)
    if (foundNote) foundNote.position = note.innerPosition
  }
  importContent(event) {
    const files = event.srcElement.files

    if (files && files[0]) {
      const reader = new FileReader()
      reader.onload = data => {
        const fileContent = data?.target?.result?.toString()
        if (fileContent != undefined) {
          //this.value = fileContent
          //this.editor.instance.doc.setValue(this.value)
        }
        ;(this.$refs.fileElement as HTMLInputElement).value = ''
      }
      reader.readAsText(files[0])
    }
  }
  exportContent() {
    const fileName = `${new Date().toISOString().substr(0, 10)} - export.sticky`
    let blob = new Blob(['test'], {
      type: 'text/plain;charset=utf-8',
    })
    FileSaver.saveAs(blob, fileName)
  }

  get canvasStyle() {
    return {
      transform: `translate3D(${this.canvas.x}px, ${this.canvas.y}px, 0) scale(${this.canvas.scale}, ${this.canvas.scale})`,
      transformOrigin: `0 0 0`,
    }
  }
  zoomReset() {
    this.canvas = { x: 0, y: 0, scale: 1 }
  }
  canvas = { x: 0, y: 0, scale: 1 }
  applyZoom() {
    const canvas = this.$refs.canvas as HTMLElement
    const canvasContainer = this.$refs.canvasContainer as HTMLElement

    //todo resize events
    const canvasBounds = canvasContainer.getBoundingClientRect()
    const dimensions = {
      canvas: {
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
      },
      viewPort: {
        offsetX: canvasBounds.x,
        offsetY: canvasBounds.y,
        width: canvasContainer.offsetWidth,
        height: canvasContainer.offsetHeight,
      },
    }

    const ensureBounds = (dimensions, { x, y, scale }) => {
      if (x > 0) x = 0
      if (x < -dimensions.canvas.width * scale + dimensions.viewPort.width)
        x = -dimensions.canvas.width * scale + dimensions.viewPort.width
      if (y > 0) y = 0
      if (y < -dimensions.canvas.height * scale + dimensions.viewPort.height)
        y = -dimensions.canvas.height * scale + dimensions.viewPort.height

      return { x, y, scale }
    }

    canvas.addEventListener('wheel', e => {
      e.preventDefault()

      let currentScale = this.canvas.scale
      let scale = clamp(
        0.5,
        this.canvas.scale - (this.canvas.scale * clamp(-1, e.deltaY, 1)) / 5,
        1.5,
      )

      let mouseX = e.pageX - dimensions.viewPort.offsetX
      let mouseY = e.pageY - dimensions.viewPort.offsetY

      let targetX = (mouseX - this.canvas.x) / currentScale
      let targetY = (mouseY - this.canvas.y) / currentScale

      let x = -targetX * scale + mouseX
      let y = -targetY * scale + mouseY

      this.canvas = ensureBounds(dimensions, { x, y, scale })
    })

    this.zoom.instance = panzoom(canvas, e => {
      if (e.dz !== 0) return
      if (e.srcElement.dataset.pan === undefined) {
        e.dx = 0
        e.dy = 0
      }

      let x = this.canvas.x + e.dx
      let y = this.canvas.y + e.dy

      this.canvas = ensureBounds(dimensions, { x, y, scale: this.canvas.scale })
    })
  }

  isNoteOverBin(id, isOverBin) {
    const note = this.findNote(id)
    if (note) note.isOverBin = isOverBin
  }

  createNoteSelection() {
    let offset = 320
    Object.values(NoteColors).forEach((color, index) => {
      const note = {
        id: generateUID(),
        value: '',
        color,
        type: NoteTypes.noteSelection,
        zIndex: 999999,
        isOverBin: false,
        position: {
          x: offset - (60 + Math.random() * 7) * index,
          y: -(125 + Math.random() * 7),
          rotation: 30 + Math.random() * 7,
        },
      }
      this.noteSelection.push(note)
    })
  }

  async snapshot() {
    const canvas = this.$refs.canvas as HTMLElement

    let left = Number.MAX_VALUE
    let top = Number.MAX_VALUE
    let bottom = -Number.MAX_VALUE
    let right = -Number.MAX_VALUE
    this.notes
      .map(note => note.position)
      .forEach(({ x, y }) => {
        left = Math.min(left, x)
        right = Math.max(right, x)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
      })

    const contentBox = {
      x: 15 + left - 75,
      y: 200 + top - 75,
      width: right - left + 300,
      height: bottom - top + 300,
    }
    console.log(contentBox)
    const rendered = await html2canvas(canvas, { scale: 1, ...contentBox })
    const fileName = `${new Date().toISOString().substr(0, 10)} - export.png`
    rendered.toBlob(function(blob) {
      FileSaver.saveAs(blob, fileName)
    })
  }

  mounted() {
    this.createNoteSelection()
    this.createNote({ position: { x: 200, y: 200 } })
    this.applyZoom()

    const bin = this.$refs.bin as HTMLElement
    interact(bin)
      .dropzone({
        ondrop: event => {
          this.isOverBin = false
          this.deleteNote(event.relatedTarget.dataset.id)
        },
      })
      .on('dropactivate', event => {})
      .on('dropdeactivate', event => {})
      .on('dragenter', event => {
        this.isOverBin = true
        this.isNoteOverBin(event.relatedTarget.dataset.id, true)

        console.log('a')
      })
      .on('dragleave', event => {
        this.isOverBin = false
        this.isNoteOverBin(event.relatedTarget.dataset.id, false)
      })
  }
}
</script>
<style lang="stylus" scoped>
springy = cubic-bezier(0.35, 0.35, 0.57, 1.54)

.canvas-container
  position absolute
  top 48px
  right 0
  bottom 0
  left 0
  overflow hidden
  padding 0

.canvas
  width 3000px
  height 3000px
  background url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAABlBMVEX////z8vfnE/p3AAAAFElEQVQI12P4//9/A0MDAxDQnwAAjsgPfrGbtywAAAAASUVORK5CYII=') repeat

  .note-selection
    &.selected
      pointer-events none

.bin-container
  position absolute
  right 5px
  bottom 5px
  z-index 9999
  display flex
  justify-content center
  align-items center
  width 150px
  height 150px

  .bin
    font-size 65px
    opacity 0.1
    transition all 0.25s springy
    pointer-events none

  &.drag-over
    .bin
      opacity 1
      transform scale(1.2)

    /* &:hover .bin
    transform translateY(-20px) scale(1.2) */
</style>

<style lang="stylus">
@import url('https://fonts.googleapis.com/css2?family=Caveat&display=swap')
</style>