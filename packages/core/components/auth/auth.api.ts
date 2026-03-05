import crypto from 'crypto'
import bcrypt from 'bcrypt'
import passport from 'passport'
import passportLocal from 'passport-local'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import _db from 'monastery'
import jsonwebtoken from 'jsonwebtoken'
import { sendEmail } from 'nitro-web/server'
import { isArray, pick, ucFirst, fullNameSplit } from 'nitro-web/util'
import { Request, Response, ControllerSetup, UserMinimal, Store } from 'types'

const db = _db as any // eslint-disable-line @typescript-eslint/no-explicit-any
const configCache: {
  baseUrl?: string,
  emailFrom?: string,
  env?: string,
  name?: string,
  mailgunDomain?: string,
  mailgunKey?: string,
  masterPassword?: string, 
  isNotMultiTenant?: boolean,
} = {}
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_secure_env_secret'

export const routes = {
  // Routes
  'get     /api/store': [store],
  'get     /api/signout': [signout],
  'post    /api/signin': [signin],
  'post    /api/signup': [signup],
  'post    /api/reset-instructions': [resetInstructions],
  'post    /api/reset-password': [resetConfirm],
  'post    /api/invite-instructions': [inviteInstructions],
  'post    /api/invite-accept': [inviteConfirm],
  'delete  /api/account/:uid': [remove],

  // todo: 
  //   We dont need all of these overridable, just signinAndGetStore, findUserFromProvider, 
  //   and getStore. So we will allow just these two to be passed around.
  //   userCreate not needed, they can just create their own signup function.
  ///  Maybe we can pass these into setup?

  // Overridable helpers
  findUserFromProvider: findUserFromProvider,
  getStore: getStore,
  signinAndGetStore: signinAndGetStore,
  tokenCreate: tokenCreate,
  tokenParse: tokenParse,
  userCreate: userCreate,
  validatePassword: validatePassword,
  sendToken: sendToken,
  inviteOrResetConfirm: inviteOrResetConfirm,
}

export const setup: ControllerSetup = (middleware, config) => {
  // routes.setup is called automatically when express starts
  // Set config values
  for (const key of ['baseUrl', 'emailFrom', 'name', 'env', 'mailgunDomain', 'mailgunKey', 'masterPassword', 'isNotMultiTenant']) {
    if (!['baseUrl', 'emailFrom', 'env', 'name'].includes(key)) throw new Error(`Missing config value for: config.${key}`)
    configCache[key as keyof typeof configCache] = config[key as keyof typeof config]
  }

  passport.use(
    new passportLocal.Strategy(
      { usernameField: 'email' },
      async (email, password, next) => {
        try {
          const user = await this.findUserFromProvider({ email }, password)
          next(null, user)
        } catch (err) {
          next((err as Error).message)
        }
      }
    )
  )

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await this.findUserFromProvider({ _id: payload._id })
          if (!user) return done(null, false)
          return done(null, user)
        } catch (err) {
          return done(err, false)
        }
      }
    )
  )

  // added after index 1 (after parseJson)
  middleware.order.splice(2, 0, 'passport', 'passportError', 'jwtAuth', 'blocked')

  Object.assign(middleware, {
    blocked: function (req, res, next) {
      if (req.user && req.user.loginActive === false) {
        res.status(403).error('This user is not available.')
      } else {
        next()
      }
    },
    jwtAuth: function(req, res, next) {
      passport.authenticate('jwt', { session: false }, function(err, user) {
        if (user) req.user = user
        next()
      })(req, res, next)
    },
    passport: passport.initialize(),
    passportError: function (err, req, res, next) {
      if (!err) return next()
      res.error(err)
    },
  })
}

async function store(req: Request, res: Response) {
  res.json(await this.getStore(req.user))
}

async function signup(req: Request, res: Response) {
  try {
    const desktop = req.query.desktop
    const user = await this.userCreate(req.body)
    sendEmail({
      config: configCache,
      template: 'welcome',
      to: `${ucFirst(user.firstName)}<${user.email}>`,
    }).catch(console.error)
    res.send(await this.signinAndGetStore(user, desktop, this.getStore))
  } catch (err) {
    res.error(err)
  }
}

function signin(req, res) {
  const desktop = req.query.desktop
  if (!req.body.email) return res.error('email', 'The email you entered is incorrect.')
  if (!req.body.password) return res.error('password', 'The password you entered is incorrect.')

  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) return res.error(err)
    if (!user && info) return res.error('email', info.message)
    try {
      const response = await this.signinAndGetStore(user, desktop, this.getStore)
      res.send(response)
    } catch (err) {
      res.error(err)
    }
  })(req, res)
}

function signout(req, res) {
  res.json('{}')
}

