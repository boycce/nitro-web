import 'dotenv/config'
import db from 'monastery'
import config from './config.js'
import { setupRouter, setupDefaultModels } from '#nitro-web/server.js'

// Setup monastery models
db.manager(config.mongoUrl, config.monasteryOptions)
await db.models(config.modelsDir)
await setupDefaultModels(db)

// Catch mongod not running
if (config.env === 'development') {
  db.onError((err) => console.log(err))
}

// Setup router
const server = await setupRouter(config)

// Start express
server.listen(process.env.PORT || 3001, '0.0.0.0', async () => {
  // ...success
})

// You can send emails like this:
// const html = await sendEmail({
//   config: config,
//   data: { name: 'Test' },
//   template: 'welcome',
//   test: true,
//   to: 'test@test.com',
// })
// console.log(html)
