import { createContainer } from 'react-tracked'
import { Store } from 'nitro-web/types'


export type BeforeUpdate = (prevStore: Store | null, newData: Store) => Store

let initData: Store
let beforeUpdate: BeforeUpdate = (prevStore, newData) => newData

const container = createContainer(() => {
  const [store, setStore] = useState(() => beforeUpdate(null, initData || exposedData || {}))

  // Wrap the setState function to always run beforeUpdate
  const wrappedSetStore = (updater: (prevStore: Store) => Store) => {
    if (typeof updater === 'function') {
      setStore((prevStore: Store) => beforeUpdate(prevStore, updater(prevStore)))
    } else {
      setStore((prevStore: Store) => beforeUpdate(prevStore, updater))
    }
  }

  exposedData = store
  return [store, wrappedSetStore]
})

export let exposedData: Store
export const { Provider, useTracked } = container
export function beforeCreate(_initData: Store, _beforeUpdate: BeforeUpdate) {
  initData = _initData // normally provided from a /login or /state request data
  beforeUpdate = _beforeUpdate
}
