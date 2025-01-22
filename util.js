import _axios from '@hokify/axios'
import axiosRetry from 'axios-retry'
import dateformat from 'dateformat'
import { loadStripe } from '@stripe/stripe-js/pure.js' // pure removes ping
export const dateFormat = dateformat

export function addressSchema () {
  // Google autocomplete should return the following object
  function arrayWithSchema (array, schema) {
    array.schema = schema
    return array
  }
  return {
    city: { type: 'string' },
    country: { type: 'string', default: 'New Zealand' },
    full: { type: 'string', index: 'text' },
    line1: { type: 'string' },
    line2: { type: 'string' },
    number: { type: 'string' },
    postcode: { type: 'string' },
    suburb: { type: 'string' },
    unit: { type: 'string' },
    // Google places viewport
    area: {
      bottomLeft: [{ type: 'number' }], // lng, lat
      topRight: [{ type: 'number' }], // lng, lat
    },
    location: {
      index: '2dsphere',
      type: { type: 'string', default: 'Point' },
      coordinates: arrayWithSchema(
        [{ type: 'number' }], // lng, lat
        { minLength: 2 }
      ),
    },
  }
}

export function axios () {
  // Remove mobile specific protocol and subdomain
  const clientOrigin = window.document.location.origin.replace(/^(capacitor|https):\/\/(mobile\.)?/, 'https://')
  // axios configurations on the client
  if (!axios._axiosNonce && typeof window !== 'undefined') {
    axios._axiosNonce = true
    _axios.defaults.baseURL = clientOrigin
    _axios.defaults.headers.desktop = true
    _axios.defaults.withCredentials = true
    _axios.defaults.timeout = 60000
    axiosRetry(_axios, { retries: 0, retryDelay: (/*i*/) => 300 })
  }
  return _axios
}

export function buildUrl (url, parameters) {
  /**
   * Builds the url with params
   * @param {string} url - String url
   * @param {object} parameters - Key value parameters
   */
  const params = Object.keys(parameters).map((p) => `${encodeURIComponent(p)}=${encodeURIComponent(parameters[p])}`)
  return [url, params.join('&')].join('?')
}

export function camelCase (str, capitaliseFirst, allowNumber) {
  let regex = (capitaliseFirst ? '(?:^[a-z0-9]|' : '(?:') + '[-]+[a-z0-9])'
  return str
    .toString()
    .toLowerCase()
    .replace(allowNumber ? /^[^a-zA-Z0-9]+/ : /^[^a-zA-Z]+/, '') // Allow only letters at start.
    .replace(/(_|\s|\()+/g, '-') // Underscores, spaces, and curly braces to -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/[^a-zA-Z0-9-_]+/g, '') // Remove bad characters.
    .replace(/-+$/, '') // Remove trailing -
    .replace(new RegExp(regex, 'g'), function(match) {
      return match.toUpperCase().replace(/[-]+/g, '')
    })
}

export function camelCaseToTitle (str, captialiseFirstOnly) {
  str = str.replace(/([A-Z]+)/g, ' $1').trim()
  if (captialiseFirstOnly) str = str.toLowerCase()
  return ucFirst(str)
}

export function camelCaseToHypen (str) {
  return str.replace(/[A-Z]|[0-9]+/g, m => '-' + m.toLowerCase())
}

export function capitalise (str) {
  return (str||'').replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
}

export function currency (cents, decimals=2, decimalsMinimum) {
  // Returns a formated currency string
  const num = Number(cents / 100)
  if (!isNumber(num)) return '$0.00'
  return '$' + num.toLocaleString(undefined, {
    minimumFractionDigits: typeof decimalsMinimum == 'undefined' ? decimals : decimalsMinimum,
    maximumFractionDigits: decimals,
  })
}

export function currencyToCents (currency) {
  // Converts '$1,234.00' to '1234.00', then to '123400'
  let currencyString = Number(currency.replace(/[^0-9.]/g, '')).toFixed(2)
  return currencyString.replace(/\./g, '')
}

export function date (date, format, timezone) {
  /**
   * Returns a formatted date
   * @param {number|Date} date - number can be in seconds or milliseconds (UTC)
   * @param {string} format - e.g. "dd mmmm yy" (https://github.com/felixge/node-dateformat#mask-options)
   * @param {string} timezone - convert a UTC date to a particular timezone.
   *
   * Note on the timezone conversion:
   * Timezone conversion relies on parsing the toLocaleString result, e.g. 4/10/2012, 5:10:30 PM.
   * A older browser may not accept en-US formatted date string to its Date constructor, and it may
   * return unexpected result (it may ignore daylight saving).
   */
  if (!date || (!isNumber(date) && !isDate(date))) return 'Date?'
  else if (isNumber(date) && date < 9999999999) var milliseconds = date * 1000
  else if (isObject(date)) milliseconds = date.getTime()
  else milliseconds = date
  if (timezone) {
    milliseconds = new Date(new Date(milliseconds).toLocaleString('en-US', { timeZone: timezone })).getTime()
  }
  return dateFormat(milliseconds, format || 'dS mmmm')
}

export function debounce (func, wait, options) {
  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked.
   * @param {function} func
   * @param {number} <wait=0> - number of milliseconds to delay
   * @param {boolean} <options.leading=false> - invoke on the leading edge of the timeout
   * @param {number} <options.maxWait> - maximum time `func` is allowed to be delayed before it's invoked
   * @param {boolean} <options.trailing=true> - invoke on the trailing edge of the timeout
   * @returns {Function}
   * @see lodash
   */
  var lastArgs,
    lastThis,
    maxWait,
    result,
    timerId,
    lastCallTime,
    lastInvokeTime = 0,
    leading = false,
    maxing = false,
    trailing = true

  wait = typeof wait == 'number'? wait : 0
  if (isObject(options)) {
    leading = !!options.leading
    maxing = 'maxWait' in options
    maxWait = maxing ? Math.max(typeof options.maxWait == 'number'? options.maxWait : 0, wait) : maxWait
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }

  function invokeFunc(time) {
    var args = lastArgs
    var thisArg = lastThis
    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
      timeSinceLastInvoke = time - lastInvokeTime,
      timeWaiting = wait - timeSinceLastCall
    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
      timeSinceLastInvoke = time - lastInvokeTime
    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
  }

  function timerExpired() {
    var time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time) {
    timerId = undefined
    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = undefined
    return result
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timerId = undefined
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now())
  }

  function debounced() {
    var time = Date.now(),
      isInvoking = shouldInvoke(time)

    lastArgs = arguments
    lastThis = this // eslint-disable-line
    lastCallTime = time

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime)
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        clearTimeout(timerId)
        timerId = setTimeout(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait)
    }
    return result
  }
  debounced.cancel = cancel
  debounced.flush = flush
  return debounced
}

