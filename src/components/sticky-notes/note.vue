<template lang="pug">
  transition(name='slide' appear)
    .note(ref='root' :data-id='id' :style='noteStyle' :class='noteClass')
      .shadow
      .paper
      .text-container
        //transition-group(tag='div' name='fade' mode='out-in')
        textarea(v-show='isEdited' :key='1' ref='text' maxlength='100' spellcheck='false'
          @focusout='endEdit' @focus='onFocus' @keydown.enter='onEnter')
        .text(v-show='!isEdited' :key='2' :style='textStyle') {{formattedText}}
</template>
<script lang="ts">
import { Component, Prop, Vue, Ref, PropSync } from 'vue-property-decorator'
import interact from 'interactjs'
import Interactable from '@interactjs/core/Interactable'
import { mean } from 'lodash'
import { clamp } from '@/shared/utils.ts'
import {
  PaperColors,
  InkColors,
  NoteTypes,
  NotePosition,
  NoteUpdateEventTypes,
} from './types'

import { BestFit } from './bestFit'
import * as config from './config.json'
const EVENT_UPDATE = 'noteUpdate'
const BASE_FONT_SIZE = 16
@Component
export default class Note extends Vue {
  name = 'Note'

  isDragged = false
  isEdited = false
  interactInstance!: Interactable
  recomputeTextStyle = false

  @Ref()
  root!: HTMLElement

  @Ref()
  text!: HTMLInputElement

  @PropSync('position', {
    default: { x: 0, y: 0, rotation: 0 },
  })
  innerPosition!: NotePosition

  @PropSync('value', {
    default: '',
  })
  innerValue!: string

  @Prop({
    default: () => ({ scale: 1, dimensions: 1000 }),
  })
  canvas!: { scale: number; dimensions: number }

  @Prop({
    default: false,
  })
  isCrumbled!: boolean

  @Prop({
    default: 1,
  })
  zIndex!: number

  @Prop({
    default: '1',
  })
  id!: string

  @Prop({
    default: NoteTypes.default,
  })
  type!: NoteTypes

  @Prop({
    default: () => ({ paper: PaperColors.yellow, ink: InkColors.black }),
  })
  color!: { paper: PaperColors; ink: InkColors }

  get bestFit() {
    return BestFit.getFit(this.innerValue, {
      baseFontSize: BASE_FONT_SIZE,
      dimensions: config.note.width,
      padding: 7,
    })
  }

  get formattedText() {
    return this.bestFit.value
  }

  get noteClass() {
    const classes = ['p-' + this.color.paper, 'i-' + this.color.ink] as string[]

    if (this.isEdited) {
      classes.push('edited')
    } else if (this.type === NoteTypes.default) {
      classes.push('movable')
    }

    if (this.isDragged) {
      classes.push('dragged')
    }

    if (this.isCrumbled) {
      classes.push('crumbled')
    }

    return classes
  }

  get textStyle() {
    this.recomputeTextStyle
    this.innerValue

    let fontSize = clamp(
      13,
      Math.floor(BASE_FONT_SIZE * this.bestFit.scale),
      90,
    )

    const lineHeight = clamp(15, fontSize * 1.1, 90)
    return {
      fontSize: fontSize + 'px',
      lineHeight: lineHeight + 'px',
    }
  }

