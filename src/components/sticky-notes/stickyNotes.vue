<template lang="pug">
  v-card
    v-card-title.px-0.py-0
      ToolBar(:activeTool.sync='activeTool' :tools.sync='tools' :processing='processing' 
        @clearNotes='clearNotes' @zoomReset='zoomReset' @snapshot='snapshot')
    v-card-text.canvas-container.pb-0(ref='canvasContainer' v-resize:debounce='updateDimensions')
      .canvas(ref='canvasElement' data-pan :style='canvasStyle')
        Note(v-for='note in notes' :key='note.id' :id='note.id' :ref='note.id' :type='note.type' :value.sync='note.value'
          :color='note.color' :canvas='{scale:canvas.scale, dimensions: canvasDimensions}'
          :zIndex='note.zIndex' :isCrumbled='note.isCrumbled' :position.sync='note.position'
          @noteUpdate='onNoteUpdate')
      .note-selection(data-html2canvas-ignore)
        Note(v-for='note in noteCreation' :key='note.id' :id='note.id' :type='note.type'
          :color='note.color' :position.sync='note.position'
          @noteUpdate='onNoteCreationUpdate')
      .bin-container(ref='bin' :class='{"drag-over":isOverBin}' data-html2canvas-ignore)
        v-icon.bin.ui-element {{isOverBin?'mdi-delete-empty':'mdi-delete'}}
      .pointer-layer
        PointerIndicator(v-for='pointer in pointers' :key='pointer.id' :position='pointer.position' :user='pointer.user')
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch, Ref } from 'vue-property-decorator'
import {
  PaperColors,
  InkColors,
  NoteTypes,
  NoteParameters,
  PointerParameters,
  ToolTypes,
  ToolStatus,
  NoteUpdateEventTypes,
  SyncEventTypes,
} from './types'
import Note from './note.vue'
import { snapshot } from './export'
import ToolBar from './toolBar.vue'
import PointerIndicator from './pointerIndicator.vue'
import interact from 'interactjs'
import { generateUID, clamp } from '@/shared/utils.ts'
import { throttle, defaultsDeep, defer } from 'lodash'
import panzoom from 'pan-zoom'
import resize from 'vue-resize-directive'
import config from './config.json'
type NoteConfig = Partial<NoteParameters>
const UPDATE_EVENT = 'update'
@Component({
  components: { Note, ToolBar, PointerIndicator },
  directives: { resize },
})
export default class StickyNotes extends Vue {
  name = 'StickyNotes'
  notes: NoteParameters[] = []
  noteCreation: NoteParameters[] = []
  pointers: PointerParameters[] = []
  isOverBin = false
  canvasDimensions = config.canvas.width
  zoomInstance: null | typeof panzoom
  canvas = { x: 0, y: 0, scale: 1 }
  dimensions: {
    canvas: {
      width: number
      height: number
    }
    viewPort: {
      x: number
      y: number
      width: number
      height: number
    }
  } | null = null

  activeTool: ToolTypes = ToolTypes.hand
  tools: ToolStatus = {
    bucket: { swatch: { name: 'yellow', color: '' } },
    pen: { swatch: { name: 'black', color: '' } },
  }
  processing = { snapshot: false }

  @Ref()
  bin!: HTMLElement
  @Ref()
  canvasElement!: HTMLElement
  @Ref()
  canvasContainer!: HTMLElement

  get highestZindex() {
    return this.notes.reduce((acc, val) => Math.max(acc, val.zIndex), 0)
  }
  get canvasStyle() {
    const { x, y, scale } = this.canvas
    return {
      transform: `translate3D(${x}px, ${y}px, 0) scale(${scale}, ${scale})`,
    }
  }

  onNoteUpdate(event) {
    const note = this.findNote(event.note.id)

    const throttledMove = throttle(note => {
      this.$emit(UPDATE_EVENT, {
        type: NoteUpdateEventTypes.move,
        note,
      })
    }, config.sync)
    if (!note) return
    switch (event.type) {
      case NoteUpdateEventTypes.dragStart:
        this.updateNoteToTop(note)
        break
      case NoteUpdateEventTypes.input:
      case NoteUpdateEventTypes.dragEnd:
        this.$emit(UPDATE_EVENT, {
          type: event.type,
          note,
        })
        break
      case NoteUpdateEventTypes.tap:
        if (this.activeTool !== ToolTypes.bucket) {
          ;(this.$refs[note.id][0] as Note).startEdit()
        }
        if (this.activeTool === ToolTypes.bucket) {
          note.color.paper = this.tools.bucket.swatch.name as PaperColors
          this.$emit(UPDATE_EVENT, {
            type: NoteUpdateEventTypes.color,
            note,
          })
        }
        if (this.activeTool === ToolTypes.pen) {
          note.color.ink = this.tools.pen.swatch.name as InkColors
          this.$emit(UPDATE_EVENT, {
            type: NoteUpdateEventTypes.color,
            note,
          })
        }
        break
      case NoteUpdateEventTypes.move:
        throttledMove(note)
        break
      default:
        break
    }
  }
  onNoteCreationUpdate(event) {
    switch (event.type) {
      case NoteUpdateEventTypes.dragEnd:
      case NoteUpdateEventTypes.tap:
        this.cloneNoteFromSelected(event.note)
        break
      default:
        break
    }
  }

