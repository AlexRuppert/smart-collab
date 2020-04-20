import Sync from '@/shared/sync'
const store = {
  title: 'Smart Collab',

  room: { name: '', password: '', connected: false },
  user: {
    name: 'Unknown' + Math.floor(Math.random() * 100) + 1,
    color: '#fab',
  },
  sync: new Sync(),
}
export default store
export type StoreType = typeof store
