// @ts-nocheck
export * from '../util.js'
export * as util from '../util.js'

// Export models
import userModel from './models/user.js'
import companyModel from './models/company.js'
async function setupDefaultModels(db) {
  // Load default nitro models, if they don't exist already
  if (!db.models.user) await db.model('user', userModel)
  if (!db.models.company) await db.model('company', companyModel)
}
export { userModel, companyModel, setupDefaultModels }

// Export router
export { setupRouter } from './router.js'

// Export email utility
export { sendEmail } from './email/index.js'

// Export api default controllers
export { default as auth, findUserFromProvider, signinAndGetState, userCreate } from '../components/auth/auth.api.js'
export { default as settings } from '../components/settings/settings.api.js'
export { default as stripe } from '../components/billing/stripe.api.js'