  findNote(id): NoteParameters | undefined {
    return this.notes.find(note => note.id === id)
  }
  createNote(options: NoteConfig, network = false) {
    const defaultOptions = {
      value: '',
      color: { paper: PaperColors.yellow, ink: InkColors.black },
      type: NoteTypes.default,
      position: {
        x: 0,
        y: 0,
        rotation: 0,
      },
    }
    options = defaultsDeep(options, defaultOptions)

    const note = {
      id: network ? options.id : generateUID(),
      value: options.value,
      color: options.color,
      zIndex: network ? options.zIndex : this.highestZindex + 1,
      isCrumbled: false,
      position: options.position,
    }
    this.notes.push(note as NoteParameters)

    if (!network) {
      this.$emit(UPDATE_EVENT, {
        type: NoteUpdateEventTypes.create,
        note: note,
      })
    }
    return note
  }

  deleteNote(id: string, network = false) {
    const foundNote = this.findNote(id)
    this.notes = this.notes.filter(note => note.id !== id)
    if (!network) {
      this.$emit(UPDATE_EVENT, {
        type: NoteUpdateEventTypes.delete,
        note: foundNote,
      })
    }
  }
  clearNotes() {
    this.notes.forEach(note => {
      this.deleteNote(note.id)
    })
  }
  updateNoteToTop(note: NoteParameters) {
    const highestZindex = this.highestZindex
    if (note.zIndex < highestZindex) {
      note.zIndex = highestZindex + 1
    }
  }
  update(event: { type: SyncEventTypes; [key: string]: any }) {
    let foundNote: NoteParameters | undefined
    switch (event.type) {
      case SyncEventTypes.create:
        this.createNote(event.note, true)
        break
      case SyncEventTypes.delete:
        this.deleteNote(event.note.id, true)
        break
      case SyncEventTypes.update:
        foundNote = this.findNote(event.note.id)
        if (!foundNote) return
        foundNote.position = event.note.position
        foundNote.color = event.note.color
        foundNote.value = event.note.value
        this.updateNoteToTop(foundNote)
        break
      case SyncEventTypes.pointerMove:
        let localPointer = this.pointers.find(p => p.id === event.pointer.id)
        if (!localPointer) {
          localPointer = { ...event.pointer } as PointerParameters
          this.pointers.push(localPointer)
        }
        localPointer.user = event.pointer.user
        localPointer.lastUpdate = Date.now()
        localPointer.position = {
          x: event.pointer.position.x * this.canvas.scale + this.canvas.x,
          y: event.pointer.position.y * this.canvas.scale + this.canvas.y,
        }
        break
      default:
        break
    }
  }
  cloneNoteFromSelected(note: NoteParameters) {
    const newNote = this.createNote({
      color: {
        paper: note.color.paper,
        ink: this.tools.pen.swatch.name as InkColors,
      },
      position: {
        x:
          (-this.canvas.x + note.position.x + config.note.width / 3) /
          this.canvas.scale,
        y: (-this.canvas.y + config.note.width) / this.canvas.scale,
        rotation: 0,
      },
    }) as NoteParameters

    defer(() => {
      ;(this.$refs[newNote.id][0] as Note).startEdit()
    })
  }
  initPointerIndicators() {
    const throttledMove = throttle(pointer => {
      this.$emit(UPDATE_EVENT, {
        type: SyncEventTypes.pointerMove,
        pointer,
      })
    }, config.sync)

    this.canvasElement.addEventListener('mousemove', e => {
      if (!this.dimensions) return
      let mouseX = e.pageX - this.dimensions.viewPort.x
      let mouseY = e.pageY - this.dimensions.viewPort.y
      let x = (-this.canvas.x + mouseX) / this.canvas.scale
      let y = (-this.canvas.y + mouseY) / this.canvas.scale
      throttledMove({ position: { x, y } })
    })

    setInterval(() => {
      const now = Date.now()
      this.pointers = this.pointers.filter(
        pointer => pointer.lastUpdate + 5 * 1000 > now,
      )
    }, 1000)
  }
  updateDimensions() {
    let { x, y } = this.canvasContainer.getBoundingClientRect()
    this.dimensions = {
      canvas: {
        width: this.canvasElement.offsetWidth,
        height: this.canvasElement.offsetHeight,
      },
      viewPort: {
        x,
        y,
        width: this.canvasContainer.offsetWidth,
        height: this.canvasContainer.offsetHeight,
      },
    }
  }
  initZoom() {
    const ensureBounds = (dimensions, { x, y, scale }) => {
      const limit = (prop: 'width' | 'height') =>
        -dimensions.canvas[prop] * scale + dimensions.viewPort[prop]
      x = clamp(limit('width'), x, 0)
      y = clamp(limit('height'), y, 0)
      return { x, y, scale }
    }

    this.canvasElement.addEventListener('wheel', e => {
      e.preventDefault()
      if (!this.dimensions) return

      let deltaY = clamp(-1, e.deltaY, 1) / 5
      let newScale = clamp(
        config.canvas.minZoom,
        this.canvas.scale * (1 - deltaY),
        config.canvas.maxZoom,
      )

      let mouseX = e.pageX - this.dimensions.viewPort.x
      let mouseY = e.pageY - this.dimensions.viewPort.y

      let scaleFactor = newScale / this.canvas.scale
      let x = -(mouseX - this.canvas.x) * scaleFactor + mouseX
      let y = -(mouseY - this.canvas.y) * scaleFactor + mouseY

      this.canvas = ensureBounds(this.dimensions, { x, y, scale: newScale })
    })

    this.zoomInstance = panzoom(this.canvasElement, e => {
      if (e.dz !== 0 || e.srcElement.dataset.pan === undefined) return

      this.canvas = ensureBounds(this.dimensions, {
        x: this.canvas.x + e.dx,
        y: this.canvas.y + e.dy,
        scale: this.canvas.scale,
      })
    })
    this.zoomReset()
  }
  zoomReset() {
    const topLeft = -this.canvasDimensions / 3
    this.canvas = {
      x: topLeft,
      y: topLeft,
      scale: 1,
    }
  }
  createNoteCreation() {
    const { width, height } = config.note
    const offset = width * 2.5

    Object.values(PaperColors).forEach((paperColor, index) => {
      this.noteCreation.push({
        id: generateUID(),
        color: {
          paper: paperColor as PaperColors,
          ink: InkColors.black,
        },
        type: NoteTypes.noteCreation,
        zIndex: 1,
        position: {
          x: offset - width * 0.5 * index,
          y: -height * 0.75,
          rotation: 35,
        },
      })
    })
  }
  async snapshot() {
    if (this.processing.snapshot || !this.dimensions) return
    this.processing.snapshot = true
    const oldScale = this.canvas.scale
    this.canvas.scale = 1
    snapshot(
      {
        notes: this.notes,
        canvasElement: this.canvasElement,
        canvas: this.canvas,
        viewPort: this.dimensions.viewPort,
      },
      () => {
        this.processing.snapshot = false
        this.canvas.scale = oldScale
      },
    )
  }
  createTestNotes() {
    this.createNote({
      position: { x: 2000, y: 2000, rotation: 0 },
      value: 'Hello',
      color: { paper: PaperColors.yellow, ink: InkColors.red },
    })
    this.createNote({
      position: { x: 2150, y: 2000, rotation: 0 },
      value: 'a a a a a a a ',
      color: { paper: PaperColors.green, ink: InkColors.blue },
    })
    this.createNote({
      position: { x: 2150, y: 2150, rotation: 0 },
      value: 'Was ist das',
      color: { paper: PaperColors.red, ink: InkColors.green },
    })
    this.createNote({
      position: { x: 2300, y: 2150, rotation: 0 },
      value: 'Alle meine Entchen schwimmen auf dem See',
      color: { paper: PaperColors.blue, ink: InkColors.purple },
    })
  }
  mounted() {
    defer(() => {
      this.updateDimensions()
    })

    this.createNoteCreation()
    //this.createTestNotes()
    this.initZoom()
    this.initPointerIndicators()

    const setCrumbled = (id: string, value: boolean) => {
      const note = this.findNote(id)
      this.isOverBin = value
      if (note) note.isCrumbled = value
    }
    const getId = event => event.relatedTarget.dataset.id
    interact(this.bin)
      .dropzone({
        ondrop: event => {
          this.isOverBin = false
          this.deleteNote(getId(event))
        },
      })
      .on('dragenter', event => {
        setCrumbled(getId(event), true)
      })
      .on('dragleave', event => {
        setCrumbled(getId(event), false)
      })
  }
}
</script>
<style lang="stylus" scoped>
@import ('../../shared/style.styl')

json('config.json')

.canvas-container
  position absolute
  top 48px
  right 0
  bottom 0
  left 0
  overflow hidden
  padding 0

.canvas
  width unit(canvas-width, 'px')
  height unit(canvas-height, 'px')
  background url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAABlBMVEX////z8vfnE/p3AAAAFElEQVQI12P4//9/A0MDAxDQnwAAjsgPfrGbtywAAAAASUVORK5CYII=') repeat
  transform-origin 0 0 0

.note-selection
  position absolute
  top 0
  left 0

.pointer-layer
  pointer-events none
  full-absolute 0

.bin-container
  position absolute
  right 0
  bottom 0
  z-index 9999
  display flex
  justify-content center
  align-items center
  width 150px
  height 150px
  pointer-events none

  .bin
    font-size 65px
    opacity 0.1
    transition all 0.25s springy

  &.drag-over
    .bin
      opacity 1
      transform scale(1.2)
</style>
<style lang="stylus">
@import url('https://fonts.googleapis.com/css2?family=Caveat&display=swap')
</style>