async function remove(req, res) {
  try {
    const uid = db.id(req.params.uid || 'badid')
    // Check for active subscription first...
    if (req.user.stripeSubscription?.status == 'active') {
      throw { title: 'subscription', detail: 'You need to cancel your subscription first.' }
    }
    // // Get companies owned by user
    // const companyIdsOwned = (await db.company.find({ 
    //   query: { users: { $elemMatch: { _id: uid, role: 'owner' } } },
    //   project: { _id: 1 },
    // })).map(o => o._id)
    
    // if (companyIdsOwned.length) {
    //   await db.product.remove({ query: { company: { $in: companyIdsOwned }}})
    //   await db.company.remove({ query: { _id: { $in: companyIdsOwned }}})
    // }
    await db.user.remove({ query: { _id: uid }})
    // Logout now so that an error doesn't throw when naviating to /signout
    req.logout()
    res.send(`User: '${uid}' removed successfully`)
  } catch (err) {
    res.error(err)
  }
}

/* ---- Overridable helpers ------------------ */

export async function findUserFromProvider(query, passwordToCheck) {
  /**
   * Find user for state (and verify password if signing in with email)
   * @param {object} query - e.g. { email: 'test@test.com' }
   * @param {string} <passwordToCheck> - password to test
   */
  const isMultiTenant = !configCache.isNotMultiTenant
  const checkPassword = arguments.length > 1
  const user = await db.user.findOne({
    query: query,
    blacklist: ['-password'],
    populate: db.user.loginPopulate(),
    _privateData: true,
  })
  if (isMultiTenant && user?.company) {
    user.company = await db.company.findOne({
      query: user.company,
      populate: db.company.loginPopulate(),
      _privateData: true,
    })
  }
  if (!user) {
    throw new Error(checkPassword ? 'Email or password is incorrect.' : 'Session-user is invalid.')
  } else if (isMultiTenant && !user.company) {
    throw new Error('The current company is no longer associated with this user')
  } else if (isMultiTenant && user.company.status != 'active') {
    throw new Error('This user is not associated with an active company')
  } else {
    if (checkPassword) {
      if (!user.password) {
        throw new Error('There is no password associated with this account, please try signing in with another method.')
      }
      const match = user.password ? await bcrypt.compare(passwordToCheck, user.password) : false
      if (!match && !(configCache.masterPassword && passwordToCheck == configCache.masterPassword)) {
        throw new Error('Email or password is incorrect.')
      }
    }
    // Successful return user
    delete user.password
    return user
  }
}

export async function getStore(user?: UserMinimal): Promise<Store> {
  // Initial store
  return {
    user: user || undefined,
  }
}

export async function signinAndGetStore(user: UserMinimal, isDesktop: boolean, getStoreFn: typeof getStore)  {
  if (user.loginActive === false) throw 'This user is not available.'
  if (!getStoreFn) throw new Error('Please provide a getStore function')
  user.desktop = isDesktop

  const jwt = jsonwebtoken.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '30d' })
  const store = await getStoreFn(user)
  return { ...store, jwt }
}

export async function userCreate({ business, password, ...userDataProp }) {
  try {
    if (!this.findUserFromProvider) {
      throw new Error('this.findUserFromProvider doesn\'t exist, make sure the context is available when calling this function')
    }

    const options = { blacklist: ['-_id'] }
    const isMultiTenant = !configCache.isNotMultiTenant
    const userId = db.id()
    const companyData = isMultiTenant && {
      _id: db.id(), 
      ...(business ? { business } : {}),
      users: [{ _id: userId, role: 'owner', status: 'active' }],
    }
    const userData = {
      ...userDataProp,
      _id: userId,
      ...(userDataProp.name ? { 
        firstName: fullNameSplit(userDataProp.name)[0],
        lastName: fullNameSplit(userDataProp.name)[1],
      } : {}),
      password: password ? await bcrypt.hash(password, 10) : undefined,
      ...(isMultiTenant ? { company: companyData._id } : {}),
    }
    // First validate the data so we don't have to create a transaction
    const results = await Promise.allSettled([
      db.user.validate(userData, options),
      ...(isMultiTenant ? [db.company.validate(companyData, options)] : []),
      typeof password === 'undefined' ? Promise.resolve() : validatePassword(password),
    ])

    // Throw all the errors from at once
    const errors = results.filter(o => o.status == 'rejected').reduce((acc, o) => {
      if (isArray(o.reason)) acc.push(...o.reason)
      else throw o.reason
      return acc
    }, [])
    if (errors.length) throw errors

    // Insert company & user
    await db.user.insert({ data: userData, ...options })
    if (isMultiTenant) await db.company.insert({ data: companyData, ...options })

    // Return the user
    return await findUserFromProvider({ _id: userId })

  } catch (err) {
    if (!isArray(err)) throw err
    else throw err //...
  }
}

export function tokenCreate(id?: string) {
  return new Promise((resolve) => {
    crypto.randomBytes(16, (err, buff) => {
      const hash = buff.toString('hex') // 32 chars
      resolve(`${hash}${id || ''}:${Date.now()}`)
    })
  })
}

export function tokenParse(token?: string) {
  const split = (token ||  '').split(':')
  const hash = split[0].slice(0, 32)
  const userId = split[0].slice(32)
  const time = split[1]
  if (!hash || !userId || !time) {
    throw { title: 'error', detail: 'Sorry your code is invalid.' }
  } else if (parseFloat(time) + 1000 * 60 * 60 * 24 < Date.now()) {
    throw { title: 'error', detail: 'Sorry your code has timed out.' }
  } else {
    return userId
  }
}

