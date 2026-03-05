import { createContainer } from 'react-tracked'
import { Dispatch, SetStateAction, useState } from 'react'
import { axios, isObject } from 'nitro-web/util'
import { updateJwt } from 'nitro-web'
import { Store } from 'nitro-web/types'

export const preloadedStoreData: Store = {}
export let exposedStoreData: Store = preloadedStoreData

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

  // Send the requesting user id in the headers for the server to check (see, ./server/router.js:isValidUser() for more details)
  if (newStore?.user?._id) {
    axios().defaults.headers.requestingUserId = newStore?.user?._id
  }
  return newStore
}
