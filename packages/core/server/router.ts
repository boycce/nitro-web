import fs from 'fs'
import path, { dirname } from 'path'
import http from 'http'
import { fileURLToPath } from 'url'
import compression from 'compression'
import expressFileUpload from 'express-fileupload'
import express from 'express'
import bodyParser from 'body-parser'
import sortRouteAddressesNodeps from 'sort-route-addresses-nodeps'

import { sendEmail } from 'nitro-web/server'
import { getDirectories, each, toArray, isFunction } from 'nitro-web/util'
import { createExpress, Response, Request } from './express'
import { type ServerErrorRaw, type returnServerErrors } from '../util.errors'
import type { NitroConfigServer, NitroMiddleware, User, Routes } from 'types'

const _dirname = dirname(fileURLToPath(import.meta.url)) + '/'

type UserMinimal = (
  Pick<User, '_id'> &
  (Pick<User, 'type'> | Pick<User, 'isAdmin'>)
)
type ApiRoute = { middleware: string[], filename: string, path: string, verb: string }
type Controller = { routes: Routes, setup: (middleware: NitroMiddleware<TUser>, config: NitroConfigServer<TUser>) => void }

// My current task:
//   From this file: We need to return an app object with the following properties: router, extendedExpress, middleware
//   We also need to return empty/mock variables for: routesType and controllerType, so these can easily be referenced
//   Example:
//   const { router, extendedExpress, middleware, routesType, controllerType } = await setupApp<User>(configServer)
//   export { router, extendedExpress, middleware }
//   export type Routes = typeof routesType
//   export type Controller = typeof controllerType

// rename to app, similar to client/app.tsx


