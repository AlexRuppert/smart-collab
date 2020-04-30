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
        Note(v-for='note in notes' :key='note.id' :id='note.id' :type='note.type' v-model='note.value' :color='note.color'
          :zIndex='note.zIndex' :isOverBin='note.isOverBin' :dimensions='canvasDimensions' :zoomScale='canvas.scale' :position='note.position'
          @noteUpdate='onNoteUpdate')
      .note-selection(data-html2canvas-ignore)
        Note(v-for='note in noteSelection' :key='note.id' :id='note.id' :type='note.type' :color='note.color'
          :zIndex='note.zIndex' :position='note.position'
          @noteUpdate='onNoteSelectionUpdate')
      .bin-container(ref='bin' :class='binClass' data-html2canvas-ignore)
        v-icon.bin.ui-element {{isOverBin?'mdi-delete-empty':'mdi-delete'}}
      .pointer-layer
        PointerIndicator(v-for='pointer in pointers' :position='pointer.position' :user='pointer.user')
          
        
    //input(ref='fileElement' type='file' style='display:none' @change='importContent')
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import FileSaver from 'file-saver'
import Note from '@/components/Note.vue'
import PointerIndicator from '@/components/PointerIndicator.vue'
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
  id?: string
  value?: string
  color?: NoteColors
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
})
export default class StickyNotesComponent extends Vue {
  name = 'StickyNotesComponent'

  notes = [] as NoteParameters[]
  noteSelection = [] as NoteParameters[]
  pointers = [
    // { position: { x: 150, y: 150 }, user: { name: 'Alex', color: '#4e6fa3' } },
  ] as any
  isOverBin = false
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
  canvas = { x: 0, y: 0, scale: 1 }

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
    }, 15)
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
  findNote(id): NoteParameters | undefined {
    return this.notes.find(note => note.id === id)
  }
  createNote(options: NoteConfig, network = false) {
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
      id: network ? options.id : generateUID(),
      value: options.value,
      color: options.color,
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
    this.notes = []
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
      case 'input':
        foundNote = this.findNote(event.note.id)

        if (foundNote) foundNote.value = event.note.value
        break
      case 'dragEnd':
        foundNote = this.findNote(event.note.id)
        if (foundNote) {
          this.updateNoteToTop(foundNote)
          foundNote.position = event.note.position
        }
        break
      case 'pointerMove':
        let localPointer = this.pointers.find(p => p.id === event.pointer.id)
        if (!localPointer) {
          localPointer = { ...event.pointer }
          this.pointers.push(localPointer)
        }

        localPointer.user = event.pointer.user
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
      color: note.color,
      position: {
        x: (-this.canvas.x + note.position.x) / this.canvas.scale,
        y: (-this.canvas.y + 50) / this.canvas.scale,
        rotation: 0,
      },
    })
  }

  zoomReset() {
    this.canvas = { x: 0, y: 0, scale: 1 }
  }

  applyPointerIndicators() {
    const throttledMove = _.throttle(pointer => {
      this.$emit('update', {
        type: 'pointerMove',
        pointer,
      })
    }, 15)
    const canvas = this.$refs.canvas as HTMLElement
    canvas.addEventListener('mousemove', e => {
      let mouseX = e.pageX - this.dimensions.viewPort.offsetX
      let mouseY = e.pageY - this.dimensions.viewPort.offsetY

      let x = -this.canvas.x + mouseX / this.canvas.scale
      let y = -this.canvas.y + mouseY / this.canvas.scale
      throttledMove({ position: { x, y } })
    })
  }
  dimensions
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
    this.updateDimensions()
    window.addEventListener('resize', this.updateDimensions)
    this.createNoteSelection()
    /*this.createNote({
      position: { x: 80, y: 50 },
      value: 'Hello',
    })*/
    this.applyZoom()
    this.applyPointerIndicators()
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

    /* &:hover .bin
    transform translateY(-20px) scale(1.2) */
</style>

<style lang="stylus">
@import url('https://fonts.googleapis.com/css2?family=Caveat&display=swap')
</style>