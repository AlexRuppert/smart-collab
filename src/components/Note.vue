<template lang="pug">
  .note(ref='root' :data-id='id' :style='noteStyle' :class='noteClass' @dblclick.stop.prevent='onEditStart' )
    .shadow(data-html2canvas-ignore)
    .paper
    .text-container
      .text(ref='text' :style='textStyle' :contenteditable='isEdited' spellcheck='false'
        @focusout='onEditEnd' @focus='onFocus' @keydown.enter='onEnter') {{innerValue}}
      
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import interact from 'interactjs'
import { clamp } from '@/shared/utils.ts'

export enum NoteColors {
  yellow = 'yellow',
  blue = 'blue',
  green = 'green',
  red = 'red',
  orange = 'orange',
  white = 'white',
  purple = 'purple',
}

export enum NoteTypes {
  default = 'default',
  noteSelection = 'noteSelection',
}
@Component
export default class Note extends Vue {
  name = 'Note'

  @Prop({
    default: 1,
  })
  zoomScale!: number
  @Prop({
    default: false,
  })
  isOverBin!: boolean

  @Prop({
    default: '',
  })
  value!: string

  @Prop({
    default: 1,
  })
  zIndex!: number

  @Prop({
    default: '1',
  })
  id!: string

  @Prop({
    default: 'default',
  })
  type!: string

  @Prop({
    default: NoteColors.yellow,
  })
  color!: NoteColors

  @Prop({
    default: '',
  })
  position!: { x: number; y: number; rotation: number }

  @Prop({
    default: 900,
  })
  dimensions!: Number
  @Watch('value')
  onValueChanged() {
    this.innerValue = this.value
  }

  @Watch('position')
  onPositionChanged() {
    this.innerPosition = this.position
  }

  innerValue = ''
  innerPosition = { x: 0, y: 0, rotation: 0 }
  isDragged = false
  isHold = false
  isEdited = true
  interactInstance!: any

  rotationSmoother = [] as number[]
  onEditStart() {
    this.isEdited = true

    const text = this.$refs.text as HTMLElement
    setTimeout(() => {
      text.focus()
    }, 10)
  }
  onFocus() {
    document.execCommand('selectAll', false, undefined)
  }
  onEnter(event) {
    event.target.blur()
  }
  onEditEnd(event) {
    this.isEdited = false
    this.innerValue = event.target.innerText.trim().replace(/\s+/g, ' ')
    const text = this.$refs.text as HTMLElement
    while (text.childNodes.length > 1) {
      text.removeChild(text.childNodes[0])
    }
    this.$emit('input', this.innerValue)
  }

  get noteClass() {
    const classes = ['n-' + this.color] as string[]

    if (this.type === NoteTypes.noteSelection) {
      classes.push('ui-element')
    }

    if (this.isEdited) {
      classes.push('edited')
    } else {
      classes.push('movable')
    }
    if (this.isOverBin) {
      classes.push('crumbled')
    }

    return classes
  }
  get textStyle() {
    const contentArray = this.innerValue.split(/\s/).map(s => s.trim())
    const maxLineLength = Math.max(...contentArray.map(c => c.length))
    const lineCount = contentArray.length

    let fontSize

    if (this.isEdited) {
      fontSize = 20
    } else {
      fontSize = clamp(15, 150 / (maxLineLength * 0.8), 90)
    }
    const lineHeight = clamp(15, fontSize * 1.1, 90)
    return {
      fontSize: fontSize + 'px',
      lineHeight: lineHeight + 'px',
    }
  }

  get noteStyle() {
    return {
      transform: `translate(${this.innerPosition.x}px, ${this.innerPosition.y}px) rotate(${this.innerPosition.rotation}deg)`,
      zIndex: this.zIndex,
    }
  }

  setPosition(coordinates = { x: 0, y: 0, rotation: 0 }) {
    this.innerPosition = coordinates
  }

  mounted() {
    this.onValueChanged()
    this.isEdited = false
    const note = this.$refs.root as HTMLElement
    this.setPosition(this.position)
    this.interactInstance = interact(note)
      .styleCursor(false)
      .draggable({
        onstart: () => {
          this.isDragged = true
          this.$emit('dragStart', this)
        },
        onmove: event => {
          const maxRotation = 20
          const x = clamp(
            0,
            this.innerPosition.x + event.dx / this.zoomScale,
            this.dimensions,
          )
          const y = clamp(
            0,
            this.innerPosition.y + event.dy / this.zoomScale,
            this.dimensions,
          )

          let rotation = clamp(
            -maxRotation,
            (maxRotation * event.dx) / 50,
            maxRotation,
          )
          this.rotationSmoother.push(rotation)
          if (this.rotationSmoother.length > 4) {
            this.rotationSmoother = this.rotationSmoother.slice(1)
          }

          const averageRotation =
            this.rotationSmoother.reduce((acc, val) => acc + val, 0) /
            this.rotationSmoother.length
          if (!this.isEdited && this.type !== NoteTypes.noteSelection) {
            this.setPosition({ x, y, rotation: averageRotation })
            this.$emit('moved', this)
          }
        },
        onend: () => {
          this.isDragged = false
          this.$emit('dragEnd', this)
        },
      })
  }

