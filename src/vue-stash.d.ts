/**
 * Declarations to add vue-stash's 'store' property in @Component options
 */

import Vue from 'vue'

/**
 * @module augmentation to ComponentOptions defined by Vuejs
 */
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    store?: any[] | {}
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: any
  }
}