export function deepCopy (obj) {
  // Deep clones an object
  if (!obj) return obj
  let obj2 = Array.isArray(obj) ? [] : {}
  for (let key in obj) {
    let v = obj[key]
    obj2[key] = typeof v === 'object' && !isHex24(v) ? deepCopy(v) : v
  }
  return obj2
}

export function deepFind (obj, path) {
  // Returns a nested value from a path URI e.g. owner.houses.0.color
  if (!obj) return undefined
  let last
  let chunks = (path || '').split('.')
  let target = obj
  for (let i = 0, l = chunks.length; i < l; i++) {
    last = l === i + 1
    if (!last && !target[chunks[i]]) break
    else target = target[chunks[i]]
  }
  return last ? target : undefined
}

export function deepSave (obj, path, value) {
  /**
   * Save a deeply nested value without mutating original object
   * @param {object} obj
   * @param {string} path
   * @param {value|function(current-value) value - pass a function to access the current value
   * @return new object
   */
  if (isArray(obj)) obj = [...obj]
  else if (isObject(obj)) obj = {...obj}
  else return undefined

  let chunks = (path || '').split('.')
  let target = obj
  for (let i = 0, l = chunks.length; i < l; i++) {
    if (l === i + 1) { // Last
      target[chunks[i]] = isFunction(value) ? value(target[chunks[i]]) : value
      // console.log(target)
    } else {
      let isArray = chunks[i + 1].match(/^[0-9]+$/)
      let parentCopy = isArray ? [...(target[chunks[i]] || [])] : { ...(target[chunks[i]] || {}) }
      target = target[chunks[i]] = parentCopy
    }
  }
  return obj
}

export function each (obj, iteratee, context) {
  // Similar to the underscore.each method
  const shallowLen = obj == null ? void 0 : obj['length']
  const isArrayLike = typeof shallowLen == 'number' && shallowLen >= 0
  if (isArrayLike) {
    for (let i = 0, l = obj.length; i < l; i++) {
      iteratee.call(context || null, obj[i], i, obj)
    }
  } else {
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      iteratee.call(context || null, obj[key], key, obj)
    }
  }
  return obj
}

