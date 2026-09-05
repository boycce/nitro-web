import 'nitro-web/client/globals'
import { createStore, setupApp } from 'nitro-web'

import './css/index.css'
import config from './config'
import type { Store, User } from 'types'
import { Layout1, Layout2 } from '../components/partials/layouts'

// Create store, and expose `useTracked` globally
const store = createStore<Store>({
  user: { /*e.g. isDarkMode: false,*/ } as User,
  sharedCollections: { roleOptions: { rows: [], total: 0 } },
})
declare global { const useTracked: typeof store.useTracked }
Object.assign(window, { useTracked: store.useTracked })

// Auto-import page components, initialise app, and run config.beforeApp
setupApp(config, store, [Layout1, Layout2])
