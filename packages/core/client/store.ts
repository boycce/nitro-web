import { createContainer } from 'react-tracked'
import { Dispatch, SetStateAction } from 'react'
import { axios, isObject, deepCopy } from 'nitro-web/util'
import { updateJwt } from 'nitro-web'
import { Store } from 'nitro-web/types'

export const preloadedStoreData: Partial<Store> = {}
export let initialStoreData: Store // handy for resetting the user on signout
export let exposedStoreData: Store // handy for the router to access the store

export function createStore<T extends Store>(initialStore: T) {
  const container = createContainer(() => {
    // const [state, setState] = useState<T>(() => (initData || store || {}) as T)
    const [state, setState] = useState<T>(() => beforeUpdate({ ...initialStore, ...preloadedStoreData } as T))
    initialStoreData = initialStore
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

  // Send the requesting user id in the headers for the server to check (see, ./server/router.js:isValidUser() for more details)
  if (newStore?.user?._id) {
    axios().defaults.headers.requestingUserId = newStore?.user?._id
  }
  return newStore
}

export function getInitialStore() {
  return deepCopy(initialStoreData)
}

export function getSignoutStore(prev: Store, initialStore: Store) {
  return { ...(prev || {}), user: initialStore.user }
}