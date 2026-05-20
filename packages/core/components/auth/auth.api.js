// @ts-nocheck
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import passport from 'passport'
import passportLocal from 'passport-local'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import db, { isId } from 'monastery'
import jsonwebtoken from 'jsonwebtoken'
import { getDomain } from 'tldts'
import { sendEmail, requiredEmailConfigKeys, optionalEmailConfigKeys } from 'nitro-web/server'
import { isArray, pick, ucFirst, fullNameSplit, isEmail } from 'nitro-web/util'
// Todo: detect if the user is already invited to the company, instead of token error

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_with_secure_env_secret'
let authConfig = null
const requiredConfigKeys = [...requiredEmailConfigKeys]
const optionalConfigKeys = [...optionalEmailConfigKeys, 'masterPassword', 'isNotMultiTenant', 'autoAddExistingUsers', 'limitOneTenantPerUser']

export const auth = {
  userFindFromProvider, userSigninGetStore, getStore, addUserToCompany,
  userCreate, passwordValidate, tokenCreate, tokenParse, tokenSend,
  tokenConfirmForReset, tokenConfirmForSingleTenant, tokenConfirmForMultiTenant,
  getBaseUrl, invitePreConfirm, inviteConfirm, updateMemberRole, removeMember,
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
  'post    /api/resend-instructions': [resendInstructions],
  'get     /api/invite-pre-confirm/:token': [invitePreConfirm],
  'post    /api/invite-confirm/:token': [inviteConfirm], // was invite-accept
  'delete  /api/account/:uid': [remove],
  'put     /api/company/:cid/member-role/:uidOrEmail': ['isCompanyOwner', updateMemberRole],
  'delete  /api/company/:cid/member/:uidOrEmail': ['isCompanyOwner', removeMember],
  // Setup (called automatically when express starts)
  setup: setup,
}

