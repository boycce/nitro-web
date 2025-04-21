import { createContainer } from 'react-tracked'
import { Dispatch, SetStateAction } from 'react'
import { axios, isObject } from 'nitro-web/util'
import { updateJwt } from 'nitro-web'
import { Store } from 'nitro-web/types'

export let preloadedStoreData: Store
export let exposedStoreData: Store

export function createStore<T extends Store>(store: T) {
  const container = createContainer(() => {
    // const [state, setState] = useState<T>(() => (initData || store || {}) as T)
    const [state, setState] = useState<T>(() => beforeUpdate((preloadedStoreData || store || {}) as T))
    exposedStoreData = state
    return [state, setStoreWrapper(setState)]
  })
  return container
}

export function setStoreWrapper<T extends Store>(setState: Dispatch<SetStateAction<T>>, _beforeUpdate?: (newStore: T) => T) {
  _beforeUpdate = _beforeUpdate || beforeUpdate
  return (updater: SetStateAction<T>) => {
    if (typeof updater === 'function') setState((prev: T) => beforeUpdate(updater(prev)))
    else setState(() => beforeUpdate(updater))
  }
}

function beforeUpdate<T extends Store>(newStore: T) {
  /**
   * Get store object (called on signup/signin/signout/state)
   * @param {object} <newData> - pass to override store with /login or /state request data
   * @return {object} store
   */
  if (!newStore || !isObject(newStore)) return newStore

  // If newData.jwt is present, update the jwt token
  if (newStore?.jwt) {
    updateJwt(newStore.jwt)
    delete newStore.jwt
  }

  // E.g. Cookie matching handy for rare issues, e.g. signout > signin (to a different user on another tab)
  axios().defaults.headers.authid = newStore?.user?._id
  return newStore
}
