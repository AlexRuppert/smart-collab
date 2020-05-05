<template lang="pug">
  v-card
    v-card-title.px-0.py-0
      v-toolbar(dense flat)
        v-btn(icon :style='handStyle' color='#333' @click='selectHand')
          v-icon mdi-hand-right
        v-menu(nudge-bottom offset-y transition='scroll-y-transition' z-index='99999999')
          template(v-slot:activator='{ on }')
            v-btn(icon v-on='on' :color='pencilColor' :style='pencilStyle')
              v-icon mdi-lead-pencil
          v-card.user-config-menu
            v-card-text
              .color-selection
                v-btn.pa-0.ma-1(v-for='swatch in pencilColors' :color='swatch.color' fab small @click='selectPencil(swatch)')
                v-btn.pa-0.ma-1(fab small @click='selectPencil()')
                  v-icon mdi-pencil-off
                
        v-menu(nudge-bottom offset-y transition='scroll-y-transition' z-index='99999999')
          template(v-slot:activator='{ on }')
            v-btn(icon v-on='on' :color='bucketColor' :style='bucketStyle')
              v-icon mdi-format-color-fill
          v-card.user-config-menu
            v-card-text
              .color-selection
                v-btn.pa-0.ma-1(v-for='swatch in bucketColors' :color='swatch.color' style='min-width: 38px;' @click='selectBucket(swatch)')
        
        v-spacer
        v-dialog(v-model='dialogs.clearNotes' max-width='290')
          template(v-slot:activator='{ on }')
            v-btn(icon v-on='on')
              v-icon mdi-delete
          v-card
            v-card-title
            v-card-text Do you want to delete all notes?
            v-card-actions
              v-spacer
              v-btn(text @click='dialogs.clearNotes=false') Cancel
              v-btn(text color='primary' @click='dialogs.clearNotes=false;clearNotes()') Ok
        v-btn(icon @click='zoomReset')
          v-icon mdi-image-filter-center-focus
        //v-btn(icon @click='$refs.fileElement.click()')
          v-icon mdi-cloud-upload-outline
        //v-btn(icon @click='')
          v-icon mdi-cloud-download-outline
        v-btn(color='primary' icon @click='snapshot' :loading='tools.snapshot.active')
          v-icon mdi-camera
    v-card-text.canvas-container.pb-0(ref='canvasContainer' v-resize:debounce='updateDimensions')
      .canvas(ref='canvas' data-pan :style='canvasStyle')
        Note(v-for='note in notes' :key='note.id' :id='note.id' :ref='note.id' :type='note.type' v-model='note.value'
          :paperColor='note.paperColor' :inkColor='note.inkColor'
          :zIndex='note.zIndex' :isOverBin='note.isOverBin' :dimensions='canvasDimensions' :zoomScale='canvas.scale' :position='note.position'
          @noteUpdate='onNoteUpdate')
      .note-selection(data-html2canvas-ignore)
        Note(v-for='note in noteSelection' :key='note.id' :id='note.id' :type='note.type'
          :paperColor='note.paperColor' :inkColor='note.inkColor'
          :zIndex='note.zIndex' :position='note.position'
          @noteUpdate='onNoteSelectionUpdate')
      .bin-container(ref='bin' :class='binClass' data-html2canvas-ignore)
        v-icon.bin.ui-element {{isOverBin?'mdi-delete-empty':'mdi-delete'}}
      .pointer-layer
        PointerIndicator(v-for='pointer in pointers' :key = 'pointer.id' :position='pointer.position' :user='pointer.user')
          
        
    //input(ref='fileElement' type='file' style='display:none' @change='importContent')
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import FileSaver from 'file-saver'
import Note, { PaperColors, InkColors, NoteTypes } from '@/components/Note.vue'
import PointerIndicator from '@/components/PointerIndicator.vue'

import interact from 'interactjs'
import { generateUID, clamp } from '@/shared/utils.ts'
import _ from 'lodash'
import html2canvas from 'html2canvas'
import panzoom from 'pan-zoom'
import resize from 'vue-resize-directive'

type NoteParameters = {
  id: string
  value: string
  paperColor: PaperColors
  inkColor: InkColors
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
  id?: string
  value?: string
  paperColor?: PaperColors
  inkColor?: InkColors
  type?: NoteTypes
  zIndex?: number
  position?: {
    x?: number
    y?: number
    rotation?: number
  }
}
@Component({
  components: { Note, PointerIndicator },
  directives: { resize },
})
export default class StickyNotesComponent extends Vue {
  name = 'StickyNotesComponent'

