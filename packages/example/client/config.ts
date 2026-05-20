import { middleware } from 'nitro-web'
import type { Store, Config } from 'types'

export default { 
  ...INJECTED_CONFIG as Config,

  middleware: {
    ...middleware,
    // extend or override default middleware here...
    hasExecutiveAccess: (_route: unknown, store: Store) => {
      if (store.user?.isAdmin) return
      else return { redirect: '/signin?error=Only executive account holders of Wayne Enterprises can access this page.' }
    },
  },

  // Override the default signout store to add a message (or to clear more properties from the store)
  getSignoutStore: (prev: Store, initialStore: Store) => {
    return { ...(prev || {}), user: initialStore.user, message: 'Signed out successfully.' }
  },
}
