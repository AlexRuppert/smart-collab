<template lang="pug">
  v-menu(nudge-bottom offset-y transition='scroll-y-transition' z-index='99999999')
    template(v-slot:activator='{ on }')
      v-btn.mr-3.text-none(dark :color='user.color' v-on='on' depressed)
        v-icon(left) mdi-account
        | {{user.name}}
    v-card
      v-card-text
        v-text-field(label='Name' maxlength='18' :color='user.color' v-model='user.name' clearable spellcheck='false')
        .color-selection
          v-btn.ma-1(v-for='color in swatches' :color='color' fab small @click='user.color=color')
          v-btn.random.ma-1(color='#fff' fab small @click='user.color = generateColor()')
            v-icon mdi-dice-3-outline
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Sync from '@/shared/sync'
@Component
export default class User extends Vue {
  name = 'User'
  user = {
    name: 'Unknown',
    color: '#fab',
  }
  swatches = [
    '#FF5722',
    '#F44336',
    '#E91E63',
    '#9C27B0',
    '#673AB7',
    '#3F51B5',
    '#2196F3',
    '#03A9F4',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#CDDC39',
    '#FF9800',
    '#607D8B',
  ]
  @Prop()
  sync!: Sync
  @Watch('user', { deep: true })
  onUserchanged() {
    localStorage.userName = this.user.name
    localStorage.userColor = this.user.color
    this.sync.setUser(this.user)
  }
  generateColor() {
    return this.swatches[Math.floor(Math.random() * this.swatches.length)]
  }

  mounted() {
    ;(this.user.name =
      localStorage?.userName ??
      'Unknown' + (Math.floor(Math.random() * 100) + 1)),
      (this.user.color = localStorage?.userColor ?? this.generateColor())
  }
}
</script>

<style lang="stylus" scoped>
.color-selection
  display flex
  flex-wrap wrap
  justify-content center
  max-width 210px

.text-none
  max-width 200px

.random
  transition transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)

  &:active
    transform rotate(-50deg)
</style>