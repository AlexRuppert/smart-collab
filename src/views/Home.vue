<template lang="pug">
  v-container
    v-row.mb-5
      v-col
        v-card(flat)
          v-card-title Welcome to Smart Collab
          v-card-text This is a small collection of collaboration tools. 
    v-row 
      v-col
        v-card
          v-card-title Mermaid Swarm
          v-card-text Create diagramms collaboratively using 
            a(href='https://github.com/mermaid-js/mermaid#readme') mermaid
            |.
          v-card-actions
            v-btn(text color='primary' to='/mermaid') Open


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