export function fileDownload (data, filename, mime, bom) {
  // @link https://github.com/kennethjiang/js-file-download
  let blobData = (typeof bom !== 'undefined') ? [bom, data] : [data]
  let blob = new Blob(blobData, {type: mime || 'application/octet-stream'})

  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    window.navigator.msSaveBlob(blob, filename)
  } else {
    let blobURL = (window.URL && window.URL.createObjectURL)
      ? window.URL.createObjectURL(blob)
      : window.webkitURL.createObjectURL(blob)
    let tempLink = document.createElement('a')
    tempLink.style.display = 'none'
    tempLink.href = blobURL
    tempLink.setAttribute('download', filename)
    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank')
    }
    document.body.appendChild(tempLink)
    tempLink.click()

    // Fixes "webkit blob resource error 1"
    setTimeout(function() {
      document.body.removeChild(tempLink)
      window.URL.revokeObjectURL(blobURL)
    }, 200)
  }
}

export function formatName (string, ignoreHyphen) {
  return ignoreHyphen
    ? ucFirst(string.toString().trim())
    : ucFirst(string.toString().trim().replace('-', ' '))
}

export function formatSlug (string) {
  return string
    .toString()
    .toLowerCase()
    .replace(/^[^a-zA-Z]+/, '') // Allow only letters at start.
    .replace(/\s+/g, '-') // Spaces to -
    .replace(/[^a-zA-Z0-9-_]+/g, '') // Remove bad characters.
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/-+$/, '') // Remove trailing -
}

export function formData (obj, cfg, fd, pre) {
  /**
   * Serializes objects to FormData instances
   * @param {object} obj
   * @param {object} cfg - config, e.g. { allowEmptyArrays: true, indices: true }
   * @link https://github.com/therealparmesh/object-to-formdata
   */
  const isUndefined = (value) => value === undefined
  const isNull = (value) => value === null
  const isBoolean = (value) => typeof value === 'boolean'
  const isObject = (value) => value === Object(value)
  const isArray = (value) => Array.isArray(value)
  const isDate = (value) => value instanceof Date

  const isBlob = (value) =>
    value && typeof value.size === 'number' && typeof value.type === 'string' && typeof value.slice === 'function'

  const isFile = (value) =>
    isBlob(value) &&
    typeof value.name === 'string' &&
    (typeof value.lastModifiedDate === 'object' || typeof value.lastModified === 'number')

  const serialize = (obj, cfg, fd, pre) => {
    cfg = cfg || {}
    cfg.indices = isUndefined(cfg.indices) ? false : cfg.indices
    cfg.nullsAsUndefineds = isUndefined(cfg.nullsAsUndefineds) ? false : cfg.nullsAsUndefineds
    cfg.booleansAsIntegers = isUndefined(cfg.booleansAsIntegers) ? false : cfg.booleansAsIntegers
    cfg.allowEmptyArrays = isUndefined(cfg.allowEmptyArrays) ? false : cfg.allowEmptyArrays
    fd = fd || new FormData()

    if (isUndefined(obj)) {
      return fd
    } else if (isNull(obj)) {
      if (!cfg.nullsAsUndefineds) {
        fd.append(pre, '')
      }
    } else if (isBoolean(obj)) {
      if (cfg.booleansAsIntegers) {
        fd.append(pre, obj ? 1 : 0)
      } else {
        fd.append(pre, obj)
      }
    } else if (isArray(obj)) {
      if (obj.length) {
        obj.forEach((value, index) => {
          const key = pre + '[' + (cfg.indices ? index : '') + ']'
          serialize(value, cfg, fd, key)
        })
      } else if (cfg.allowEmptyArrays) {
        fd.append(pre + '[]', '')
      }
    } else if (isDate(obj)) {
      fd.append(pre, obj.toISOString())
    } else if (isObject(obj) && !isFile(obj) && !isBlob(obj)) {
      Object.keys(obj).forEach((prop) => {
        const value = obj[prop]
        if (isArray(value)) {
          while (prop.length > 2 && prop.lastIndexOf('[]') === prop.length - 2) {
            prop = prop.substring(0, prop.length - 2)
          }
        }
        const key = pre ? pre + '[' + prop + ']' : prop
        serialize(value, cfg, fd, key)
      })
    } else {
      fd.append(pre, obj)
    }
    return fd
  }
  return serialize(obj, cfg, fd, pre)
}

export function fullName (object) {
  // Returns full name
  return ucFirst(object.firstName) + ' ' + ucFirst(object.lastName)
}

export function fullNameSplit (string) {
  // Returns [firstName, lastName]
  string = string.trim().replace(/\s+/, ' ')
  if (string.match(/\s/)) {
    return [string.substring(0, string.lastIndexOf(' ')), string.substring(string.lastIndexOf(' ') + 1)]
  } else {
    return [string, '']
  }
}

