import 'dotenv/config'
import { createRequire } from 'module'
import { middleware } from 'nitro-web/server'

const _require = createRequire(import.meta.url)
const env = process.env.env || (process.env.NODE_ENV !== 'production' ? 'development' : process.env.NODE_ENV)
const pwd = process.env.PWD + '/'

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
  pwd: pwd, // change to rootDir
  stripeSecretKey: process.env.stripeSecretKey,
  stripeWebhookSecret: process.env.stripeWebhookSecret,
  // isNotMultiTenant: true,

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
    clientUrl: process.env.originUrl || 'http://localhost:3000',
    env: env,
    googleMapsApiKey: process.env.googleMapsApiKey,
    name: process.env.name,
    placeholderEmail: process.env.placeholderEmail,
    stripePublishableKey: process.env.stripePublishableKey,
    version: _require(pwd + 'package.json').version,
    countries: {
      nz: {
        currency: 'nzd',
        name: 'New Zealand',
        numberFormats: {
          currency: '¤#,##0.00',
          percentage: '¤#,##0.00%',
        },
        dateFormats: {
          full: 'dddd, D MMMM YYYY',
          long: 'D MMMM YYYY',
          medium: 'D/MM/YYYY',
          short: 'D/MM/YY',
        },
      },
      au: {
        currency: 'aud',
        name: 'Australia',
        numberFormats: {
          currency: '¤#,##0.00',
          percentage: '¤#,##0.00%',
        },
        dateFormats: {
          full: 'dddd, D MMMM YYYY',
          long: 'D MMMM YYYY',
          medium: 'D/MM/YYYY',
          short: 'D/MM/YY',
        },
      },
    },
    currencies: {
      nzd: {
        name: 'New Zealand Dollar',
        symbol: '$',
      },
      aud: {
        name: 'Australian Dollar',
        symbol: '$',
      },
    },
  },

  middleware: {
    ...middleware,
    // You add/extend middleware here, or even override what default middleware is used, e.g:
    // order: [...middleware.order, 'cors'],
    // cors: cors({
    //   origin: '*',
    //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    //   credentials: true,
    // }),
  },
}

export default { ...config.client, ...config }