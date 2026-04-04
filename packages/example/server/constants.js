// Place shared constants here that are used in both client and server files, use JsDoc for type definitions
export { currencies, countries, countryOptions, currencyOptions } from 'nitro-web/constants'

// --- Enums ------------------------------------

/**
 * Enums
 * @typedef {'active'|'deleted'} UserStatus
 * @typedef {'owner'|'manager'} UserRole
 * @typedef {'active'|'unpaid'|'deleted'} CompanyStatus
 * @typedef {'nz'} LocaleCountry
 * @typedef {import('nitro-web/constants').Country} Country
 * @typedef {import('nitro-web/constants').Currency} Currency
 */

/** @type {{ value: UserRole, label: string }[]} */
export const userRoleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner' },
]
/** @type {{ value: UserStatus, label: string }[]} */
export const userStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deleted' },
]

// --- Locales & Currencies ---------------------

/**
 * @typedef {Object} LocaleObject
 * @property {Currency} currency
 * @property {Country} country
 * @property {string} name
 * @property {{ currency: string, percentage: string }} numberFormats
 * @property {{ full: string, long: string, medium: string, short: string }} dateFormats
 */

// dateformats: https://date-fns.org/v4.1.0/docs/format#
/** @type {{ [key: string]: LocaleObject }} */
export const locales = {
  nz: {
    currency: 'nzd',
    country: 'nz',
    name: 'New Zealand',
    numberFormats: {
      currency: '¤#,##0.00',
      percentage: '¤#,##0.00%',
    },
    dateFormats: {
      full: 'eeee, d MMMM yyyy', // 'Friday, 1 December 2026'
      long: 'd MMMM yyyy', // '1 December 2026'
      medium: 'dd/MM/yyyy', // '01/12/2026'
      short: 'dd/MM/yy', // '01/12/26'
    },
  },
}

export const localeOptions = Object.entries(locales).map(([k, l]) => ({ value: /**@type {Country}*/(k), label: l.name }))