  notes = [] as NoteParameters[]
  noteSelection = [] as NoteParameters[]
  pointers = [] as any
  isOverBin = false
  canvasDimensions = 6000
  zoom = {
    instance: null as any | null,
  }
  canvas = { x: 0, y: 0, scale: 1 }
  dimensions
  dialogs = {
    clearNotes: false,
  }
  bucketColors = [
    {
      name: 'yellow',
      color: '#fffaba',
    },
    {
      name: 'blue',
      color: '#b3e4ff',
    },
    {
      name: 'green',
      color: '#d4ffb3',
    },
    {
      name: 'red',
      color: '#ffb6b3',
    },
    {
      name: 'orange',
      color: '#ffd6b3',
    },
    {
      name: 'white',
      color: '#fdfdfd',
    },
    {
      name: 'purple',
      color: '#f0b3ff',
    },
  ]
  pencilColors = [
    {
      name: 'black',
      color: '#222',
    },
    {
      name: 'red',
      color: '#8c0a00',
    },
    {
      name: 'blue',
      color: '#0011a6',
    },
    {
      name: 'green',
      color: '#0a8000',
    },
    {
      name: 'purple',
      color: '#540085',
    },
  ]
  tools = {
    bucket: {
      active: false,
      swatch: this.bucketColors[0],
    },
    pencil: {
      active: false,
      swatch: this.pencilColors[0],
      noChange: false,
    },
    hand: {
      active: true,
    },
    snapshot: {
      active: false,
    },
  }