export function getCountryOptions (countries) {
  const output = []
  for (const iso in countries) {
    const name = countries[iso].name
    output.push({ value: iso, label: name, flag: iso.toUpperCase() })
  }
  return output
}

export function getCurrencyOptions (currencies) {
  const output = []
  for (const iso in currencies) {
    const name = currencies[iso].name
    output.push({ value: iso, label: name })
  }
  return output
}

export function getCurrencyPrefixWidth (prefix, paddingRight=0) {
  if (!prefix) return
  const span = document.createElement('span')
  span.classList.add('input-prefix')
  span.style.visibility = 'hidden'
  span.textContent = prefix
  document.body.appendChild(span)
  const width = span.offsetWidth + paddingRight
  document.body.removeChild(span)
  return width
}

export function getDirectories (path, pwd) {
  const _pwd = pwd || process.env.PWD
  return {
    clientDir: path.join(_pwd, process.env.clientDir || 'client', '/'),
    componentsDir: path.join(_pwd, process.env.componentsDir || 'components', '/'),
    distDir: path.join(_pwd, process.env.distDir || ((process.env.clientDir || 'client') + '/dist'), '/'),
    emailTemplateDir: path.join(_pwd, process.env.emailTemplateDir || 'server/email', '/'),
    fontsDir: path.join(_pwd, (process.env.clientDir || 'client'), 'fonts', '/'),
    imgsDir: path.join(_pwd, (process.env.clientDir || 'client'), 'imgs', '/'),
    tmpDir: path.join(_pwd, process.env.tmpDir || 'tmp', '/'),
  }
}

export function getLink (obj, query) {
  /**
   * @param {object} obj - new query object
   * @param {object} <query> - current query object, window.location.search used otherwise
   * @return {string}
   */
  let newQueryObj = {...(query||queryObject(window.location.search))}
  for (let key in obj) {
    if (!obj[key]) delete newQueryObj[key]
    else newQueryObj[key] = obj[key]
  }
  return queryString(newQueryObj) || '?'
}

export function getStripeClientPromise (stripePublishableKey) {
  return global.stripeClientPromise || (global.stripeClientPromise = loadStripe(stripePublishableKey))
}

export function getResponseErrors (errs) {
  // Axios response errors
  if (errs.response && errs.response.data && errs.response.data.errors) {
    var errors = errs.response.data.errors
  // Axios response error
  } else if (errs.response && errs.response.data && errs.response.data.error) {
    errors = [{ title: errs.response.data.error, detail: errs.response.data.error_description }]
  // Array
  } else if (isArray(errs)) {
    errors = errs
  // Error object
  } else if (errs.toJSON) {
    errors = [{ title: 'error', detail: errs.toJSON().message }]
  // String
  } else if (typeof errs === 'string') {
    errors = [{ title: 'error', detail: errs }]
  // Default error message
  } else {
    console.info('getResponseErrors(): ', errs)
    errors = [{ title: 'error', detail: 'Oops there was an error' }]
  }
  return errors
}

export function inArray (array, key, value) {
  /**
   * Property match inside an array of objects
   * (For a string/number value check just use [].includes(x))
   * @param {string} <key> - optional to match across on a colleciton of objects
   * @param {any} value
   */
  if (!array || typeof key == 'undefined') return false
  if (typeof value == 'undefined') return array.includes(key)
  for (let i = array.length; i--; ) {
    if (array[i] && array[i].hasOwnProperty(key) && array[i][key] == value) return array[i]
  }
  return false
}

export function isArray (variable) {
  return Array.isArray(variable)
}

export function isDate (variable) {
  return variable && typeof variable.getMonth === 'function'
}

export function isDefined (variable) {
  return typeof variable !== 'undefined'
}

