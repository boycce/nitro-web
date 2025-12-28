import _axios from 'axios'
import axiosRetry from 'axios-retry'
import dateformat from 'dateformat'
import { loadStripe } from '@stripe/stripe-js/pure.js' // pure removes ping
import { twMerge as _twMerge, twJoin, createTailwindMerge, getDefaultConfig } from 'tailwind-merge'

/** @typedef {import('react').Dispatch<import('react').SetStateAction<any>>} SetState */

/**
 * Create an `axios` instance type that contains the `axios-retry` global declarations.
 * @typedef {import('axios').AxiosInstance} AxiosInstance
 * @typedef {import('axios').AxiosRequestConfig} AxiosRequestConfig
 * @typedef {import('axios').AxiosResponse} AxiosResponse
 * @typedef {import('axios-retry').IAxiosRetryConfigExtended} IAxiosRetryConfigExtended
 * 
 * Extend the config to be used below
 * @typedef {AxiosRequestConfig & { 'axios-retry'?: IAxiosRetryConfigExtended }} AxiosRequestConfigWithRetry
 * 
 * We only need to fix the `get` method, the rest of the methods inherit the new extended config...
 * @typedef {Omit<AxiosInstance, 'get'> & {
 *   get<T = any, R = AxiosResponse, D = any>(url: string, config?: AxiosRequestConfigWithRetry): Promise<R>
* }} AxiosInstanceWithRetry
*/

/** @typedef {object} ObjectId */
/** @typedef {(value: string) => ObjectId} parseId */
/** @typedef {(string|number|boolean)[]} EnumArray - an array of strings, numbers or booleans */
/** @typedef {{ title: string, detail: string }} NitroError */
/** @typedef {{ toJSON: () => { message: string } }} MongoError */
/** @typedef {{ response: { data: { errors?: NitroError[], error?: string, error_description?: string } } }} AxiosWithErrors */

/** @type {{[key: string]: {[key: string]: string|true|(string|true)[]}}} */
let queryObjectCache = {}

/** @type {Promise<import('@stripe/stripe-js').Stripe|null>|undefined} */
let stripeClientCache

/** @type {number|undefined} */
let scrollbarCache

/** @type {boolean|undefined} */
let axiosNonce

/**
 * Returns a monastery schema which matches the Google autocomplete output
 */
