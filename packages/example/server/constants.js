/**
 * @typedef {import('types').Role} Role
 */

/**
 * @typedef {Object} Country
 * @property {string} currency
 * @property {string} name
 * @property {{ currency: string, percentage: string }} numberFormats
 * @property {{ full: string, long: string, medium: string, short: string }} dateFormats
 */

/** @type {{ value: Role, label: string }[]} */
export const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
]

/** @type {{ [key: string]: Country }} */
// dateformats: https://date-fns.org/v4.1.0/docs/format#
export const countries = {
  nz: {
    currency: 'nzd',
    name: 'New Zealand',
    numberFormats: {
      currency: '¤#,##0.00',
      percentage: '¤#,##0.00%',
    },
    dateFormats: {
      full: 'eeee, d MMMM yyyy', // 'Friday, 1 December 2026' (was 'dddd, D MMMM YYYY') 
      long: 'd MMMM yyyy', // '1 December 2026' (was 'D MMMM YYYY') 
      medium: 'dd/MM/yyyy', // '01/12/2026' (was 'D/MM/YYYY') 
      short: 'dd/MM/yy', // '01/12/26' (was 'D/MM/YY') 
    },
  },
  au: {
    currency: 'aud',
    name: 'Australia',
    numberFormats: {
      currency: '¤#,##0.00',
      percentage: '¤#,##0.00%',
    },
    dateFormats: {
      full: 'eeee, d MMMM yyyy', // 'Friday, 26 January 2026' (was 'dddd, D MMMM YYYY') 
      long: 'd MMMM yyyy', // '26 January 2026' (was 'D MMMM YYYY') 
      medium: 'dd/MM/yyyy', // '26/01/2026' (was 'D/MM/YYYY') 
      short: 'dd/MM/yy', // '26/01/26' (was 'D/MM/YY') 
    },
  },
}

/** @type {{ [key: string]: { name: string, symbol: string, digits: number } }} */
export const currencies = {
  nzd: { name: 'New Zealand Dollar', symbol: '$', digits: 2 },
  aud: { name: 'Australian Dollar', symbol: '$', digits: 2 },
  usd: { name: 'United States Dollar', symbol: '$', digits: 2 },
  btc: { name: 'Bitcoin', symbol: '₿', digits: 8 },
  aed: { name: 'UAE Dirham', symbol: 'د.إ', digits: 2 },
  ars: { name: 'Argentine Peso', symbol: '$', digits: 2 },
  bdt: { name: 'Bangladeshi Taka', symbol: '৳', digits: 2 },
  bhd: { name: 'Bahraini Dinar', symbol: '.د.ب', digits: 3 },
  brl: { name: 'Brazilian Real', symbol: 'R$', digits: 2 },
  cad: { name: 'Canadian Dollar', symbol: '$', digits: 2 },
  chf: { name: 'Swiss Franc', symbol: 'Fr', digits: 2 },
  clp: { name: 'Chilean Peso', symbol: '$', digits: 0 },
  cny: { name: 'Chinese Yuan', symbol: '¥', digits: 2 },
  cop: { name: 'Colombian Peso', symbol: '$', digits: 2 },
  czk: { name: 'Czech Koruna', symbol: 'Kč', digits: 2 },
  dkk: { name: 'Danish Krone', symbol: 'kr', digits: 2 },
  egp: { name: 'Egyptian Pound', symbol: '£', digits: 2 },
  eur: { name: 'Euro', symbol: '€', digits: 2 },
  gbp: { name: 'Great Britain Pound', symbol: '£', digits: 2 },
  hkd: { name: 'Hong Kong Dollar', symbol: '$', digits: 2 },
  huf: { name: 'Hungarian Forint', symbol: 'Ft', digits: 0 },
  idr: { name: 'Indonesian Rupiah', symbol: 'Rp', digits: 0 },
  ils: { name: 'Israeli Shekel', symbol: '₪', digits: 2 },
  inr: { name: 'Indian Rupee', symbol: '₹', digits: 2 },
  jod: { name: 'Jordanian Dinar', symbol: 'د.ا', digits: 3 },
  jpy: { name: 'Japanese Yen', symbol: '¥', digits: 0 },
  kes: { name: 'Kenyan Shilling', symbol: 'Sh', digits: 2 },
  krw: { name: 'South Korean Won', symbol: '₩', digits: 0 },
  kwd: { name: 'Kuwaiti Dinar', symbol: 'د.ك', digits: 3 },
  lkr: { name: 'Sri Lankan Rupee', symbol: 'Rs', digits: 2 },
  mad: { name: 'Moroccan Dirham', symbol: 'د.م.', digits: 2 },
  mxn: { name: 'Mexican Peso', symbol: '$', digits: 2 },
  myr: { name: 'Malaysian Ringgit', symbol: 'RM', digits: 2 },
  ngn: { name: 'Nigerian Naira', symbol: '₦', digits: 2 },
  nok: { name: 'Norwegian Krone', symbol: 'kr', digits: 2 },
  omr: { name: 'Omani Rial', symbol: '﷼', digits: 3 },
  pen: { name: 'Peruvian Sol', symbol: 'S/', digits: 2 },
  php: { name: 'Philippine Peso', symbol: '₱', digits: 2 },
  pkt: { name: 'Pakistani Rupee', symbol: '₨', digits: 2 },
  pln: { name: 'Polish Zloty', symbol: 'zł', digits: 2 },
  qar: { name: 'Qatari Riyal', symbol: '﷼', digits: 2 },
  ron: { name: 'Romanian Leu', symbol: 'lei', digits: 2 },
  rub: { name: 'Russian Ruble', symbol: '₽', digits: 2 },
  sar: { name: 'Saudi Riyal', symbol: '﷼', digits: 2 },
  sek: { name: 'Swedish Krona', symbol: 'kr', digits: 2 },
  sgd: { name: 'Singapore Dollar', symbol: '$', digits: 2 },
  thb: { name: 'Thai Baht', symbol: '฿', digits: 2 },
  try: { name: 'Turkish Lira', symbol: '₺', digits: 2 },
  twd: { name: 'New Taiwan Dollar', symbol: 'NT$', digits: 2 },
  uah: { name: 'Ukrainian Hryvnia', symbol: '₴', digits: 2 },
  vnd: { name: 'Vietnamese Dong', symbol: '₫', digits: 0 },
  zar: { name: 'South African Rand', symbol: 'R', digits: 2 },
}
