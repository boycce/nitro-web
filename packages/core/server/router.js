// @ts-nocheck
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
import * as util from 'nitro-web/util'

const _dirname = dirname(fileURLToPath(import.meta.url)) + '/'

export async function setupRouter (config) {
  const { env, middleware, version } = config
  const { componentsDir, distDir, emailTemplateDir } = util.getDirectories(path, config.pwd)
  const expressApp = express()
  const server = http.createServer(expressApp)
  const apiRoutes = {}
  const controllers = {} // { controllerName: { ...routes, ...helpers } }
  const allMiddleware = { ...defaultMiddleware, ...(middleware || {}) }
  const verbs = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'all']

  if (!env) {
    throw new Error('setupRouter: `config.env` missing')
  }

  // Extend request/response with our custom error responses
  setupErrorResponses(expressApp)

  // Extend request with version
  expressApp.use((req, res, next) => {
    req.version = version
    next()
  })

  // Load in API routes & controllers
  let filepaths = getFiles(componentsDir, /\.api\.js$/)
  // console.log(filepaths, componentsDir)
  for (let filepath of filepaths) {
    const file = await import(filepath)
    const routes = file.routes
    const name = filepath.replace(/^.*[\\\/]|\.api\.js$/g, '') // eslint-disable-line
    controllers[name] = routes // { ...routes, ...helpers }

    if (!routes) {
      console.warn(`API warning: no 'routes' export found on file ${filepath}`)
      continue
    }

    if (routes?.setup) routes.setup.call(routes, allMiddleware, config)
    if (routes) {
      util.each(routes, (_middleware, key) => {
        if (!key.match(/\s/)) return
        const match = key.match(new RegExp(`^(${verbs.join('|')})\\s+(.*)$`, 'i'))
        if (!match) throw new Error(`Invalid verb or path: ${key}`)
        apiRoutes[key] = {
          middleware: util.toArray(_middleware),
          filename: name,
          path: match[2],
          verb: match[1],
        }
      })
    }
  }

  // Register the base middleware
  for (let name of allMiddleware.order) {
    if (name == 'loadAssets') {
      expressApp.use('/favicon.png', express.static(distDir + 'favicon.png', { maxage: '7d' }))
      expressApp.use('/assets', compression()) // gzip
      expressApp.use('/assets', express.static(distDir + 'assets/', { maxage: '365d' }))
    } else if (!allMiddleware[name]) {
      continue
    } else {
      expressApp.use(allMiddleware[name])
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
  // E.g. http://localhost:3001/email/welcome
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
          config: config,
          subject: 'Development email',
          template: req.params.name,
          test: true,
          skipCssInline: true,
          to: 'Ricky<test@gmail.com>',
        })
        res.send(html)
      } catch (e) {
        console.error(e)
        res.error(e.message)
      }
    })
  }

  // Ping, pong, useful for webpack
  expressApp.get('/ping', (req, res) => {
    res.send('pong')
  })

  // Catch all remaining routes, i.e 404
  expressApp.get('*', (req, res) => {
    if (indexExists) res.sendFile(distDir + 'index.html')
    else { res.status(404); res.notFound() }
  })

  return server
}

