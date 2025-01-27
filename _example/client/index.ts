
import 'nitro-web/client/globals'
import { setupApp } from 'nitro-web'

import './css/index.css'
import config from './config'
import { Layout1, Layout2 } from '../components/partials/layouts'

// Auto-import page components, initilize app, and run config.beforeApp
setupApp(config, [Layout1, Layout2])

