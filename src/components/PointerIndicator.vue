<template lang="pug">
  .pointer(:style='pointerStyle')
    .center-ring
    .name-tag(:style='nameTagStyle') {{user.name}}
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
@Component
export default class PointerIndicator extends Vue {
  name = 'PointerIndicator'

  @Prop({
    default: { x: 0, y: 0, rotation: 0 },
  })
  position!: { x: number; y: number; rotation: number }

  @Prop({
    default: { name: 'Unknown', color: '#ff3333' },
  })
  user!: { name: string; color: string }

  get pointerStyle() {
    return {
      transform: `translate(${this.position.x}px, ${this.position.y}px)`,
      background: this.user.color,
    }
  }
  get nameTagStyle() {
    return {
      background: this.user.color,
    }
  }

  mounted() {}
}
</script>
<style lang="stylus" scoped>
dim = 20px
thickness = 5px

.pointer
  position absolute
  margin-top - dim * 0.5
  margin-left - dim * 0.5
  width dim
  height dim
  border-radius dim
  filter drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.35))
  transition transform 0.105s linear
  user-select none

  .center-ring
    margin-top thickness
    margin-left thickness
    width dim - thickness * 2
    height dim - thickness * 2
    border-radius dim - thickness * 2
    background #fff
    transition transform 0.1s linear

  .name-tag
    position absolute
    top dim - thickness * 2
    left dim - thickness * 2
    padding 3px 8px
    border-radius dim
    color #fff
    white-space nowrap
</style>