  beforeDestroy() {
    interact(this.$refs.root as HTMLElement).unset()
  }
}
</script>
<style lang="stylus" scoped>
gradient(color)
  background linear-gradient(180deg, darken(color, 1%) 0%, darken(color, 2%) 13%, color 37%, color 73%, lighten(color, 8%) 100%)

gradient-hover(color)
  background linear-gradient(180deg, darken(color, 1%) 0%, darken(color, 2%) 13%, lighten(color, 2%) 37%, lighten(color, 3%) 73%, lighten(color, 12%) 80%, lighten(color, 17%) 100%)

random(a, b)
  return math(math(0, 'random') * (b - a + 1) + a, 'floor')

paper-colors = { yellow: #fffaba, blue: #b3e4ff, green: #d4ffb3, red: #ffb6b3, orange: #ffd6b3, white: #fdfdfd, purple: #f0b3ff }
paper-hues = { yellow: 165, blue: 165, green: 165, red: 165, orange: 165, white: 0, purple: 165 }
springy = cubic-bezier(0.35, 0.35, 0.57, 1.54)

generateColorGradients(classname)
  for name, color in paper-colors
    &.n-{name}
      .{classname}
        gradient(color)

      &:hover .{classname}
        gradient-hover(color)

.note
  position absolute
  z-index 1
  margin-bottom 10px
  width 150px
  height 150px
  border 1px solid transparent
  border-radius 2px
  background transparent
  transform-origin center center
  user-select none
  will-change transform

  & .shadow
    position absolute
    top 25px
    right 0
    bottom 0
    left 0
    z-index 0
    width 100%
    box-shadow 0.5px 3px 4px -1px rgba(0, 0, 0, 0.25), 1px 1px 12px -2px rgba(0, 0, 0, 0.1)
    opacity 1
    transition all 0.15s ease-out
    transform perspective(10px) rotateX(0.2deg) scaleY(0.95) scaleX(0.95)
    transform-origin top

  &:hover .shadow
    box-shadow 0.5px 5px 10px rgba(0, 0, 0, 0.2), 1px 1px 12px -2px rgba(0, 0, 0, 0.1)
    transform perspective(10px) rotateX(0.2deg) scaleY(0.94) scaleX(0.95)

  &:active .shadow
    top 0
    box-shadow 0.5px 5px 10px rgba(0, 0, 0, 0.16), 1px 1px 12px 1px rgba(0, 0, 0, 0.07)
    transform perspective(10px) rotateX(0deg) scaleY(1) scaleX(1)

  & .paper
    position absolute
    top 0
    right 0
    bottom 0
    left 0
    z-index 2
    width 100%
    height 100%
    border-radius 2px
    transition all 0.15s ease-out
    transform-origin top

  &:hover .paper
    transform perspective(20px) rotateX(0.1deg) scaleY(0.98)

  &:active .paper
    transform perspective(20px) rotateX(0) scaleY(1)

  // crumbled
  &.crumbled
    overflow hidden

    .shadow
      opacity -10
      transform scale(0.1) rotateZ(59deg)

    .paper
      transform-origin center center

    .paper
      filter brightness(1)
      background-image url('../assets/crumbled.png') !important
      background-size cover !important
      transform scale(0.7) rotateZ(59deg)
      transform-origin center center

    filter-color(hue, bri)
      invert(30%) sepia(100%) saturate(180%) hue-rotate(unit(hue, deg)) brightness(percentage(bri)) contrast(110%) drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.3))

    &.n-blue
      .paper
        filter filter-color(165, 1)

    &.n-red
      .paper
        filter filter-color(-50, 1)

    &.n-green
      .paper
        filter filter-color(50, 1.2)

    &.n-yellow
      .paper
        filter filter-color(15, 1.2)

    &.n-purple
      .paper
        filter filter-color(-115, 1)

    &.n-orange
      .paper
        filter filter-color(-10, 1)

    &.n-white
      .paper
        filter invert(30%) contrast(100%) brightness(150%)

    .text
      color transparent

  generateColorGradients(paper)

  &.edited .text
    cursor text

  &.movable
    cursor grab

.text-container
  position absolute
  top 1px
  right 1px
  bottom 1px
  left 1px
  z-index 3
  display flex
  justify-content center
  align-items center
  overflow hidden

  .text
    padding 8px
    max-width 150px
    outline none
    color #222
    text-align center
    font-family 'Caveat', cursive
    transition font-size 0.1s springy

    &::selection
      border-radius 3px
      background-color transparent
      color #3486eb
</style>

