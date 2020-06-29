<template lang="pug">
  v-app
    v-navigation-drawer(temporary app v-model='drawer')
      v-list-item
        v-list-item-content
          v-list-item-title.title
            | Smart Collab
      v-divider
      v-list(dense nav)
        v-list-item(v-for='item in items' :key='item.name' link :to='item.path')
          v-list-item-icon
            v-icon {{ item.meta.icon }}
          v-list-item-content
            v-list-item-title {{ item.name }}
    v-app-bar(app color='primary' dark)
      v-app-bar-nav-icon(@click.stop='drawer = !drawer')
      .title {{title}}
      v-spacer

    v-main
      router-view#router
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { StoreType } from '@/store'
import { routes } from '@/router'
@Component({ store: ['title'] })
export default class App extends Vue {
  name = 'App'
  $store!: StoreType
  drawer = false
  items = routes
}
</script>

