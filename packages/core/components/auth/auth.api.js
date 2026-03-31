// @ts-nocheck
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import passport from 'passport'
import passportLocal from 'passport-local'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import db, { isId } from 'monastery'
import jsonwebtoken from 'jsonwebtoken'
import { sendEmail } from 'nitro-web/server'
import { isArray, pick, ucFirst, fullNameSplit } from 'nitro-web/util'
// Todo: detect if the user is already invited to the company, instead of token error

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_secure_env_secret'
let authConfig = null
export const auth = {
  userFindFromProvider, userSigninGetStore, getStore,
  userCreate, passwordValidate, tokenCreate, tokenParse, tokenSend,
  tokenConfirmForReset, tokenConfirmForSingleTenant, tokenConfirmForMultiTenant,
}

export const routes = {
  // Routes
  'get     /api/store': [store],
  'get     /api/signout': [signout],
  'post    /api/signin': [signin], // [todo: route gaurd basic limiter]
  'post    /api/signup': [signup], // [todo: route gaurd Altcha]
  'post    /api/reset-instructions': [resetInstructions],
  'post    /api/reset-confirm': [resetConfirm], // was reset-password
  'post    /api/invite-instructions': [inviteInstructions],
  'post    /api/invite-confirm': [inviteConfirm], // was invite-accept
  'delete  /api/account/:uid': [remove],
  // Setup (called automatically when express starts)
  setup: setup,
}

