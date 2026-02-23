import type { Store, Config } from 'types'
export default { 
  ...INJECTED_CONFIG as Config,

  middleware: {
    // extend or override default middleware here...
    hasExecutiveAccess: (_route: unknown, store: Store) => {
      if (store.user?.type === 'admin') return
      else return { redirect: '?error=Only executive account holders of Wayne Enterprises can access this page.' }
    },
  },
}
