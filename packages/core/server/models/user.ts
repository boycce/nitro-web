// @ts-nocheck
import { ucFirst, fullName } from 'nitro-web/util'

export default {

  fields: {
    avatar: { type: 'image' },
    company: { model: 'company', required: true },
    email: { type: 'email', required: true, index: 'unique' },
    isInvited: { type: 'boolean' },
    firstName: { type: 'string', required: true },
    lastName: { type: 'string', required: true },
    status: { type: 'string', default: 'active', enum: ['active', 'deleted', 'inactive'] },
    stripeCustomer: { type: 'any' },
    stripeSubscription: { type: 'any' },
    stripeIntents: { type: 'any' },
    type: { type: 'string', default: 'user', enum: ['user', 'admin'] },
    usedFreeTrial: { type: 'boolean', default: false },
    // hidden fields
    password: { type: 'string', minLength: 6 },
    inviteToken: { type: 'string' },
    resetToken: { type: 'string' },
  },

  findBL: ['password', 'inviteToken', 'resetToken'],
  updateBL: ['password', 'inviteToken', 'resetToken', 'company', 'status', 'stripeSubscription', 'type', 'usedFreeTrial'],

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