export function addressSchema () {
  // Google autocomplete should return the following object
  /** @param {any} array @param {object} schema @returns {[]} */
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

/**
 * Returns an axios instance for the client
 * @returns {AxiosInstanceWithRetry}
 * 
 * To set the defaults (e.g. baseURL) other than ones below, simply set them yourself:
 * ```js
 *   import { axios } from 'nitro-web/util'
 *   axios().defaults.baseURL = 'https://example.com'
 * ```
 */
export function axios () {
  if (!axiosNonce && typeof window !== 'undefined') {
    // Remove mobile specific protocol and subdomain
    const clientOrigin = window.document.location.origin.replace(/^(capacitor|https):\/\/(mobile\.)?/, 'https://')
    axiosNonce = true
    _axios.defaults.baseURL = clientOrigin
    _axios.defaults.headers.desktop = true
    _axios.defaults.withCredentials = true
    _axios.defaults.timeout = 60000
    axiosRetry(_axios, { retries: 0, retryDelay: (/*i*/) => 300 })
  }
  return _axios
}

/**
 * Builds the url with params
 * @param {string} url
 * @param {{[key: string]: string}} parameters - Key value parameters
 * @returns {string}, e.g. 'https://example.com?param1=value1&param2=value2'
 */
export function buildUrl (url, parameters) {
  const params = Object.keys(parameters).map((p) => `${encodeURIComponent(p)}=${encodeURIComponent(parameters[p])}`)
  return [url, params.join('&')].join('?')
}   

/**
 * Converts a string to camel case
 * @param {string} str
 * @param {boolean} [capitaliseFirst] - Capitalise the first letter
 * @param {boolean} [allowNumber] - Allow numbers
 * @returns {string}
 */
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

/**
 * Converts camel case to title case
 * @param {string} str
 * @param {boolean} [captialiseFirstOnly] - Capitalise the first letter only
 * @returns {string}
 */
export function camelCaseToTitle (str, captialiseFirstOnly) {
  str = str.replace(/([A-Z]+)/g, ' $1').trim()
  if (captialiseFirstOnly) str = str.toLowerCase()
  return ucFirst(str)
}

/**
 * Converts camel case to hypen case
 * @param {string} str
 * @returns {string}
 */
export function camelCaseToHypen (str) {
  return str.replace(/[A-Z]|[0-9]+/g, m => '-' + m.toLowerCase())
}

/**
 * Capitalises a string
 * @param {string} [str]
 * @returns {string}
 */
export function capitalise (str) {
  return (str||'').replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
}

/**
 * Formats a currency string
 * @param {number} cents
 * @param {number} [decimals=2]
 * @param {number} [decimalsMinimum]
 * @returns {string}
 */
export function currency (cents, decimals=2, decimalsMinimum) {
  // Returns a formated currency string
  const num = Number(cents / 100)
  if (!isNumber(num)) return '$0.00'
  return '$' + num.toLocaleString(undefined, {
    minimumFractionDigits: typeof decimalsMinimum == 'undefined' ? decimals : decimalsMinimum,
    maximumFractionDigits: decimals,
  })
}

/**
 * Converts a currency string to cents
 * @param {string} currency string, e.g. '$1,234.00'
 * @returns {string}
 */
export function currencyToCents (currency) {
  // Converts '$1,234.00' to '1234.00', then to '123400'
  let currencyString = Number(currency.replace(/[^0-9.]/g, '')).toFixed(2)
  return currencyString.replace(/\./g, '')
}

/**
 * Returns a formatted date string
 * @param {number|Date} [date] - number can be in seconds or milliseconds (UTC)
 * @param {string} [format] - e.g. "dd mmmm yy" (https://github.com/felixge/node-dateformat#mask-options)
 * @param {string} [timezone] - convert a UTC date to a particular timezone.
 * @returns {string}
 * 
 * Note on the timezone conversion:
 * Timezone conversion relies on parsing the toLocaleString result, e.g. 4/10/2012, 5:10:30 PM.
 * A older browser may not accept en-US formatted date string to its Date constructor, and it may
 * return unexpected result (it may ignore daylight saving).
 */
export function date (date, format, timezone) {
  if (!date) return 'Date?'

  // Get the milliseconds
  let milliseconds = 0
  if (typeof date === 'number') {
    if (date < 9999999999) milliseconds = date * 1000
    else milliseconds = date
  } else if (isDate(date)) {
    milliseconds = date.getTime()
  }
  if (timezone) {
    milliseconds = new Date(new Date(milliseconds).toLocaleString('en-US', { timeZone: timezone })).getTime()
  }
  return dateformat(milliseconds, format || 'dS mmmm')
}

/**
 * @template {(...args: any[]) => any} T
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 *
 * @param {T} func - The function to debounce.
 * @param {number} [wait=0] - Number of milliseconds to delay.
 * @param {{
 *   leading?: boolean,  // invoke on the leading edge of the timeout (default: false)
 *   maxWait?: number,   // maximum time `func` is allowed to be delayed before it's invoked 
 *   trailing?: boolean, // invoke on the trailing edge of the timeout (default: true)
 * }} [options] - Options to control behavior.
 * @returns {((...args: Parameters<T>) => ReturnType<T>) & {
 *     cancel: () => void;
 *     flush: () => ReturnType<T>
 * }}
 *
 * @example const debounced = debounce(updatePosition, 100)
 * @see https://lodash.com/docs/4.17.15#debounce
 */
export function debounce(func, wait = 0, options) {
  /** @type {any[]|undefined} */
  let lastArgs
  /** @type {any} */
  let lastThis
  /** @type {number|undefined} */
  let maxWait
  /** @type {any} */
  let result
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let timerId
  /** @type {number|undefined} */
  let lastCallTime
  let lastInvokeTime = 0
  let leading = false
  let maxing = false
  let trailing = true

  if (options) {
    leading = !!options.leading
    maxing = 'maxWait' in options
    maxWait = maxing ? Math.max(typeof options.maxWait === 'number' ? options.maxWait : 0, wait) : undefined
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }

  /**
   * @param {number} time
   * @returns {any}
   */
  function invokeFunc(time) {
    const args = lastArgs
    const thisArg = lastThis
    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args ? args : [])
    return result
  }

  /**
   * @param {number} time
   * @returns {any}
   */
  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  /**
   * @param {number} time
   * @returns {number}
   */
  function remainingWait(time) {
    const timeSinceLastCall = time - (lastCallTime ?? 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall
    return maxing
      ? Math.min(timeWaiting, (maxWait ?? 0) - timeSinceLastInvoke)
      : timeWaiting
  }

  /**
   * @param {number} time
   * @returns {boolean}
   */
  function shouldInvoke(time) {
    const timeSinceLastCall = time - (lastCallTime ?? 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxing && timeSinceLastInvoke >= (maxWait ?? 0))
    )
  }

  /**
   * @returns {any}
   */
  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time))
  }

  /**
   * @param {number} time
   * @returns {any}
   */
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

  /**
   * Cancel any pending debounced invocation.
   * @returns {void}
   */
  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timerId = undefined
  }

  /**
   * Immediately invoke the debounced function if pending.
   * @returns {any}
   */
  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now())
  }

  /**
   * The debounced function.
   * @this {any}
   * @param {...any} args
   * @returns {any}
   */
  function debounced(...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
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

/**
 * Deep clones an object or array, preserving its type
 * @template T
 * @param {T} obj - Object or array to deep clone
 * @returns {T}
 */
export function deepCopy(obj) {
  if (!obj) return obj
  if (typeof obj !== 'object') return obj

  // Create a new instance based on the input type
  /** @type {any} */
  const clone = Array.isArray(obj) ? [] : {}

  for (const key in obj) {
    const value = obj[key]
    clone[key] = typeof value === 'object' && !isHex24(value) ? deepCopy(value) : value
  }

  return clone
}

/**
 * Retrieves a nested value from an object or array from a dot-separated path.
 * @param {object|any[]} obj - The source object or array.
 * @param {string} path - Dot-separated path (e.g. "owner.houses.0.color").
 * @returns {unknown} 
 */
export function deepFind(obj, path) {
  if (!obj) return undefined
  if (typeof obj !== 'object') return undefined

  const chunks = path.split('.')
  /** @type {any} */
  let target = obj

  for (const chunk of chunks) {
    if (target === null || target === undefined) return undefined
    target = target[chunk]
  }

  return target
}

/**
 * Saves a deeply nested value without mutating the original object.
 * @template T
 * @param {T} obj - The source object or array.
 * @param {string} path - Dot-separated path to the nested property.
 * @param {unknown|function} value - The value to set, or a function to compute it from the current value.
 * @returns {T}
 */
export function deepSet(obj, path, value) {
  if (obj === null || obj === undefined) return obj
  return deepSetWithInfo(obj, path, value).obj
}

/**
 * Sets a deeply nested value without mutating the original object.
 * @template T
 * @param {T} _obj - The target object or array.
 * @param {string} path - Dot-separated path to the nested property.
 * @param {unknown|function} value - The value to set, or a function to compute it from the current value.
 * @returns {{ obj: T, parent: T, fieldName: string }}
 */
export function deepSetWithInfo(_obj, path, value) {
  /** @type {any} */
  let obj = Array.isArray(_obj) ? [..._obj] : { ..._obj }
  let parent = obj
  const chunks = (path || '').split('.')

  for (let i = 0, l = chunks.length; i < l; i++) {
    const key = chunks[i]
    const isLast = i === l - 1

    if (isLast) {
      // was obj for onChange()
      parent[key] = typeof value === 'function' ? value(parent[key]) : value 
    } else {
      const nextIsArray = /^\d+$/.test(chunks[i + 1])
      const current = parent[key]

      // If the next level doesn't exist, create an empty array/object
      const parentCopy = nextIsArray
        ? Array.isArray(current) ? [...current] : []
        : isObject(current) ? { ...current } : {}

      parent = parent[key] = parentCopy
    }
  }
  return {
    obj: obj,
    parent: parent,
    fieldName: chunks.pop() ?? '',
  }
}

/**
 * Iterates over an object or array
 * @param {{[key: string]: any}|[]|null} obj
 * @param {function} iteratee
 * @param {object} [context]
 * @returns {object|[]|null}
 */
export function each (obj, iteratee, context) {
  // Similar to the underscore.each method
  const shallowLen = obj === null ? void 0 : obj['length']
  const isArrayLike = typeof shallowLen == 'number' && shallowLen >= 0
  if (obj === null) {
    return null
  } else if (isArrayLike) {
    for (let i = 0, l = obj.length; i < l; i++) {
      iteratee.call(context || null, /** @type {any[]} */(obj)[i], i, obj)
    }
  } else {
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      iteratee.call(context || null, /** @type {{[key: string]: any}} */(obj)[key], key, obj)
    }
  }
  return obj
}

/**
 * Downloads a file
 * @param {string|Blob|File|Uint8Array<ArrayBuffer>} data
 * @param {string} filename
 * @param {string} [mime]
 * @param {string} [bom]
 * @returns {void}
 * 
 * @link https://github.com/kennethjiang/js-file-download
 */
