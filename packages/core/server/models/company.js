// @ts-nocheck
import { addressSchema, fullName } from 'nitro-web/util'

export default {

  fields: {
    business: {
      address: addressSchema(),
      country: { type: 'string', default: 'nz', required: true },
      currency: { type: 'string', default: 'nzd', required: true },
      name: { type: 'string', required: true, index: 'text' },
      number: { type: 'string' },
      phone: { type: 'string' },
      website: { type: 'string', isURL: true },
    },
    status: { type: 'string', default: 'active', enum: ['active', 'unpaid', 'deleted'], required: true },
    users: [{
      _id: { model: 'user', required: true },
      role: { type: 'string', enum: ['owner', 'manager'], required: true },
      status: { type: 'string', default: 'active', enum: ['active', 'deleted'], required: true },
    }],
    invites: [{
      email: { type: 'email', required: true },
      role: { type: 'string', enum: ['owner', 'manager'], required: true },
      inviteToken: { type: 'string', required: true },
    }],
  },

  findBL: ['invites.token'],
  updateBL: ['status', 'users'],

  afterFind: [
    async function (data) {
      if (!data) return
      // Merge expanded users into users
      if (data.usersExpanded) {
        for (let i=data.users.length; i--;) {
          const user = data.users[i]
          const userExpanded = data.usersExpanded.find(o => String(o._id) == String(user._id))
          if (userExpanded) Object.assign(user, { ...userExpanded, name: fullName(userExpanded) })
        }
        delete data.usersExpanded
      }
    },
  ],

  methods: {
    publicData: function(models) {
      return models
    },
    loginPopulate: function() {
      // return the company with expanded company.users
      return [
        {
          as: 'usersExpanded',
          from: 'user',
          let: { users: '$users' }, // company.users
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$users._id'] },
              },
            },
            {
              $project: {
                'createdAt': 1,
                'email': 1,
                'firstName': 1,
                'lastName': 1,
                'avatar': 1,
              },
            },
          ],
        },
      ]
    },
  },
}