export async function setupApp<TUser extends UserMinimal>(
  configServer: Pick<NitroConfigServer<TUser>, 'env' | 'middleware' | 'middlewareOrder' | 'pwd' | 'version'>
) {
  const { env, middleware, middlewareOrder, pwd, version } = configServer
  const { componentsDir, distDir, emailTemplateDir } = getDirectories(path, pwd)
  const expressApp = createExpress<TUser>(version) // <--- todo: rename to expressInstance
  const server = http.createServer(expressApp) // required for websockets <-- todo: renamed to app
  const apiRoutes: { [key: string]: { middleware: any[], filename: string, path: string, verb: string } } = {}
  const controllers: { [key: string]: Routes } = {} // key=controllerName
  const allMiddleware: NitroMiddleware<TUser> = { ...defaultMiddleware, ...(middleware || {}) }
  const allMiddlewareOrder = middlewareOrder || defaultMiddlewareOrder
  const verbs = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'all']
  
  if (!env) {
    throw new Error('setupRouter: `config.env` missing')
  }

  // Basic request extensions
  expressApp.use((req, res, next) => {
    req.json = req.xhr || req.accepts(['html', 'json']) == 'json' // boolean showing that the request wants JSON returned
    req.version = version // res.set('version', version), now set in createExpress
    req.env = env
    next()
  })

  // Load in API routes & controllers
  const filepaths = getFiles(componentsDir, /\.api\.(js|ts)$/) //; console.log(filepaths, componentsDir)
  for (const filepath of filepaths) {
    const file = await import(filepath)
    const routes = file.routes
    const name = filepath.replace(/^.*[\\\/]|\.api\.(js|ts)$/g, '') // eslint-disable-line
    controllers[name] = routes // { ...routes }

    if (!routes) {
      console.warn(`API warning: no 'routes' export found on file ${filepath}`)
      continue
    }

    if (routes?.setup) routes.setup.call(routes, allMiddleware, configServer)
    if (routes) {
      each(routes, (_middleware, _key) => {
        if (!_key.match(/\s/)) return
        const key = _key.replace(/\s+/g, ' ')
        const match = key.match(new RegExp(`^(${verbs.join('|')})\\s+(.*)$`, 'i'))
        if (!match) throw new Error(`Invalid verb or path: ${key}`)
        apiRoutes[key] = {
          middleware: toArray(_middleware),
          filename: name,
          path: match[2],
          verb: match[1],
        }
      })
    }
  }

  // Register the base middleware
  for (const name of allMiddlewareOrder) {
    if (name === 'loadAssets') {
      expressApp.use('/favicon.png', express.static(distDir + 'favicon.png', { maxAge: '7d' })) // todo: test was `maxage`
      expressApp.use('/assets', compression()) // gzip
      expressApp.use('/assets', express.static(distDir + 'assets/', { maxAge: '365d' })) // todo: test was `maxage`
    } else if (!allMiddleware[name]) {
      continue
    } else {
      expressApp.use(allMiddleware[name as keyof typeof allMiddleware])
    }
  }

  // Register the API routes
  expressApp.use('/api', compression()) // gzip
  for (let key of sortRouteAddressesNodeps(Object.keys(apiRoutes))) {
    let route = apiRoutes[key]
    if (!route.verb.match(/get|post|put|delete/)) throw Error(`The API route verb '${route.verb}' is invalid`)
    route.middleware = route.middleware
      .map((o, i) => resolveMiddleware(controllers, allMiddleware, route, o, i+1==route.middleware.length))
      .filter(o => o)
    // express uses path-to-regex for URL interpretation
    // console.log(route.verb, route.path, route.middleware)
    expressApp[route.verb](route.path, [ ...route.middleware])
  }

  // If the index file is missing that means webpack-dev-server is being used which
  // stores the bundled files in memory
  let indexExists = !!fs.existsSync(distDir + 'index.html')

  // Register email routes for development
  // E.g. http://localhost:3001/email/welcome Or
  // E.g. http://localhost:3000/email/welcome (with webpack-dev-server proxy)
  if (env == 'development') {
    expressApp.get('/email/partials/email.css', (req, res) => {
      // first check if there is a custom email.css in the emailTemplateDir
      // if not, return the default nitro email.css
      if (fs.existsSync(emailTemplateDir + 'partials/email.css')) res.sendFile(emailTemplateDir + 'partials/email.css')
      else res.sendFile(_dirname + 'email/partials/email.css')
    })
    expressApp.get('/email/:name', async (req, res) => {
      try {
        const html = await sendEmail({
          config: configServer,
          subject: 'Development email',
          template: req.params.name,
          test: true,
          skipCssInline: true,
          to: 'Ricky<test@gmail.com>',
        })
        res.send(html)
      } catch (e) {
        console.error(e)
        res.error(e)
      }
    })
  }

  // Ping, pong, useful for webpack
  expressApp.get('/ping', (req, res, _next) => {
    res.send('pong')
  })

  // Catch all remaining routes, i.e 404
  expressApp.get('*', (req, res) => {
    if (indexExists) res.sendFile(distDir + 'index.html')
    else { res.status(404); res.notFound() }
  })
  
  return expressApp
}

/**
 * Recursively retrieve all files
 * @param {string} dir - directory to search (IS NOW FULL PATH)
 * @return [path, ..]
 */
function getFiles (dir: string, regexp: RegExp) {
  let paths: string[] = []
  // let dirname = path.dirname(fileURLToPath(import.meta.url))
  // if (dir.match(/^\./)) dir = path.join(dirname, dir)
  for (const filename of fs.readdirSync(dir)) {
    const filepath = path.join(dir, '/', filename)
    const stat = fs.statSync(filepath)
    if (stat && stat.isDirectory()) {
      paths = paths.concat(getFiles(filepath, regexp))
    } else if (filepath.match(regexp)) {
      paths.push(filepath)
    }
  }
  return paths
}

/**
 * Resolves a placeholder string into a function
 * @param controllers - { controllerName: { routes, setup, ...other exported functions } }
 */
function resolveMiddleware (
  controllers: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  middleware: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  route: { filename: string, path: string, verb: string },
  item: any // eslint-disable-line @typescript-eslint/no-explicit-any
): ((req: express.Request, res: express.Response, next: express.NextFunction) => void) | undefined {
  if (isFunction(item)) {
    return item.bind(controllers[route.filename])

  } else if (typeof item !== 'string') {
    console.error('Invalid middleware item on route:', route.path, item)
    return

  } else if (middleware[item]) {
    return middleware[item]

  } else {
    console.error(`The middleware '${item}' defined in '${route.filename}.api' doesn't exist.`)
    return
  }
}

const defaultMiddlewareOrder = [
  // Default middleware called before all /api/* routes
  'loadAssets',
  'parseUrlEncoded',
  'parseJson',
  'parseFile',
]