export function fileDownload (data, filename, mime, bom) {
  if (typeof window === 'undefined') return
  let blobData = (typeof bom !== 'undefined') ? [bom, data] : [data]
  let blob = new Blob(blobData, {type: mime || 'application/octet-stream'})

  if (typeof /** @type {any} */(window.navigator).msSaveBlob !== 'undefined') {
    /** @type {any} */(window.navigator).msSaveBlob(blob, filename)
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

/**
 * Formats a string into a name
 * @param {string} string
 * @param {boolean} [ignoreHyphen]
 * @returns {string}
 */
export function formatName (string, ignoreHyphen) {
  return ignoreHyphen
    ? ucFirst(string.toString().trim())
    : ucFirst(string.toString().trim().replace('-', ' '))
}

/**
 * Formats a string into a slug
 * @param {string} string
 * @returns {string}
 */
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

/**
 * Serializes objects to FormData instances
 * @param {object} obj
 * @param {{ allowEmptyArrays?: boolean, indices?: boolean, nullsAsUndefineds?: boolean, booleansAsIntegers?: boolean }} [cfg] - config
 * @param {FormData} [existingFormData]
 * @param {string} [keyPrefix]
 * @returns {FormData}
 * @link https://github.com/therealparmesh/object-to-formdata
 */
export function formData (obj, cfg, existingFormData, keyPrefix) {
  /**
   * Serializes objects to FormData instances
   * @param {{[key: string]: any}} obj
   * @param {{ allowEmptyArrays?: boolean, indices?: boolean, nullsAsUndefineds?: boolean, booleansAsIntegers?: boolean }} [cfg] - config
   * @param {FormData} [existingFormData]
   * @param {string} [keyPrefix]
   * @returns {FormData}
   */
  const serialize = (obj, cfg, existingFormData, keyPrefix='') => {
    cfg = cfg || {}
    cfg.indices = cfg.indices === undefined ? false : cfg.indices
    cfg.nullsAsUndefineds = cfg.nullsAsUndefineds === undefined ? false : cfg.nullsAsUndefineds
    cfg.booleansAsIntegers = cfg.booleansAsIntegers === undefined ? false : cfg.booleansAsIntegers
    cfg.allowEmptyArrays = cfg.allowEmptyArrays === undefined ? false : cfg.allowEmptyArrays
    existingFormData = existingFormData || new FormData()

    const isBlob = typeof obj === 'object' && 
      'size' in obj && typeof obj.size === 'number' && 
      'type' in obj && typeof obj.type === 'string' && 
      'slice' in obj && typeof obj.slice === 'function'

    const isFile = isBlob &&
      'name' in obj && typeof obj.name === 'string' &&
      (
        ('lastModifiedDate' in obj && typeof obj.lastModifiedDate === 'object') || 
        ('lastModified' in obj && typeof obj.lastModified === 'number')
      )

    if (obj === undefined) {
      return existingFormData
    } else if (obj === null) {
      if (!cfg.nullsAsUndefineds) {
        existingFormData.append(keyPrefix, '')
      }
    } else if (typeof obj === 'boolean') {
      if (cfg.booleansAsIntegers) {
        existingFormData.append(keyPrefix, obj ? '1' : '0')
      } else {
        existingFormData.append(keyPrefix, obj)
      }
    } else if (Array.isArray(obj)) {
      if (obj.length) {
        obj.forEach((value, index) => {
          const key = keyPrefix + '[' + (cfg.indices ? index : '') + ']'
          serialize(value, cfg, existingFormData, key)
        })
      } else if (cfg.allowEmptyArrays) {
        existingFormData.append(keyPrefix + '[]', '')
      }
    } else if (obj instanceof Date) {
      existingFormData.append(keyPrefix, obj.toISOString())
    } else if (obj === Object(obj) && !isFile && !isBlob) {
      Object.keys(obj).forEach((prop) => {
        const value = obj[prop]
        if (Array.isArray(value)) {
          while (prop.length > 2 && prop.lastIndexOf('[]') === prop.length - 2) {
            prop = prop.substring(0, prop.length - 2)
          }
        }
        const key = keyPrefix ? keyPrefix + '[' + prop + ']' : prop
        serialize(value, cfg, existingFormData, key)
      })
    } else {
      existingFormData.append(keyPrefix, /** @type {any} */(obj))
    }
    return existingFormData
  }
  return serialize(obj, cfg, existingFormData, keyPrefix)
}

/**
 * Returns capitalized full name
 * @param {{firstName: string, lastName: string}} object
 * @returns {string}
 */
export function fullName (object) {
  return ucFirst(object.firstName) + ' ' + ucFirst(object.lastName)
}

/**
 * Splits a full name into first and last names
 * @param {string} string
 * @returns {string[]} e.g. ['John', 'Smith']
 */
export function fullNameSplit (string) {
  string = string.trim().replace(/\s+/, ' ')
  if (string.match(/\s/)) {
    return [string.substring(0, string.lastIndexOf(' ')), string.substring(string.lastIndexOf(' ') + 1)]
  } else {
    return [string, '']
  }
}

/**
 * Returns a list of country options
 * @param {{ [key: string]: { name: string } }} countries
 * @returns {{ value: string, label: string, flag: string }[]}
 */
export function getCountryOptions (countries) {
  const output = []
  for (const iso in countries) {
    const name = countries[iso].name
    output.push({ value: iso, label: name, flag: iso.toUpperCase() })
  }
  return output
}

/**
 * Returns a list of currency options
 * @param {{ [iso: string]: { name: string } }} currencies
 * @returns {{ value: string, label: string }[]}
 */
export function getCurrencyOptions (currencies) {
  const output = []
  for (const iso in currencies) {
    const name = currencies[iso].name
    output.push({ value: iso, label: name })
  }
  return output
}

/**
 * Returns an error from a state object matching the path
 * @param {{ errors?: { title: string, detail: string }[] }|undefined} state
 * @param {string|RegExp} path
 * @returns {{ title: string, detail: string }|undefined}
 */
export function getErrorFromState (state, path) {
  if (!state || !state.errors) return undefined
  for (const item of state.errors) {
    if (isRegex(path) && (item.title || '').match(path)) return item
    else if (item.title == path) return item
  }
}

/**
 * Get the width of a prefix
 * @param {string} prefix
 * @param {number} [paddingRight=0]
 * @returns {number}
 */
export function getPrefixWidth (prefix, paddingRight=0) {
  if (!prefix || typeof window === 'undefined') return 0
  const span = document.createElement('span')
  span.classList.add('input-prefix')
  span.style.visibility = 'hidden'
  span.textContent = prefix
  document.body.appendChild(span)
  const width = span.offsetWidth + paddingRight
  document.body.removeChild(span)
  return width
}

/**
 * Returns a list of project directories
 * @param {{ join: (...args: string[]) => string }} path - e.g. `import path from 'path'`
 * @param {string} [pwd]
 * @returns {object}
 */
export function getDirectories (path, pwd) {
  const _pwd = pwd || process.env.PWD || ''
  return {
    clientDir: path.join(_pwd, process.env.clientDir || 'client', '/'),
    componentsDir: path.join(_pwd, process.env.componentsDir || 'components', '/'),
    distDir: path.join(_pwd, process.env.distDir || ((process.env.clientDir || 'client') + '/dist'), '/'),
    emailTemplateDir: path.join(_pwd, process.env.emailTemplateDir || 'server/email', '/'),
    imgsDir: path.join(_pwd, (process.env.clientDir || 'client'), 'imgs', '/'),
    tmpDir: path.join(_pwd, process.env.tmpDir || 'tmp', '/'),
  }
}

/**
 * Returns a Stripe client promise
 * @param {string} stripePublishableKey
 * @returns {Promise<import('@stripe/stripe-js').Stripe|null>}
 */
export function getStripeClientPromise (stripePublishableKey) {
  return stripeClientCache || (stripeClientCache = loadStripe(stripePublishableKey))
}

/**
 * Returns a list of response errors
 * @typedef {Error|NitroError[]|MongoError|AxiosWithErrors|string|any} NitroErrorRaw
 * 
 * @param {NitroErrorRaw} errs
 * @returns {NitroError[]}
 */
export function getResponseErrors (errs) {
  // Array of error objects
  if (Array.isArray(errs)) {
    return errs
  
  // Axios response errors
  } else if (typeof errs === 'object' && errs?.response?.data?.errors) {
    return errs.response.data.errors

  // Axios response error
  } else if (typeof errs === 'object' && errs?.response?.data?.error) {
    return [{ title: errs.response.data.error, detail: errs.response.data.error_description || '' }]

  // new Error
  } else if (errs instanceof Error || errs === null) {
    return [{ title: 'error', detail: 'Oops there was an error' }]

  // Mongo errors (when called on the backend)
  } else if (typeof errs === 'object' && 'toJSON' in errs) {
    return [{ title: 'error', detail: errs.toJSON().message }]
      
  // String
  } else if (typeof errs === 'string') {
    return [{ title: 'error', detail: errs }]

  // Default error message
  } else {
    console.info('getResponseErrors(): ', errs)
    return [{ title: 'error', detail: 'Oops there was an error' }]
  }
}

/**
 * Returns the system error from a list of errors
 * @param {NitroError[]|undefined} nitroErrors
 * @returns {string}
 */
export function getSystemError(nitroErrors) {
  const allErrors = getResponseErrors(nitroErrors || [])
  const systemError = allErrors.find(error => error.title === 'error')
  return systemError?.detail || ''
}

/**
 * Checks if a value is in an array (todo, update this to not use optional key)
 * @param {any[]} array
 * @param {unknown} [value]
 * @param {string} [key] - optional, to match across on a colleciton of objects
 * @returns {boolean}
 */
export function inArray (array, value, key) {
  if (!array || typeof value == 'undefined') return false
  else if (typeof key == 'undefined') return array.includes(value)
  else 
    for (let i = array.length; i--; ) {
      if (typeof array[i] === 'object') {
        /** @type {{[key: string]: unknown}} */
        const item = array[i]
        if (key in item && array[i][key] == value) return array[i]
      }
    }
  return false
}

/**
 * Checks if a variable is an array
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isArray (variable) {
  return Array.isArray(variable)
}

/**
 * Checks if a variable is a date
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isDate (variable) {
  return !!(typeof variable === 'object' && variable && 'getMonth' in variable)
}

/**
 * Checks if a variable is defined
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isDefined (variable) {
  return typeof variable !== 'undefined'
}

/**
 * Checks if a variable is an email
 * @param {string} email
 * @returns {boolean}
 */
export function isEmail (email) {
  // eslint-disable-next-line
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

/**
 * Checks if an object is empty
 * @param {{[key: string]: unknown}|null} [obj]
 * @param {boolean} [truthyValuesOnly]
 * @returns {boolean}
 */
export function isEmpty (obj, truthyValuesOnly) {
  // note req.files doesn't have a hasOwnProperty method
  if (obj === null || typeof obj === 'undefined') return true
  for (let prop in obj) {
    if (obj[prop] || (!truthyValuesOnly && obj.hasOwnProperty && obj.hasOwnProperty(prop))) return false
  }
  return true
}

/**
 * Checks if a variable is a function
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isFunction (variable) {
  return typeof variable === 'function' ? true : false
}

/**
 * Checks if a variable is a hex string
 * @param {unknown} value
 * @returns {boolean}
 */
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

/**
 * Checks if a variable is a number
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isNumber (variable) {
  return !isNaN(parseFloat(/** @type {string} */(variable))) && isFinite(/** @type {number} */(variable))
}