export function isEmail (email) {
  // eslint-disable-next-line
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

export function isEmpty (obj, truthyValuesOnly) {
  // note req.files doesn't have a hasOwnProperty method
  if (obj === null || typeof obj === 'undefined') return true
  for (let prop in obj) {
    if (obj[prop] || (!truthyValuesOnly && obj.hasOwnProperty && obj.hasOwnProperty(prop))) return false
  }
  return true
}

export function isFunction (variable) {
  return typeof variable === 'function' ? true : false
}

export function isHex24 (value) {
  // Fast function to check if the length is exactly 24 and all characters are valid hexadecimal digits
  const str = (value||'').toString()
  if (str.length !== 24) return false
  else if (Array.isArray(value)) return false
  
  // Check if all characters are valid hexadecimal digits
  for (let i=24; i--;) {
    const charCode = str.charCodeAt(i)
    const isDigit = charCode >= 48 && charCode <= 57     // '0' to '9'
    const isLowerHex = charCode >= 97 && charCode <= 102 // 'a' to 'f'
    const isUpperHex = charCode >= 65 && charCode <= 70  // 'A' to 'F'
    if (!isDigit && !isLowerHex && !isUpperHex) {
      return false
    }
  }
  return true
}

export function isNumber (variable) {
  return !isNaN(parseFloat(variable)) && isFinite(variable)
}

export function isObject (variable) {
  // Excludes null and array's
  return variable !== null && typeof variable === 'object' && !(variable instanceof Array) ? true : false
}

export function isRegex (variable) {
  return variable instanceof RegExp ? true : false
}

export function isString (variable) {
  return typeof variable === 'string' || variable instanceof String ? true : false
}

export function lcFirst (string) {
  return string.charAt(0).toLowerCase() + string.slice(1)
}

export function maxLength (string, len, showEllipsis) {
  // Trims to a maximum length, and removes any partial words at the end
  len = len || 100
  if (!string) return ''
  if (string.length <= len) return string
  if (showEllipsis) len -= 3
  // trim the string to the maximum length
  var trimmed = string.substr(0, len || 100)
  // re-trim if we are in the middle of a word
  return trimmed.substr(0, Math.min(trimmed.length, trimmed.lastIndexOf(' ')))
    + (showEllipsis ? '...' : '')
}

export function mongoAddKmsToBox (km, bottomLeft, topRight) {
  /**
   * Expands a mongodb lat/lng box in kms
   * @param  {number} km
   * @param  {Array[lng, lat]|Box} bottomLeft
   * @param  {Array[lng, lat]} topRight
   * @return [bottomLeft, topRight]
   *
   * Handy box tester
   * https://www.keene.edu/campus/maps/tool/
   *
   * Returned Google places viewport (i.e. `place.geometry.viewport`)
   * {
   *   Qa: {g: 174.4438160493033, h: 174.9684260722261} == [btmLng, topLng]
   *   zb: {g: -37.05901990116617, h: -36.66060184426172} == [btmLat, topLat]
   * }
   *
   * We then convert above into `address.area.bottomLeft|topRight`
   *
   * Rangiora box
   * [[172.5608731356091,-43.34484397837406] (btm left)
   * [172.6497429548984,-43.28025140057695]] (top right)
   *
   * Auckland box
   * [[174.4438160493033,-37.05901990116617] (btm left)
   * [174.9684260722261,-36.66060184426172]] (top right)
   */
  if (bottomLeft && bottomLeft.bottomLeft) {
    topRight = bottomLeft.topRight
    bottomLeft = bottomLeft.bottomLeft
  }
  if (!bottomLeft || !topRight) {
    return null
  }
  let lat = (lat, kms) => lat + (kms / 6371) * (180 / Math.PI)
  let lng = (lng, lat, kms) => lng + (kms / 6371) * (180 / Math.PI) / Math.cos(lat * Math.PI/180)
  return [
    [lng(bottomLeft[0], bottomLeft[1], -km), lat(bottomLeft[1], -km)],
    [lng(topRight[0], -topRight[1], km), lat(topRight[1], km)],
  ]
}

export function mongoDocWithinPassedAddress (address, km, prefix) {
  let type = ''
  let areaSize = 5
  if (type == 'geoNear') {
    // NOT USING
    // Must be the first stage in an aggregate pipeline
    if (address.area) {
      areaSize = mongoPointDifference(address.area.bottomLeft, address.area.topRight)
    }
    // console.log('kms', (areaSize / 2))
    return {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [address.location.coordinates[0], address.location.coordinates[1]],
        },
        distanceField: 'distance',
        maxDistance: ((areaSize / 2) + km) / 6371,  // km / earth's radius in km = radians
        spherical: true,
      },
    }
  } else if (address.area) {
    let box = mongoAddKmsToBox(km, address.area)
    return {
      [`${prefix}location`]: {
        $geoWithin: {
          $box: box,// [[lng lat], [lng lat]]
        },
      },
    }
  } else {
    return {
      [`${prefix}location`]: {
        $geoWithin: {
          $centerSphere: [
            [address.location.coordinates[0], address.location.coordinates[1]], // lng lat
            (areaSize + km) / 6371,  // km / earth's radius in km = radians
          ],
        },
      },
    }
  }
}