const defaultMiddleware: NitroMiddleware<UserMinimal> = {

  // --- Default middleware ---------------------

  // parse application/x-www-form-urlencoded (rawbody for stripe webhooks)
  parseUrlEncoded: bodyParser.urlencoded({ 
    extended: false, 
    verify: (req: Request<UserMinimal>, res, buf, encoding: BufferEncoding) => {
      if (!buf || !buf.length) return
      (req as any).rawHeaders = req.headers // eslint-disable-line @typescript-eslint/no-explicit-any
      req.rawBody = buf.toString(encoding || 'utf8')
    },
  }),

  // parse application/json
  parseJson: bodyParser.json({
    verify: (req: Request<UserMinimal>, res, buf, encoding: BufferEncoding) => {
      if (!buf || !buf.length) return
      (req as any).rawHeaders = req.headers // eslint-disable-line @typescript-eslint/no-explicit-any
      req.rawBody = buf.toString(encoding || 'utf8')
    },
    limit: '40mb',
  }),

  // parse multipart/form-data
  parseFile: (req, res, next) => {
    req.files = {} // always ensure req.files is defined
    // console.time('upload middleware')
    expressFileUpload({
      limits: { fileSize: 1000 * 1000 * 90, files: 10 }, // 90mb
    })(req, res, () => { /*console.timeEnd('upload middleware'); */next() })
  },

  // --- Middleware policies --------------------

  isAdmin: (req, res, next) => {
    if (!isValidUserOrRespond(req, res)) return
    else if (!isAdminUser(req)) res.unauthorized('You are not authorised to make this request.')
    else next()
  },
  isUser: (req, res, next) => {
    if (!isValidUserOrRespond(req, res)) return
    else next()
  },
  isParamUser: (req, res, next) => {
    const isParamUser = req.user?._id?.toString() == req.params.uid
    if (!isValidUserOrRespond(req, res)) return
    else if (!isParamUser && !isAdminUser(req)) res.unauthorized('You are not authorised to make this request.')
    else next() 
  },
  isDevelopment: (req, res, next) => {
    if (req.env !== 'development') res.error('This API endpoint is only available in development')
    else next()
  },
  isCompanyUser: (req, res, next) => {
    if (!isValidParamCompanyUserOrRespond(req, res)) return
    else next()
  },
  isCompanyOwner: (req, res, next) => {
    if (!isValidParamCompanyUserOrRespond(req, res, true)) return
    else next()
  },
}

export function isAdminUser(req: Request<UserMinimal>) {
  return req.user && (('type' in req.user && req.user.type?.match(/admin/)) || ('isAdmin' in req.user && req.user.isAdmin)) ? true : false
}

export function isValidUserOrRespond(req: Request<Pick<UserMinimal, '_id'>>, res: Response) {
  // Check if the user is logged in, and that the requesting user is the same as the user, the requesting user might be outdated.
  // E.g. new tab > signout > signin to a different user, now old tab needs to refresh.
  if (!req.user) {
    res.unauthorized('Please sign in first.')
    return false
  } else if (req.headers.requestingUserId && req.user._id?.toString() != req.headers.requestingUserId) {
    res.unauthorized('Invalid session, please refresh your browser.')
    return false
  } else {
    return true
  }
}

function isValidParamCompanyUserOrRespond(
  req: Request<UserMinimal & ({ company?: any} | { companies?: any[] })>, // eslint-disable-line @typescript-eslint/no-explicit-any
  res: Response,
  checkIsOwner = false
) {
  const user = req.user as any // eslint-disable-line @typescript-eslint/no-explicit-any
  const _company = user?.company?._id?.toString() == req.params.cid ? user.company : false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = _company || user?.companies?.find((o: any) => o._id.toString() == req.params.cid)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isCompanyOwner = company?.users?.find((o: any) => o._id.toString() == user?._id?.toString() && o.type === 'owner')
  if (!isValidUserOrRespond(req, res)) return
  else if (!isAdminUser(req) && !company) res.unauthorized('You are not authorised to make this request.')
  else if (!isAdminUser(req) && checkIsOwner && !isCompanyOwner) res.unauthorized('Only owners can make this request.')
  else return true
}