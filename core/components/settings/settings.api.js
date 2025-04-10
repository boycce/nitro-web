// @ts-nocheck
import db from 'monastery'

export default {

  routes: {
    'put  /api/company/:cid': ['isCompanyUser', 'update'],
    'put  /api/user/:uid': ['isUser', 'updateUser'],
  },

  update: async function(req, res) {
    try {
      const update = await db.company.update({
        query: req.params.cid,
        data: req.body,
        files: req.query.files ? req.files : undefined,
      })
      if (!update) {
        throw new Error('Coudln\'t find the company to update')
      }
      const company = await db.company.findOne({
        query: req.params.cid,
        populate: db.company.loginPopulate(),
        _privateData: true,
      })
      res.json(company)

    } catch (errs) {
      res.error(errs)
    }
  },

  updateUser: async function(req, res) {
    try {
      const update = await db.user.update({
        query: req.params.uid,
        data: req.body,
        files: req.query.files ? req.files : undefined,
      })
      if (!update) {
        throw new Error('Coudln\'t find the user to update')
      }
      const user = await db.user.findOne({
        query: req.params.uid,
        _privateData: true,
        blacklist: ['company'], // don't return the company id
      })
      res.json(user)

    } catch (errs) {
      res.error(errs)
    }
  },

}
