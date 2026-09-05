// Mock employees, used by employees.api.js and as the client-only fallback (npm run dev:client-only)
/** @typedef {import('types').Employee} Employee */
/** @typedef {import('types').Role} Role */

/** @type {Role[]} */
export const mockRoles = [
  { _id: 'exec', name: 'Executive' },
  { _id: 'eng', name: 'Engineer' },
  { _id: 'butler', name: 'Butler' },
  { _id: 'consult', name: 'Consultant' },
]

/** @type {Employee[]} */
export const mockEmployees = Array.from({ length: 41 }, (_, i) => {
  const name = ['Bruce Wayne', 'Lucius Fox', 'Alfred Pennyworth', 'Selina Kyle'][i % 4]
  return {
    _id: String(i + 1),
    name: `${name} ${i + 1}`,
    email: `${name.toLowerCase().replace(' ', '.')}${i + 1}@wayneenterprises.com`,
    role: mockRoles[i % 4]._id,
    startedAt: Date.now() - i * 86400000 * 30,
  }
})

/**
 * Slice a page of rows, 1-based
 * @template T
 * @param {T[]} rows
 * @param {number} perPage
 * @param {string|number} [page]
 * @returns {T[]}
 */
export function pageOf(rows, perPage, page) {
  const p = parseInt(String(page || 1))
  return rows.slice((p - 1) * perPage, p * perPage)
}