export function mongoPointDifference (point1, point2) {
  /**
   * Find the distance in km between to points
   * @param {array} point1 - [192.2132.., 212.23323..]
   * @param {array} point2 - [192.2132.., 212.23323..]
   * @return {number} kms
   */
  let R = 6371 // km
  let mongoDegreesToRadians = (degrees) => degrees * (Math.PI / 180)
  let dLat = mongoDegreesToRadians(point2[1]-point1[1])
  let dLon = mongoDegreesToRadians(point2[0]-point1[0])
  let lat1 = mongoDegreesToRadians(point1[1])
  let lat2 = mongoDegreesToRadians(point2[1])

  let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) *
    Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  let d = R * c
  return d.toFixed(1)
}

export function objectMap (object, fn) {
  return Object.keys(object).reduce(function(result, key) {
    result[key] = fn(object[key], key)
    return result
  }, {})
}

export function omit (obj, fields) {
  const shallowCopy = Object.assign({}, obj)
  for (let i=0; i<fields.length; i+=1) {
    const key = fields[i]
    delete shallowCopy[key]
  }
  return shallowCopy
}

export function onChange (setState, event, beforeSetState) {
  /**
   * Updates state from an input event, you can also update deep state properties
   * 
   * @param {function} setState
   * @param {Empty | Event | Array[{string}, {string|number|fn}]}
   *   {Empty} - pass undefined to return a reusable function, e.g. const _onChange = onChange(setState)
   *   {Event} - pass the event object,                        e.g. <input onChange={_onChange}>
   *   {Array} - pass an array with [path, value],             e.g. <input onChange={() => _onChange(['name', 'Joe'])}>
   * @param {function} beforeSetState - optional function to run before setting the state
   * 
   * @return {Function | Promise({state, chunks, target})}
   */
  if (typeof event === 'undefined') {
    return onChange.bind(this, setState)
  }
  let elem = event.target ? event.target : { id: event[0], value: event[1] }
  let chunks = (elem.id || elem.name).split('.')
  let value = elem.files
    ? elem.files[0]
    : elem.type === 'checkbox'
      ? elem.checked
      : isDefined(elem._value) 
        ? elem._value 
        : elem.value

  // Removing leading zero(s) on number fields
  // if (elem.type == 'number' && !isFunction(value) && (value||'').match(/^0+([1-9])/)) {
  //   value = value.replace(/^0+([1-9])/, '$1')
  // }

  // Update state
  return new Promise((resolve) => {
    setState((state) => {
      const newState = { ...state, ...(elem.files ? { hasFiles: true } : {}) }
      let target = newState
      for (var i = 0, l = chunks.length; i < l; i++) {
        if (l === i + 1) { // Last
          target[chunks[i]] = isFunction(value) ? value(state) : value
          // console.log(target)
        } else {
          let isArray = chunks[i + 1].match(/^[0-9]+$/)
          let parentCopy = isArray ? [...(target[chunks[i]] || [])] : { ...(target[chunks[i]] || {}) }
          target = target[chunks[i]] = parentCopy
        }
      }
      if (beforeSetState) {
        beforeSetState({ newState: newState, fieldName: chunks[i], parent: target })
      }
      resolve(newState)
      return newState
    })
  })
}

export function pad (num, padLeft, fixedRight) {
  num = parseFloat(num || 0)
  if (fixedRight || fixedRight === 0) {
    return num.toFixed(fixedRight).padStart((padLeft||0) + fixedRight + 1, '0')
  } else {
    if (padLeft && `${num}`.match('.')) padLeft += (`${num}`.split('.')[1]||'').length + 1
    return `${num}`.padStart(padLeft, '0')
  }
}

export function pick (obj, keys) {
  // Similiar to underscore.pick
  // @param {string[] | regex[]} keys
  if (!isObject(obj) && !isFunction(obj)) return {}
  keys = toArray(keys)
  let res = {}
  for (let key of keys) {
    if (isString(key) && obj.hasOwnProperty(key)) res[key] = obj[key]
    if (isRegex(key)) {
      for (let key2 in obj) {
        if (obj.hasOwnProperty(key2) && key2.match(key)) res[key2] = obj[key2]
      }
    }
  }
  return res
}