  get bucketColor() {
    if (this.tools.bucket.active) {
      return this.tools.bucket.swatch.color
    }
    return '#555'
  }
  get pencilColor() {
    if (this.tools.pencil.active) {
      return this.tools.pencil.swatch.color
    }
    return '#555'
  }
  get bucketStyle() {
    if (this.tools.bucket.active) {
      return {
        filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,1))',
        backgroundColor: 'rgba(0,200,100,0.04)',
      }
    }
    return {}
  }
  get pencilStyle() {
    if (this.tools.pencil.active) {
      return {
        backgroundColor: 'rgba(0,200,100,0.1)',
      }
    }
    return {}
  }
  get handStyle() {
    if (this.tools.hand.active) {
      return {
        backgroundColor: 'rgba(0,200,100,0.1)',
      }
    }
    return {}
  }
  get binClass() {
    const classes = [] as string[]

    if (this.isOverBin) {
      classes.push('drag-over')
    }
    return classes
  }
  get highestZindex() {
    return this.notes.reduce((acc, val) => Math.max(acc, val.zIndex), 0)
  }
  get canvasStyle() {
    return {
      transform: `translate3D(${this.canvas.x}px, ${this.canvas.y}px, 0) scale(${this.canvas.scale}, ${this.canvas.scale})`,
      transformOrigin: `0 0 0`,
    }
  }

  onNoteUpdate(event) {
    const foundNote = this.findNote(event.note.id)

    const throttledMove = _.throttle((note, position) => {
      this.$emit('update', {
        type: 'move',
        note: { ...note, position },
      })
    }, 10)
    if (!foundNote) return
    switch (event.type) {
      case 'input':
        this.$emit('update', {
          type: 'input',
          note: foundNote,
        })
        break
      case 'dragStart':
        this.updateNoteToTop(foundNote)
        break
      case 'dragEnd':
        foundNote.position = event.note.innerPosition

        this.$emit('update', {
          type: 'dragEnd',
          note: foundNote,
        })
        break
      case 'tapped':
        if (this.tools.bucket.active) {
          foundNote.paperColor = this.tools.bucket.swatch.name as PaperColors
          this.$emit('update', {
            type: 'color',
            note: foundNote,
          })
        }
        if (this.tools.pencil.active) {
          if (!this.tools.pencil.noChange) {
            foundNote.inkColor = this.tools.pencil.swatch.name as InkColors
          }
          ;(this.$refs[foundNote.id][0] as Note).startEdit()
          this.$emit('update', {
            type: 'color',
            note: foundNote,
          })
        }
        break
      case 'move':
        throttledMove(foundNote, event.note.innerPosition)
        break
      default:
        break
    }
  }
  onNoteSelectionUpdate(event) {
    switch (event.type) {
      case 'input':
        break
      case 'dragStart':
        this.cloneNoteFromSelected(event.note)
        break
      case 'dragEnd':
        break
      case 'tapped':
        this.cloneNoteFromSelected(event.note)
        break

      default:
        break
    }
  }

  selectBucket(swatch: { name: string; color: string }) {
    this.tools.bucket.active = true
    this.tools.hand.active = false
    this.tools.pencil.active = false
    this.tools.bucket.swatch = swatch
  }

  selectPencil(swatch: { name: string; color: string }) {
    this.tools.pencil.active = true
    this.tools.pencil.noChange = false
    this.tools.hand.active = false
    this.tools.bucket.active = false

    if (swatch) {
      this.tools.pencil.swatch = swatch
    } else {
      this.tools.pencil.noChange = true
    }
  }
  selectHand() {
    this.tools.hand.active = true
    this.tools.pencil.active = false
    this.tools.bucket.active = false
  }

  findNote(id): NoteParameters | undefined {
    return this.notes.find(note => note.id === id)
  }
  createNote(options: NoteConfig, network = false) {
    const defaultOptions = {
      value: '',
      paperColor: PaperColors.yellow,
      inkColor: InkColors.black,
      type: NoteTypes.default,
      position: {
        x: 0,
        y: 0,
        rotation: 0,
      },
    }

    options = _.defaultsDeep(options, defaultOptions)
    const note = {
      id: network ? options.id : generateUID(),
      value: options.value,
      paperColor: options.paperColor,
      inkColor: options.inkColor,
      zIndex: network ? options.zIndex : this.highestZindex + 1,
      isOverBin: false,
      position: options.position,
    }

    this.notes.push(note as NoteParameters)

    if (!network) {
      this.$emit('update', {
        type: 'create',
        note: note,
      })
    }
    return note
  }

  deleteNote(id, network = false) {
    const foundNote = this.findNote(id)
    if (!network) {
      this.$emit('update', {
        type: 'delete',
        note: foundNote,
      })
    }
    this.notes = this.notes.filter(note => note.id !== id)
  }
  clearNotes() {
    this.notes.forEach(note => {
      this.deleteNote(note.id)
    })
  }

  updateNoteToTop(note) {
    const highestZindex = this.highestZindex
    if (note.zIndex < highestZindex) {
      note.zIndex = highestZindex + 1
    }
  }

  update(event) {
    let foundNote
    switch (event.type) {
      case 'create':
        this.createNote(event.note, true)
        break
      case 'delete':
        this.deleteNote(event.note.id, true)
        break
      case 'update':
        foundNote = this.findNote(event.note.id)
        if (foundNote) {
          foundNote.value = event.note.value
          this.updateNoteToTop(foundNote)
          foundNote.position = event.note.position
          foundNote.paperColor = event.note.paperColor
          foundNote.inkColor = event.note.inkColor
        }
        break
      case 'pointerMove':
        let localPointer = this.pointers.find(p => p.id === event.pointer.id)
        if (!localPointer) {
          localPointer = { ...event.pointer }
          localPointer.lastUpdate = Date.now
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
  cloneNoteFromSelected(note) {
    const newNote = this.createNote({
      paperColor: note.paperColor,
      inkColor: this.tools.pencil.swatch.name as InkColors,
      position: {
        x: (-this.canvas.x + note.position.x + 50) / this.canvas.scale,
        y: (-this.canvas.y + 150) / this.canvas.scale,
        rotation: 0,
      },
    }) as NoteParameters
    setTimeout(() => {
      if (newNote) {
        ;(this.$refs[newNote.id][0] as Note).startEdit()
      }
    }, 10)
  }

  zoomReset() {
    this.canvas = {
      x: -this.canvasDimensions / 3,
      y: -this.canvasDimensions / 3,
      scale: 1,
    }
  }

  applyPointerIndicators() {
    const throttledMove = _.throttle(pointer => {
      this.$emit('update', {
        type: 'pointerMove',
        pointer,
      })
    }, 10)
    const canvas = this.$refs.canvas as HTMLElement
    canvas.addEventListener('mousemove', e => {
      let mouseX = e.pageX - this.dimensions.viewPort.offsetX
      let mouseY = e.pageY - this.dimensions.viewPort.offsetY

      let x = (-this.canvas.x + mouseX) / this.canvas.scale
      let y = (-this.canvas.y + mouseY) / this.canvas.scale

      throttledMove({ position: { x, y } })
    })
  }

  updateDimensions() {
    const canvas = this.$refs.canvas as HTMLElement
    const canvasContainer = this.$refs.canvasContainer as HTMLElement
    let canvasBounds

    canvasBounds = canvasContainer.getBoundingClientRect()
    this.dimensions = {
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
  }

  applyZoom() {
    const canvas = this.$refs.canvas as HTMLElement

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

      let mouseX = e.pageX - this.dimensions.viewPort.offsetX
      let mouseY = e.pageY - this.dimensions.viewPort.offsetY

      let targetX = (mouseX - this.canvas.x) / currentScale
      let targetY = (mouseY - this.canvas.y) / currentScale

      let x = -targetX * scale + mouseX
      let y = -targetY * scale + mouseY

      this.canvas = ensureBounds(this.dimensions, { x, y, scale })
    })

    this.zoom.instance = panzoom(canvas, e => {
      if (e.dz !== 0) return
      if (e.srcElement.dataset.pan === undefined) {
        return
        e.dx = 0
        e.dy = 0
      }

      let x = this.canvas.x + e.dx
      let y = this.canvas.y + e.dy

      this.canvas = ensureBounds(this.dimensions, {
        x,
        y,
        scale: this.canvas.scale,
      })
    })
    this.zoomReset()
  }

  isNoteOverBin(id, isOverBin) {
    const note = this.findNote(id)
    if (note) note.isOverBin = isOverBin
  }

  createNoteSelection() {
    let offset = 320
    Object.values(PaperColors).forEach((paperColor, index) => {
      const note = {
        id: generateUID(),
        value: '',
        paperColor,
        inkColor: InkColors.black,
        type: NoteTypes.noteSelection,
        zIndex: 199,
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
    if (this.tools.snapshot.active) return
    this.tools.snapshot.active = true
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

    left += this.canvas.x + this.dimensions.viewPort.offsetX
    top += this.canvas.y + this.dimensions.viewPort.offsetY
    right += this.canvas.x + this.dimensions.viewPort.offsetX
    bottom += this.canvas.y + this.dimensions.viewPort.offsetY
    const contentBox = {
      x: left - 50,
      y: top - 50,
      width: right - left + 250,
      height: bottom - top + 250,
    }

    const oldScale = this.canvas.scale
    this.canvas.scale = 1

    setTimeout(async () => {
      const rendered = await html2canvas(canvas, {
        ...contentBox,
        onclone: doc => {
          this.canvas.scale = oldScale
          doc.querySelectorAll('.note').forEach((el: Element, key, parent) => {
            let htmlElement = el as HTMLElement
            const originalNote = this.findNote(htmlElement.dataset.id)
            htmlElement.setAttribute(
              'style',
              htmlElement.style +
                `;position: absolute; left: ${-originalNote!.position
                  .x}px; top: ${-originalNote!.position.y}px`,
            )
          })
          doc.querySelectorAll('.paper').forEach((el: Element, key, parent) => {
            let htmlElement = el as HTMLElement
            htmlElement.setAttribute(
              'style',
              htmlElement.style +
                `; border-bottom: 1.5px solid #ccc; border-right: 1px solid #ddd;`,
            )
          })
        },
      })
      this.tools.snapshot.active = false
      const fileName = `${new Date().toISOString().substr(0, 10)} - export.png`
      rendered.toBlob(function(blob) {
        FileSaver.saveAs(blob, fileName)
      })
    }, 10)
  }

  managePointers() {
    setInterval(() => {
      const now = Date.now()

      this.pointers = this.pointers.filter(
        pointer => pointer.lastUpdate + 5 * 1000 > now,
      )
    }, 1000)
  }

  mounted() {
    this.updateDimensions()
    setTimeout(() => {
      this.updateDimensions()
    }, 100)

    this.createNoteSelection()
    /*this.createNote({
      position: { x: 2000, y: 2000 },
      value: 'Hello',
      inkColor: InkColors.red,
    })
    this.createNote({
      position: { x: 2150, y: 2000 },
      value: 'a a a a a a a ',
      paperColor: PaperColors.green,
      inkColor: InkColors.blue,
    })
    this.createNote({
      position: { x: 2150, y: 2150 },
      value: 'Was ist das',
      paperColor: PaperColors.red,
      inkColor: InkColors.green,
    })
    this.createNote({
      position: { x: 2300, y: 2150 },
      value: 'Alle meine Entchen schwimmen auf dem See',
      paperColor: PaperColors.blue,
      inkColor: InkColors.purple,
    })*/
    this.applyZoom()
    this.applyPointerIndicators()
    this.managePointers()
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

.color-selection
  display flex
  flex-wrap wrap
  justify-content center
  max-width 145px

.canvas-container
  position absolute
  top 48px
  right 0
  bottom 0
  left 0
  overflow hidden
  padding 0

.canvas
  width 6000px
  height 6000px
  background url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZAQMAAAD+JxcgAAAABlBMVEX////z8vfnE/p3AAAAFElEQVQI12P4//9/A0MDAxDQnwAAjsgPfrGbtywAAAAASUVORK5CYII=') repeat

.note-selection
  position absolute
  top 0
  left 0

.pointer-layer
  position absolute
  top 0
  right 0
  bottom 0
  left 0
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