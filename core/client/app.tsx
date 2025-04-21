import { createBrowserRouter, createHashRouter, redirect, useParams, RouterProvider } from 'react-router-dom' 
import { Fragment, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosRequestConfig } from '@hokify/axios'
import { axios, camelCase, pick, toArray, setTimeoutPromise } from 'nitro-web/util'
import { injectedConfig, preloadedStoreData, exposedStoreData } from './index'
import { Config, Store } from 'nitro-web/types'

type StoreContainer = { 
  Provider: React.FC<{ children: ReactNode }> 
}

type LayoutProps = {
  config: Config;
}

type Settings = {
  afterApp?: () => void
  beforeApp: (config: Config) => Promise<object>
  // beforeStoreUpdate: (prevStore: Store | null, newData: Store) => Store
  isStatic?: boolean
  layouts: React.FC<LayoutProps>[]
  middleware: Record<string, (route: unknown, store: Store) => undefined | { redirect: string }>
  name: string
  titleSeparator?: string
}

type Route = {
  component: React.FC<{ route?: Route; params?: object; location?: object; config?: Config }>
  meta?: { title?: string }
  middleware: string[]
  name: string
  path: string
  redirect?: string
}

export async function setupApp(config: Config, storeContainer: StoreContainer, layouts: React.FC<LayoutProps>[]) {
  if (!layouts) throw new Error('layouts are required')
  // Fetch state and init app
  const settings: Settings = {
    beforeApp: config.beforeApp || beforeApp,
    isStatic: config.isStatic,
    layouts: layouts,
    middleware: Object.assign(defaultMiddleware, config.middleware || {}),
    name: config.name,
    titleSeparator: config.titleSeparator,
  }

  // Setup the jwt token
  updateJwt(localStorage.getItem(injectedConfig.jwtName))

  // Fetch the store data, and make it available to the store
  const data = await settings.beforeApp(config)
  Object.assign(preloadedStoreData, data)

  const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement)
  root.render(<App settings={settings} config={config} storeContainer={storeContainer} />)
}

export function updateJwt(token?: string | null) {
  // Update the jwt token in local storage and axios headers
  const key = injectedConfig.jwtName
  localStorage.setItem(key, token || '')
  if (token) axios().defaults.headers.Authorization = `Bearer ${token}`
  else delete axios().defaults.headers.Authorization
}

function App({ settings, config, storeContainer }: { settings: Settings, config: Config, storeContainer: StoreContainer }): ReactNode {
  // const themeNormalised = theme
  const router = getRouter({ settings, config })
  // const theme = pick(themeNormalised, []) // e.g. 'topPanelHeight'

  useEffect(() => {
    /**
     * Save the scroll position before navigating to a new react route, works in react-router-dom@6.24.1
     * https://stackoverflow.com/a/71399121/1900648
     * 
     * We will need to save the scroll position to sessionStorage since popstate (via the back button) has already 
     * updated window.history.state before this function is called, but the route/layout has not yet changed.
     * 
     * Note that an empty loader function is required in the route object for this to work. If missing, only the 
     * 'idle' event is fired, after route/layout change.
     */
    const sessionHistory = JSON.parse(sessionStorage.getItem('sessionHistory') || '{}')
    router?.subscribe((state) => {
      // @param state.historyAction - 'POP', 'PUSH', 'REPLACE'
      // @param state.navigation.state - 'loading', 'idle' (after navigation)
      if (state.navigation.state === 'idle') return
      sessionHistory[state.location.key] = scrollbarElement()?.scrollTop // 100k pages == 1.6MB (we're good, lol)
      sessionStorage.setItem('sessionHistory', JSON.stringify(sessionHistory))
    })
  }, [!!router])

  return (
    <storeContainer.Provider>
      {/* <ThemeProvider theme={themeNormalised}> */}
        { router && <RouterProvider router={router} /> }
        <AfterApp settings={settings} />
      {/* </ThemeProvider> */}
    </storeContainer.Provider>
  )
}

function AfterApp({ settings }: { settings: Settings }) {
  if (settings.afterApp) settings.afterApp()
  return (null)
}

