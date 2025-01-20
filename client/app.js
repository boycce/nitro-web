import { createBrowserRouter, redirect, useParams, RouterProvider } from 'react-router-dom' 
import ReactDOM from 'react-dom/client'
import { createContainer } from 'react-tracked'
import { axios, camelCase, pick, toArray, setTimeoutPromise } from '../util.js'

export async function setupApp(config, layouts) {
  // Fetch state and init app
  const settings = {
    middleware: Object.assign(defaultMiddleware, config.middleware || {}),
    beforeApp: config.beforeApp || defaultBeforeApp,
    beforeStoreUpdate: config.beforeStoreUpdate || defaultBeforeStoreUpdate,
    layouts: layouts,
  }
  if (!settings.layouts) throw new Error('layouts are required')
  const data = (await settings.beforeApp()) || {}
  window.sharedStore = createStore(data, settings.beforeStoreUpdate)

  const root = ReactDOM.createRoot(document.getElementById('app'))
  root.render(<App settings={settings} />)
}

function App({ settings }) {
  // Should only render once
  const Provider = window.sharedStore.Provider
  // const themeNormalised = theme
  const router = getRouter(settings)
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
    router.subscribe((state, a, b) => { // eslint-disable-line
      // @param state.historyAction - 'POP', 'PUSH', 'REPLACE'
      // @param state.navigation.state - 'loading', 'idle' (after navigation)
      if (state.navigation.state === 'idle') return
      sessionHistory[state.location.key] = scrollbarElement().scrollTop // 100k pages == 1.6MB (we're good, lol)
      sessionStorage.setItem('sessionHistory', JSON.stringify(sessionHistory))
    })
  }, [])

  return (
    <Provider>
      {/* <ThemeProvider theme={themeNormalised}> */}
        <RouterProvider router={router} />
        <AfterApp settings={settings} />
      {/* </ThemeProvider> */}
    </Provider>
  )
}

function AfterApp(settings) {
  if (settings.afterApp) settings.afterApp()
  return (null)
}

function createStore(newStoreData, beforeStoreUpdate) {
  // @param {object} newStoreData - normally provided from a /login or /state request data
  return createContainer(() => {
    // Normally only setup once
    // Fast reload - rebuilds <Root/>, and then createContainer() without providing the initialState
    // Hot reload - rebuilds the whole app
    let [store, setStore] = useState(() => beforeStoreUpdate(null, newStoreData || window.sharedStoreCache || {})) // runs only once

    // Wrap the setState function to always run beforeStoreUpdate
    const wrappedSetStore = (updater) => {
      if (typeof updater === 'function') {
        setStore((prevStore) => {
          const nextState = updater(prevStore)
          return beforeStoreUpdate(prevStore, nextState)
        })
      } else {
        setStore((prevStore) => beforeStoreUpdate(prevStore, updater))
      }
    }
    
    window.sharedStoreCache = store
    newStoreData = null
    return [store, wrappedSetStore]
  })
}

