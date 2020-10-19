<template lang="pug">
v-container
  v-row.mb-5
    v-col
      v-card(flat)
        v-card-title Welcome to Smart Collab
        v-card-text 
          p
            | This is a small collection of collaboration tools. This is a hobby project. No data is stored (not even cookies ;)).
            | All communication is sent encrypted via WebRTC (Peer2Peer). Just a signaling server is used to establish the initial connection between the peers.
          p
            | Internet Explorer is not supported. iOS will probably not work.
  v-row 
    v-col
      v-card
        v-card-title Sticky Notes
        v-card-text Create sticky notes on a shared board.
        v-card-actions
          v-btn(text, color='primary', to='/sticky-notes') Open
  v-row 
    v-col
      v-card
        v-card-title Mermaid Swarm
        v-card-text Create diagrams collaboratively using
          a(href='https://github.com/mermaid-js/mermaid#readme') mermaid
          | .
        v-card-actions
          v-btn(text, color='primary', to='/mermaid') Open
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { StoreType } from '@/store'
@Component({ store: ['title'] })
export default class Home extends Vue {
  name = 'Home'
  $store!: StoreType
  mounted() {
    this.$store.title = 'Smart Collab'
  }
}
</script>
