import { middleware } from 'nitro-web'
import type { NitroConfigClient } from 'nitro-web/types'
import type { Store } from 'types'

export type ConfigClient = NitroConfigClient<Store> & {
  exampleClientField: string
}

const config = {
  ...INJECTED_CONFIG,
  middleware: {
    ...middleware,
    // extend or override default middleware here...
    hasExecutiveAccess: (_route: unknown, store: Store) => {
      if (store.user?.type === 'admin') return
      else return { redirect: '/signin?error=Only executive account holders of Wayne Enterprises can access this page.' }
    },
  },
  exampleClientField: 'test',
} satisfies ConfigClient

export default config