/**
 * Checks if a variable is an object
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isObject (variable) {
  // Excludes null and array's
  return variable !== null && typeof variable === 'object' && !(variable instanceof Array) ? true : false
}

/**
 * Checks if a variable is a regex
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isRegex (variable) {
  return variable instanceof RegExp ? true : false
}

/**
 * Checks if a variable is a string
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isString (variable) {
  return typeof variable === 'string' || variable instanceof String ? true : false
}

/**
 * Converts the first character of a string to lowercase
 * @param {string} string
 * @returns {string}
 */
export function lcFirst (string) {
  return string.charAt(0).toLowerCase() + string.slice(1)
}

/**
 * Trims a string to a maximum length, and removes any partial words at the end
 * @param {string} string
 * @param {number} [len=100]
 * @param {boolean} [showEllipsis=true]
 * @returns {string}
 */
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

/**
 * Expands a mongodb lng/lat box in kms, and returns the expanded box
 * @typedef {[number, number]} Point - lng/lat
 * @typedef {{bottomLeft: Point, topRight: Point}} Box
 * 
 * @param {number} km
 * @param {Point|Box} bottomLeftOrBox
 * @param {Point} [topRight]
 * @returns {[Point, Point]|null} (e.g. [bottomLeft, topRight])
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
export function mongoAddKmsToBox (km, bottomLeftOrBox, topRight) {
  if (typeof bottomLeftOrBox === 'object' && 'bottomLeft' in bottomLeftOrBox) {
    topRight = bottomLeftOrBox.topRight
    var bottomLeft = bottomLeftOrBox.bottomLeft
  } else {
    bottomLeft = bottomLeftOrBox
  }
  if (!bottomLeft || !topRight) {
    return null
  }
  /** @param {number} lat @param {number} kms @returns {number} */
  let lat = (lat, kms) => lat + (kms / 6371) * (180 / Math.PI)
  /** @param {number} lng @param {number} lat @param {number} kms @returns {number} */
  let lng = (lng, lat, kms) => lng + (kms / 6371) * (180 / Math.PI) / Math.cos(lat * Math.PI/180)
  return [
    [lng(bottomLeft[0], bottomLeft[1], -km), lat(bottomLeft[1], -km)],
    [lng(topRight[0], -topRight[1], km), lat(topRight[1], km)],
  ]
}

/**
 * Returns a mongo query to find documents within a passed address
 * @param {{
 *   area?: {bottomLeft: [number, number], topRight: [number, number]}
 *   location?: {coordinates: [number, number]}
 * }} address
 * @param {number} km
 * @param {string} prefix
 * @returns {Object}
 */
export function mongoDocWithinPassedAddress (address, km, prefix) {
  // let type = ''
  let areaSize = 5
  // if (type == 'geoNear') {
  //   // NOT USING
  //   // Must be the first stage in an aggregate pipeline
  //   if (address.area) {
  //     areaSize = mongoPointDifference(address.area.bottomLeft, address.area.topRight)
  //   }
  //   // console.log('kms', (areaSize / 2))
  //   return {
  //     $geoNear: {
  //       near: {
  //         type: 'Point',
  //         coordinates: [address.location.coordinates[0], address.location.coordinates[1]],
  //       },
  //       distanceField: 'distance',
  //       maxDistance: ((areaSize / 2) + km) / 6371,  // km / earth's radius in km = radians
  //       spherical: true,
  //     },
  //   }
  if ('area' in address && address.area) {
    let box = mongoAddKmsToBox(km, address.area)
    return {
      [`${prefix}location`]: {
        $geoWithin: {
          $box: box,// [[lng lat], [lng lat]]
        },
      },
    }
  } else if ('location' in address && address.location) {
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
  } else {
    throw new Error('Missing address.location or address.area')
  }
}

/**
 * Find the distance in km between to points
 * @param {number[]} point1 - [lng, lat] ([192.2132.., 212.23323..])
 * @param {number[]} point2 - [lng, lat] ([192.2132.., 212.23323..])
 * @return {number} kms
 */
export function mongoPointDifference (point1, point2) {
  let R = 6371 // km
  /** @param {number} degrees @returns {number} */
  let mongoDegreesToRadians = (degrees) => degrees * (Math.PI / 180)
  let dLat = mongoDegreesToRadians(point2[1]-point1[1])
  let dLon = mongoDegreesToRadians(point2[0]-point1[0])
  let lat1 = mongoDegreesToRadians(point1[1])
  let lat2 = mongoDegreesToRadians(point2[1])

  let a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) *
    Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  let d = R * c
  return parseFloat(d.toFixed(1))
}

/**
 * Maps over an object
 * @param {{ [key: string]: any }} object
 * @param {(value: any, key: string) => any} fn
 */
export function objectMap (object, fn) {
  /** @type {{ [key: string]: any }} */
  const result = {}
  return Object.keys(object).reduce(function(result, key) {
    result[key] = fn(object[key], key)
    return result
  }, result)
}