function setup(middleware, _config, helpers = {}) {
  // todo: i think returning setup with auth context is better. We can then spread this 
  // in the project e.g. const { getUrl, signup, ... } = auth.setup(middleware, config, { getStore, ... })
  //
  // Tip: you can pass in your own helpers to override the default helpers, internally all functions are called
  // with `auth` as the context, so `this` context contains all helpers.
  // E.g. setup: (middleware, config, helpers) => authRoutes.setup(middleware, config, { getStore, ... })

  authConfig = pick(_config, [...requiredConfigKeys, ...optionalConfigKeys])
  for (const key of Object.keys(helpers)) {
    auth[key] = helpers[key]
  }
  for (const key of requiredConfigKeys) {
    if (!authConfig[key]) throw new Error(`Auth setup(): Missing config.${key} value`)
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
  res.json(await auth.getStore(req.user, req))
}

async function signup(req, res) {
  try {
    const desktop = req.query.desktop
    const user = await auth.userCreate(req.body, auth.getBaseUrl(req))
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
    if (req.whitelabel && user.company?._id?.toString() !== req.whitelabel._id?.toString()) {
      return res.error('email', `This sign in page is for ${req.whitelabel.name || req.whitelabel.subdomain} only.`)
    }
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
    const email = (req.body.email || '').trim().toLowerCase()
    const user = email && await db.user.findOne({ query: { email }, _privateData: true })
    if (!user) throw { title: 'email', detail: 'The email you entered is incorrect.' }
    await auth.tokenSend({ type: 'reset', id: user._id, payload: pick(user, ['email', 'firstName']), baseUrl: auth.getBaseUrl(req) })
    res.json({})
  } catch (err) {
    res.error(err)
  }
}

export async function inviteInstructions(req, res) {
  /**
   * Single-tenant (requires pre-created user):  res.body: isResend ? { _id } : { _id }
   *   - no user found: error
   *   - user exsits: send them the token to update their password
   * 
   * Multi-tenant:   res.body: isResend ? { companyId, email } : { companyId, email, firstName, role }
   *   - user exists and autoAddExistingUsers=true: auto-add user to company.users
   *   - user exists and autoAddExistingUsers=false: add user to company.invites, and send them the token
   *   - no user found: add user to company.invites and send them the token
   */
  try {
    if (authConfig.isNotMultiTenant) {
      const user = await db.user.findOne({ query: { _id: req.body._id }, _privateData: true })
      if (!user) throw new Error('Please pre-create the user first, no user id found.')
      await auth.tokenSend({ 
        type: 'invite', 
        id: user._id, 
        payload: pick(user, ['email', 'firstName']), 
        baseUrl: auth.getBaseUrl(req),
        isResend: req.isResend,
      })
      return res.json({})

    } else {
      const { companyId, email, firstName, role } = req.body
      if (!companyId) throw new Error('CompanyId is missing from the request body.')
      const company = await db.company.findOne({ query: { _id: db.id(companyId) }, project: { users: 1 } })

      if (!company) {
        throw new Error('Company not found.')
      } else if (!req.user.isAdmin && company.users?.find(u => u._id.toString() === req.user._id.toString())?.role !== 'owner') {
        throw new Error('Only company owners can invite users to this company.')
      }

      // Is there an exsiting user witht his email?
      const existingUserCheck = (authConfig.autoAddExistingUsers || authConfig.limitOneTenantPerUser) ? true : false
      const existingUser = existingUserCheck ? await db.user.findOne({ query: { email }, project: { firstName: 1, company: 1 } }) : null
      const autoAdd = authConfig.autoAddExistingUsers && existingUser

      // Check if the user is already a member of another company (the extra condition is to handle user's missing from company.users)
      if (authConfig.limitOneTenantPerUser && existingUser?.company && existingUser.company.toString() !== companyId) {
        throw new Error('This user is already a member of another company.')
      }

      if (autoAdd) {
        // Make sure the user is not already a member of the company
        if (company?.users?.some(u => u._id.toString() === existingUser._id.toString())) {
          throw new Error('User is already a member of this company.')
        }
        // Add the user to the company
        await auth.addUserToCompany(companyId, existingUser._id, role)

      } else {
        await auth.tokenSend({
          type: 'companyInvite',
          id: companyId,
          payload: { email: email, firstName: firstName, role: role },
          baseUrl: auth.getBaseUrl(req),
          isResend: req.isResend,
        })
      }

      res.json(await db.company.findOne({
        query: db.id(companyId),
        populate: db.company.authPopulate(),
        project: autoAdd ? { users: 1, usersExpanded: 1 } : { invites: 1, invitesExpanded: 1 },
      }))
    }
  } catch (err) {
    res.error(err)
  }
}

export async function resendInstructions(req, res) {
  req.isResend = true
  return inviteInstructions(req, res)
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
  //   - user exists and autoAddExistingUsers=true: no-op (i.e no token, user already added)
  //   - user exists and autoAddExistingUsers=false: update company (invite.tsx should display 'Invite Accepted' and redirect to home)
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

export async function invitePreConfirm(req, res) {
  req.preConfirm = true
  return await auth.inviteConfirm(req, res)
}

export async function updateMemberRole(req, res) {
  // req.body: { role }
  try {
    const { role } = req.body
    const { cid, uidOrEmail } = req.params
    const companyId = db.id(cid)
    const uid = uidOrEmail.includes('@') ? null : db.id(uidOrEmail)
    const email = uidOrEmail.includes('@') ? uidOrEmail.trim().toLowerCase() : null

    const company = await db.company.findOne({ query: { _id: companyId }, blacklist: false, project: { users: 1, invites: 1 } })
    const item = uid ? company?.users?.find((u) => u._id.toString() === uid.toString()) : company?.invites?.find((i) => i.email === email)
    if (!company) throw { title: 'error', detail: 'Company not found.' }
    else if (uid && !item) throw { title: 'error', detail: 'User not found.' }
    else if (email && !item) throw { title: 'error', detail: 'Invite not found.' }
    else if (!role) throw { title: 'role', detail: 'Role is required.' }
    else if (role !== 'owner' && uid) ensureNotLastOwner(company?.users, uid)

    // Validate the role
    await db.company.validate(
      { [uid ? 'users' : 'invites']: [{ ...item, role }] },
      { update: true, blacklist: ['-users', '-invites'] }
    )
    await db.company.update({
      query: { _id: companyId, ...(uid ? { 'users._id': uid } : { 'invites.email': email }) },
      $set: { ...(uid ? { 'users.$.role': role } : { 'invites.$.role': role }) },
    })
    res.json({})
  } catch (err) {
    res.error(err)
  }
}

export async function removeMember(req, res) {
  try {
    const { cid, uidOrEmail } = req.params
    const companyId = db.id(cid)
    const uid = uidOrEmail.includes('@') ? null : db.id(uidOrEmail)
    const email = uidOrEmail.includes('@') ? uidOrEmail.trim().toLowerCase() : null

    const company = await db.company.findOne({ query: { _id: companyId }, blacklist: false, project: { users: 1, invites: 1 } })
    if (!company) throw { title: 'error', detail: 'Company not found.' }
    if (uid && uid.toString() === req.user._id.toString()) throw { title: 'error', detail: 'You cannot remove yourself.' }
    if (uid && !company.users.find((u) => u._id.toString() === uid.toString())) throw { title: 'error', detail: 'User not found.' }
    if (email && !company.invites.find((i) => i.email === email)) throw { title: 'error', detail: 'Invite not found.' }
    if (uid) ensureNotLastOwner(company?.users, uid)
    
    // Remove the user from the company
    await db.company.update({
      query: { _id: companyId, ...(uid ? { 'users._id': uid } : { 'invites.email': email }) },
      $pull: { ...(uid ? { users: { _id: uid } } : { invites: { email } }) },
    })
    // Not required since the company.users is checked on auth.
    //
    //   Remove the user's active company, if it's the same
    //   if (uid) {
    //     await db.user.update({
    //       query: { _id: uid, company: cid },
    //       $set: { company: null },
    //     })
    //   }
    res.json({})
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
    populate: db.user.authPopulate(),
    _privateData: true,
  })
  if (isMultiTenant && user?.company) {
    user.company = await db.company.findOne({
      query: user.company,
      populate: db.company.authPopulate(),
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
    throw new Error('There is no primary company associated with this user')
  } else if (isMultiTenant && user.company.status != 'active') {
    throw new Error('The  company associated with this user is no longer active')
  } else if (isMultiTenant && user.company.users?.find(u => u._id.toString() === user._id.toString())?.status !== 'active') {
    throw new Error('This user is no longer a member of the company')
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

export async function getStore(user, _req) {
  // Initial store (req only passed from the /store route, not after signin)
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
 * @param {string} [baseUrl] - baseUrl to use for the email
 * @param {boolean} [skipSendEmail=false] - whether to skip sending the welcome email
 * @returns {Promise<object>} - the created user
 */
export async function userCreate({ password, password2, company, ...userDataProp }, baseUrl, invite, skipSendEmail) {
  try {
    const userId = db.id()
    const isMultiTenant = !authConfig.isNotMultiTenant
    const options = { blacklist: ['-_id'] }
    const isUpdate = isMultiTenant && isId(company)
    const isInsert = isMultiTenant && !isId(company)
    const companyId = isInsert ? db.id() : isUpdate ? db.id(company) : null

    // Create or update data if multi tenant
    const insertCompanyData = isInsert ? {
      ...(company || {}),
      _id: companyId,
      users: [{ _id: userId, role: 'owner', status: 'active' }],
    } : null

    // Define user data
    const userData = {
      ...userDataProp,
      _id: userId,
      password: password ? await bcrypt.hash(password, 10) : undefined,
      ...(isInsert || isUpdate ? { company: companyId } : {}), // AKA "active company"
      ...(userDataProp.name ? { firstName: fullNameSplit(userDataProp.name)[0], lastName: fullNameSplit(userDataProp.name)[1] } : {}),
    }
    // First validate the data so we don't have to create a transaction
    const results = await Promise.allSettled([
      db.user.validate(userData, options),
      typeof password === 'undefined' ? Promise.resolve() : auth.passwordValidate(password, password2),
      ...(isInsert 
        ? [db.company.validate(insertCompanyData, options)] 
        : isUpdate ? [addUserToCompany(companyId, userId, invite.role, invite.inviteToken, true)] : []
      ),
    ])

    // Throw all the errors from at once
    const errors = results.filter(o => o.status == 'rejected').reduce((acc, o) => {
      if (isArray(o.reason)) acc.push(...o.reason)
      else throw o.reason
      return acc
    }, [])
    if (errors.length) throw errors

    // todo: start: add this in transaction, handy for tokenConfirmForMultiTenant -------
    // Insert user
    await db.user.insert({ data: userData, ...options })

    // Insert, or, update company with user
    if (isInsert) await db.company.insert({ data: insertCompanyData, ...options })
    else if (isUpdate) await auth.addUserToCompany(companyId, userId, invite.role, invite.inviteToken)

    // Send welcome email
    if (!skipSendEmail) {
      sendEmail({
        config: { ...authConfig, baseUrl: baseUrl || authConfig.baseUrl },
        template: 'welcome',
        to: `${ucFirst(userData.firstName)}<${userData.email}>`,
      }).catch(console.error)
    }

    // Return the user
    return await auth.userFindFromProvider({ _id: userId })
    // todo: end: add this in transaction, handy for tokenConfirmForMultiTenant -------

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

export async function addUserToCompany(companyId, userId, role, token, justValidate) {
  // Validate first, if it fails its an internal error really...
  const userRow = { _id: userId, role: role, status: 'active' }
  const userRow2 = (await db.company.validate({ users: [userRow] }, { update: true, blacklist: ['-users'] })).users[0]
  if (justValidate) return userRow2
  
  // Add the user to the company ($push skips implicit validation)
  await db.company.update({
    query: companyId, 
    $push: { users: userRow2 }, 
    ...(token ? { $pull: { invites: { inviteToken: token } } } : {}), // token optional
  })
  // Update users with no active company yet
  await db.user.update({
    query: { _id: userId, company: null },
    $set: { company: companyId },
  })
}

export async function tokenConfirmForReset(req) {
  return await auth.tokenConfirmForSingleTenant(req, true)
}

export async function tokenConfirmForSingleTenant(req, isReset) {
  // single tenant: for both confirm and reset, this endpoint at least requires password/password2
  const token = req.params.token
  const { password, password2, ...userData } = req.body
  const tokenName = isReset ? 'resetToken' : 'inviteToken'
  const desktop = req.query.desktop
  const _id = db.id(auth.tokenParse(token, 'user'))
  await auth.passwordValidate(password, password2)

  // Find the inviteToken, but bypass hooks because inviteToken may = true in a potential afterFind hook.
  const user1 = await db.user._findOne({ _id: _id}, { projection: { [tokenName]: 1 } })
  if (!user1 || user1[tokenName] !== token) throw new Error('Sorry your token is invalid or has already been used.')
  if (req.preConfirm) throw new Error('Internal error: Token pre-confirm is not supported in single tenant mode.')

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
  const token = req.params.token
  const desktop = req.query.desktop
  const companyId = db.id(auth.tokenParse(token, 'company'))

  // Find the invite (we need to bypass hooks as inviteToken maybe true in an afterFind hook)
  const company = await db.company._findOne({ _id: companyId, 'invites.inviteToken': token }, { projection: { invites: 1, users: 1 } })
  const invite = company?.invites?.find(inv => inv.inviteToken === token)
  if (!company) throw new Error('Sorry your token is invalid or has already been used.')
  if (!invite.email) throw new Error('Internal error: Email address missing from the invite.')

  const existingUser = await db.user.findOne({ query: { email: invite.email }, _privateData: true })
  if (authConfig.limitOneTenantPerUser && existingUser?.company && existingUser.company.toString() !== companyId.toString()) {
    throw new Error(`You (${invite.email}) are already a member of another company.`)
  }

  // Existing user already added to company?
  if (existingUser && company.users?.some(u => u._id.toString() === existingUser._id.toString())) {
    throw new Error('User is already a member of this company.')
  }

  // Dont submit yet if the user is requesting preConfirm data (used to show the correct form fields first)
  if (req.preConfirm) return { isExistingUser: !!existingUser, email: invite.email }

  // Existing user: add the user to company
  if (existingUser) {
    await auth.addUserToCompany(companyId, existingUser._id, invite.role, invite.inviteToken)
    return {} // no signin, security risk if they take hold of the token

  // New user: create user (and add the user to the company), and signin
  } else {
    const baseUrl = auth.getBaseUrl(req)
    const user = await auth.userCreate({ ...req.body, company: companyId }, baseUrl, invite, true)
    return await auth.userSigninGetStore(user, desktop)
  }
}

/**
 * Creates and sends a reset or invite token to a user or company
 * @param {object} options
 * @param {'reset' | 'invite' | 'companyInvite'} options.type - token type
 * @param {string} options.id - user or company id
 * @param {{
 *   email: string,
 *   firstName: string,
 *   [key: string]: any, // other fields to include in the invite row
 * }} options.payload
 * @param {function} [options.beforeUpdate] - runs before updating the model with the token, return null to skip update
 * @param {function} [options.beforeSendEmail] - runs before sending the email, receives (options, token)
 * @param {string} [options.baseUrl] - baseUrl to use for the email
 * @returns {Promise<{token: string, mailgunPromise: Promise<unknown>}>}
 */
export async function tokenSend({ type, id, payload, beforeUpdate, beforeSendEmail, baseUrl, isResend }) {
  if (!id) throw { title: 'error', detail: `${type === 'companyInvite' ? 'Company id is required' : 'User id is required'}` }
  if (!payload?.email || !isEmail(payload.email)) throw { title: 'email', detail: 'A valid email address is required' }
  if (!isResend && !payload?.firstName) throw { title: 'firstName', detail: 'First name is required' }

  delete payload._id
  delete payload.inviteToken

  const docId = db.id(id)
  const apply = beforeUpdate || (o => o)
  const tokenName = type + 'Token'
  const emailData = {}
  const companyProjection = { invites: 1, name: 1, business: 1 }

  // Company invite resend: reuse the invite token (bypass hooks, inviteToken may be `true` in an afterFind hook)
  if (type === 'companyInvite' && isResend) {
    const company = await db.company._findOne({ _id: docId, 'invites.email': payload.email }, { projection: companyProjection })
    const invite = company?.invites?.find(i => i.email === payload.email)
    if (!invite?.inviteToken) throw new Error('No pending invite found for this email.')
    if (!payload.firstName) payload.firstName = invite.firstName
    emailData.token = invite.inviteToken
    emailData.companyName = company.name || company.business?.name

  // Company invite new: push new invite onto company.invites
  } else if (type === 'companyInvite') {
    const company = await db.company._findOne({ _id: docId }, { projection: companyProjection })
    if (!company) throw new Error('Invalid company id to send an invite for.')
    if (company.invites?.find(i => i.email === payload.email)) throw new Error('This email has already been invited to join this company.')
    emailData.token = await auth.tokenCreate('company', id)
    emailData.companyName = company.name || company.business?.name
    const invite = (await db.company.validate(
      { invites: [apply({ ...payload, inviteToken: emailData.token })] },
      { update: true, blacklist: ['-invites'] }
    )).invites[0]
    await db.company.update({ query: docId, $push: { invites: invite } })

  // User token resend: reuse the reset/invite token stored on the user 
  } else if (isResend) {
    const user = await db.user._findOne({ _id: docId }, { projection: { [tokenName]: 1 } }) // token maybe `true` in an afterFind hook
    if (!user?.[tokenName]) throw new Error('No pending invite for this user.')
    emailData.token = user[tokenName]

  // User token fresh: create token, set on user.resetToken or user.inviteToken
  } else {
    emailData.token = await auth.tokenCreate('user', id)
    const result = await db.user.update({
      query: docId,
      $set: apply({ [tokenName]: emailData.token, isInvited: type === 'invite' ? true : undefined }),
    })
    if (!result._output.matchedCount) throw new Error('Invalid user id to update the token for')
  }

  // Send email
  const emailOpts = {
    config: { ...authConfig, baseUrl: baseUrl || authConfig.baseUrl },
    template: type === 'reset' ? 'reset-instructions' : 'invite-instructions',
    to: `${ucFirst(payload.firstName)}<${payload.email}>`,
    data: emailData,
    // test: true,
  }
  const mailgunPromise = sendEmail(beforeSendEmail ? beforeSendEmail(emailOpts, emailData.token) : emailOpts).catch(err => {
    console.error('sendEmail(..) mailgun error', err)
  })

  return { token: emailData.token, mailgunPromise: mailgunPromise }
}

export function getBaseUrl(req) {
  return resolveBaseUrl(req?.nitroBaseUrl, authConfig.baseUrl)
}

export function resolveBaseUrl(reqUrl, cfgUrl) {
  // Use reqUrl if its apex domain matches cfgUrl's apex (e.g. wildcard.example.com matches cfg: app.example.com)
  if (!reqUrl) return cfgUrl
  try {
    const reqHost = new URL(reqUrl).hostname
    const cfgHost = new URL(cfgUrl).hostname
    const reqApex = getDomain(reqHost)
    const cfgApex = getDomain(cfgHost)

    if (reqApex && cfgApex) {
      return reqApex === cfgApex ? reqUrl : cfgUrl
    } else if (reqHost === cfgHost || reqHost.endsWith('.' + cfgHost)) {
      return reqUrl
    } else {
      return cfgUrl
    }
  } catch (_) {
    return cfgUrl
  }
}

export function ensureNotLastOwner(companyUsers, idNowNonOwner) {
  const remaining = (companyUsers || []).filter((u) =>
    u.role === 'owner' && u.status !== 'deleted' && u._id.toString() !== idNowNonOwner.toString()
  )
  if (!remaining.length) throw { title: 'role', detail: 'There must be at least one active owner.' }
}