  get noteStyle() {
    const { x, y, rotation } = this.innerPosition
    return {
      transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`,
      zIndex: this.zIndex,
    }
  }

  startEdit() {
    this.isEdited = true
    this.text.value = this.innerValue

    setTimeout(() => {
      this.text.focus()
    }, 10)
  }
  onFocus() {
    document.execCommand('selectAll', false, undefined)
  }
  onEnter(event) {
    event.target.blur()
  }
  endEdit(event) {
    this.isEdited = false
    this.innerValue = this.text.value.trim().replace(/\s+/g, ' ')
    this.$emit(EVENT_UPDATE, { type: NoteUpdateEventTypes.input, note: this })
  }

  mounted() {
    let smoothRotation = [0, 0, 0, 0, 0]
    let sri = 0
    const MAX_ROTATION = 20
    this.interactInstance = interact(this.root)
      .styleCursor(false)
      .draggable({
        onstart: () => {
          if (this.isEdited) return
          this.isDragged = true
          this.$emit(EVENT_UPDATE, { type: 'dragStart', note: this })
        },
        onmove: event => {
          if (this.isEdited || this.type === NoteTypes.noteCreation) return

          let { x, y } = {
              ...this.innerPosition,
            },
            { dx, dy } = { dx: event.dx, dy: event.dy }

          x = clamp(0, x + dx / this.canvas.scale, this.canvas.dimensions)
          y = clamp(0, y + dy / this.canvas.scale, this.canvas.dimensions)

          let rotation = clamp(-MAX_ROTATION, dx / 5, MAX_ROTATION)
          smoothRotation[sri] = rotation

          rotation = mean(smoothRotation)
          if (++sri >= smoothRotation.length) sri = 0

          this.innerPosition = { x, y, rotation }
          this.$emit(EVENT_UPDATE, { type: 'move', note: this })
        },
        onend: () => {
          this.isDragged = false
          this.$emit(EVENT_UPDATE, { type: 'dragEnd', note: this })
        },
      })
      .on('doubletap', event => {
        //this.startEdit()
      })
      .on('tap', event => {
        if (event.double) return
        this.$emit(EVENT_UPDATE, { type: 'tap', note: this })
      })

    setTimeout(() => {
      this.recomputeTextStyle = !this.recomputeTextStyle
    }, 200)
  }

  beforeDestroy() {
    interact(this.root).unset()
  }
}
</script>


<style lang="stylus" scoped>
@import ('../../shared/style.styl')

paperColors = json('paper-colors.json', { hash: true })
paperCrumbledColors = json('paper-crumbled-colors.json', { hash: true })
inkColors = json('ink-colors.json', { hash: true })
json('config.json')
crumbled-paper = url('../../assets/crumbled.png')

gradient(color, params)
  background linear-gradient(180deg, darken(color, params[0]) 0%, darken(color, params[1]) 13%, lighten(color, params[2]) 37%, lighten(color, params[3]) 73%, lighten(color, params[4]) 100%)

.note
  position absolute
  margin-bottom 10px
  width unit(note-width, 'px')
  height unit(note-height, 'px')
  border-radius 2px
  transition transform 0.051s linear
  transform-origin center center
  user-select none
  will-change transform

  &.slide-enter-active, &.slide-leave-active
    opacity 1
    transition all 0.15s springy

  &.slide-enter, &.slide-leave-to
    margin-top -100px
    opacity 0

  for name, color in inkColors
    &.i-{name}
      .text
        color color

  for name, color in paperColors
    &.p-{name}
      .paper
        gradient(color, 1% 2% 0% 0% 8%)

      &:hover .paper
        gradient(color, 1% 2% 2% 5% 22%)

  &.dragged
    transition none

  .shadow
    position absolute
    top 25px
    right 1px
    bottom 1px
    left 1px
    border-radius 2px
    box-shadow 0.5px 3px 4px -1px rgba(0, 0, 0, 0.25), 1px 1px 12px -2px rgba(0, 0, 0, 0.15)
    transition transform 0.15s ease-out, opacity 0.001s linear
    transform perspective(10px) rotateX(0.2deg) scaleY(0.95) scaleX(0.95)
    transform-origin top

  .paper
    z-index 2
    width 100%
    height 100%
    border-radius 2px
    transition transform 0.15s ease-out
    transform-origin top
    full-absolute 0

  &:hover
    .shadow
      box-shadow 0.5px 5px 10px rgba(0, 0, 0, 0.2), 1px 1px 12px -2px rgba(0, 0, 0, 0.15)
      transform perspective(10px) rotateX(0.2deg) scaleY(0.94) scaleX(0.95)

    .paper
      transform perspective(20px) rotateX(0.1deg) scaleY(0.98)

  &:active
    .shadow
      top 0
      box-shadow 0.5px 5px 10px rgba(0, 0, 0, 0.16), 1px 1px 12px 1px rgba(0, 0, 0, 0.07)
      transform perspective(10px) rotateX(0deg) scaleY(1) scaleX(1)

    .paper
      transform perspective(20px) rotateX(0) scaleY(1)

  &.crumbled
    .shadow
      opacity 0
      transform scale(0.01) rotateZ(59deg)

    .paper
      filter brightness(1)
      background-image crumbled-paper !important
      background-size cover !important
      transform scale(0.7) rotateZ(59deg)
      transform-origin center center

    filter-color(params)
      invert(30%) sepia(100%) saturate(180%) hue-rotate(unit(params[0], deg)) brightness(percentage(params[1])) contrast(110%) drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.3))

    for name, color in paperCrumbledColors
      &.p-{name}
        .paper
          filter filter-color(color)

    &.p-white
      .paper
        filter invert(30%) contrast(100%) brightness(150%)

    .text
      display none

  &.edited .text
    cursor text

  &.movable
    cursor grab

.text-container
  z-index 3
  display flex
  justify-content center
  align-items center
  overflow hidden
  font-family 'Caveat', cursive
  full-absolute 1px

  .fade-enter-active, .fade-leave-active
    transition all 0.15s linear !important

  .fade-enter, .fade-leave-to
    opacity 0
    transform translateX(150px)

  textarea
    line-color = rgba(0, 8, 50, 0.1)
    font-size = 20px
    line-height = 20px
    padding 5px
    width 100%
    outline none
    background-image url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAUAQMAAAB2wMXiAAAABlBMVEUAAAAAAGmRCWAzAAAAAnRSTlMAGovxNEIAAAAMSURBVAjXYyAONAAAAKgAgdaHfAQAAAAASUVORK5CYII=')
    background-position-y 5px
    background-size 1px 21.5px
    background-repeat repeat
    color #222
    text-align justify
    font-size font-size
    resize none
    full-absolute 0

  .text
    max-width unit(note-width, 'px')
    text-align center
    white-space pre
    transition font-size 0.1s springy
</style>