function getRouter(settings) {
  /**
   * Get all routes from components folder
   * @return {array} routes for for creatingBrowserRouter
   */
  // During build time, webpack returns `require` function, which also contains all matching files 
  // https://webpack.js.org/guides/dependency-management/#requirecontext

  let requireContext
  try {
    requireContext = import.meta.webpackContext('componentsDir', { // components is the alias in webpack.config.js
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
  const layouts = []

  for (const filename of requireContext.keys()) {
    const file = requireContext(filename) // require

    // Loop exported file components
    for (const key in file) {
      const isReactFnComponentOrFnRef = typeof file[key] === 'function' || !!file[key]?.render
      if (!file.hasOwnProperty(key) || key.match(/route/i) || !isReactFnComponentOrFnRef) continue
      const componentRoutes = toArray(file[key].route || file.route || file.Route)
      const componentName = key || camelCase(key.replace(/^.*[\\\/]|\.jsx$/g, '')) // eslint-disable-line
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
  let nonce
  const createBrowserRouterArray = layouts.map((routes, i) => {
    if (!routes) return
    const Layout = settings.layouts[i]
    if (!Layout) throw new Error(`Please pass Layout${i+1 || ''} to appSetup()`)
    return {
      // path: '/', // (disbaled: page component with path:'/' doesnt work)
      element: <> 
        <Layout />
        <RestoreScroll />
      </>,
      children: routes.map((route) => {
        return {
          element: <RouteComponent route={route} />,
          path: route.path,
          loader: async (/*{ request }*/) => {
            // wait for sharedStore/sharedStoreCache to be setup
            if (!nonce) nonce = true && await setTimeoutPromise(() => {}, 0) // eslint-disable-line
            for (let key of route.middleware) {
              let error = settings.middleware[key](route, window.sharedStoreCache||{})
              if (error && error.redirect) {
                return redirect(error.redirect)
              }
            }
            return null
          },
        }
      }),
    }
  }).filter(o => o)

  // console.log(createBrowserRouterArray) ////////////////////////

  // Create BrowserRouter (if there is no error above otheriwse router will be empty)
  if (createBrowserRouterArray.length) {
    return createBrowserRouter(createBrowserRouterArray)
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
      if (scrollbarElement().scrollTop !== previousScrollY && attempts < 100) {
        scrollbarElement().scrollTo(0, previousScrollY)
        setTimeout(() => attemptScroll(attempts + 1), 10)
      }
    }
    attemptScroll()
  }, [location])

  return (null)
}

function RouteComponent({ route }) {
  const params = useParams()
  const location = useLocation()
  document.title = route.meta.title
  return <route.component route={route} params={params} location={location} />
}

function scrollbarElement() {
  // main element that has page scrollbar
  // this needs to be non-body element otherwise the Modal.jsx doesn't open/close smoothly
  return document.getElementById('app') // was window.scrollY
}

// ---- Overridable defaults ------------

async function defaultBeforeApp() {
  /**
   * Gets called once before React is initialised
   * @return {promise} - newStoreData which is used for window.store, later merged with the config.store() defaults
   */
  let newStoreData
  try {
    // Unload prehot data
    if (window.prehot) {
      window.sharedStoreCache = window.prehot.sharedStoreCache
      delete window.prehot
    }
    if (!window.sharedStoreCache) {
      newStoreData = (await axios().get('/api/state', { 'axios-retry': { retries: 7 }, timeout: 4000 })).data
    }
  } catch (err) {
    console.error('We had trouble connecting to the API, please refresh')
    console.log(err)
  }
  return newStoreData || window.sharedStoreCache
}

function defaultBeforeStoreUpdate(store, newStoreData) {
  /**
   * Get store object (called on signup/signin/signout/state)
   * @param {object} store - existing store
   * @param {object} <newStoreData> - pass to override store with /login or /state request data
   * @return {object} store
   */
  if (!newStoreData) return newStoreData
  store = {
    ...(store || {
      message: null,
      stripeProducts: [],
      user: null, // defined if user is signed in
    }),
    ...(newStoreData || {}),
  }

  // Used to verify if the current cookie belongs to this user
  // E.g. signout > signin (to a different user on another tab)
  axios().defaults.headers.userid = store?.user?._id
  return store
}

const defaultMiddleware = {
  // Global middleware that can referenced from component routes
  isAdmin: (route, store) => {
    let user = store.user || { type: 'visitor' }
    if (user.type.match(/admin/)) return
    else if (user.type && user.type !== 'visitor') return { redirect: '/signin?unauth' }
    else return { redirect: '/signin?signin' }
  },
  isSubscribed: (route, store) => {
    let user = store.user || { type: 'visitor', company: {} }
    if (!user.company.currentSubscription) return
    else return { redirect: '/plans/subscribe' }
  },
  isUser: (route, store) => {
    let user = store.user || { type: 'visitor' }
    if (user.type !== 'visitor') return
    else return { redirect: '/signin?signin' }
  },
}