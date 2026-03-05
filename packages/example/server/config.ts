import 'dotenv/config'
import { createRequire } from 'module'
import { setupApp, Controller, isValidUserOrRespond } from 'nitro-web/server'
import { NitroConfigServer } from 'nitro-web/types'
import type { User } from 'types'

// From this function: We need to return an app object with the following properties: router, middleware
// We also need to return empty/mock variables for routesType and controllerType, so these can easily be referenced
const { router, middleware, routesType, controllerType } = await setupApp<User>(configServer)
export { router, middleware }
export type Routes = typeof routesType
export type Controller = typeof controllerType

// Export the config server object

const _require = createRequire(import.meta.url)
const env = process.env.env || (process.env.NODE_ENV == 'production' ? 'production' : 'development')
const pwd = process.env.PWD + '/'

const sharedConfig = {
  baseUrl: process.env.baseUrl || 'http://localhost:3000',
  env: env,
  name: process.env.name || 'Nitro',
  version: _require(pwd + 'package.json').version,
}

export type ConfigServer = NitroConfigServer<User> & {
  exampleServerField: string
  webpack: NitroConfigServer<User>['webpack'] & { exampleWebpackField: string }
}

export const configServer = {
  ...sharedConfig,
  emailFrom: process.env.emailFrom,
  emailReplyTo: process.env.emailReplyTo,
  emailTestMode: !!process.env.emailTestMode,
  homepage: _require(pwd + 'package.json').homepage,
  // isNotMultiTenant: true,
  mailgunDomain: process.env.mailgunDomain,
  mailgunKey: process.env.mailgunKey,
  masterPassword: process.env.masterPassword,
  mongoUrl: process.env.mongoUrl,
  publicPath: process.env.publicPath,
  pwd: pwd, // change to rootDir
  stripeSecretKey: process.env.stripeSecretKey,
  stripeWebhookSecret: process.env.stripeWebhookSecret,
  exampleServerField: 'test',

  webpack: {
    // injected into the client via webpack
    ...sharedConfig,
    isDemo: false,
    isStatic: false,
    jwtName: '',
    awsUrl: process.env.awsUrl,
    googleMapsApiKey: process.env.googleMapsApiKey,
    placeholderEmail: process.env.placeholderEmail,
    stripePublishableKey: process.env.stripePublishableKey,
    exampleWebpackField: 'test',
  },

  monasteryOptions: {
    noDefaults: true,
    nullObjects: true,
    useMilliseconds: true,
    imagePlugin: process.env.awsSecretAccessKey
      ? {
          awsBucket: process.env.awsBucket,
          awsRegion: process.env.awsRegion,
          awsAccessKeyId: process.env.awsAccessKeyId,
          awsSecretAccessKey: process.env.awsSecretAccessKey,
          formats: ['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'gif', 'webp'],
        }
      : undefined,
    // show mongod selection error faster in development
    serverSelectionTimeoutMS: env == 'development' ? 3000 : undefined,
  },
  // You can set the default middleware order here
  middlewareOrder: ['loadAssets', 'parseUrlEncoded', 'parseJson', 'parseFile', 'cors'],
  middleware: {
    ...middleware,
    // cors: cors({
    //   origin: '*',
    //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    //   credentials: true,
    // }),
    hasExecutiveAccess: (req, res, next) => {
      if (!isValidUserOrRespond(req, res)) return
      else if (req.user?.type !== 'admin') res.unauthorized('Only executive account holders of Wayne Enterprises can access this page.')
      else next()
    },
  },
} satisfies ConfigServer

// const _test: ConfigServer = {
//   pwd: 'test',
//   baseUrl: 'test',
//   env: 'test',
//   name: 'test',
//   version: 'test',
//   unknownFFField: true,
// }