/**
 * Omits fields from an object
 * @param {{ [key: string]: unknown }} obj
 * @param {string[]} fields
 * @returns {{ [key: string]: unknown }}
 */
export function omit (obj, fields) {
  const shallowCopy = Object.assign({}, obj)
  for (let i=0; i<fields.length; i+=1) {
    const key = fields[i]
    delete shallowCopy[key]
  }
  return shallowCopy
}

/**
 * @typedef {({target: {name: string, value: unknown}} | [string, unknown])} EventOrPathValue
 */

/**
 * Automatically updates a state object from a field event by using the input name/value (deep paths supported)
 * E.g. setState(s => ({ ...s, [e.target.name]: e.target.value }))
 * @template T
 * @param {EventOrPathValue} eventOrPathValue - The input/select change event or [path, value] to update the state with
 * @param {React.Dispatch<React.SetStateAction<T>>} setState
 * @param {(value: unknown) => unknown} [beforeSetValue] - optional function to change the value before setting the state
 * @param {Function} [beforeSetState] - optional function to run before setting the state
 * @returns {Promise<T>}
 * 
 * @example usage:
 *   - <input onChange={(e) => onChange(e, setState)} />
 *   - <input onChange={() => onChange(['address.name', 'Joe'], setState)} />
 */
export function onChange (eventOrPathValue, setState, beforeSetValue, beforeSetState) {
  /** @type {unknown} */
  let value
  /** @type {string} */
  let path = ''
  /** @type {boolean | undefined} */
  let hasFiles
  
  if (typeof eventOrPathValue === 'object' && 'target' in eventOrPathValue) {
    const element = /** @type {HTMLInputElement & {_value?: unknown}} */(eventOrPathValue.target)
    path = element.name || element.id || ''
    hasFiles = !!element.files
    value = (
      element.files
        ? element.files[0]
        : typeof element._value !== 'undefined'
          ? element._value
          : element.type === 'checkbox'
            ? element.checked
            : element.value
    )
  } else if (Array.isArray(eventOrPathValue)) {
    path = eventOrPathValue[0]
    value = eventOrPathValue[1]
  }

  // Update state
  return new Promise((resolve) => {
    setState((state) => {
      const newValue = beforeSetValue ? beforeSetValue(value) : value
      const baseState = { ...state, ...(hasFiles ? { hasFiles } : {}) }

      /** @type {{[key: string]: any}} */
      const { obj, parent, fieldName } = deepSetWithInfo(baseState, path, newValue)
      
      const newState = beforeSetState ? beforeSetState({ state: obj, parent: parent, key: fieldName }) : obj

      resolve(newState)
      return newState
    })
  })
}

/**
 * Pads a number
 * @param {number} [num=0]
 * @param {number} [padLeft=0]
 * @param {number} [fixedRight]
 * @returns {string}
 */
export function pad (num=0, padLeft=0, fixedRight) {
  num = parseFloat(num + '')
  if (fixedRight || fixedRight === 0) {
    return num.toFixed(fixedRight).padStart(padLeft + fixedRight + 1, '0')
  } else {
    if (padLeft && `${num}`.match('.')) padLeft += (`${num}`.split('.')[1]||'').length + 1
    return `${num}`.padStart(padLeft, '0')
  }
}

/**
 * Validates req.query "filters" against a config object, and returns a MongoDB-compatible query object.
 * @param {{ [key: string]: unknown }} query - req.query
 *   E.g. {
 *     location: '10-RS',
 *     age: '33',
 *     isDeleted: 'false',
 *     search: 'John Doe',
 *     createdAt: '1749038400000,1749729600000',
 *     status: 'incomplete',
 *     bookingDate: '14'
 *     isActive: 'true',
 *     customer.0: '69214ce7ab121fb3726965a1', // splayed array items
 *   }
 * @param {{ 
 *   [key: string]: 'string'|'number'|'boolean'|'search'|'dateRange'|EnumArray|{ rule: 'ids', parseId: parseId } 
 * }} config - allowed filters and their rules
 *   E.g. {
 *     location: 'string',
 *     age: 'number',
 *     isDeleted: 'boolean',
 *     search: 'search',  
 *     createdAt: 'dateRange',
 *     status: ['incomplete', 'complete'],       // EnumArray
 *     bookingDate: [11, 14, 33],                // EnumArray
 *     isActive: [true, false],                  // EnumArray
 *     customer: { rule: 'ids', ObjectId: ObjectIdConstructor },
 *   }
 * @example returned object (using the examples above):
 *   E.g. {
 *     location: '10-RS',
 *     age: 33,
 *     isDeleted: false,
 *     search: { $search: 'John' },
 *     createdAt: { $gte: 1749038400000, $lte: 1749729600000 },
 *     status: 'incomplete',
 *     bookingDate: 14,
 *     isActive: true,
 *     customer: { $in: [new ObjectId('1234567890')] },
 *   }
 */
