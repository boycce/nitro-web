// @ts-nocheck
import { ucFirst, fullName } from 'nitro-web/util'

export default {

  fields: {
    avatar: { type: 'image' },
    company: { model: 'company', required: true },
    email: { type: 'email', required: true, index: 'unique' },
    firstName: { type: 'string', required: true },
    lastName: { type: 'string' },
    password: { type: 'string', minLength: 6 },
    resetToken: { type: 'string' },
    status: { type: 'string', default: 'active', enum: ['active', 'deleted', 'inactive'] },
    stripeCustomer: { type: 'any' },
    stripeSubscription: { type: 'any' },
    stripeIntents: { type: 'any' },
    type: { type: 'string', default: 'user', enum: ['user', 'admin'] },
    usedFreeTrial: { type: 'boolean', default: false },
  },

  findBL: ['password', 'resetToken'],
  updateBL: ['company', 'password', 'resetToken', 'status', 'stripeSubscription', 'type', 'usedFreeTrial'],

  beforeValidate: [
    async function (data) {
      if (data.email) data.email = data.email.trim().toLowerCase()
      if (data.firstName) data.firstName = ucFirst(data.firstName)
      if (data.lastName) data.lastName = ucFirst(data.lastName)
    },
  ],

  afterFind: [
    async function (data) {
      if (!data) return
      data.name = fullName(data)
    },
  ],

  methods: {
    loginPopulate: function() {
      return []
    },
  },

}
