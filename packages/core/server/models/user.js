// @ts-nocheck
import { ucFirst, fullName } from 'nitro-web/util'

export default {

  fields: {
    avatar: { type: 'image' },
    company: { model: 'company', required: true }, // AKA "active company"
    email: { type: 'email', required: true, index: 'unique' },
    isAdmin: { type: 'boolean', default: false },
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true },
    stripeCustomer: { type: 'any' },
    stripeSubscription: { type: 'any' },
    stripeIntents: { type: 'any' },
    usedFreeTrial: { type: 'boolean', default: false },
    // hidden fields
    password: { type: 'string', minLength: 6 },
    resetToken: { type: 'string' },
    // If single tenancy application
    // status: { type: 'string', default: 'active', enum: ['active', 'deleted'] },
    // isInvited: { type: 'boolean' }
    // inviteToken: { type: 'string' },
  },

  findBL: ['password', 'inviteToken', 'resetToken'],
  updateBL: ['password', 'inviteToken', 'resetToken', 'company', 'status', 'stripeSubscription', 'isAdmin', 'usedFreeTrial'],

  messages: {
    lastName: {
      required: 'A full name is required',
    },
  },

  beforeValidate: [
    async function (data) {
      if (data.email) data.email = data.email.trim().toLowerCase()
      if (data.firstName) data.firstName = ucFirst(data.firstName)
      if (data.lastName) data.lastName = ucFirst(data.lastName)
    },
  ],

  afterFind: [
    async function (data) {
      if (!data) return data
      data.name = fullName(data)
    },
  ],

  methods: {
    loginPopulate: function() {
      return []
    },
  },

}
