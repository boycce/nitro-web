// @ts-nocheck
import { perPage } from '../../server/constants.js'
import { mockEmployees, mockRoles, pageOf } from './employees.mock.js'

export const routes = {
  'get /api/employees': [/*'isUser',*/ getEmployees],
  'get /api/employees/roles': [/*'isUser',*/ getRoles],
}

function getEmployees(req, res) {
  res.json({ rows: pageOf(mockEmployees, perPage, req.query.page), total: mockEmployees.length })
}

function getRoles(req, res) {
  res.json({ rows: mockRoles, total: mockRoles.length })
}
