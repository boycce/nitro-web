import 'nitro-web/client/globals'
import { createStore, setupApp, Store } from 'nitro-web'

import './css/index.css'
import config from './config'
import { Layout1, Layout2 } from '../components/partials/layouts'

// Create store, and expose `useTracked` globally
const store = createStore({ user: null, message: null, apple: 'hello' } as Store)
declare global { const useTracked: typeof store.useTracked }
Object.assign(window, { useTracked: store.useTracked })

// Auto-import page components, initialise app, and run config.beforeApp
setupApp(config, store, [Layout1, Layout2])
