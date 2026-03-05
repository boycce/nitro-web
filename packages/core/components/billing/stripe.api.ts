/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe'
import _db from 'monastery'
import * as util from 'nitro-web/util'
import type { Routes, Request, Response, ControllerSetup } from 'types'

type StripePrice = Pick<Stripe.Price, 'id' | 'product' | 'nickname' | 'recurring' | 'unit_amount' | 'tiers' | 'tiers_mode'> & {
  interval?: Stripe.Price.Recurring['interval']
}
type StripeProduct = Pick<Stripe.Product, 'id' | 'created' | 'default_price' | 'description' | 'name' | 'metadata'> & {
  type: 'project' | 'subscription'
  prices: StripePrice[]
}

let stripe: Stripe
let stripeProducts: StripeProduct[] = []
const configCache: { stripeSecretKey?: string, stripeWebhookSecret?: string, baseUrl?: string } = {}
const db = _db as any

export const routes: Routes = {
  // Routes
  'post   /api/stripe/webhook': [stripeWebhook],
  'post   /api/stripe/create-billing-portal-session': [billingPortalSessionCreate],
  'get    /api/stripe/upcoming-invoices': [upcomingInvoicesFind],
}

export const setup: ControllerSetup = (_middleware, config) => {
  // Set config values
  configCache.stripeSecretKey = config.stripeSecretKey
  configCache.stripeWebhookSecret = config.stripeWebhookSecret
  configCache.baseUrl = config.baseUrl
  if (!configCache.stripeSecretKey || !configCache.stripeWebhookSecret || !configCache.baseUrl) {
    throw new Error('Missing config value for stripe.api.js')
  }
  stripe = new Stripe(configCache.stripeSecretKey, { apiVersion: '2020-08-27' })
}

async function stripeWebhook(req: Request, res: Response) {
  try {
    var event = req.env === 'development' ? req.body : stripe.webhooks.constructEvent(
      req.rawBody,
      req.rawHeaders['stripe-signature'] as string,
      configCache.stripeWebhookSecret || ''
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'message' in err) console.log(err.message)
    else console.log(err)
    res.error(err)
    return
  }

  if (!event.data || !event.data.object) {
    res.status(400).send(`Missing webhook data: ${event}.`)
    return
  }

  // useful for cleaning failed webhooks
  if (req.query.success) return
  // console.log('event.type: ', event.type)

  // Stripe cannot guarantee event order
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // Subscriptions can be renewed which resurrects cancelled subscriptions.. ignore this
      console.log('Event: ' + event.type)
      webhookSubUpdated(req, res, event)
      break
    case 'customer.created': // customer created by subscribing
    case 'customer.updated': // payment method changes
      console.log('Event: ' + event.type)
      webhookCustomerCreatedUpdated(req, res, event)
      break
    default:
      res.status(400).send(`Unsupported type: ${event}.`)
      break
  }
}

async function billingPortalSessionCreate(req: Request, res: Response) {
  try {
    if (!req.user?.stripeCustomer?.id) {
      throw new Error('No stripe customer found for the user')
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomer.id,
      return_url: configCache.baseUrl + '/subscriptions',
    })
    res.json(session.url)
  } catch (err) {
    error(req, res, err)
  }
}

async function upcomingInvoicesFind(req: Request, res: Response) {
  try {
    if (!req.user?.stripeCustomer?.id) {
      res.json({})
      return
    }
    const nextInvoice = await stripe.invoices.retrieveUpcoming({
      customer: req.user.stripeCustomer.id,
    })
    res.json(nextInvoice)
  } catch (err) {
    if ((err as { code: string })?.code == 'invoice_upcoming_none') {
      res.json({})
      return
    }
    error(req, res, err)
  }
}

/* ---- Overridable helpers ------------------ */

async function error(req: Request, res: Response, err: any) {
  if (err && err.response && err.response.body) console.log(err.response.body)
  if (util.isString(err) && err.match(/Cannot find company with id/)) {
    res.json({ user: 'no company found' })
  } else {
    res.error(err)
  }
}

/**
 * Returns all products and caches it on the app
 */
export async function getProducts() {
  try {
    if (stripeProducts) return stripeProducts
    if (!configCache.stripeSecretKey) {
      stripeProducts = []
      throw new Error('Missing process.env.stripeSecretKey for retrieving products')
    }

    const products = (await stripe.products.list({ limit: 100, active: true })).data
    const prices = (await stripe.prices.list({ limit: 100, active: true, expand: ['data.tiers'] })).data

    return (stripeProducts = products.map((product): StripeProduct => ({
      id: product.id,
      created: product.created,
      default_price: product.default_price, // remove default_price when new pricing is ready
      description: product.description,
      name: product.name,
      metadata: product.metadata,
      type: product.name.match(/housing/i) ? 'project' : 'subscription', // overwriting, was 'service'
      prices: prices
        .filter((price) => price.product == product.id)
        .map((price): StripePrice => ({
          id: price.id,
          product: price.product,
          nickname: price.nickname,
          recurring: price.recurring,
          unit_amount: price.unit_amount,
          tiers: price.tiers,
          tiers_mode: price.tiers_mode,
          interval: price.recurring?.interval,
        })),
    })))
  } catch (err) {
    console.error(new Error(err as string)) // when stripe throws errors, the callstack is missing.
    return []
  }
}

async function getUserFromEvent(event: Stripe.Event) {
  // User retreived from the event's customer. 
  // The customer is created before the paymentIntent and subscriptionIntent is set up
  const object = event.data.object as Stripe.Customer | Stripe.PaymentIntent | Stripe.Subscription
  const customerId = object.object == 'customer' ? object.id : object.customer
  if (customerId) {
    var user = await  db.user.findOne({
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
    user.company.users = user.company.users.map((o: any) => {
      if (o.role == 'owner' && o._id.toString() == user._id.toString()) {
        o.firstName = user.firstName
        o.name = user.name
        o.email = user.email
      }
      return o
    })
  }
  return user
}

async function webhookCustomerCreatedUpdated(req: Request, res: Response, event: Stripe.Event) {
  try {
    const customer = event.data.object as Stripe.Customer
    const user = await getUserFromEvent(event)
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
    error(req, res, err)
  }
}

async function webhookSubUpdated(req: Request, res: Response, event: Stripe.Event) {
  // Update the subscription on the company
  try {
    const subData = event.data.object as Stripe.Subscription
    // webhook from deleting a company?
    if ((subData as any).cancellation_details.comment == 'company deleted') {
      return res.json({})
    }

    const user = await getUserFromEvent(event)
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
    error(req, res, err)
  }
}

// async function createOrUpdateCustomer(user, paymentMethod=null) {
//   /**
//    * Creates or updates a stripe customer and saves it to the user
//    * @param {Object} user - user
//    * @param {String} paymentMethod - stripe payment method id to save to the customer
//    * @called before paymentIntent and subscriptionIntent, and after completion with paymentMethod
//    * @returns mutates user
//    */
//   const data = {
//     email: user.email,
//     name: user.name,
//     address: { country: 'NZ' },
//     ...(!paymentMethod ? {} : { invoice_settings: { default_payment_method: paymentMethod }}),
//     expand: ['invoice_settings.default_payment_method', 'tax'], // expands card object
//   }
  
//   if (user.stripeCustomer) var customer = await stripe.customers.update(user.stripeCustomer.id, data)
//   else customer = await stripe.customers.create({ ...data })

//   user.stripeCustomer = customer
//   await db.user.update({
//     query: user._id,
//     data: { stripeCustomer: customer },
//     blacklist: ['-stripeCustomer'],
//   })
// }