function setup(middleware, _config, helpers = {}) {
  // Tip: you can pass in your own helpers to override the default helpers, internally all functions are called
  // with `auth` as the context, so `this` context contains all helpers.
  // E.g. setup: (middleware, config, helpers) => authRoutes.setup(middleware, config, { getStore, ... })
  const configKeys = ['baseUrl', 'emailFrom', 'env', 'name', 'mailgunDomain', 'mailgunKey', 'masterPassword', 'isNotMultiTenant', 
    'confirmInvites']
  authConfig = pick(_config, configKeys)
  for (const key of Object.keys(helpers)) {
    auth[key] = helpers[key]
  }
  for (const key of ['baseUrl', 'emailFrom', 'env', 'name']) {
    if (!authConfig[key]) throw new Error(`Missing config value for: config.${key}`)
  }

  passport.use(
    new passportLocal.Strategy(
      { usernameField: 'email' },
      async (email, password, next) => {
        try {
          const user = await auth.userFindFromProvider({ email }, password)
          next(null, user)
        } catch (err) {
          next(err.message)
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
          const user = await auth.userFindFromProvider({ _id: payload._id })
          if (!user) return done(null, false)
          return done(null, user)
        } catch (err) {
          return done(err, false)
        }
      }
    )
  )

  middleware.order.splice(3, 0, 'passport', 'passportError', 'jwtAuth', 'blocked')

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

async function store(req, res) {
  res.json(await auth.getStore(req.user))
}

async function signup(req, res) {
  try {
    const desktop = req.query.desktop
    const user = await auth.userCreate(req.body)
    res.send(await auth.userSigninGetStore(user, desktop))
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
      const response = await auth.userSigninGetStore(user, desktop)
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
    await new Promise((resolve, reject) => req.logout(err => err ? reject(err) : resolve()))
    res.send(`User: '${uid}' removed successfully`)
  } catch (err) {
    res.error(err)
  }
}

export async function resetInstructions(req, res) {
  try {
    // const desktop = req.query.hasOwnProperty('desktop') ? '?desktop' : '' // see sendToken for future usage
    let email = (req.body.email || '').trim().toLowerCase()
    if (!email) throw { title: 'email', detail: 'The email you entered is incorrect.' }

    let user = await db.user.findOne({ query: { email }, _privateData: true })
    if (!user) throw { title: 'email', detail: 'The email you entered is incorrect.' }

    // Send reset password email
    await auth.tokenSend({ _id: user._id, email: user.email, firstName: user.firstName })
    res.json({})
  } catch (err) {
    res.error(err)
  }
}

export async function inviteInstructions(req, res) {
  // Single-tenant: 
  //.  - no user found: error (not supported, must be pre-created)
  //   - user pre-created: update user with token, and send them the token
  // Multi-tenant:
  //   - user exists and confirmInvites=false: auto-add user to company.users
  //   - user exists and confirmInvites=true: add user to company.invites, and send them the token
  //.  - no user found: add user to company.invites and send them the token
  try {
    if (authConfig.isNotMultiTenant) {
      const user = await db.user.findOne({ query: { _id: req.body._id }, _privateData: true })
      if (!user) throw new Error('Please pre-create the user first, no user id found.')
      await auth.tokenSend({ type: 'invite', _id: user._id, email: user.email, firstName: user.firstName })
      res.json({})

    } else {
      const companyId = req.body.companyId
      if (!req.user.isAdmin && (!companyId || req.user?.company?._id?.toString() !== companyId.toString())) {
        throw new Error('You do not have permission to invite users to this company.')
      }
      const existingUser = await db.user.findOne({ query: { email: req.body.email } })
      if (existingUser && !authConfig.confirmInvites) {
        await db.company.update({
          query: db.id(companyId),
          $push: { users: { _id: existingUser._id, role: req.body.role, status: 'active' } },
        })
      } else {
        await auth.tokenSend({
          type: 'companyInvite', _id: companyId,
          email: req.body.email,
          firstName: existingUser?.firstName || req.body.firstName,
        })
      }
      res.json({})
    }
  } catch (err) {
    res.error(err)
  }
}

export async function resetConfirm(req, res) {
  try {
    res.send(await auth.tokenConfirmForReset(req))
  } catch (err) {
    res.error(err)
  }
}

export async function inviteConfirm(req, res) {
  // single tenant:
  //   - user pre-created: update user with new password (and any other inviteConfirm.tsx form fields)
  //.  - no user found: error (not supported, must be pre-created)
  // multi tenant:
  //   - user exists and confirmInvites=false: no-op (i.e no token, user already added)
  //   - user exists and confirmInvites=true: update company (invite.tsx should display 'Invite Accepted' and redirect to home)
  //   - no user found: create new user with new password (and any other inviteConfirm.tsx form fields)
  try {
    const result = authConfig.isNotMultiTenant
      ? await auth.tokenConfirmForSingleTenant(req)
      : await auth.tokenConfirmForMultiTenant(req)
    res.send(result)
  } catch (err) {
    res.error(err)
  }
}

/* ---- Overridable helpers ------------------ */

export async function userFindFromProvider(query, passwordToCheck) {
  /**
   * Find user for state (and verify password if signing in with email).
   * NOTE: the application needs to set user.company to the active company (if multi tenant)
   * @param {object} query - e.g. { email: 'test@test.com' }
   * @param {string} <passwordToCheck> - password to test
   */
  const isMultiTenant = !authConfig.isNotMultiTenant
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
  } else if (user.status?.match(/removed|deleted|unavailable/)) {
    throw new Error('This user account is not available.')
  } else if (user.status === 'terminated') {
    throw new Error('This user account has been terminated.')
  } else if (user.status === 'invited') {
    throw new Error('This user account is not yet active.')
  } else if (isMultiTenant && !user.company) {
    throw new Error('The current company is no longer associated with this user')
  } else if (isMultiTenant && user.company.status != 'active') {
    throw new Error('This user is not associated with an active company')
  } else if (isMultiTenant && !user.company.users?.find(u => u._id.toString() === user._id.toString())?.status === 'active') {
    throw new Error('This user is not associated with an active company')
  } else {
    if (checkPassword) {
      if (!user.password) {
        throw new Error('There is no password associated with this account, please try signing in with another method.')
      }
      const match = user.password ? await bcrypt.compare(passwordToCheck, user.password) : false
      if (!match && !(authConfig.masterPassword && passwordToCheck == authConfig.masterPassword)) {
        throw new Error('Email or password is incorrect.')
      }
    }
    // Successful return user
    delete user.password
    return user
  }
}

export async function userSigninGetStore(user, isDesktop) {
  if (user.loginActive === false) throw { title: 'error', detail: 'This user is not available.' }
  user.desktop = isDesktop

  const jwt = jsonwebtoken.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '30d' })
  const store = await auth.getStore(user)
  return { ...store, jwt }
}

export async function getStore(user) {
  // Initial store
  return {
    user: user || undefined,
  }
}