export async function validatePassword(password='', password2?: string) {
  // let hasLowerChar = password.match(/[a-z]/)
  // let hasUpperChar = password.match(/[A-Z]/)
  // let hasNumber = password.match(/\d/)
  // let hasSymbol = password.match(/\W/)
  if (!password) {
    throw [{ title: 'password', detail: 'This field is required.' }]
  } else if (configCache.env !== 'development' && password.length < 8) {
    throw [{ title: 'password', detail: 'Your password needs to be atleast 8 characters long' }]
    // } else if (!hasLowerChar || !hasUpperChar || !hasNumber || !hasSymbol) {
    //   throw {
    //     title: 'password',
    //     detail: 'You need to include uppercase and lowercase letters, and a number'
    //   }
  } else if (typeof password2 != 'undefined' && password !== password2) {
    throw [{ title: 'password2', detail: 'Your passwords need to match.' }]
  }
}




/* ---- Controllers -------------------------- */

export async function resetInstructions(req, res) {
  try {
    // const desktop = req.query.hasOwnProperty('desktop') ? '?desktop' : '' // see sendToken for future usage
    const email = (req.body.email || '').trim().toLowerCase()
    if (!email) throw { title: 'email', detail: 'The email you entered is incorrect.' }

    const user = await db.user.findOne({ query: { email }, _privateData: true })
    if (!user) throw { title: 'email', detail: 'The email you entered is incorrect.' }

    // Send reset password email
    await sendToken({ type: 'reset', user: user })
    res.json({})
  } catch (err) {
    res.error(err)
  }
}

export async function inviteInstructions(req, res) {
  try {
    // const desktop = req.query.hasOwnProperty('desktop') ? '?desktop' : '' // see sendToken for future usage
    const user = await db.user.findOne({ query: { _id: req.params._id }, _privateData: true })
    if (!user) throw new Error('Invalid user id')
    // Send invite instructions email
    await sendToken({ type: 'invite', user: user })
    res.json({})
  } catch (err) {
    res.error(err)
  }
}

export async function inviteConfirm(req, res) {
  try {
    res.send(await this.inviteOrResetConfirm('invite', req))
  } catch (err) {
    res.error(err)
  }
}

export async function resetConfirm(req, res) {
  try {
    res.send(await this.inviteOrResetConfirm('reset', req))
  } catch (err) {
    res.error(err)
  }
}

/* ---- Helpers ------------------------------ */

export async function inviteOrResetConfirm(type, req) {
  const { token, password, password2 } = req.body
  const name = type === 'invite' ? 'inviteToken' : 'resetToken'
  const desktop = req.query.desktop
  const id = tokenParse(token)
  await validatePassword(password, password2)

  const user = await db.user.findOne({ query: id, blacklist: ['-' + name], _privateData: true })
  if (!user || user[name] !== token) throw new Error('Sorry your token is invalid or has already been used.')

  await db.user.update({
    query: user._id,
    data: {
      password: await bcrypt.hash(password, 10),
      [name]: '', // remove token
    },
    blacklist: ['-' + name, '-password'],
  })
  const store = await this.signinAndGetStore({ ...user, [name]: undefined }, desktop, this.getStore)
  return store
}

/**
 * Checks if the user exists, updates the user with the invite token and sends the invite email
 * @param {object} options
 * @param {'reset' | 'invite'} options.type -  The type of token to send (default: 'reset')
 * @param {{_id: string, email: string, firstName: string}} options.user -  The user to send the invite email to
 * @param {function} [options.beforeUpdate] - callback hook to run before updating the user
 * @param {function} [options.beforeSendEmail] -  callback hook to run before sending the email
 * @returns {Promise<{token: string, mailgunPromise: Promise<unknown>}>}
 */
export async function sendToken({ type = 'reset', user, beforeUpdate, beforeSendEmail }) {
  if (!user?._id) throw new Error('user is required')
  if (!user?.email) throw new Error('user.email is required')
  if (!user?.firstName) throw new Error('user.firstName is required')
  const token = await tokenCreate(user._id)

  // get the data
  const data = beforeUpdate ? beforeUpdate({ [type + 'Token']: token }) : { [type + 'Token']: token }
  if (type === 'invite') data.isInvited = true

  // Update the user with the token
  const result = await db.user.update({
    query: { _id: user._id },
    data: data,
    blacklist: ['-' + type + 'Token'],
  })

  if (!result._output.matchedCount) {
    throw new Error('Invalid user id to send the token to')
  }

  // Send email
  const options = {
    config: configCache,
    template: type === 'reset' ? 'reset-password' : 'invite-user',
    to: `${ucFirst(user.firstName)}<${user.email}>`,
    data: { token: token }, // + (req.query.hasOwnProperty('desktop') ? '?desktop' : '')
  }
  const mailgunPromise = sendEmail(beforeSendEmail ? beforeSendEmail(options, token) : options).catch(err => {
    console.error('sendEmail(..) mailgun error', err)
  })

  // Return the token and mailgun promise
  return { token, mailgunPromise }
}