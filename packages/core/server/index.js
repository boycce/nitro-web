// @ts-nocheck
export * from '../util.js'
export * as util from '../util.js'

/**
 * Re-export the MiddlewareConfig type from nitro-web/server
 * @typedef {import('./router.js').MiddlewareConfig} MiddlewareConfig
 */

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
export { setupRouter, middleware } from './router.js'

// Export email utility
export { sendEmail } from './email/index.js'

// Export API controllers
export * from '../components/auth/auth.api.js'
export * from '../components/billing/stripe.api.js'
export { routes as authRoutes } from '../components/auth/auth.api.js'
export { routes as stripeRoutes } from '../components/billing/stripe.api.js'