function getRouter({ settings, config }: { settings: Settings, config: Config }) {
  /**
   * Get all routes from components folder
   * @return {array} routes for for creatingBrowserRouter
   * 
   * During build time, webpack returns `require` function, which also contains all matching files 
   * https://webpack.js.org/guides/dependency-management/#requirecontext
   */
  let requireContext
  try {
    // @ts-expect-error
    requireContext = import.meta.webpackContext('componentsDir', {
      recursive: true,
      regExp: /(?<!\.api)\.(j|t)sx$/,
    })
  } catch (e) {
    const text = 'Please add resolve.alias: { components: path.join(dirname, "components") } to your webpack configuration:'
    console.error(text, e)
    throw new Error(text)
  }
  // Loop files
  // const components = {}
  const layouts: Route[][] = []

  for (const filename of requireContext.keys()) {
    const file = requireContext(filename) // require

    // Loop exported file components
    for (const key in file) {
      const isReactFnComponentOrFnRef = typeof file[key] === 'function' || !!file[key]?.render
      if (!file.hasOwnProperty(key) || key.match(/route/i) || !isReactFnComponentOrFnRef) continue
      const componentRoutes = toArray(file[key].route || file.route || file.Route)
      const componentName = key || camelCase(key.replace(/^.*[\\\/]|\.jsx$/g, '')) as string // eslint-disable-line
      // console.log(file)
      // Todo: need to retrieve the original function name for default exports during minification.
      // console.log(1, file[key].name, key, componentName, file[key])

      // Create global component
      // if (components[componentName]) continue
      // components[componentName] = file[key]

      // Loop component's routes
      for (let i=0, l=componentRoutes.length; i<l; i++) {
        const route = componentRoutes[i]
        const routePaths = Object.keys(pick(route, /^(get\s+)?\/|^\*$/))
        
        for (const routePath of routePaths) {
          const layoutNum = (route.meta?.layout || 1) - 1

          // get the routes middleware
          const middleware = toArray(route[routePath]).filter(o => {
            if (o === true) return // ignore true
            else if (settings.middleware[o]) return true
            else console.error(`No middleware named '${o}' defined under config.middleware, skipping..`)
          })

          // Push route to layout
          if (!layouts[layoutNum]) layouts[layoutNum] = []
          layouts[layoutNum].push({
            component: file[key],
            meta: {
              ...(route.meta || {}),
              layout: layoutNum,
              title: `${route.meta?.title ? `${route.meta.title}${settings.titleSeparator || ' - '}` : ''}${settings.name}`,
            },
            middleware: middleware,
            name: componentName,
            path: routePath,
            redirect: route.redirect,
          })
        }
      }
    }
  }

  // Generate createBrowserRouter array
  let nonce: boolean
  const createRouterArray = layouts.map((layout, i) => {
    if (!layout) return
    const Layout = settings.layouts[i]
    if (!Layout) throw new Error(`Please pass Layout${i+1 || ''} to appSetup()`)
    return {
      // path: '/', // (disbaled: page component with path:'/' doesnt work)
      element: (
        <Fragment> 
          <Layout config={config} />
          <RestoreScroll />
        </Fragment>
      ),
      children: layout.map((route) => {
        return {
          element: (
            <RouteComponent route={route} config={config} />
          ),
          path: route.path,
          loader: async () => { // request
            // wait for container/exposedStoreData to be setup
            if (!nonce) nonce = true && await setTimeoutPromise(() => {}, 0) // eslint-disable-line
            for (const key of route.middleware) {
              const error = settings.middleware[key](route, exposedStoreData || {})
              if (error && error.redirect) {
                return redirect(error.redirect)
              }
            }
            return null
          },
        }
      }),
    }
  }).filter(o => !!o)

  // console.log(createRouterArray) ////////////////////////

  // Create Browser/HashRouter (if there is no error above otheriwse router will be empty)
  if (createRouterArray.length) {
    if (settings.isStatic) return createHashRouter(createRouterArray) // Use HashRouter for demo
    else return createBrowserRouter(createRouterArray) // Use BrowserRouter otherwise
  }
}

function RestoreScroll() {
  const location = useLocation()

  useEffect(() => {
    // Restore scroll position after navigation over 1 second to account for requests
    const sessionHistory = JSON.parse(sessionStorage.getItem('sessionHistory') || '{}')
    const previousScrollY = sessionHistory[location.key] || 0
    // console.log(3, previousScrollY, window.history.state)
    const attemptScroll = (attempts = 0) => {
      if (scrollbarElement()?.scrollTop !== previousScrollY && attempts < 100) {
        scrollbarElement()?.scrollTo(0, previousScrollY)
        setTimeout(() => attemptScroll(attempts + 1), 10)
      }
    }
    attemptScroll()
  }, [location])

  return (null)
}

function RouteComponent({ route, config }: { route: Route, config: Config }) {
  const Component = route.component
  const params = useParams()
  const location = useLocation()
  document.title = route.meta?.title || ''
  return (
    <Component route={route} params={params} location={location} config={config} />
  )
}

function scrollbarElement() {
  // main element that has page scrollbar
  // this needs to be non-body element otherwise the Modal.jsx doesn't open/close smoothly
  return document.getElementById('app') // was window.scrollY
}

// ---- Overridable defaults ------------

async function beforeApp(config: Config) {
  /**
   * Gets called once before React is initialised
   * @return {promise} - newStoreData which is used for sharedStore, later merged with the config.store() defaults
   */
  let apiAvailable = false
  let storeData = {}
  try {
    // Unload prehot data
    // if (window.prehot) {
    //   sharedStoreCache = window.prehot.sharedStoreCache
    //   delete window.prehot
    // }
    if (!config.isStatic) {
      storeData = (await axios().get('/api/store', { 'axios-retry': { retries: 3 }, timeout: 4000 } as AxiosRequestConfig)).data
      apiAvailable = true
    }
  } catch (err) {
    console.error('We had trouble connecting to the API, please refresh')
    console.log(err)
  }
  return { ...storeData, apiAvailable }
}

const defaultMiddleware = {
  // Global middleware that can referenced from component routes
  isAdmin: (route: unknown, store: { user?: { type?: string } }) => {
    const user = store.user || { type: 'visitor' }
    if (user?.type?.match(/admin/)) return
    else if (user?.type && user?.type !== 'visitor') return { redirect: '/signin?unauth' }
    else return { redirect: '/signin?signin' }
  },
  isSubscribed: (route: unknown, store: { user?: { company?: { currentSubscription?: string } } }) => {
    const user = store?.user || { type: 'visitor', company: { currentSubscription: '' } }
    if (!user?.company?.currentSubscription) return
    else return { redirect: '/plans/subscribe' }
  },
  isUser: (route: unknown, store: { user?: { type?: string } }) => {
    const user = store.user || { type: 'visitor' }
    if (user?.type !== 'visitor') return
    else return { redirect: '/signin?signin' }
  },
}