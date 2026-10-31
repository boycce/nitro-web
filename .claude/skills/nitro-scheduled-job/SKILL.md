---
name: nitro-scheduled-job
description: For projects using nitro-web only. Adding or changing a scheduled job, e.g. a daily email alert, cleanup or sync that runs from a scheduler rather than the web server.
---

# Setup

  - One kebab file per job in `server/scheduled-jobs/`, e.g. `server/scheduled-jobs/cut-off-alerts.js`.
  - Add a camelCase npm script, e.g. `"cutOffAlerts": "node server/scheduled-jobs/cut-off-alerts.js"`. The scheduler (e.g. Heroku Scheduler) calls that script.
  - Don't use `setInterval` in `server/index.js`, as every server instance would run it.
  - Email templates stay in `server/email/`.

# Job file

  - Start with a how-to-use line, with the npm script and the schedule in UTC, then a short line on what the job does.
  - Load models with `waitForIndexes: true`, otherwise `db.close()` runs before the indexes finish.
  - Add a `--test` flag that logs instead of sending or saving.
  - Mark each document once done (e.g. `cutOffAlertDate`), so it isn't sent twice.
  - Compare calendar days in `auckland`, and remember daylight saving shifts the UTC schedule by an hour.

  ## Example:

  ```js
  // @ts-nocheck
  // How to use: `npm run cutOffAlerts` (Daily at 7:00 PM UTC), add `-- --test` to render the emails without sending
  // Emails the assigned staff member the day before an active order's cut-off
  import 'nitro-web/env'
  import db from 'monastery'
  import { sendEmail, setupDefaultModels } from 'nitro-web/server'
  import { date } from 'nitro-web/util'
  import config from '../config.js'
  import { auckland } from '../constants.js'

  const dayMs = 24 * 60 * 60 * 1000
  const day = (/** @type {number} */ d) => date(d, 'yyyy-MM-dd', auckland)
  const test = process.argv.includes('--test')

  try {
    db.manager(config.mongoUrl, config.monasteryOptions)
    await db.models(config.pwd + 'server/models', { waitForIndexes: true })
    await setupDefaultModels(db)
    await sendCutOffAlerts()
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  } finally {
    await db.close()
  }

  async function sendCutOffAlerts() {
    // Emails each order's staff member the day before its cut-off
    const tomorrow = day(Date.now() + dayMs)
    const orders = await db.order.find({ query: { cutOffDate: { $gt: Date.now(), $lt: Date.now() + 2 * dayMs } } })

    for (const order of orders) {
      if (day(order.cutOffDate) !== tomorrow || order.cutOffAlertDate === order.cutOffDate) continue
      try {
        const res = await sendEmail({
          config: config,
          template: 'cut-off-alert',
          to: `${order.staff.name}<${order.staff.email}>`,
          subject: `Cut-off tomorrow for order ${order.number}`,
          test: test,
          data: { orderUrl: `${config.baseUrl}/orders/${order._id}` },
        })
        if (test) console.log(res)
        else await db.order.update({ query: order._id, data: { cutOffAlertDate: order.cutOffDate } })
      } catch (err) {
        console.error(`Cut-off alert failed for order ${order.number}`, err)
      }
    }
  }
  ```

# Testing

  ```bash
  npm run cutOffAlerts -- --test # Dry run against the dev database
  ```

  - For date based cases, temporarily change a document's date, run with `--test`, then restore it.
