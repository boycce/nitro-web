import 'dotenv/config'
import { createRequire } from 'module'
import { middleware } from 'nitro-web/server'

const _require = createRequire(import.meta.url)
const env = process.env.env || (process.env.NODE_ENV !== 'production' ? 'development' : process.env.NODE_ENV)
const pwd = process.env.PWD + '/'
const port = process.env.port || 3000 // TODO: Maybe think how we can extract default from baseUrl if defined? Maybe. 

const config = {
  emailFrom: process.env.emailFrom,
  emailReplyTo: process.env.emailReplyTo,
  emailTestMode: process.env.emailTestMode,
  homepage: _require(pwd + 'package.json').homepage,
  mailgunDomain: process.env.mailgunDomain,
  mailgunKey: process.env.mailgunKey,
  masterPassword: process.env.masterPassword,
  mongoUrl: process.env.mongoUrl,
  publicPath: process.env.publicPath,
  port: port,
  pwd: pwd, // change to rootDir
  stripeSecretKey: process.env.stripeSecretKey,
  stripeWebhookSecret: process.env.stripeWebhookSecret,
  // isNotMultiTenant: true,
  // portServer: 3001,

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

  client: {
    // injected into the client via webpack
    awsUrl: process.env.awsUrl,
    baseUrl: process.env.baseUrl || 'http://localhost:' + port,
    env: env,
    googleMapsApiKey: process.env.googleMapsApiKey,
    name: process.env.name,
    placeholderEmail: process.env.placeholderEmail,
    stripePublishableKey: process.env.stripePublishableKey,
    version: _require(pwd + 'package.json').version,
  },

  middleware: {
    ...middleware,
    // You add/extend middleware here, or even override what default middleware is used, e.g:
    // order: [...middleware.order, 'cors', 'hasExecutiveAccess'],
    // cors: cors({
    //   origin: '*',
    //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    //   credentials: true,
    // }),
    // hasExecutiveAccess: (req, res, next) => {
    //   if (!isValidUserOrRespond(req, res)) return
    //   else if (req.user?.isAdmin) res.unauthorized('Only executive account holders of Wayne Enterprises can access this page.')
    //   else next()
    // },
  },
}

export default { ...config.client, ...config }