export function queryObject (search, assignTrue) {
  /*
    * Parses a query string into an object, or returns the last known matching cache
    * @param {string} search - location.search or location.href, e.g. '?page=1', 'https://...co.nz?page=1'
    * @param {boolean} assignTrue - assign true to empty values
    * @return {object} e.g. { page: 1 }
    */
  search = search.replace(/^[^?]+\?/, '?') // remove domain preceeding search string
  let obj = {}
  if (search === '') return obj
  if (!queryObject.queryObjectCache) queryObject.queryObjectCache = {}
  if (queryObject.queryObjectCache[search]) return { ...queryObject.queryObjectCache[search] }

  // Remove '?', and split each query parameter (ampersand-separated)
  search = search.slice(1).split('&')

  // Loop through each query paramter
  search.map(function (part) {
    part = part.split('=') // Split into key/value
    let key = part[0]
    let value = !part[1] && part[1] !== 0 ? (assignTrue ? true : '') : decodeURIComponent(part[1])

    // Key already exists
    if (obj[key]) {
      obj[key] = toArray([obj[key]])
      obj[key].push(value)
    } else {
      obj[key] = value
    }
  })

  queryObject.queryObjectCache = { [search]: obj }
  return { ...obj }
}

export function queryString (obj) {
  /*
    * Parses an object and returns a query string
    * @param {object} obj - query object
    */
  obj = { ...(obj||{}) }
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] == 'undefined') delete obj[key]
      else if (!obj[key]) delete obj[key]
    }
  }
  let qs = new URLSearchParams(obj).toString()
  return qs ? `?${qs}` : ''
}

export async function request (event, route, data, isLoading) {
  /**
   * Axios request to the route
   * @param {Event} event - event to prevent default
   * @param {string} route - e.g. 'post /api/user'
   * @param {object} <data> - payload
   * @param {array} <isLoading> - [isLoading, setIsLoading]
   * @return {promise}
   */
  try {
    if (event?.preventDefault) event.preventDefault()
    const uri = route.replace(/^(post|put|delete|get) /, '')
    const method = (route.match(/^(post|put|delete|get) /)?.[1] || 'post').trim()

    // show loading
    if (isLoading) {
      if (isLoading[0]) return
      else isLoading[1](' is-loading')
    }

    // warning, not persisting through re-renders, but should be fine until loading is finished
    data = data || {}
    delete data.errors

    // has files, if yes, convert to form data
    let hasFiles
    let recurse = (o) => {
      if (o instanceof File || hasFiles) hasFiles = true
      else if (o && typeof o === 'object') each(o, recurse)
    }
    recurse(data)
    if (hasFiles) {
      data = formData(data, { allowEmptyArrays: true, indices: true })
    }

    // send the request
    const [res] = await Promise.allSettled([
      axios()[method](uri, data, { withCredentials: true }),
      setTimeoutPromise(() => {}, 200), // eslint-disable-line
    ])

    // success
    if (isLoading) isLoading[1]('')
    if (res.status == 'rejected') throw res.reason
    return res.value.data

  } catch (errs) {
    throw getResponseErrors(errs)
  }
}

export function removeUndefined (variable) {
  // Removes undefined from an array or object
  if (Array.isArray(variable)) {
    for (let i = variable.length; i--; ) {
      if (variable[i] === undefined) variable.splice(i, 1)
    }
  } else {
    Object.keys(variable).forEach((key) => {
      if (variable[key] === undefined) delete variable[key]
    })
  }
  return variable
}

export function s3Image (awsUrl, image, size='full', i) {
  /**
   * Build image URL from image array or object
   * @param {string} awsUrl - e.g. 'https://s3.amazonaws.com/...'
   * @param {array|object} image - file object/array
   * @param {string} <size> - overrides to 'full' when the image sizes are still processing
   * @param {integer} <i> - array index
   */
  let lambdaDelay = 7000
  let usingMilliseconds = true

  if (!isObject(image)) image = (image && image[i]) ? image[i] : null
  if (!image) return '/assets/imgs/no-image.jpg'
  // Alway use preview if available
  if (image.base64) return image.base64
  // Wait a moment before the different sizes are generated by lambda
  if (((usingMilliseconds ? image.date : image.date * 1000) + lambdaDelay) > new Date()) size = 'full'
  let key = size == 'full' ? image.path : `${size}/${image.path.replace(/^full\/|\.[a-z0-9]{3,4}$/ig, '')}.jpg`
  return awsUrl + image.bucket + '/' + key
}

export function sanitizeHTML (string) {
  /*
    * Sanitize and encode all HTML in a user-submitted string
    * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
    * @param  {String} str  The user-submitted string
    * @return {String} str  The sanitized string
    */
  var temp = document.createElement('div')
  temp.textContent = string
  return temp.innerHTML
}