function setupErrorResponses (expressApp) {
  /**
   * Extend the express response object with custom formatted error responses
   * @param {object} express - expressApp to extend
   */

  Object.assign(expressApp.response, {
    error: function(a, b) { error.call(this, a, b, 400) },
    unauthorized: function(a, b) { error.call(this, a, b, 401) },
    forbidden: function(a, b) { error.call(this, a, b, 403) },
    notFound: function(a, b) { error.call(this, a, b, 404) },
    serverError: function(a, b) { error.call(this, a, b, 500) },
  })

  function duplicateKeyIndexAndValue(error) {
    // https://github.com/Automattic/mongoose/issues/2129#issuecomment-280507821
    // E.g. E11000 duplicate key error collection: anamata-production.person index:
    //   email_1 dup key: { email: "person1@gmail.com" }
    let regex = /index: (?:.*\.)?\$?(?:([_a-z0-9]*)(?:_\d*)|([_a-z0-9]*))\s*dup key/i
    let match = error.message.match(regex)
    let index = match[1] || match[2]
    let value = (error.message.match(/.*{.*?: (.*) }/i)[1]||'').replace(/"/g, '')
    return [index, value]
  }

  function error(error, detail, status) {
    /**
     * Returns a formatted error
     * @this = res
     * @param {string | Error | Error[]} error - { code, title, detail }, or title
     * @param {string} detail - used when error is a string
     * @param {number} status
     */

    const res = this 
    const req = this.req
    let errors = []
    let _detail

    status = parseInt(error && error.status || status) // parseInt until monastery removes or udpates status?
    res.status(status)

    // Default detail
    if (status == 400) _detail = 'Bad request made.'
    else if (status == 401) _detail = 'You are unauthorised to make this request.'
    else if (status == 403) _detail = 'You are unauthorised to make this request.'
    else if (status == 404) _detail = 'Sorry, nothing found here.'
    else if (status == 500) _detail = 'Internal server error, please contact the admin.'

    // Single error string
    if (util.isString(error) || !error) {
      if (detail) errors = [{ title: error, detail: detail }]
      else errors = [{ detail: error || _detail }]

    // Mongo error
    } else if (util.isObject(error) && (error.name||'').match(/Mongo|BulkWriteError/)) {
      if (error.code == 11000) {
        let [name] = duplicateKeyIndexAndValue(error)
        if (name == 'email') errors = [{ title: 'email', detail: 'That email is already linked to an account.' }]
        else errors = [{ title: name, detail: `Cannot insert duplicate values for "${name}".` }]
      } else {
        errors = [{ title: 'mongo', detail: error.message }]
      }

    // Stripe error object
    } else if (error instanceof Error && error.type?.match(/Stripe/)) {
      errors = [{ title: 'error', detail: 'Stripe: ' + error.message }]

    // Error object
    } else if (error instanceof Error) {
      if (error.response) console.log('Error:', error.response.data)
      else console.error(error) // and stack
      errors = [{ title: 'error', detail: error.message }]

    // Mutliple errors passed
    } else if (util.isObject(error) || util.isArray(error)) {
      errors = error.errors? error.errors : util.toArray(error)
      for (let o of errors) {
        // detail can be an error object
        if (o.detail instanceof Error) {
          console.error(o.detail) // and stack
          o.detail = o.detail.message
        }
        // Remove _ prefixed keys
        for (let key in o) {
          if (o.hasOwnProperty(key) && key.match(/^_/)) delete o[key]
        }
      }

    // Invalid data
    } else {
      console.error('Invalid data parsed into response()')
    }

    // Add status to all errors.
    for (let o of errors) {
      if (!o.status) o.status = status
    }

    // Log error
    let type = status == 500 ? 'error' : 'log'
    console[type]('Sending ' + status + ' response: \n', errors)

    // Display error json/html
    if (req.json) res.json({ errors: errors })
    else res.send('<p>' + errors.map(e => e.detail).join('<br>') + '</p>')
    return new Error({ errors: errors })
  }
}

function getFiles (dir, regexp) {
  /**
   * Recursivaly retreive all files
   * @param {string} dir - directory to search (IS NOW FULL PATH)
   * @return [path, ..]
   */
  let paths = []
  // let dirname = path.dirname(fileURLToPath(import.meta.url))
  // if (dir.match(/^\./)) dir = path.join(dirname, dir)

  for (let filename of fs.readdirSync(dir)) {
    let filepath = path.join(dir, '/', filename)
    let stat = fs.statSync(filepath)
    if (stat && stat.isDirectory()) {
      paths = paths.concat(getFiles(filepath, regexp))
    } else if (filepath.match(regexp)) {
      paths.push(filepath)
    }
  }
  return paths
}

function resolveMiddleware (controllers, middleware, route, item) {
  /**
   * Resolves a placeholder string into a function
   * @param {object} controllers - { controllerName: { routes, setup, ...other exported functions } }
   * @param {object} middleware
   * @param {object} route
   * @param {fn|string} item
   * @param {boolean} last - last item
   * @return function(req, res){..}
   */
  if (util.isFunction(item)) {
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

const defaultMiddleware = {
  order: [
    // Express middleware runtime order
    'loadAssets',
    'modifyRequest',
    'parseUrlEncoded',
    'parseJson',
    'parseFile',
    'beforeAPIRoute',
  ],

  modifyRequest: (req, res, next) => {
    // Handy boolean denoting that the request wants JSON returned
    // global.start = new Date().getTime()
    req.json = req.xhr || req.accepts(['html', 'json']) == 'json'
    next()
  },

  // parse application/x-www-form-urlencoded (rawbody for stripe webhooks)
  parseUrlEncoded: bodyParser.urlencoded({ extended: false, verify: (req, res, buf, encoding) => {
    if (!buf || !buf.length) return
    req.rawHeaders = req.headers
    req.rawBody = buf.toString(encoding || 'utf8')
  }}),

  // parse application/json
  parseJson: bodyParser.json({
    verify: (req, res, buf, encoding) => {
      if (!buf || !buf.length) return
      req.rawHeaders = req.headers
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

  beforeAPIRoute: (req, res, next) => {
    res.set('version', req.version)
    next()
  },
}