/* ---- Helpers (not easily overridable) ----- */

/**
 * Creates a new user and company (if multi tenant and `user.company` is not an id)
 * @param {object} userData - user data
 * @param {string} [userData.password] - optional
 * @param {string} [userData.password2] - optional, to confirm the password
 * @param {string} [userData.company] - if multi tenant and `user.company` is not an id, create a new company
 * @param {boolean} [skipSendEmail=false] - whether to skip sending the welcome email
 * @returns {Promise<object>} - the created user
 */
export async function userCreate({ password, password2, company, ...userDataProp }, skipSendEmail) {
  try {
    const userId = db.id()
    const options = { blacklist: ['-_id'] }
    const companyIsId = !authConfig.isNotMultiTenant && isId(company)

    // Define new company data if applicable
    const companyData = !authConfig.isNotMultiTenant && !companyIsId && {
      _id: db.id(),
      users: [{ _id: userId, role: 'owner', status: 'active' }],
      ...(company ? company : {}), // removed
    }

    // Define user data
    const userData = {
      ...userDataProp,
      _id: userId,
      password: password ? await bcrypt.hash(password, 10) : undefined,
      ...(companyIsId ? { company: company } : (companyData ? { company: companyData._id } : {})), // AKA "active company"
      ...(userDataProp.name ? { firstName: fullNameSplit(userDataProp.name)[0], lastName: fullNameSplit(userDataProp.name)[1] } : {}),
    }
    // First validate the data so we don't have to create a transaction
    const results = await Promise.allSettled([
      db.user.validate(userData, options),
      typeof password === 'undefined' ? Promise.resolve() : auth.passwordValidate(password, password2),
      ...(companyData ? [db.company.validate(companyData, options)] : []),
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
    if (companyData) await db.company.insert({ data: companyData, ...options })

    // Send welcome email
    if (!skipSendEmail) {
      sendEmail({
        config: authConfig,
        template: 'welcome',
        to: `${ucFirst(userData.firstName)}<${userData.email}>`,
      }).catch(console.error)
    }

    // Return the user
    return await auth.userFindFromProvider({ _id: userId })

  } catch (err) {
    if (!isArray(err)) throw err
    else throw err //...
  }
}

export async function passwordValidate(password='', password2) {
  // let hasLowerChar = password.match(/[a-z]/)
  // let hasUpperChar = password.match(/[A-Z]/)
  // let hasNumber = password.match(/\d/)
  // let hasSymbol = password.match(/\W/)
  if (!password) {
    throw [{ title: 'password', detail: 'This field is required.' }]
  } else if (authConfig.env !== 'development' && password.length < 8) {
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

export function tokenCreate(modelName, id) {
  return new Promise((resolve) => {
    crypto.randomBytes(16, (err, buff) => {
      let hash = buff.toString('hex') // 32 chars
      resolve(`${hash}:${modelName}:${id || ''}:${Date.now()}`)
    })
  })
}

export function tokenParse(token, modelName, maxAgeMs = 1000 * 60 * 60 * 24) {
  let [hash, modelNameParsed, id, time] = (token || '').split(':')
  if (!hash || !id || !time) {
    throw { title: 'error', detail: 'Sorry your code is invalid.' }
  } else if (modelNameParsed !== modelName) {
    throw { title: 'error', detail: 'Sorry we are detecting a token mismatch.' }
  } else if (parseFloat(time) + maxAgeMs < Date.now()) {
    throw { title: 'error', detail: 'Sorry your code has timed out.' }
  } else {
    return id
  }
}

export async function tokenConfirmForReset(req) {
  return await auth.tokenConfirmForSingleTenant(req, true)
}

export async function tokenConfirmForSingleTenant(req, isReset) {
  const { token, password, password2, ...userData } = req.body
  const tokenName = isReset ? 'resetToken' : 'inviteToken'
  const desktop = req.query.desktop
  const _id = db.id(auth.tokenParse(token, 'user'))
  await auth.passwordValidate(password, password2)

  // Find the inviteToken, but bypass hooks because inviteToken may = true in a potential afterFind hook.
  const user1 = await db.user._findOne({ _id: _id}, { projection: { [tokenName]: 1 } })
  if (!user1 || user1[tokenName] !== token) throw new Error('Sorry your token is invalid or has already been used.')

  await db.user.update({
    query: _id,
    data: {
      password: await bcrypt.hash(password, 10),
      [tokenName]: '', // remove token
      ...userData,
    },
    blacklist: ['-' + tokenName, '-password'],
  })

  const user2 = await db.user.findOne({ query: _id })
  return await auth.userSigninGetStore({ ...user2, [tokenName]: undefined }, desktop)
}

export async function tokenConfirmForMultiTenant(req) {
  const { token, ...userData } = req.body
  const desktop = req.query.desktop
  const companyId = db.id(auth.tokenParse(token, 'company'))

  // Find the invite from the token (company.invites[] entry), but bypass hooks because inviteToken may = true in 
  // a potential afterFind hook.
  const company = await db.company._findOne(
    { _id: companyId, 'invites.inviteToken': token }, 
    { projection: { 'invites.inviteToken': 1 } }
  )
  if (!company) throw new Error('Sorry your token is invalid or has already been used.')
  const invite = company.invites.find(inv => inv.inviteToken === token)

  // Has the user already been added to the company (company.users[] entry)?
  const existingUser = await db.user.findOne({ query: { email: userData.email }, _privateData: true })
  if (existingUser && company.users.some(u => u._id.toString() === existingUser._id.toString())) {
    throw new Error('This user has already been added to the company.')
  }

  // Find or create new user
  const user = existingUser || await auth.userCreate({ ...userData, company: companyId }, true) // AKA "active company"
  
  // Add the user to the company
  await db.company.update({
    query: companyId,
    $push: { users: { _id: user._id, role: invite.role, status: 'active' } }, // add user to company
    $pull: { invites: { inviteToken: token } }, // remove invite
  })

  // Signin
  return await auth.userSigninGetStore(user, desktop)
}

/**
 * Creates and sends a reset or invite token to a user or company
 * @param {object} options
 * @param {'reset' | 'invite' | 'companyInvite'} options.type - token type (default: 'reset')
 * @param {string} options._id - user or company id
 * @param {string} options.email - recipient email
 * @param {string} options.firstName - recipient first name
 * @param {function} [options.beforeUpdate] - runs before updating the model with the token, return null to skip update
 * @param {function} [options.beforeSendEmail] - runs before sending the email, receives (options, token)
 * @returns {Promise<{token: string, mailgunPromise: Promise<unknown>}>}
 */
export async function tokenSend({ type = 'reset', _id, email, firstName, beforeUpdate, beforeSendEmail }) {
  if (!_id) throw new Error(`${type === 'companyInvite' ? 'company' : 'user'} id is required`)
  if (!email) throw new Error('email is required')
  if (!firstName) throw new Error('firstName is required')

  const tokenName = type === 'companyInvite' ? 'inviteToken' : type + 'Token'
  const modelName = type === 'companyInvite' ? 'company' : 'user'
  const token = await auth.tokenCreate(modelName, _id)
  const _beforeUpdate = beforeUpdate || (o => o)

  if (modelName === 'company') {
    // For companies, add the token to company.invites[].inviteToken
    await db.company.update({ query: db.id(_id), $pull: { invites: { email } } })
    const result = await db.company.update({ query: db.id(_id), $push: { invites: _beforeUpdate({ email: email, inviteToken: token }) }})
    if (!result._output.matchedCount) throw new Error('Invalid company id to update the token for')
  } else {
    // For users, add the token to user.inviteToken|resetToken
    const result = await db[modelName].update({
      query: db.id(_id),
      $set: _beforeUpdate({ [tokenName]: token, isInvited: type === 'invite' ? true : undefined }),
    })
    if (!result._output.matchedCount) throw new Error('Invalid ' + modelName + ' id to update the token for')
  }

  // Send email
  const options = {
    config: authConfig,
    template: type === 'reset' ? 'reset-instructions' : 'invite-instructions',
    to: `${ucFirst(firstName)}<${email}>`,
    data: { token: token },
  }
  const mailgunPromise = sendEmail(beforeSendEmail ? beforeSendEmail(options, token) : options).catch(err => {
    console.error('sendEmail(..) mailgun error', err)
  })

  // Return the token and mailgun promise
  return { token, mailgunPromise }
}