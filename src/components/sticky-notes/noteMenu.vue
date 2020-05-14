<template lang="pug">
  mixin list-item(icon, text)
    v-list-item-icon
      v-icon= icon
    v-list-item-content
      v-list-item-title= text

  v-menu(v-model='menu.enabled' :position-x='menu.x' :position-y='menu.y' absolute offset-y :close-on-click='menu.closeOnClick')
    v-list(dense)
      v-list-item(@click='deleteNote')
        +list-item('mdi-delete', 'Delete')
      v-divider
      v-subheader Paper Color
      v-list-item.narrow
        v-list-item-content
          v-btn.square-button.pa-0(v-for='swatch in paperColors' small :color='swatch.color'
            @click='changePaperColor(swatch.name)')
      v-divider
      v-subheader Ink Color
      v-list-item.narrow
        v-list-item-content
          v-btn.square-button.pa-0(v-for='swatch in inkColors' small fab :color='swatch.color'
            @click='changeInkColor(swatch.name)')
</template>
<script lang="ts">
import { Component, Prop, Vue, PropSync } from 'vue-property-decorator'
import PAPER_COLORS from './paper-colors.json'
import INK_COLORS from './ink-colors.json'
import { PaperColors, InkColors, NoteMenuEventTypes } from './types'

const NOTE_MENU_ACTION = 'noteMenuAction'

@Component
export default class NoteMenu extends Vue {
  @PropSync('menu')
  innerMenu!: {
    noteId: string
    enabled: boolean
    closeOnClick: boolean
    x: number
    y: number
  }

  paperColors = Object.entries(PAPER_COLORS).map(([name, color]) => ({
    name,
    color,
  })) as { name: PaperColors; color: string }[]
  inkColors = Object.entries(INK_COLORS).map(([name, color]) => ({
    name,
    color,
  })) as { name: InkColors; color: string }[]

  deleteNote() {
    this.$emit(NOTE_MENU_ACTION, {
      type: NoteMenuEventTypes.delete,
      noteId: this.innerMenu.noteId,
    })
  }

  changePaperColor(color: PaperColors) {
    this.$emit(NOTE_MENU_ACTION, {
      type: NoteMenuEventTypes.changePaperColor,
      noteId: this.innerMenu.noteId,
      color,
    })
  }
  changeInkColor(color: InkColors) {
    this.$emit(NOTE_MENU_ACTION, {
      type: NoteMenuEventTypes.changeInkColor,
      noteId: this.innerMenu.noteId,
      color,
    })
  }
}
</script>
<style lang="stylus" scoped>
.narrow
  margin-top -15px
  max-width 200px

.square-button
  dim = 28px
  margin 2px
  min-width dim !important
  min-height dim
  max-width dim
  max-height dim
</style>