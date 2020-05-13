<template lang="pug">
  transition(name='fade' appear)
    .pointer(:style='pointerStyle') {{user.name}}
      .center-ring
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
@Component
export default class PointerIndicator extends Vue {
  name = 'PointerIndicator'

  @Prop({
    default: { x: 0, y: 0 },
  })
  position!: { x: number; y: number }

  @Prop({
    default: { name: '', color: '#fff' },
  })
  user!: { name: string; color: string }

  get pointerStyle() {
    let { x, y } = this.position
    return {
      transform: `translate3d(${x}px, ${y}px, 0)`,
      background: this.user.color,
    }
  }
}
</script>
<style lang="stylus" scoped>
dim = 20px
thickness = 5px

.pointer
  position absolute
  overflow hidden
  margin - dim * 0.5px
  padding-right 6px
  padding-left dim
  max-width 150px
  height dim
  border-radius dim
  box-shadow 1px 1px 3px rgba(0, 0, 0, 0.35)
  color #fff
  text-overflow ellipsis
  white-space nowrap
  font-size 13px
  line-height dim
  transition transform 0.051s linear
  user-select none

  .center-ring
    position absolute
    top thickness
    left thickness
    width dim - thickness * 2
    height dim - thickness * 2
    border-radius dim
    background #fff

.fade-enter-active, .fade-leave-active
  opacity 1
  transition opacity 0.25s

.fade-enter, .fade-leave-to
  opacity 0
</style>