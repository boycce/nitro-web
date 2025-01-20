import 'dotenv/config'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
const _require = createRequire(import.meta.url)
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)) + '/../') + '/'
const env = process.env.env || (process.env.NODE_ENV !== 'production' ? 'development' : process.env.NODE_ENV)
const isNitro = process.env.NITRO

export default {
  inject: 'awsUrl clientUrl currencies countries env googleMapsApiKey stripePublishableKey testEmail',

  // apiUrl: process.env.originUrl || 'http://localhost:3001',
  clientUrl: process.env.originUrl || 'http://localhost:3000',
  emailFrom: process.env.emailFrom,
  emailReplyTo: process.env.emailReplyTo,
  emailTestMode: process.env.emailTestMode,
  env: env,
  masterPassword: process.env.masterPassword,
  mongoUrl: process.env.mongoUrl,
  testEmail: process.env.testEmail,

  clientDir: projectDir + 'client/',
  componentsDir: projectDir + 'components/',
  distDir: projectDir + 'client/dist/',
  emailTemplateDir: projectDir + 'server/email/',
  modelsDir: projectDir + 'server/models/',
  projectDir: projectDir,
  tmpDir: projectDir + 'tmp/',
  nitroDir: resolve(isNitro ? projectDir + '../' : projectDir + 'node_modules/nitro-web/') + '/',

  awsUrl: process.env.awsUrl,
  googleMapsApiKey: process.env.googleMapsApiKey,
  mailgunDomain: process.env.mailgunDomain,
  mailgunKey: process.env.mailgunKey,
  stripePublishableKey: process.env.stripePublishableKey,
  stripeSecretKey: process.env.stripeSecretKey,
  stripeWebhookSecret: process.env.stripeWebhookSecret,

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
  },

  currencies: {
    nzd: {
      name: 'New Zealand Dollar',
      symbol: '$',
    },
  },

  middleware: {
    isAdmin: (req, res, next) => {
      // Still need to remove cookie matching in favour of uid..
      // E.g. Cookie matching handy for rare issues, e.g. signout > signin (to a different user on another tab)
      let cookieMatch = req.user && (!req.headers.userid || req.user._id.toString() == req.headers.userid)
      if (cookieMatch && req.user.type.match(/admin/)) next()
      else if (req.user && req.user.type.match(/admin/)) res.unauthorized('Invalid cookie, please refresh your browser')
      else if (req.user) res.unauthorized('You are not authorised to make this request.')
      else res.unauthorized('Please sign in first.')
    },
    isCompanyOwner: (req, res, next) => {
      let user = req.user || { companies: [] }
      let cid = req.params.cid
      let company = user.companies.find((o) => o._id.toString() == cid)
      let companyUser = company?.users?.find((o) => o._id.toString() == user._id.toString())
      if (!user._id) return res.unauthorized('Please sign in first.')
      else if (!company || !companyUser) res.unauthorized('You are not authorised to make this request.')
      else if (companyUser.type != 'owner') res.unauthorized('Only owners can make this request.')
      else next()
    },
    isCompanyUser: (req, res, next) => {
      let user = req.user || { companies: [] }
      let cid = req.params.cid
      let company = user.companies.find((o) => o._id.toString() == cid)
      if (!user._id) return res.unauthorized('Please sign in first.')
      else if (!company) res.unauthorized('You are not authorised to make this request.')
      else next()
    },
    isUser: (req, res, next) => {
      // todo: need to double check that uid is always defined
      let uid = req.params.uid
      if (req.user && (typeof uid == 'undefined' || req.user._id.toString() == uid)) next()
      else if (req.user) res.unauthorized('You are not authorised to make this request.')
      else res.unauthorized('Please sign in first.')
    },
  },

  version: _require(projectDir + (isNitro ? '../' : '') + 'package.json').version,
  isNitro: isNitro,
}
