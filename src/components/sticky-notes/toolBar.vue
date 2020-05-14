<template lang="pug">
  -let extendedMenuAttributes = {'v-model':'extendedMenu'}
  mixin tooltip(text)
    v-tooltip(bottom)
      template(v-slot:activator='{ on: tooltip }')
        block
      span= text

  mixin menu(additionalAttributes)
    v-menu(nudge-bottom offset-y transition='scroll-y-transition' z-index='99999999')&attributes(additionalAttributes)
      block

  mixin menuTemplate()
    template(v-slot:activator='{ on: menu }')
      block

  mixin list-item(icon, text)
    v-list-item-icon
      v-icon= icon
    v-list-item-content
      v-list-item-title= text
  v-toolbar.toolbar(dense flat)
    +tooltip('Grab Tool')
      v-btn.hand(icon :class='handClass' color='#555' v-on='{...tooltip}' @click='selectHand')
        v-icon mdi-hand-right
    +tooltip('Ink Color')
      +menu
        +menuTemplate
          v-btn.pen(icon v-on='{...tooltip, ...menu}' :color='penColor' :class='penClass')
            v-icon mdi-lead-pencil
        v-card.user-config-menu
          v-card-text
            .color-selection
              v-btn.pa-0.ma-1(v-for='swatch in penColors' :color='swatch.color' fab small @click='selectPen(swatch)')
            
    +tooltip('Paper Color')
      +menu
        +menuTemplate
          v-btn.bucket(icon v-on='{...tooltip,...menu}' :color='bucketColor' :class='bucketClass')
            v-icon mdi-format-color-fill
        v-card.user-config-menu
          v-card-text
            .color-selection
              v-btn.pa-0.ma-1(v-for='swatch in bucketColors' :color='swatch.color' style='min-width: 38px;'
                @click='selectBucket(swatch)')
    v-spacer
    +tooltip('Snap to Grid')
      v-btn(icon v-on='{...tooltip}' :class='{active:tools.grid.enabled}' @click='toggleGrid()')
        v-icon mdi-grid
    +tooltip('Center View')
      v-btn(icon v-on='{...tooltip}' @click='$emit("zoomReset")')
        v-icon mdi-image-filter-center-focus
    v-spacer
    +tooltip('Snapshot Board')
      v-btn(icon v-on='{...tooltip}' color='primary' @click='$emit("snapshot")' :loading='processing.snapshot')
        v-icon mdi-camera
    +tooltip('More...')
      +menu(extendedMenuAttributes)
        +menuTemplate
          v-btn(icon v-on='{...tooltip, ...menu}')
            v-icon mdi-dots-vertical
        v-list(dense)
          v-list-item(@click='')
              +list-item('mdi-cloud-upload-outline', 'Import')
          v-list-item(@click='')
            +list-item('mdi-cloud-download-outline', 'Export')
          v-divider
          v-dialog(v-model='dialogs.clearNotes' max-width='290' @input='extendedMenu=false')
            template(v-slot:activator='{ on: dialog }')
              v-list-item(v-on='{...dialog}' @click='')
                +list-item('mdi-delete', 'Clear Notes')
            v-card
              v-card-title
              v-card-text Do you want to delete all notes?
              v-card-actions
                v-spacer
                v-btn(text @click='dialogs.clearNotes=false') Cancel
                v-btn(text color='primary' @click='dialogs.clearNotes=false;$emit("clearNotes")') Ok
            
          
</template>

<script lang="ts">
import { Component, Prop, Vue, PropSync } from 'vue-property-decorator'
import PAPER_COLORS from './paper-colors.json'
import INK_COLORS from './ink-colors.json'
import { PaperColors, InkColors, ToolTypes, ToolStatus } from './types'

const DEFAULT_COLOR = '#555'

@Component
export default class ToolBar extends Vue {
  name = 'ToolBar'
  extendedMenu = false
  dialogs = {
    clearNotes: false,
  }

  bucketColors = Object.entries(PAPER_COLORS).map(([name, color]) => ({
    name,
    color,
  })) as { name: PaperColors; color: string }[]
  penColors = Object.entries(INK_COLORS).map(([name, color]) => ({
    name,
    color,
  })) as { name: InkColors; color: string }[]

  @PropSync('activeTool', { default: ToolTypes.hand })
  innerActiveTool!: ToolTypes

  @PropSync('tools', {
    default: () => ({
      bucket: { swatch: { name: PaperColors.yellow, color: '#fff' } },
      pen: { swatch: { name: InkColors.black, color: '#000' } },
      grid: { enabled: false },
    }),
  })
  innerTools!: ToolStatus

  @Prop({ default: { snapshot: false } })
  processing!: { snapshot: boolean }

  isBucket() {
    return this.innerActiveTool === ToolTypes.bucket
  }
  isPen() {
    return this.innerActiveTool === ToolTypes.pen
  }
  isHand() {
    return this.innerActiveTool === ToolTypes.hand
  }
  get bucketColor() {
    return this.isBucket() ? this.innerTools.bucket.swatch.color : DEFAULT_COLOR
  }
  get penColor() {
    return this.innerTools.pen.swatch.color ?? DEFAULT_COLOR
  }
  get bucketClass() {
    return this.isBucket() ? ['active'] : []
  }
  get penClass() {
    return this.isPen() ? ['active'] : []
  }
  get handClass() {
    return this.isHand() ? ['active'] : []
  }

  selectBucket(swatch: { name: PaperColors; color: string }) {
    this.innerActiveTool = ToolTypes.bucket
    this.innerTools.bucket.swatch = swatch
  }
  selectPen(swatch: { name: InkColors; color: string }) {
    this.innerActiveTool = ToolTypes.pen
    this.innerTools.pen.swatch = swatch
  }
  selectHand() {
    this.innerActiveTool = ToolTypes.hand
  }
  toggleGrid() {
    this.innerTools.grid.enabled = !this.innerTools.grid.enabled
  }
  mounted() {}
}
</script>

<style lang="stylus" scoped>
.color-selection
  display flex
  flex-wrap wrap
  justify-content center
  max-width 145px

.active
  &.bucket i
    filter drop-shadow(0px 0px 1px rgba(0, 0, 0, 1))

  &::after
    position absolute
    bottom 1px
    width 50%
    height 3px
    background #006064
    content ''
</style>

<style lang="stylus">
.toolbar
  .v-toolbar__content
    box-shadow inset 0px -4px 4px -6px #333
</style>