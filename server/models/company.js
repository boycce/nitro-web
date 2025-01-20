import { addressSchema, fullName } from '../../util.js'

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
    status: { type: 'string', default: 'active', enum: ['active', 'unpaid', 'deleted'] },
    users: [{
      _id: { model: 'user' },
      role: { type: 'string', enum: ['owner', 'manager', 'accountant'] },
      status: { type: 'string', required: true, enum: ['invited', 'active', 'deleted'] },
      inviteEmail: { type: 'string' },
      inviteToken: { type: 'string' },
    }],
  },

  findBL: ['users.inviteToken'],
  updateBL: ['status', 'users'],

  afterFind: [
    async function (data) {
      if (!data) return
      // Merge expanded users into users
      if (data.usersExpanded) {
        for (let i=data.users.length; i--;) {
          const user = data.users[i]
          const userExpanded = data.usersExpanded.find(o => String(o._id) == String(user._id))
          // console.log(userExpanded)
          if (user.inviteEmail) user.email = user.inviteEmail
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
