import 'dotenv/config'
import db from 'monastery'
import config from './config.js'
import { setupRouter, setupDefaultModels } from 'nitro-web/server'

// Setup monastery models
db.manager(config.mongoUrl, config.monasteryOptions)
await db.models(config.pwd + 'server/models')
await setupDefaultModels(db)

// Catch mongod not running
if (config.env === 'development') {
  db.onError(/** @param {Error} err */(err) => console.log(err))
}

// Setup router
const server = await setupRouter(config)

// Start express
server.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' }, async () => {
  // ...success
})

/**
 * Transactional Mailgun emails:
 *
 *   The `sendEmail` utility compiles and sends Nunjuck templates with Mailgun.
 *   1. Templates must be placed in the `/server/email/` directory, there are 3 available by default: welcome, reset-password, invite-user
 *   2. You can test the email templates at http://localhost:3000/email/welcome
 *   3. Update the `emailFrom`, `emailReplyTo`, `emailTestMode`, `mailgunKey`, `mailgunDomain` in the your .env once you are ready to send
 *
 *   Example:
 * 
 *   import { sendEmail } from 'nitro-web/server'
 *   const res = await sendEmail({
 *     config: config,
 *     data: { name: 'Test' },
 *     template: 'welcome',
 *     to: 'test@test.com',
 *   })
 *   console.log(res) // if config.emailTestMode=true, the template will be returned
 */
