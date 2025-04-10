// @ts-nocheck
import MongoStore from 'connect-mongo'
import crypto from 'crypto'
import expressSession from 'express-session'
import passport from 'passport'
import passportLocal from 'passport-local'
import db from 'monastery'
import { sendEmail } from 'nitro-web/server'
import * as util from 'nitro-web/util'
// import stripeController from '../billing/stripe.api.js'

let config = {}

export default {

  routes: {
    'get     /api/state': ['state'],
    'get     /api/signout': ['signout'],
    'post    /api/signin': ['signin'],
    'post    /api/signup': ['signup'],
    'post    /api/reset-instructions': ['resetInstructions'],
    'post    /api/reset-password': ['resetPassword'],
    'delete  /api/account/:uid': ['isUser', 'remove'],
  },

  setup: function (middleware, _config) {
    // Setup passport handlers for reading and writing to req.session
    const that = this
    global.passport = passport

    // Set config values
    config = {
      env: _config.env,
      masterPassword: _config.masterPassword,
    }
    for (let key in config) {
      if (!config[key] && key != 'masterPassword') {
        throw new Error(`Missing config value for stripe.api.js: ${key}`)
      }
    }

    // After successful login, serialize the user into a session object
    passport.serializeUser((user, next) => {
      next(null, { _id: user._id })
    })

    // After session read, get the user from the session object
    passport.deserializeUser(async (sessionObject, next) => {
      try {
        const user = await that._findUserFromProvider('deserialize', sessionObject)
        next(null, user)
      } catch (err) {
        next(err.message)
      }
    })
    
    // Setup passport local signin strategy
    passport.use(
      new passportLocal.Strategy(
        { usernameField: 'email' }, 
        async (email, password, next) => {
          try {
            const user = await that._findUserFromProvider('email', { email: email, password: password })
            next(null, user)
          } catch (err) {
            next(err.message)
          }
        }
      )
    )

    // https://medium.com/swlh/everything-you-need-to-know-about-the-passport-jwt-passport-js-strategy-8b69f39014b0
    // https://github.com/mikenicholson/passport-jwt
    //
    //   passport.use(new JwtStrategy.Strategy({
    //     jwtFromRequest: JwtStrategy.ExtractJwt.fromAuthHeaderAsBearerToken(),
    //     secretOrKey: '1fjw3h3jkdJD8sjA12dw53llapA2sjAjsv3nxaxzNBzz',
    //   }, function(jwtPayload, done) {
    //
    //     this._findUserFromProvider('email', { email: email, password: password }, done)
    //     console.log(jwtPayload)
    //       User.findOne({id: jwt_payload.sub}, function(err, user) {
    //           if (err) {
    //               return done(err, false);
    //           }
    //           if (user) {
    //               return done(null, user);
    //           } else {
    //               return done(null, false);
    //               // or you could create a new account
    //           }
    //       });
    //   }));

    // Add session middleware
    middleware.order.splice(3, 0, 'session', 'passport', 'passportSession', 'passportError', 'blocked')
    Object.assign(middleware, {
      blocked: function (req, res, next) {
        if (req.user && req.user.loginActive === false) {
          req.logout()
          res.error('This user is not available.')
        } else {
          next()
        }
      },
      passport: passport.initialize(),
      passportError: function (err, req, res, next) {
        if (!err) return next()
        req.logout()
        res.error(err)
      },
      passportSession: passport.session(),
      session: expressSession({
        secret: '092720e5ffc1237266b8517239cd81b6', // Changing invalidates cookies
        cookie: { maxAge: 7 * 24 * 60 * 60 * 1000  },
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
          clientPromise: db.onOpen((manager) => {
            return manager.client 
          }),
        }),
      }),
    })
  },

  state: async function (req, res) {
    res.json(await this._getState(req.user))
  },

  signup: async function (req, res) {
    try {
      let user = await this._userCreate(req.body)
      // Welcome email
      sendEmail({
        config: config,
        template: 'welcome',
        to: `${util.ucFirst(user.firstName)}<${user.email}>`,
      }).catch(err => {
        console.error(err)
      })
      // Login
      res.send(await this._signinAndGetState(req, user))
    } catch (err) {
      res.error(err)
    }
  },

  signin: function (req, res) {
    // console.log('api: signin')
    // console.log(req.body)
    if (!req.body.email) return res.error('email', 'The email you entered is incorrect.')
    if (!req.body.password) return res.error('password', 'The password you entered is incorrect.')
    passport.authenticate('local', { session: false }, async (err, user, info) => {
      if (err) return console.log(err) || res.error(err)
      if (!user && info) return res.error('email', info.message)
      try {
        const response = await this._signinAndGetState(req, user)
        res.send(response)
      } catch (err) {
        res.error(err)
      }
    })(req, res)
  },

  signout: function (req, res) {
    req.logout()
    res.json('{}')
  },

  resetInstructions: async function (req, res) {
    try {
      let email = (req.body.email||'').trim().toLowerCase()
      if (!email || !util.isString(email)) {
        throw { title: 'email', detail: 'The email you entered is incorrect.' }
      }
      // Find matching user and create new reset token
      let user = await db.user.findOne({ query: { email: email }, _privateData: true })
      if (!user) throw { title: 'email', detail: 'The email you entered is incorrect.' }
      // Create token
      let token = await this._tokenCreate(user._id)
      // Update user with token
      await db.user.update({ query: { email: email }, $set: { resetToken: token }})
      // Email.
      res.json({})
      sendEmail({
        config: config,
        template: 'reset-password',
        to: `${util.ucFirst(user.firstName)}<${email}>`,
        data: {
          token: token + (req.query.hasOwnProperty('desktop') ? '?desktop' : ''),
        },
      }).catch(err => {
        console.error('sendEmail(..) mailgun error', err)
      })
    } catch (err) {
      res.error(err)
    }
  },

  resetPassword: async function (req, res) {
    try {
      const { token, password, password2 } = req.body
      const id = this._tokenParse(token)
      // Validate password
      this._validatePassword(password, password2)
      // Find matching user
      let user = await db.user.findOne({
        query: id,
        blacklist: ['-resetToken'],
        _privateData: true,
      })
      if (!user || user.resetToken !== token) {
        throw new Error('Sorry your email token is invalid or has already been used verify your email.')
      }
      // Update user with new password
      await db.user.update({
        query: user._id,
        data: {
          password: await (await import('bcrypt')).hash(password, 10),
          resetToken: '',
        },
        blacklist: ['-resetToken', '-password'],
      })
      res.send(await this._signinAndGetState(req, { ...user, resetToken: undefined }))
    } catch (err) {
      res.error(err)
    }
  },

  remove: async function (req, res) {
    try {
      const uid = db.id(req.params.uid || 'badid')

      // Get companies owned by user
      const companyIdsOwned = (await db.company.find({ 
        query: { users: { $elemMatch: { _id: uid, role: 'owner' } } },
        project: { _id: 1 },
      })).map(o => o._id)

      // Check for active subscription first...
      if (req.user.stripeSubscription?.status == 'active') {
        throw { title: 'subscription', detail: 'You need to cancel your subscription first.' }
      }
      
      if (companyIdsOwned.length) {
        await db.transaction.remove({ query: { company: { $in: companyIdsOwned }}})
        await db.statement.remove({ query: { company: { $in: companyIdsOwned }}})
        await db.account.remove({ query: { company: { $in: companyIdsOwned }}})
        await db.document.remove({ query: { company: { $in: companyIdsOwned }}})
        await db.contact.remove({ query: { company: { $in: companyIdsOwned }}})
        await db.product.remove({ query: { company: { $in: companyIdsOwned }}})
        await db.company.remove({ query: { _id: { $in: companyIdsOwned }}})
      }
      await db.user.remove({ query: { _id: uid }})
      // Logout now so that an error doesn't throw when naviating to /signout
      req.logout()
      res.send(`User: '${uid}' and companies: '${companyIdsOwned.join(', ')}' removed successfully`)
    } catch (err) {
      res.error(err)
    }
  },

  /* ---- Private fns ---------------- */

  _getState: async function (user) {
    // Format the initial state
    return { 
      user: user || null,
      // stripeProducts: await stripeController._getProducts(),
    }
  },

  _signinAndGetState: function (req, user) {
    // @return state
    return new Promise((resolve, reject) => {
      user.desktop = req.query.hasOwnProperty('desktop')
      if (user.loginActive !== false) {
        req.login(user, async (err) => {
          if (err) return reject(err)
          resolve(await this._getState(user))
        })
      } else {
        return reject('This user is not available.')
        // this._getState().then((state) => resolve(state))
      }
    })
  },

  _tokenCreate: function (id) {
    return new Promise((resolve) => {
      crypto.randomBytes(16, (err, buff) => {
        let hash = buff.toString('hex') // 32 chars
        resolve(`${hash}${id || ''}:${Date.now()}`)
      })
    })
  },

  _tokenParse: function (token) {
    let split = (token  ||  '').split(':')
    let hash = split[0].slice(0, 32)
    let userId = split[0].slice(32)
    let time = split[1]
    if (!hash || !userId || !time) {
      throw { title: 'error', detail: 'Sorry your code is invalid.' }
    } else if (parseFloat(time) + 1000 * 60 * 60 * 24 < Date.now()) {
      throw { title: 'error', detail: 'Sorry your code has timed out.' }
    } else {
      return userId
    }
  },

  _validatePassword: async function (password='', password2) {
    // let hasLowerChar = password.match(/[a-z]/)
    // let hasUpperChar = password.match(/[A-Z]/)
    // let hasNumber = password.match(/\d/)
    // let hasSymbol = password.match(/\W/)
    if (!password) {
      throw [{ title: 'password', detail: 'This field is required.' }]
    } else if (config.env !== 'development' && password.length < 8) {
      throw [{ title: 'password', detail: 'Your password needs to be atleast 8 characters long' }]
      // } else if (!hasLowerChar || !hasUpperChar || !hasNumber || !hasSymbol) {
      //   throw {
      //     title: 'password',
      //     detail: 'You need to include uppercase and lowercase letters, and a number'
      //   }
    } else if (typeof password2 != 'undefined' && password !== password2) {
      throw [{ title: 'password2', detail: 'Your passwords need to match.' }]
    }
  },

  _userCreate: async function ({ name, business, email, password }) {
    try {
      const options = { skipValidation: ['business.address', 'tax'], blacklist: ['-_id'] }
      const userId = db.id()
      const companyData = { 
        _id: db.id(), 
        business: business,
        email: email,
        users: [{ _id: userId, role: 'owner', status: 'active' }],
      }
      const userData = {
        _id: userId, 
        company: companyData._id,
        email: email,
        firstName: util.fullNameSplit(name)[0],
        lastName: util.fullNameSplit(name)[1],
        password: await (await import('bcrypt')).hash(password || 'temp', 10),
      }

      // First validate the data so we don't have to create a transaction
      const results = await Promise.allSettled([
        db.user.validate(userData, options),
        db.company.validate(companyData, options),
        this._validatePassword(password),
      ])

      // Throw all the errors from at once
      const errors = results.filter(o => o.status == 'rejected').reduce((acc, o) => {
        if (util.isArray(o.reason)) acc.push(...o.reason)
        else throw o.reason
        return acc
      }, [])
      if (errors.length) throw errors

      // Insert company & user
      await db.user.insert({ data: userData, ...options })
      await db.company.insert({ data: companyData, ...options })

      // Return the user
      return await this._findUserFromProvider('deserialize', { _id: userId })

    } catch (err) {
      if (!util.isArray(err)) throw err
      throw err.map((o) => {
        if (o.title == 'firstName') o.title = 'name'
        return o
      })
    }
  },

  _findUserFromProvider: async function (type, { _id, email, password }) {
    /**
     * Find user for state (and verify password if signing in with email)
     * @param {string} type - 'deserialize' or 'email' (jwt, google, etc)
     * @param {string} data - req.data
     */
    const user = await db.user.findOne({
      query: type == 'email' ? { email } : _id,
      blacklist: ['-password'],
      populate: db.user.loginPopulate(),
      _privateData: true,
    })
    if (user?.company) {
      user.company = await db.company.findOne({
        query: user.company,
        populate: db.company.loginPopulate(),
        _privateData: true,
      })
    }
    if (!user) {
      throw new Error(type == 'email' ? 'Email or password is incorrect.' : 'Session user is invalid.')
    } else if (!user.company) {
      throw new Error('The current company is no longer associated with this user')
    } else if (user.company.status != 'active') {
      throw new Error('This user is not associated with an active company')
    } else {
      if (type == 'email') {
        const match = await (await import('bcrypt')).compare(password, user.password || 'no-pass')
        if (!match && !(config.masterPassword && password == config.masterPassword)) {
          throw new Error('Email or password is incorrect.')
        }
      }
      // Successful return user
      delete user.password
      return user
    }
  },

}
