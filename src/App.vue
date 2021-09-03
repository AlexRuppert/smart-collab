<template lang="pug">
v-app
  v-navigation-drawer(temporary, app, v-model='drawer')
    v-list-item
      v-list-item-content
        v-list-item-title.title
          | Smart Collab
    v-divider
    v-list(dense, nav)
      v-list-item(
        v-for='item in items',
        :key='item.name',
        link,
        :to='item.path'
      )
        v-list-item-icon
          v-icon {{ item.meta.icon }}
        v-list-item-content
          v-list-item-title {{ item.name }}
  v-app-bar(app, color='primary', dark)
    v-app-bar-nav-icon(@click.stop='drawer = !drawer')
    .title {{ title }}
    v-spacer

  main
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

<style scoped>
#router {
  padding-top: 68px; /*hack*/
}
</style>

<style lang="scss">
.tooltip {
  display: block !important;
  z-index: 10000;
  font-family: Arial, Helvetica, sans-serif;

  .tooltip-inner {
    background: black;
    color: white;
    border-radius: 16px;
    padding: 5px 10px 4px;
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-style: solid;
    position: absolute;
    margin: 5px;
    border-color: black;
    z-index: 1;
  }

  &[x-placement^='top'] {
    margin-bottom: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 0 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      bottom: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^='bottom'] {
    margin-top: 5px;

    .tooltip-arrow {
      border-width: 0 5px 5px 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-top-color: transparent !important;
      top: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^='right'] {
    margin-left: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 5px 0;
      border-left-color: transparent !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
      left: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &[x-placement^='left'] {
    margin-right: 5px;

    .tooltip-arrow {
      border-width: 5px 0 5px 5px;
      border-top-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      right: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &.popover {
    $color: #f9f9f9;

    .popover-inner {
      background: $color;
      color: black;
      padding: 24px;
      border-radius: 5px;
      box-shadow: 0 5px 30px rgba(black, 0.1);
    }

    .popover-arrow {
      border-color: $color;
    }
  }

  &[aria-hidden='true'] {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.15s, visibility 0.15s;
  }

  &[aria-hidden='false'] {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.15s;
  }
}
</style>
