// @ts-nocheck
import Stripe from 'stripe'
import db from 'monastery'
import * as util from 'nitro-web/util'

let stripe = undefined
let stripeProducts = []
let config = {}

export default {
  routes: {
    'post   /api/stripe/webhook': ['stripeWebhook'],
    'post   /api/stripe/create-billing-portal-session': ['isUser', 'billingPortalSessionCreate'],
    'get    /api/stripe/upcoming-invoices': ['isUser', 'upcomingInvoicesFind'],
  },

  setup: function (middleware, _config) {
    // Set config values
    config = {
      env: _config.env,
      clientUrl: _config.clientUrl,
      stripeSecretKey: _config.stripeSecretKey,
      stripeWebhookSecret: _config.stripeWebhookSecret,
    }
    for (let key in config) {
      if (!config[key]) {
        throw new Error(`Missing config value for stripe.api.js: ${key}`)
      }
    }
    stripe = new Stripe(config.stripeSecretKey)
  },

  stripeWebhook: async function (req, res) {
    try {
      var event = config.env == 'development' ? req.body : stripe.webhooks.constructEvent(
        req.rawBody,
        req.rawHeaders['stripe-signature'],
        config.stripeWebhookSecret
      )
    } catch (err) {
      if (err && err.message) console.log(err.message)
      else console.log(err)
      return res.error(err)
    }

    if (!event.data || !event.data.object) {
      return res.status(400).send(`Missing webhook data: ${event}.`)
    }

    // useful for cleaning failed webhooks
    if (req.query.success) return true
    // console.log('event.type: ', event.type)

    // Stripe cannot guarantee event order
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Subscriptions can be renewed which resurrects cancelled subscriptions.. ignore this
        console.log('Event: ' + event.type)
        this._webhookSubUpdated(req, res, event)
        break
      case 'customer.created': // customer created by subscribing
      case 'customer.updated': // payment method changes
        console.log('Event: ' + event.type)
        this._webhookCustomerCreatedUpdated(req, res, event)
        break
      default:
        res.status(400).send(`Unsupported type: ${event}.`)
        break
    }
  },

  billingPortalSessionCreate: async function (req, res) {
    try {
      if (!req.user.stripeCustomer?.id) {
        throw new Error('No stripe customer found for the user')
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: req.user.stripeCustomer.id,
        return_url: config.clientUrl + '/subscriptions',
      })
      res.json(session.url)
    } catch (err) {
      this._error(req, res, err)
    }
  },

  upcomingInvoicesFind: async function (req, res) {
    try {
      if (!req.user.stripeCustomer?.id) return res.json({})
      const nextInvoice = await stripe.invoices.retrieveUpcoming({
        customer: req.user.stripeCustomer.id,
      })
      res.json(nextInvoice)
    } catch (err) {
      if (err.code == 'invoice_upcoming_none') return res.json({})
      this._error(req, res, err)
    }
  },

  /* Private webhook actions */

  _webhookCustomerCreatedUpdated: async function (req, res, event) {
    try {
      const customer = event.data.object
      const user = await this._getUserFromEvent(event)
      const customerExpanded = await stripe.customers.retrieve(
        customer.id,
        { expand: ['invoice_settings.default_payment_method'] }
      )
      await db.user.update({
        query: user._id,
        data: { stripeCustomer: customerExpanded },
        blacklist: ['-stripeCustomer'],
      })
      res.json({})
    } catch (err) {
      console.log(err)
      this._error(req, res, err)
    }
  },

  _webhookSubUpdated: async function (req, res, event) {
    // Update the subscription on the company
    try {
      const subData = event.data.object
       // webhook from deleting a company?
      if (subData.cancellation_details.comment == 'company deleted') {
        return res.json({})
      }

      const user = await this._getUserFromEvent(event)
      if (!user.company) {
        throw new Error(`Subscription user has no company to update the subscription (${subData.id}) onto`)
      }

      // Ignoring incomplete subscriptions
      if (subData.status.match(/incomplete/)) {
        return res.json({})
      // Ignoring subscriptions without companyId (e.g. manual subscriptions)
      } else if (!subData.metadata.companyId) {
        return res.json({ ignoringManualSubscriptions: true })
      // Ignoring old subscriptions
      } else if (subData.created < (user.company.stripeSubscription?.created || 0)) {
        return res.json({ ignoringOldSubscriptions: true })
      }
      
      // Update company with the updated subscription and users
      const sub = await stripe.subscriptions.retrieve(
        subData.id,
        { expand: ['latest_invoice.payment_intent'] }
      )
      await db.company.update({
        query: user.company._id,
        data: { stripeSubscription: sub, users: user.company.users },
        blacklist: ['-stripeSubscription', '-users'],
      })
      
      res.json({})
    } catch (err) {
      console.error(err)
      this._error(req, res, err)
    }
  },

  /* Private */

  _getUserFromEvent: async function (event) {
    // User retreived from the event's customer. 
    // The customer is created before the paymentIntent and subscriptionIntent is set up
    let object = event.data.object
    let customerId = object.object == 'customer'? object.id : object.customer
    if (customerId) {
      var user = await db.user.findOne({
        query: { 'stripeCustomer.id': customerId },
        populate: db.user.populate({}),
        blacklist: false, // ['-company.users.inviteToken'],
      })
    }
    if (!user) {
      await db.log.insert({ data: {
        date: Date.now(),
        event: event.type,
        message: `Cannot find user with id: ${customerId}.`,
      }})
      throw new Error(`Cannot find user with id: ${customerId}.`)
    }
    // populate company owner with user data (handy for _addSubscriptionBillingChange)
    if (user.company?.users) {
      user.company.users = user.company.users.map(o => {
        if (o.role == 'owner' && o._id.toString() == user._id.toString()) {
          o.firstName = user.firstName
          o.name = user.name
          o.email = user.email
        }
        return o
      })
    }
    return user
  },

  _getProducts: async function () {
    /**
     * Returns all products and caches it on the app
     * @returns {Array} products
     */
    try {
      if (stripeProducts) return stripeProducts
      if (!config.stripeSecretKey) {
        stripeProducts = []
        throw new Error('Missing process.env.stripeSecretKey for retrieving products')
      }

      let products = (await stripe.products.list({ limit: 100, active: true })).data
      let prices = (await stripe.prices.list({ limit: 100, active: true, expand: ['data.tiers'] })).data

      return (stripeProducts = products.map((product) => ({
        // remove default_price when new pricing is ready
        ...util.pick(product, ['id', 'created', 'default_price', 'description', 'name', 'metadata']),
        type: product.name.match(/housing/i) ? 'project' : 'subscription', // overwriting, was 'service'
        prices: prices
          .filter((price) => price.product == product.id)
          .map((price) => ({
            ...util.pick(price, ['id', 'product', 'nickname', 'recurring', 'unit_amount', 'tiers', 'tiers_mode']),
            interval: price.recurring?.interval, // 'year', 'month', undefined
          })),
      })))
    } catch (err) {
      console.error(new Error(err)) // when stripe throws errors, the callstack is missing.
      return []
    }
  },

  _createOrUpdateCustomer: async function (user, paymentMethod=null) {
    /**
     * Creates or updates a stripe customer and saves it to the user
     * @param {Object} user - user
     * @param {String} paymentMethod - stripe payment method id to save to the customer
     * @called before paymentIntent and subscriptionIntent, and after completion with paymentMethod
     * @returns mutates user
     */
    const data = {
      email: user.email,
      name: user.name,
      address: { country: 'NZ' },
      ...(!paymentMethod ? {} : { invoice_settings: { default_payment_method: paymentMethod }}),
      expand: ['invoice_settings.default_payment_method', 'tax'], // expands card object
    }
    
    if (user.stripeCustomer) var customer = await stripe.customers.update(user.stripeCustomer.id, data)
    else customer = await stripe.customers.create({ ...data })

    user.stripeCustomer = customer
    await db.user.update({
      query: user._id,
      data: { stripeCustomer: customer },
      blacklist: ['-stripeCustomer'],
    })
  },

  _error: async function (req, res, err) {
    if (err && err.response && err.response.body) console.log(err.response.body)
    if (util.isString(err) && err.match(/Cannot find company with id/)) {
      res.json({ user: 'no company found' })
    } else res.error(err)
  },
}
