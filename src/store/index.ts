import Sync from '@/shared/sync'
const store = {
  title: 'Smart Collab',

  room: { name: '', password: '', connected: false },
  user: {
    name: 'Unknown',
    color: '#fab',
  },
  sync: new Sync(),
}
export default store
export type StoreType = typeof store
