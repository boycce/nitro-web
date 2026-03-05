export * from '../util.js'
export * as util from '../util.js'

// Export models
import userModel from './models/user.js'
import companyModel from './models/company.js'
export { userModel, companyModel, setupDefaultModels }

// Export router
export { setupApp, isValidUserOrRespond, isAdminUser } from './router.js'

// Export email utility
export { sendEmail } from './email/index.js'

// Export API controllers
export { 
  routes as authRoutes, findUserFromProvider, getStore, signinAndGetStore, userCreate, tokenCreate, tokenParse, 
  validatePassword,
} from '../components/auth/auth.api.js'
export { routes as stripeRoutes, getProducts } from '../components/billing/stripe.api.js'


async function setupDefaultModels(db: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  // Load default nitro models, if they don't exist already
  if (!db.models.user) await db.model('user', userModel)
  if (!db.models.company) await db.model('company', companyModel)
}