export function parseFilters(query, config) {
  /** 
   * Should match the example returned object above
   * @type {{ 
   *   [key: string]: string|number|boolean|{ $search: string }|{ $gte?: number; $gt?: number; $lte?: number; $lt?: number; }|
   *     { $in: ObjectId[] } }} */
  const mongoQuery = {}

  // Convert splayed array items into a unified array objects, e.g. 'customer.0' = '1' and 'customer.1' = '2' -> 'customer' = '1,2'
  for (const key in query) {
    if (key.match(/\.\d+$/)) {
      const baseKey = key.replace(/\.\d+$/, '')
      const index = key.match(/\.(\d+)$/)?.[1] || 0
      if (index == 0) query[baseKey] = query[key]
      else query[baseKey] += ',' + query[key]
    }
  }

  for (const key in query) {
    if (typeof query[key] !== 'string') continue
    const val = query[key]
    const rule = config[key]

    if (!rule) {
      continue

    } else if (rule === 'string') {
      if (typeof val !== 'string') throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a string.`)
      mongoQuery[key] = val

    } else if (rule === 'number') {
      const num = parseFloat(val)
      if (isNaN(num)) throw new Error(`The "${key}" filter should be a number, but received "${val}".`)
      mongoQuery[key] = num

    } else if (rule === 'boolean') {
      const bool = val === 'true' ? true : val === 'false' ? false : undefined
      if (bool === undefined) throw new Error(`The "${key}" filter should be a boolean, but received "${val}".`)
      mongoQuery[key] = bool

    } else if (rule === 'search') {
      if (typeof val !== 'string') throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a string.`)
      mongoQuery['$text'] = { $search: '"' + val + '"' }

    // Enums
    } else if (Array.isArray(rule)) {
      // Detetect the entire array's type from the first item
      const type = typeof rule[0]
      if (!['string', 'number', 'boolean'].includes(type)) {
        throw new Error(`The rule for "${key}" should only contain strings, numbers or booleans, but received "${type}".`)
      }
      // Parse the value to the correct type and compare it to the rule item
      for (const ruleItem of rule) {
        let valParsed = /** @type {string|number|boolean|undefined} */(val)
        if (type === 'number') valParsed = parseFloat(val)
        else if (type === 'boolean') valParsed = val === 'true' ? true : val === 'false' ? false : undefined
        if (valParsed === ruleItem) mongoQuery[key] = valParsed
      }
    
    // Ids
    } else if (typeof rule === 'object' && 'rule' in rule && rule.rule === 'ids') {
      if (!rule.parseId) {
        throw new Error(`The "${key}" filter has an invalid rule. Expected a parseId function.`)
      }
      const ids = val.split(',').map(id => {
        if (!isHex24(id)) throw new Error(`Invalid id "${id}" passed to the "${key}" filter.`)
        else return rule.parseId(id)
      })
      if (!ids.length) throw new Error(`Please pass at least one id to the "${key}" filter.`)
      mongoQuery[key] = { $in: ids }

    } else if (rule === 'dateRange') {
      const [start, end] = val.split(',').map(Number)
      if (isNaN(start) && isNaN(end)) throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a date range.`)
      else if (isNaN(start)) mongoQuery[key] = { $gte: 0, $lte: end }
      else if (isNaN(end)) mongoQuery[key] = { $gte: start }
      else mongoQuery[key] = { $gte: start, $lte: end }

    } else {
      throw new Error(`Unknown filter type "${rule}" in the config.`)
    }
  }

  return mongoQuery
}

/**
 * Parses req.query "pagination" and "sorting" fields and returns a monastery-compatible options object.
 * @param {{ page?: string, sort?: '1'|'-1', sortBy?: string }} query - req.query
 *   E.g. { 
 *     page: '1', 
 *     sort: '1', 
 *     sortBy: 'createdAt' 
 *   }
 * @param {{ fieldsFlattened: object, name: string }} model - The Monastery model
 * @param {number} [limit=10] - pass 0 to exclude limit/skip, regardless of pagination
 * @param {boolean} [hasMore] - hasMore parameter on parseSortOptions has been deprecated.
 * @example returned object (using the examples above):
 *   E.g. {
 *     limit: 10,
 *     skip: undefined,
 *     sort: { createdAt: 1 },
 *   }
 */
export function parseSortOptions(query, model, limit = 10, hasMore) {
  if (hasMore) throw new Error('hasMore parameter on parseSortOptions has been deprecated.')
  const page = parseInt(query.page || '') || 1

  // Validate sortBy value
  const sortBy = query.sortBy || 'createdAt'
  const fields = Object.keys(model.fieldsFlattened)
  
  if (!fields.includes(sortBy) && fields.includes(`${sortBy}.0`)) {
    throw new Error(`"${sortBy}" is an invalid sortBy value for the "${model.name}" model, please use "${sortBy}.0" to sort array fields.`)
  } else if (!fields.includes(sortBy)) {
    throw new Error(`"${sortBy}" is an invalid sortBy value for the "${model.name}" model.`)
  }

  const sort = sortBy === 'createdAt' && !query.sort ? -1 : (parseInt(query.sort || '') || 1)

  return {
    ...(limit ? { limit } : {}),
    ...(limit && page > 1 ? { skip: (page - 1) * limit } : {}),
    sort: {
      [sortBy]: sort,
      ...(sortBy !== 'createdAt' ? { createdAt: -1 } : {}),
    },
  }
}

/**
 * Picks fields from an object
 * @param {{ [key: string]: any }} obj
 * @param {string|RegExp|string[]|RegExp[]} keys
 */
export function pick (obj, keys) {
  // Similiar to underscore.pick
  if (!isObject(obj) && !isFunction(obj)) return {}
  const keysArr = toArray(keys)
  /** @type {{ [key: string]: unknown }} */
  let output = {}
  for (let key of keysArr) {
    if (typeof key === 'string' && obj.hasOwnProperty(key)) output[key] = obj[key]
    else if (key instanceof RegExp ) {
      for (let key2 in obj) {
        if (obj.hasOwnProperty(key2) && key2.match(key)) output[key2] = obj[key2]
      }
    }
  }
  return output
}

/**
 * 
 * Parses a query string into an object, or returns the last known matching cache
 * @param {string} searchString - location.search e.g. '?page=1&book=my+%2B+book&date.0=1234567890'
 * @param {Object} [options] - options
 * @param {boolean} [options.emptyStringAsTrue] - assign true to empty values
 * @param {boolean} [options.splitCommaSeparated=true] - split comma-separated values into arrays
 * @param {boolean} [options.groupArrayIndexes=true] - group splayed array indexes into real arrays, 
 *   E.g. 'date.0'='1234567890' -> 'date' = ['1234567890']
 * @returns {{[key: string]: string|true|(string|true)[]}} - e.g. { page: '1', book: 'my book', date: [1234567890] }
 * 
 * todo: maybe add toDeepObject param? be kinda cool to have
 */
export function queryObject (searchString, options={}) {
  if (searchString.startsWith('?')) searchString = searchString.slice(1)
  const { emptyStringAsTrue = false, splitCommaSeparated = true, groupArrayIndexes = true } = options
  const uniqueKey = searchString + (emptyStringAsTrue ? '-true' : '')

  if (searchString === '') return {}
  if (!queryObjectCache) queryObjectCache = {}
  if (queryObjectCache[uniqueKey]) return queryObjectCache[uniqueKey]

  const params = new URLSearchParams(searchString)
  /** @type {{[key: string]: string|true}} */
  const flattened = Object.fromEntries(params.entries())
  /** @type {{[key: string]: string|true|(string|true)[]}} */
  const result = {}
  // Loop through flattened query object.
  for (const key in flattened) {
    result[key] = flattened[key]
    // Convert empty strings to true, if emptyStringAsTrue is true
    if (emptyStringAsTrue) {
      if (!flattened[key] && flattened[key] !== '0') result[key] = true
    }
    // Split comma-separated values into arrays
    if (splitCommaSeparated && typeof flattened[key] === 'string' && flattened[key].includes(',')) {
      result[key] = flattened[key].split(',')
    }
    // Convert splayed array items into a array objects, e.g. 'customer.0' = '1' -> 'customer' = ['1']
    if (groupArrayIndexes && key.match(/\.\d+$/)) {
      const baseKey = key.replace(/\.\d+$/, '')
      const index = Number(key.match(/\.(\d+)$/)?.[1] || '0')
      if (Array.isArray(result[baseKey])) result[baseKey][index] = flattened[key]
      else result[baseKey] = [flattened[key]]
      delete result[key]
    }
  }

  queryObjectCache[uniqueKey] = result
  return result
}

/**
 * Parses a query string into an array of objects
 * @param {string} searchString - location.search, e.g. '?page=1'
 * @returns {object[]} - e.g. [{ page: '1' }]
 */
export function queryArray (searchString) {
  const query = queryObject(searchString)
  return Object.keys(query).map((key) => {
    return { [key]: query[key] }
  })
}

/**
 * Parses an object and returns a query string (deep value keys are flatterned, e.g. 'job.location=1')
 * @param {{[key: string]: unknown}} obj - query object
 * @param {string} [_path] - path to the object
 * @param {{[key: string]: string}} [_output] - output object
 * @param {Object} [options] - options
 * @param {boolean} [options.concatenateArrays=true] - will concatenate arrays into a comma-separated string, rather than separate keys, 
 *   E.g. { date: [1,2] } -> 'date=1,2'
 * @returns {string}
 */
export function queryString (obj, _path='', _output, options={}) {
  /** @type {{[key: string]: string}} */
  const output = _output || {}
  const { concatenateArrays = true } = options

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] == 'undefined' || obj[key] === '') continue
      else if (concatenateArrays && Array.isArray(obj[key])) output[_path + key] = obj[key].join(',')
      else if (typeof obj[key] == 'object') queryString(/** @type {{[key: string]: unknown}} */(obj[key]), _path+key+'.', output, options)
      else output[_path + key] = obj[key] + ''
    }
  }
  if (_path) return /** @type {string} */(/** @type {unknown} */ (output))
  const qs = new URLSearchParams(output).toString()
  return qs ? `?${qs}` : ''
}

/**
 * Axios request to the route
 * @param {string} route - e.g. 'post /api/user'
 * @param {{ [key: string]: any }} [data] - payload
 * @param {{preventDefault?: function}} [event] - event to prevent default
 * @param {[boolean, (value: boolean) => void]} [isLoading] - [isLoading, setIsLoading]
 * @param {SetState} [setState] - if passed, state.errors will be reset before the request
 * @returns {Promise<any>}
 * 
 * @example
 *   - request('post /api/user', { name: 'John' })
 *   - request(`get  /api/user/${id}`, undefined, e, isLoading)
 */
export async function request (route, data, event, isLoading, setState) {
  try {
    if (event?.preventDefault) event.preventDefault()
    const uri = route.replace(/^(post|put|delete|get) /, '')
    const method =
      /** @type {'post'|'put'|'delete'|'get'} */ (
        (route.match(/^(post|put|delete|get) /)?.[1] || 'post').trim()
      )

    // show loading
    if (isLoading) {
      if (isLoading[0]) return
      else isLoading[1](true)
    }

    // warning, not persisting through re-renders, but should be fine until loading is finished
    data = data || {}
    if (setState) setState((/** @type {{[key: string]: any}} */prev) => ({ ...prev, errors: [] }))

    // Find out if the data has files?
    let hasFiles = false
    /** @param {unknown} o */
    let recurse = (o) => {
      if (o instanceof File || hasFiles) hasFiles = true
      else if (o && typeof o === 'object') each(o, recurse)
    }
    recurse(data)

    // If yes, convert to form data
    /** @type {FormData|undefined} */
    const formData2 = hasFiles ? formData({ ...data }, { allowEmptyArrays: true, indices: true }) : undefined

    // send the request
    const axiosPromise = (method === 'get' || method === 'delete') 
      ? axios()[method](uri, { withCredentials: true })
      : axios()[method](uri, formData2 || data, { withCredentials: true })

    const [res] = await Promise.allSettled([
      axiosPromise,
      // setTimeoutPromise(() => {}, 200), // eslint-disable-line
    ])

    // success
    if (isLoading) isLoading[1](false)
    if (res.status == 'rejected') throw res.reason
    return res.value.data

  } catch (errs) {
    if (isLoading) isLoading[1](false)
    throw getResponseErrors(errs)
  }
}

/**
 * Removes undefined from an array or object
 * @param {[]|{[key: string]: any}} variable
 * @returns {[]|{[key: string]: any}}
 */
export function removeUndefined (variable) {
  // Removes undefined from an array or object
  if (Array.isArray(variable)) {
    for (let i = variable.length; i--; ) {
      if (variable[i] === undefined) variable.splice(i, 1)
    }
  } else {
    Object.keys(variable).forEach((key) => {
      if (key in variable && variable[key] === undefined) delete variable[key]
    })
  }
  return variable
}

/**
 * Build image URL from image array or object
 * @typedef {{path: string, bucket: string, base64?: string, date?: number}} Image
 * @param {string} awsUrl - e.g. 'https://s3.amazonaws.com/...'
 * @param {Image[]|Image} imageOrArray - file object/array
 * @param {string} [size] - overrides to 'full' when the image sizes are still processing
 * @param {number} [i] - array index
 * @returns {string}
 */
export function s3Image (awsUrl, imageOrArray, size='full', i) {
  let lambdaDelay = 7000
  let usingMilliseconds = true

  const image = /**@type {Image}*/(Array.isArray(imageOrArray) ? imageOrArray[i||0] : imageOrArray)
  if (!image) return ''
  // Alway use preview if available
  if (image.base64) return image.base64
  // Wait a moment before the different sizes are generated by lambda
  if (((usingMilliseconds ? (image.date || 0) : (image.date || 0) * 1000) + lambdaDelay) > new Date().getTime()) size = 'full'
  let key = size == 'full' ? image.path : `${size}/${image.path.replace(/^full\/|\.[a-z0-9]{3,4}$/ig, '')}.jpg`
  return awsUrl + image.bucket + '/' + key
}

/**
 * Sanitize and encode all HTML in a user-submitted string
 * @param {string} string
 * @returns {string}
 */
export function sanitizeHTML (string) {
  var temp = document.createElement('div')
  temp.textContent = string
  return temp.innerHTML
}

/**
 * Process scrollbar width once.
 * @param {string} [paddingClass] - class name to give padding to
 * @param {string} [marginClass] - class name to give margin to
 * @param {number} [maxWidth] - enclose css in a max-width media query
 * @param {string} [marginClassNegative] - class name to give negative margin to
 * @returns {number}
 * 
 */
export function scrollbar (paddingClass, marginClass, marginClassNegative, maxWidth) {
  if (typeof window === 'undefined') return 0
  if (scrollbarCache || scrollbarCache === 0) {
    return scrollbarCache
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
  if (outer.parentNode) outer.parentNode.removeChild(outer)
  scrollbarCache = widthNoScroll - widthWithScroll

  // Add padding class. (CHANGED, need to test)
  if (paddingClass || marginClass) {
    const style = document.createElement('style')
    style.textContent = 
      (maxWidth ? '@media only screen and (max-width: ' + maxWidth + 'px) {' : '') +
      (paddingClass ? paddingClass + ' {padding-right:' + scrollbarCache + 'px}' : '') +
      (marginClass ? marginClass + ' {margin-right:' + scrollbarCache + 'px}' : '') +
      (marginClassNegative ? marginClassNegative + ' {margin-right:' + scrollbarCache * -1 + 'px}' : '') +
      (maxWidth ? '}' : '')
    document.head.appendChild(style)
  }

  // return.
  return scrollbarCache
}

/**
 * Convert seconds to time
 * @param {number} seconds
 * @param {boolean} [padMinute]
 * @returns {string}
 */
export function secondsToTime (seconds, padMinute) {
  seconds = Math.round(seconds)
  let hours = Math.floor(seconds / (60 * 60))
  let divisor_for_minutes = seconds % (60 * 60)
  let minutes = Math.floor(divisor_for_minutes / 60)
  let divisor_for_seconds = divisor_for_minutes % 60
  let secs = Math.ceil(divisor_for_seconds)
  let data = {
    h: (hours + ''),
    m: (minutes + '').padStart(padMinute ? 2 : 1, '0'),
    s: (secs + ''),
  }
  return data.h + ':' + data.m
}

/**
 * Promise wrapper for setTimeout
 * @param {function} func
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
export function setTimeoutPromise (func, milliseconds) {
  return new Promise(function(resolve) {
    setTimeout(() => resolve(func()), milliseconds)
  })
}

/**
 * Shows a global error
 * @param {function} setStore
 * @param {NitroErrorRaw} errs
 */
export function showError (setStore, errs) {
  let detail = getResponseErrors(errs)[0].detail
  setStore((/** @type {{[key: string]: any}} */o) => ({ ...o, message: { type: 'error', text: detail } }))
}

/**
 * Sort an array of objects by a key
 * @param {{[key: string]: any}[]} collection
 * @param {string} key
 * @returns {object[]}
 */
export function sortByKey (collection, key) {
  return collection.sort(function (a, b) {
    var textA = (key in a ? a[key] : '').toUpperCase()
    var textB = (key in b ? b[key] : '').toUpperCase()
    return textA < textB ? -1 : textA > textB ? 1 : 0
  })
}

/**
 * @template {(...args: any[]) => any} T
 * Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds
 * 
 * @param {T} func - The function to throttle.
 * @param {number} [wait=0] - the number of milliseconds to throttle invocations to
 * @param {{
 *    leading?: boolean, // invoke on the leading edge of the timeout (default: true)
 *    trailing?: boolean, // invoke on the trailing edge of the timeout (default: true)
 * }} [options] - options object
 * @returns {((...args: Parameters<T>) => ReturnType<T>) & { 
 *     cancel: () => void;
 *     flush: () => ReturnType<T>
 * }}
 * @example const throttled = throttle(updatePosition, 100)
 * @see lodash
 */
export function throttle (func, wait, options) {
  let leading = true
  let trailing = true
  if (typeof func != 'function') {
    throw new TypeError('Expected a function')
  }
  if (options) {
    leading = 'leading' in options ? !!options.leading : leading
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }
  return debounce(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing,
  })
}

/**
 * Convert a variable to an array, if not already an array.
 * @template T
 * @param {T | undefined} variable
 * @returns {(T extends any[] ? T : T[])}
 */
export function toArray (variable) {
  if (variable === undefined) {
    // TypeScript can’t infer conditional return types from runtime empty array
    // So we force-cast it to the generic fallback type
    return /** @type {T extends any[] ? T : T[]} */([])
  }
  return /** @type {T extends any[] ? T : T[]} */(Array.isArray(variable) ? variable : [variable])
}

/**
 * Trim a string and replace multiple newlines with double newlines
 * @param {string} string
 * @returns {string}
 */
export function trim (string) {
  if (!string || !isString(string)) return ''
  return string.trim().replace(/\n\s+\n/g, '\n\n')
}

// Create a custom twMerge instance
const customTailwindMerge = createTailwindMerge(() => {
  const config = getDefaultConfig()

  /**
   * @param {string[]} baseNames - base names for x-axis (e.g. 'input-x')
   * @returns {object} extended classGroups with new spacing classes
   */
  function newSpacingSizes(baseNames) {
    const obj = {
      pl: [...(/** @type {any} */(config.classGroups.pl) ?? [])],
      pr: [...(/** @type {any} */(config.classGroups.pr) ?? [])],
      pt: [...(/** @type {any} */(config.classGroups.pt) ?? [])],
      pb: [...(/** @type {any} */(config.classGroups.pb) ?? [])],
      px: [...(/** @type {any} */(config.classGroups.px) ?? [])],
      py: [...(/** @type {any} */(config.classGroups.py) ?? [])],
      p: [...(/** @type {any} */(config.classGroups.p) ?? [])],
      ml: [...(/** @type {any} */(config.classGroups.ml) ?? [])],
      mr: [...(/** @type {any} */(config.classGroups.mr) ?? [])],
      mt: [...(/** @type {any} */(config.classGroups.mt) ?? [])],
      mb: [...(/** @type {any} */(config.classGroups.mb) ?? [])],
      mx: [...(/** @type {any} */(config.classGroups.mx) ?? [])],
      my: [...(/** @type {any} */(config.classGroups.my) ?? [])],
      m: [...(/** @type {any} */(config.classGroups.m) ?? [])],
      gap: [...(/** @type {any} */(config.classGroups.gap) ?? [])],
    }
  
    // Add both axes classes
    for (const baseName of baseNames) {
      obj.pl.push(`pl-${baseName}`)
      obj.pr.push(`pr-${baseName}`)
      obj.pt.push(`pt-${baseName}`)
      obj.pb.push(`pb-${baseName}`)
      obj.px.push(`px-${baseName}`)
      obj.py.push(`py-${baseName}`)
      obj.p.push(`p-${baseName}`)
      obj.ml.push(`ml-${baseName}`)
      obj.mr.push(`mr-${baseName}`)
      obj.mt.push(`mt-${baseName}`)
      obj.mb.push(`mb-${baseName}`)
      obj.mx.push(`mx-${baseName}`)
      obj.my.push(`my-${baseName}`)
      obj.m.push(`m-${baseName}`)
      obj.gap.push(`gap-${baseName}`)
    }
    return obj
  }
  return {
    ...config,
    classGroups: {
      ...config.classGroups,
      ...newSpacingSizes(['input-x', 'input-x-icon', 'input-y', 'input-before', 'input-after', 'input-icon']),
      'shadow': [...(config.classGroups.shadow || []), 'shadow-dropdown-ul'],
      'font-size': [...(config.classGroups['font-size'] || []), 'text-button-base', 'text-input-base'],
    },
  }
})

/**
 * Merge class conflicts together, but protect groups of classes from being merged together in the same argument. E.g. `(mb-1 mb-2) mx-1`
 * @param {string[]} args
 * @returns {string}
 */
export function twMerge(...args) {
  const raw = twJoin(args)
  if (!raw.includes('(')) return customTailwindMerge(raw)

  // 1) Tokenize: either "(...)" group chunks or normal non-space tokens.
  /** @type {{ cls: string, groupId: number }[]} */
  const tokens = []
  let groupId = 0

  const re = /\(([^()]*)\)|(\S+)/g
  for (let m; (m = re.exec(raw)); ) {
    const groupText = m[1]
    const single = m[2]

    if (groupText != null) {
      const id = ++groupId
      for (const cls of groupText.trim().split(/\s+/).filter(Boolean)) {
        tokens.push({ cls: cls, groupId: id })
      }
    } else if (single) {
      tokens.push({ cls: single, groupId: 0 })
    }
  }

  // 3) Merge, except don't merge-away conflicts inside the same "( ... )" group.
  /** @type {(string|null)[]} */
  const out = []
  /** @type {number[]} */
  const groupIds = []

  for (const t of tokens) {
    for (let i = out.length - 1; i >= 0; i--) {
      const prev = out[i]
      const next = t.cls
      if (!prev) continue

      // Does next override prev, according to tailwind-merge?
      const parts = customTailwindMerge(`${prev} ${next}`).trim().split(/\s+/).filter(Boolean)
      const isOverride = !parts.includes(prev) && parts.includes(next)

      if (isOverride) {
        const sameProtectedGroup = t.groupId !== 0 && t.groupId === groupIds[i]
        if (!sameProtectedGroup) out[i] = null
      }
    }

    out.push(t.cls)
    groupIds.push(t.groupId)
  }

  return out.filter(Boolean).join(' ')

  // const testCases = [
  //   [['mb-1 mb-2 mb-input-x'], 'mb-input-x'],
  //   [['mb-1 mb-2 my-input-y'], 'my-input-y'],
  //   [['mb-1 my-input-y mb-2'], 'my-input-y mb-2'],
  //   [['mb-1 my-input-y mb-2 my-input-x'], 'my-input-x'],
  //   [['mx-1 my-input-y mb-2 my-input-x'], 'mx-1 my-input-x'],
  //   [['text-xs text-nonexistent text-input-base'], 'text-nonexistent text-input-base'],
  //   [['(mb-1 mb-input-x) mx-1 mx-2', ''], 'mb-1 mb-input-x mx-2'],
  //   [['(mb-1 mb-input-x) mx-1 mx-2', 'mb-2'], 'mx-2 mb-2'],
  // ]
  
  // testCases.forEach(testCase => {
  //   const value = twMerge(...testCase[0])
  //   if (value !== testCase[1]) {
  //     console.log(`Test: ${testCase[1]}, received: ${value}`)
  //   }
  // })
}

/**
 * Capitalize the first letter of a string
 * @param {string} string
 * @returns {string}
 */
export function ucFirst (string) {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}
