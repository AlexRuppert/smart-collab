<template lang="pug">
  v-menu(nudge-bottom offset-y transition='scroll-y-transition' z-index='99999999')
    template(v-slot:activator='{ on }')
      v-btn.text-none(v-show='connected' text v-on='on')
        v-icon(left) mdi-account-group
        | {{users.length}} Users
    v-list(max-width='350px' dense)
      v-list-item.pl-2(v-for='(user, index) in users' :key='index' :color='user.color' dense @click='')
        v-list-item-avatar.my-0.mr-1
          v-icon(:color='user.color') mdi-account
        v-list-item-title {{user.name}}
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Sync from '@/shared/sync'
@Component
export default class User extends Vue {
  name = 'User'
  users = [] as Array<{ name: string; color: string }>

  @Prop()
  sync!: Sync
  @Prop({ default: false })
  connected!: boolean
  mounted() {
    setInterval(() => {
      this.users = this.sync.getUsers()
    }, 1000)
  }
}
</script>

<style lang="stylus" scoped>
.text-none
  max-width 200px

.user-list
  display flex
  flex-wrap wrap
  justify-content center
</style>