export function scrollbar (paddingClass, marginClass, maxWidth) {
  /**
   *  Process scrollbar width once.
   *  @param {string} paddingClass - class name to give padding to
   *  @param {string} marginClass - class name to give margin to
   *  @param {number} maxWidth - enclose css in a max-width media query
   *  @return width.
   */
  if (scrollbar.width || scrollbar.width === 0) {
    return scrollbar.width
  }

  var outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.width = '100px'
  outer.style.margin = '0px'
  outer.style.padding = '0px'
  outer.style.border = '0'
  document.body.appendChild(outer)

  var widthNoScroll = outer.offsetWidth
  // force scrollbars
  outer.style.overflow = 'scroll'

  // add innerdiv
  var inner = document.createElement('div')
  inner.style.width = '100%'
  outer.appendChild(inner)

  var widthWithScroll = inner.offsetWidth

  // Remove divs
  outer.parentNode.removeChild(outer)
  scrollbar.width = widthNoScroll - widthWithScroll

  // Add padding class.
  if (paddingClass || marginClass) {
    document.head.appendChild( // double check this, was jquery
      '<style type="text/css">' +
      (maxWidth ? '@media only screen and (max-width: ' + maxWidth + 'px) {' : '') +
      (paddingClass ? paddingClass + ' {padding-right:' + scrollbar.width + 'px}' : '') +
      (marginClass ? marginClass + ' {margin-right:' + scrollbar.width + 'px}' : '') +
      (maxWidth ? '}' : '') +
      '</style>'
    )
  }

  // return.
  return scrollbar.width
}

export function secondsToTime (seconds, padMinute) {
  seconds = Math.round(seconds)
  let hours = Math.floor(seconds / (60 * 60))
  let divisor_for_minutes = seconds % (60 * 60)
  let minutes = Math.floor(divisor_for_minutes / 60)
  let divisor_for_seconds = divisor_for_minutes % 60
  let secs = Math.ceil(divisor_for_seconds)
  let data = {
    h: (hours + ''),
    m: (minutes + '').padStart(padMinute? 2 : 1, 0),
    s: (secs + ''),
  }
  return data.h + ':' + data.m
}

export function setTimeoutPromise (func, milliseconds) {
  return new Promise(function(resolve) {
    setTimeout(() => resolve(func()), milliseconds)
  })
}

export function showError (setStore, errs) {
  /**
   * Shows a global error
   * @params {function} setStore
   * @params {Array|Error|String|Axios Object} errs
   */
  let detail = getResponseErrors(errs)[0].detail
  setStore((o) => ({ ...o, message: { type: 'error', text: detail } }))
}

export function sortByKey (objects, key) {
  return objects.sort(function (a, b) {
    var textA = (a[key] || '').toUpperCase()
    var textB = (b[key] || '').toUpperCase()
    return textA < textB ? -1 : textA > textB ? 1 : 0
  })
}

export function sortFromQuery (req, sortMap, sortByDefault='createdAt') {
  /**
   *
   * Return a mongodb sort pipeline stage using approved `req.query.sort-by|sort` values
   * @param {object} req - requires req.query.sort-by|sort
   * @param {object} sortMap - e.g. { name: ['user.firstName', ..], .. }
   * @param {string} <sortDefault> - e.g. 'createdAt' (default)
   * @return {object} - e.g. { 'user.firstName': -1 }
   * @see used in karpark
   */
  let sort = req.query.sort == 'asc' ? 1 : -1
  let sortBy = req.query['sort-by']
  sortByDefault = sortByDefault || 'createdAt'

  // Convert { name: ['user.firstName'] } to { name: { 'user.firstName': 1 }}
  for (let key in sortMap) {
    sortMap[key] = sortMap[key].reduce((o, name) => {
      o[name] = sort
      return o
    }, {})
  }

  if (sortMap[sortBy]) return sortMap[sortBy]
  else return { [sortByDefault]: sort }
}

export function throttle (func, wait, options) {
  /**
   * Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds
   * @param {function} func
   * @param {number} <wait=0> - the number of milliseconds to throttle invocations to
   * @param {boolean} <options.leading=true> - invoke on the leading edge of the timeout
   * @param {boolean} <options.trailing=true> - invoke on the trailing edge of the timeout
   * @returns {Function}
   * @example const throttled = util.throttle(updatePosition, 100)
   * @see lodash
   */
  let leading = true
  let trailing = true
  if (typeof func != 'function') {
    throw new TypeError('Expected a function')
  }
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing,
  })
}

export function toArray (variable) {
  // converts a variable to an array, if not already so
  if (typeof variable === 'undefined') return []
  return Array.isArray(variable) ? variable : [variable]
}

export function trim (string) {
  if (!string || !isString(string)) return ''
  return string.trim().replace(/\n\s+\n/g, '\n\n')
}

export function ucFirst (string) {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}
