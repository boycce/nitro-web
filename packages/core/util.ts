import _axios, { CreateAxiosDefaults } from 'axios'
import axiosRetry from 'axios-retry'
import { format } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { loadStripe } from '@stripe/stripe-js/pure.js' // pure removes ping
import { twMerge as _twMerge, twJoin, createTailwindMerge, getDefaultConfig } from 'tailwind-merge'
import type { Dispatch, SetStateAction } from 'react'
import { getClientErrors } from './util.errors.js'

// Re-export TZDate
export { TZDate } from '@date-fns/tz'

// Re-export util.errors
export * from './util.errors.js'

// Create an axios instance type that contains the `axios-retry` global declarations.
// We only need to fix the `get` method, the rest of the methods inherit the new extended config...
type AxiosInstanceWithRetry = Omit<AxiosInstance, 'get'> & {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  get<T = unknown, R = AxiosResponse, D = unknown>(url: string, config?: AxiosRequestConfigWithRetry): Promise<R>
}
type AxiosInstance = import('axios').AxiosInstance
type AxiosRequestConfig = import('axios').AxiosRequestConfig
type AxiosResponse = import('axios').AxiosResponse
type IAxiosRetryConfigExtended = import('axios-retry').IAxiosRetryConfigExtended
type AxiosRequestConfigWithRetry = AxiosRequestConfig & { 'axios-retry'?: IAxiosRetryConfigExtended }

type Box = {bottomLeft: Point, topRight: Point}
type EnumArray = (string|number|boolean)[]
type EventOrPathValue = {target: {name: string, value: unknown}} | [string, unknown]
type Image = {path: string, bucket: string, base64?: string, date?: number}
type ObjectId = { toString: () => string, toHexString: () => string, toJSON: () => { value: string }}
type ParseId = (value: string) => ObjectId
type Point = [number, number] // lng/lat
type QueryObjectCache = { [key: string]: string|true|(string|true)[] }
type SearchOperators = { [key: string]: unknown } // https://mongodb.com/docs/atlas/atlas-search/operators-and-collectors/

const queryObjectsCache: { [key: string]: QueryObjectCache } = {}
let stripeClientCache: Promise<import('@stripe/stripe-js').Stripe|null> | undefined
let scrollbarCache: number | undefined
let axiosNonce: boolean | undefined
let axiosInstance: AxiosInstance | undefined

/**
 * Returns a monastery schema which matches the Google autocomplete output
 */
export function addressSchema () {
  // Google autocomplete should return the following object
  function arrayWithSchema <T extends unknown[], S extends {[key: string]: unknown}>(
    array: T, 
    schema: S
  ) {
    const result = array as T & { schema: S }
    result.schema = schema
    return result
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
 * @param options.createConfig - [server only] Pass to create a shared instance on the server, 
 *   e.g. { httpsAgent: new https.Agent({ keepAlive: true }) }
 * 
 * @example
 *   - You can set the defaults (e.g. defaults.baseURL), via the follwing:
 *   ```js
 *     import { axios } from 'nitro-web/util'
 *     axios().defaults.baseURL = 'https://example.com'
 *   ```
 *  */
export function axios ({ createConfig }: { createConfig?: CreateAxiosDefaults } = {}): AxiosInstanceWithRetry {
  if (typeof window !== 'undefined') {
    if (!axiosNonce) {
      // Remove mobile specific protocol and subdomain
      const baseUrl = window.document.location.origin.replace(/^(capacitor|https):\/\/(mobile\.)?/, 'https://')
      axiosNonce = true
      _axios.defaults.baseURL = baseUrl
      _axios.defaults.headers.desktop = true
      _axios.defaults.withCredentials = true
      _axios.defaults.timeout = 60000
      axiosRetry(_axios, { retries: 0, retryDelay: (/*i*/) => 300 })
    }
    return _axios as AxiosInstanceWithRetry

  // On the server, we can create an axios instance if we want to maintain keep-alive (for Azure SNAT Port Exhaustion / speed up requests)
  // E.g. axios({ createConfig: { httpsAgent: new https.Agent({ keepAlive: true }) } })
  } else {
    if (!axiosInstance && createConfig) axiosInstance = _axios.create(createConfig)
    return axiosInstance || _axios as AxiosInstance
  }
}

/**
 * Builds the url with params
 * @example 'https://example.com?param1=value1&param2=value2'
 */
export function buildUrl (url: string, parameters: {[key: string]: string}) {
  const params = Object.keys(parameters).map((p) => `${encodeURIComponent(p)}=${encodeURIComponent(parameters[p])}`)
  return [url, params.join('&')].join('?')
}

/**
 * Converts a string to camel case
 * @param capitaliseFirst - Capitalise the first letter
 * @param allowNumber - Allow numbers
 */
export function camelCase (str: string, capitaliseFirst?: boolean, allowNumber?: boolean) {
  const regex = (capitaliseFirst ? '(?:^[a-z0-9]|' : '(?:') + '[-]+[a-z0-9])'
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
 * @param captialiseFirstOnly - Capitalise the first letter only
 */
export function camelCaseToTitle (str: string, captialiseFirstOnly?: boolean) {
  str = str.replace(/([A-Z]+)/g, ' $1').trim()
  if (captialiseFirstOnly) str = str.toLowerCase()
  return ucFirst(str)
}

/**
 * Converts camel case to hypen case
 */
export function camelCaseToHypen (str: string) {
  return str.replace(/[A-Z]|[0-9]+/g, m => '-' + m.toLowerCase())
}

/**
 * Converts hypen case to title case
 * @param str - string to convert
 * @param justCapitaliseFirst - Just capitalise the first letter
 */
export function hypenCaseToTitle (str: string, justCapitaliseFirst?: boolean) {
  if (justCapitaliseFirst) return ucFirst(str.replace(/-/g, ' '))
  else return str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

/**
 * Capitalises a string
 * @param str - string to convert
 */
export function capitalise (str: string) {
  return (str||'').replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
}

/**
 * Formats a currency string
 * @param decimals - Number of decimal places (default: 2)
 * @param decimalsMinimum - Minimum number of decimal places
 */
export function currency (cents: number, decimals = 2, decimalsMinimum?: number) {
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
 * @example '$1,234.00' => '123400'
 */
export function currencyToCents (currency: string) {
  // Converts '$1,234.00' to '1234.00', then to '123400'
  const currencyString = Number(currency.replace(/[^0-9.]/g, '')).toFixed(2)
  return currencyString.replace(/\./g, '')
}

/**
 * Returns a formatted date string
 * @param date - number can be in seconds or milliseconds (UTC)
 * @param pattern - e.g. "dd mmmm yy" (https://date-fns.org/v4.1.0/docs/format#)
 * @param timezone - convert a UTC date to a particular timezone.
 */
export function date (date: number | Date, pattern?: string, timezone?: string) {
  if (!date) return ''
  const timestamp = typeof date === 'number' ? date : isDate(date) ? date?.getTime() : 0
  const timestampInTz = timezone ? new Date(new Date(timestamp).toLocaleString('en-US', { timeZone: timezone })).getTime() : timestamp
  return format(timestampInTz, pattern ?? 'do MMMM')
}

/**
 * Get the same time in a given timezone, and optionally, set the time relative to the timezone (e.g. via timesString = '13:00')
 * @param date - number can be in seconds or milliseconds (UTC)
 * @param timezone - defaults to local timezone
 * @param timeString - 24h time string to change the time to in the new timezone, e.g. '13:00' or '13:00:01'
 * 
 * @link https://github.com/date-fns/tz
 */
export function dateInTimezone (date: number | Date, timezone?: string, timeString?: string) {
  const _date = new Date(typeof date === 'number' ? date : date.getTime())

  // No effect if no timezone or timeString provided
  if (!timezone && !timeString) throw new Error('dateInTimezone: Please pass a timezone and/or timeString.')

  // Create a date in a given timezone using the same time
  const dateInTz = new TZDate(
    _date.getFullYear(),
    _date.getMonth(),
    _date.getDate(),
    _date.getHours(),
    _date.getMinutes(),
    _date.getSeconds(),
    (timezone ?? 0) as string // will think its just milliseconds if undefined
  )
  
  // If a time string is provided, change the time
  if (timeString) {
    const timeParts = timeString.split(':') 
    const msg = `dateInTimezone: Invalid time string, please use a 24h format "13:00", received: "${timeString}"`
    if (timeParts.length < 2 || timeParts.length > 3) throw new Error(msg)
    const [hours, minutes, seconds] = timeParts.map((value, index) => {
      const num = parseFloat(value)
      if (isNaN(num) || (index === 0 && (num > 23 || num < 0)) || (index > 0 && (num > 59 || num < 0))) throw new Error(msg)
      return num
    })
    dateInTz.setHours(hours)
    dateInTz.setMinutes(minutes)
    dateInTz.setSeconds(seconds || 0)
  }
  return dateInTz.getTime()
  
  // // test (both should be different, second )
  // console.log(
  //   new Date(dateInTimezone(new Date(), 'America/New_York', '13:00')),
  //   new Date(dateInTimezone(new Date())) // uses local timezone
  // )
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 *
 * @param wait - Number of milliseconds to delay (default: 0)
 * @param options - Options to control behavior
 * @param options.leading - invoke on the leading edge of the timeout (default: false)
 * @param options.maxWait - maximum time `func` is allowed to be delayed before it's invoked 
 * @param options.trailing - invoke on the trailing edge of the timeout (default: true)
 * @example const debounced = debounce(updatePosition, 100)
 * @see https://lodash.com/docs/4.17.15#debounce
 */
export function debounce<T extends (...args: any[]) => any>( // eslint-disable-line @typescript-eslint/no-explicit-any
  func: T, 
  wait = 0, 
  options?: {
    leading?: boolean
    maxWait?: number
    trailing?: boolean
  }
): ((...args: Parameters<T>) => ReturnType<T>) & {
  cancel: () => void
  flush: () => ReturnType<T>
} {
  let lastArgs: Parameters<T> | undefined
  let lastThis: unknown
  let maxWait: number | undefined
  let result: ReturnType<T>
  let timerId: ReturnType<typeof setTimeout> | undefined
  let lastCallTime: number | undefined
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

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs
    const thisArg = lastThis
    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args ? args : []) as ReturnType<T>
    return result
  }

  function leadingEdge(time: number): ReturnType<T> {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime ?? 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall
    return maxing
      ? Math.min(timeWaiting, (maxWait ?? 0) - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time: number): boolean {
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

  function timerExpired(): void {
    const time = Date.now()
    if (shouldInvoke(time)) {
      trailingEdge(time)
      return
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time: number): ReturnType<T> {
    timerId = undefined
    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = undefined
    return result
  }

  function cancel(): void {
    if (timerId !== undefined) {
      clearTimeout(timerId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timerId = undefined
  }

  function flush(): ReturnType<T> {
    return timerId === undefined ? result : trailingEdge(Date.now())
  }

  function debounced(this: unknown, ...args: Parameters<T>): ReturnType<T> {
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
 */
export function deepCopy<T>(obj: T): T {
  if (!obj) return obj
  if (typeof obj !== 'object') return obj

  // Create a new instance based on the input type
  const clone = (Array.isArray(obj) ? [] : {}) as T

  for (const key in obj) {
    const value = obj[key]
    clone[key] = typeof value === 'object' && !isHex24(value) ? deepCopy(value) : value
  }

  return clone
}

/**
 * Retrieves a nested value from an object or array from a dot-separated path.
 * @param path - Dot-separated path (e.g. "owner.houses.0.color").
 */
export function deepFind<T = unknown>(obj: object | unknown[], path: string) {
  if (!obj) return undefined
  if (typeof obj !== 'object') return undefined

  const chunks = path.split('.')
  let target: unknown = obj

  for (const chunk of chunks) {
    if (target === null || target === undefined) return undefined
    target = (target as Record<string, unknown>)[chunk]
  }

  return target as T | undefined
}

/**
 * Saves a deeply nested value without mutating the original object.
 * @param path - Dot-separated path to the nested property.
 * @param value - The value to set, or a function to compute it from the current value.
 */
export function deepSet<T>(obj: T, path: string, value: unknown | ((current: unknown) => unknown)) {
  if (obj === null || obj === undefined) return obj
  return deepSetWithInfo(obj, path, value).obj
}

/**
 * Sets a deeply nested value without mutating the original object.
 * @param path - Dot-separated path to the nested property.
 * @param value - The value to set, or a function to compute it from the current value.
 */
export function deepSetWithInfo<T>(
  _obj: T, 
  path: string, 
  value: unknown | ((current: unknown) => unknown)
) {
  const obj = (Array.isArray(_obj) ? [..._obj] : { ..._obj }) as T
  let parent: T = obj
  const chunks = (path || '').split('.')

  for (let i = 0, l = chunks.length; i < l; i++) {
    const key = chunks[i]
    const isLast = i === l - 1

    if (isLast) {
      // was obj for onChange()
      (parent as {[key: string]: unknown})[key] = typeof value === 'function' ? value((parent as {[key: string]: unknown})[key]) : value 
    } else {
      const nextIsArray = /^\d+$/.test(chunks[i + 1])
      const current = (parent as {[key: string]: unknown})[key]

      // If the next level doesn't exist, create an empty array/object
      const parentCopy = nextIsArray
        ? Array.isArray(current) ? [...current] : []
        : typeof current === 'object' && current !== null ? { ...current } : {}

      parent = (parent as {[key: string]: unknown})[key] = parentCopy as T
    }
  }
  return {
    obj: obj,
    parent: parent,
    fieldName: chunks.pop() ?? '',
  }
}

/**
 * Recursively traverses arrays and plain objects and replaces
 * every value strictly equal to "{VALUE}".
 *
 * - Does not mutate the original input
 * - Only traverses plain objects and arrays
 * - Throws if a circular reference is detected
 * 
 * @throws {Error}
 */
export function deepSetWithMatch<T>(input: T, matchingValue: unknown, value: unknown): T {
  const seen = new WeakMap()

  function walk(input2: unknown): unknown {
    if (input2 === matchingValue) return value
    if (Array.isArray(input2)) {
      return input2.map(walk)
    }
    if (input2 && typeof input2 === 'object') {
      const proto = Object.getPrototypeOf(input2)
      if (proto !== Object.prototype && proto !== null) return input2
      if (seen.has(input2)) throw new Error('Circular reference detected')

      const result = {} as Record<string, unknown>
      seen.set(input2, result)

      for (const key of Object.keys(input2)) {
        result[key] = walk(input2[key as keyof typeof input2])
      }
      return result
    }
    return input2
  }

  return (walk(input)) as T
}

/**
 * Iterates over an object or array
 * @param iteratee - Function to call for each item
 * @param context - Context to bind to the iteratee function
 */
export function each (
  obj: {[key: string]: unknown} | unknown[] | null,
  iteratee: (value: unknown, index: number | string, obj: unknown) => void,
  context?: unknown
) {
  // Similar to the underscore.each method
  const shallowLen = obj === null ? void 0 : (obj as {length?: number})['length']
  const isArrayLike = typeof shallowLen == 'number' && shallowLen >= 0
  if (obj === null) {
    return null
  } else if (isArrayLike) {
    for (let i = 0, l = (obj as unknown[]).length; i < l; i++) {
      iteratee.call(context || null, (obj as unknown[])[i], i, obj)
    }
  } else {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue
      iteratee.call(context || null, (obj as {[key: string]: unknown})[key], key, obj)
    }
  }
  return obj
}

/**
 * Downloads a file
 * @param filename - Name of the file to download
 * @param mime - MIME type of the file
 * @param bom - Byte order mark to prepend
 * 
 * @link https://github.com/kennethjiang/js-file-download
 */
export function fileDownload (
  data: string | Blob | File | Uint8Array,
  filename: string,
  mime?: string,
  bom?: string
) {
  if (typeof window === 'undefined') return
  const blobData = (typeof bom !== 'undefined') ? [bom, data as BlobPart] : [data as BlobPart] // todo: types are off here
  const blob = new Blob(blobData, {type: mime || 'application/octet-stream'})

  if (typeof (window.navigator as {msSaveBlob?: (blob: Blob, filename: string) => void}).msSaveBlob !== 'undefined') {
    (window.navigator as unknown as {msSaveBlob: (blob: Blob, filename: string) => void}).msSaveBlob(blob, filename)
  } else {
    const blobURL = (window.URL && window.URL.createObjectURL)
      ? window.URL.createObjectURL(blob)
      : window.webkitURL.createObjectURL(blob)
    const tempLink = document.createElement('a')
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
 * @param ignoreHyphen - Whether to ignore hyphens when formatting
 */
export function formatName (string: string, ignoreHyphen?: boolean) {
  return ignoreHyphen
    ? ucFirst(string.toString().trim())
    : ucFirst(string.toString().trim().replace('-', ' '))
}

/**
 * Formats a string into a slug
 */
export function formatSlug (string: string) {
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
 * @param cfg - config
 * @param existingFormData - Existing FormData instance to append to
 * @param keyPrefix - Prefix for keys
 * @link https://github.com/therealparmesh/object-to-formdata
 */
export function formData (
  obj: {[key: string]: unknown},
  cfg?: {
    allowEmptyArrays?: boolean
    indices?: boolean
    nullsAsUndefineds?: boolean
    booleansAsIntegers?: boolean
  },
  existingFormData?: FormData,
  keyPrefix?: string
) {
  const serialize = (
    obj: unknown,
    cfg: {
      allowEmptyArrays?: boolean
      indices?: boolean
      nullsAsUndefineds?: boolean
      booleansAsIntegers?: boolean
    },
    existingFormData?: FormData,
    keyPrefix = ''
  ) => {
    cfg = cfg || {}
    cfg.indices = cfg.indices === undefined ? false : cfg.indices
    cfg.nullsAsUndefineds = cfg.nullsAsUndefineds === undefined ? false : cfg.nullsAsUndefineds
    cfg.booleansAsIntegers = cfg.booleansAsIntegers === undefined ? false : cfg.booleansAsIntegers
    cfg.allowEmptyArrays = cfg.allowEmptyArrays === undefined ? false : cfg.allowEmptyArrays
    existingFormData = existingFormData || new FormData()

    const isBlob = typeof obj === 'object' && 
      obj !== null &&
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
        existingFormData.append(keyPrefix, obj ? 'true' : 'false') // ts: changed from obj to obj ? 'true' : 'false'
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
        const value = (obj as {[key: string]: unknown})[prop]
        if (Array.isArray(value)) {
          while (prop.length > 2 && prop.lastIndexOf('[]') === prop.length - 2) {
            prop = prop.substring(0, prop.length - 2)
          }
        }
        const key = keyPrefix ? keyPrefix + '[' + prop + ']' : prop
        serialize(value, cfg, existingFormData, key)
      })
    } else {
      existingFormData.append(keyPrefix, obj as Blob | string)
    }
    return existingFormData
  }
  return serialize(obj, cfg || {}, existingFormData, keyPrefix)
}

/**
 * Returns capitalized full name
 */
export function fullName (object: {firstName: string, lastName: string}) {
  return ucFirst(object.firstName) + ' ' + ucFirst(object.lastName)
}

/**
 * Splits a full name into first and last names
 * @example ['John', 'Smith']
 */
export function fullNameSplit (string: string) {
  string = string.trim().replace(/\s+/, ' ')
  if (string.match(/\s/)) {
    return [string.substring(0, string.lastIndexOf(' ')), string.substring(string.lastIndexOf(' ') + 1)]
  } else {
    return [string, '']
  }
}

/**
 * Returns a list of country options
 */
export function getCountryOptions (countries: {[key: string]: { name: string }}) {
  const output = []
  for (const iso in countries) {
    const name = countries[iso].name
    output.push({ value: iso, label: name, flag: iso.toUpperCase() })
  }
  return output
}

/**
 * Returns a list of currency options
 */
export function getCurrencyOptions (currencies: {[key: string]: { name: string }}) {
  const output = []
  for (const iso in currencies) {
    const name = currencies[iso].name
    output.push({ value: iso, label: name })
  }
  return output
}

/**
 * Get the width of a prefix
 * @param paddingRight - Additional padding to add to the width (default: 0)
 */
export function getPrefixWidth (prefix: string, paddingRight = 0) {
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
 * @param path - e.g. `import path from 'path'`
 * @param pwd - Current working directory
 */
export function getDirectories (
  path: { join: (...args: string[]) => string },
  pwd?: string
) {
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
 * @param stripePublishableKey - Stripe publishable key
 */
export function getStripeClientPromise (stripePublishableKey: string) {
  return stripeClientCache || (stripeClientCache = loadStripe(stripePublishableKey))
}

/**
 * Checks if a value is in an array, and returns it (todo, update this to not use optional key)
 * @param value - Value to search for
 * @param key - optional, to match across on a collection of objects
 */
export function inArray2 (array: unknown[], value?: unknown, key?: string) {
  if (!array || typeof value == 'undefined') return false
  else if (typeof key == 'undefined') return array.includes(value)
  else 
    for (let i = array.length; i--; ) {
      if (typeof array[i] === 'object' && array[i] !== null) { // ts: added null check
        const item = array[i] as {[key: string]: unknown}
        if (key in item && item[key] == value) return array[i]
      }
    }
  return false
}

/**
 * Checks if a variable is an array
 */
export function isArray (variable: unknown) {
  return Array.isArray(variable)
}

/**
 * Checks if a variable is a date
 */
export function isDate (variable: unknown) {
  return !!(typeof variable === 'object' && variable && 'getMonth' in variable)
}

/**
 * Checks if a variable is defined
 */
export function isDefined (variable: unknown) {
  return typeof variable !== 'undefined'
}

/**
 * Checks if a variable is an email
 */
export function isEmail (email: string) {
  // eslint-disable-next-line
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase())
}

/**
 * Checks if an object is empty
 * @param truthyValuesOnly - Only check for truthy values
 */
export function isEmpty (obj?: {[key: string]: unknown} | null, truthyValuesOnly?: boolean) {
  // note req.files doesn't have a hasOwnProperty method
  if (obj === null || typeof obj === 'undefined') return true
  for (const prop in obj) {
    if (obj[prop] || (!truthyValuesOnly && obj.hasOwnProperty && obj.hasOwnProperty(prop))) return false
  }
  return true
}

/**
 * Checks if a variable is a function
 */
export function isFunction (variable: unknown) {
  return typeof variable === 'function' ? true : false
}

/**
 * Checks if a variable is a hex string
 */
export function isHex24 (value: unknown) {
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
 */
export function isNumber (variable: unknown) {
  return !isNaN(parseFloat(variable as string)) && isFinite(variable as number)
}

/**
 * Checks if a variable is an object
 */
export function isObject (variable: unknown) {
  // Excludes null and array's
  return variable !== null && typeof variable === 'object' && !(variable instanceof Array) ? true : false
}

/**
 * Checks if a variable is a regex
 */
export function isRegex (variable: unknown) {
  return variable instanceof RegExp ? true : false
}

/**
 * Checks if a variable is a string
 */
export function isString (variable: unknown) {
  return typeof variable === 'string' || variable instanceof String ? true : false
}

/**
 * Converts the first character of a string to lowercase
 */
export function lcFirst (string: string) {
  return string.charAt(0).toLowerCase() + string.slice(1)
}

/**
 * Trims a string to a maximum length, and removes any partial words at the end
 * @param len - Maximum length (default: 100)
 * @param showEllipsis - Whether to show ellipsis (default: true)
 */
export function maxLength (string: string, len = 100, showEllipsis = true) {
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
 * @param bottomLeftOrBox - Either a Point or a Box object
 * @param topRight - Top right point (required if bottomLeftOrBox is a Point)
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
export function mongoAddKmsToBox (
  km: number,
  bottomLeftOrBox: Point | Box,
  topRight?: Point
) {
  let bottomLeft: Point
  if (typeof bottomLeftOrBox === 'object' && 'bottomLeft' in bottomLeftOrBox) {
    topRight = bottomLeftOrBox.topRight
    bottomLeft = bottomLeftOrBox.bottomLeft
  } else {
    bottomLeft = bottomLeftOrBox
  }
  if (!bottomLeft || !topRight) {
    return null
  }
  const lat = (lat: number, kms: number) => lat + (kms / 6371) * (180 / Math.PI)
  const lng = (lng: number, lat: number, kms: number) => lng + (kms / 6371) * (180 / Math.PI) / Math.cos(lat * Math.PI/180)
  return [
    [lng(bottomLeft[0], bottomLeft[1], -km), lat(bottomLeft[1], -km)],
    [lng(topRight[0], -topRight[1], km), lat(topRight[1], km)],
  ]
}
/**
 * Returns a mongo query to find documents within a passed address
 * @param km - Kilometers to expand the search area
 * @param prefix - Prefix for the location field in the query
 */
export function mongoDocWithinPassedAddress (
  address: {
    area?: {bottomLeft: [number, number], topRight: [number, number]}
    location?: {coordinates: [number, number]}
  },
  km: number,
  prefix: string
) {
  // let type = ''
  const areaSize = 5
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
    const box = mongoAddKmsToBox(km, address.area)
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
 * @param point1 - [lng, lat] ([192.2132.., 212.23323..])
 * @param point2 - [lng, lat] ([192.2132.., 212.23323..])
 */
export function mongoPointDifference (point1: [number, number], point2: [number, number]) {
  const R = 6371 // km
  const mongoDegreesToRadians = (degrees: number) => degrees * (Math.PI / 180)
  const dLat = mongoDegreesToRadians(point2[1]-point1[1])
  const dLon = mongoDegreesToRadians(point2[0]-point1[0])
  const lat1 = mongoDegreesToRadians(point1[1])
  const lat2 = mongoDegreesToRadians(point2[1])

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) *
    Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const d = R * c
  return parseFloat(d.toFixed(1))
}

/**
 * Maps over an object
 */
export function objectMap (
  object: {[key: string]: unknown},
  fn: (value: unknown, key: string) => unknown
) {
  const result: {[key: string]: unknown} = {}
  return Object.keys(object).reduce(function(result, key) {
    result[key] = fn(object[key], key)
    return result
  }, result)
}

/**
 * Omits fields from an object
 */
export function omit (obj: {[key: string]: unknown}, fields: string[]) {
  const shallowCopy = Object.assign({}, obj)
  for (let i=0; i<fields.length; i+=1) {
    const key = fields[i]
    delete shallowCopy[key]
  }
  return shallowCopy
}

/**
 * Automatically updates a state object from a field event by using the input name/value (deep paths supported)
 * E.g. setState(s => ({ ...s, [e.target.name]: e.target.value }))
 * @param eventOrPathValue - The input/select change event or [path, value] to update the state with
 * @param beforeSetValue - optional function to change the value before setting the state
 * @param beforeSetState - optional function to run before setting the state
 * 
 * @example usage:
 *   - <input onChange={(e) => onChange(e, setState)} />
 *   - <input onChange={() => onChange(['address.name', 'Joe'], setState)} />
 */
export function onChange<T> (
  eventOrPathValue: EventOrPathValue,
  setState: Dispatch<SetStateAction<T>>,
  beforeSetValue?: (value: unknown) => unknown,
  beforeSetState?: (args: { state: T, parent: unknown, key: string }) => T
) {
  let value: unknown
  let path = ''
  let hasFiles: boolean | undefined
  
  if (typeof eventOrPathValue === 'object' && 'target' in eventOrPathValue) {
    const element = eventOrPathValue.target as HTMLInputElement & {_value?: unknown}
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
  return new Promise((resolve: (value: T) => void) => {
    setState((state) => {
      const newValue = beforeSetValue ? beforeSetValue(value) : value
      const baseState = { ...state, ...(hasFiles ? { hasFiles } : {}) }

      const { obj, parent, fieldName } = deepSetWithInfo(baseState, path, newValue)
      
      const newState = beforeSetState ? beforeSetState({ state: obj, parent: parent, key: fieldName }) : obj

      resolve(newState)
      return newState
    })
  })
}

/**
 * Pads a number
 * @param padLeft - Number of characters to pad on the left (default: 0)
 * @param fixedRight - Number of decimal places to fix on the right
 */
export function pad (num = 0, padLeft = 0, fixedRight?: number) {
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
 * - `{ rule: 'search' }` is only supported with supported $search operations (e.g. aggregate).
 * - `{ rule: 'text', numberFields: string[] }` number fields require indexes to work.
 * 
 * @param query - req.query
 *   E.g. {
 *     location: '10-RS',
 *     age: '33',
 *     isDeleted: 'false',
 *     createdAt: '1749038400000,1749729600000',
 *     status: 'incomplete',
 *     customer.0: '69214ce7ab121fb3726965a1', // splayed array items
 *     text: 'John Doe',
 *     text: '15',
 *     search: 'John Doe',
 *   }
 * @param config - allowed filters and their rules
 *   E.g. {
 *     location: 'string',
 *     age: 'number',
 *     isDeleted: 'boolean',
 *     createdAt: 'dateRange',
 *     status: ['incomplete', 'complete'],  // EnumArray [string|boolean|number]
 *     customer: { rule: 'ids', ObjectId: ObjectIdConstructor },
 *     text: 'text',
 *     text: { rule: 'text', numberFields: ['age'] }, // search with numeric fields
 *     search: { rule: 'search', text: { query: "{VALUE}", path: ['firstName'] } },
 *   }
 * @example returned object (using the examples above):
 *   E.g. {
 *     location: '10-RS',
 *     age: 33,
 *     isDeleted: false,
 *     createdAt: { $gte: 1749038400000, $lte: 1749729600000 },
 *     status: 'incomplete',
 *     customer: { $in: [new ObjectId('1234567890')] },
 *     $text: { $search: 'John Doe' },
 *     $or: [{ $text: { $search: '15' }}, { age: 15 }],
 *     $search: { text: { query: "John Doe", path: ['firstName'] }},
 *   }
 */
export function parseFilters(
  query: {[key: string]: unknown},
  config: {
    [key: string]: (
      'string' 
      | 'number' 
      | 'boolean' 
      | 'dateRange' 
      | EnumArray 
      | { rule: 'ids', parseId: ParseId } 
      | 'text' 
      | { rule: 'text', numberFields: string[] } 
      | ({ rule: 'search' } & SearchOperators)
    )
  }
) {
  // Should match the example returned object above
  const returnedMongoQuery: {
    [key: string]: (
      string
      | number
      | boolean
      | { $gte?: number; $gt?: number; $lte?: number; $lt?: number }
      | (string|number|boolean)
      | { $in: ObjectId[] }
      | { $search: string }                                              // key=$text
      | ({ $text: { $search: string } } | { [key: string]: number })[]   // key=$or
      | SearchOperators                                                  // key=$search
    )
  } = {}

  // Convert splayed array items into a unified array objects,
  // E.g. 'customer.0' = '1' and 'customer.1' = '2' -> 'customer' = '1,2'
  for (const key in query) {
    if (key.match(/\.\d+$/)) {
      const baseKey = key.replace(/\.\d+$/, '')
      const index = key.match(/\.(\d+)$/)?.[1] || 0
      if (index == 0) query[baseKey] = query[key]
      else query[baseKey] = (query[baseKey] as string) + ',' + (query[key] as string)
    }
  }

  for (const key in query) {
    if (typeof query[key] !== 'string') continue
    const val = query[key] as string
    const rule = config[key]

    if (!rule) {
      continue

    } else if (rule === 'string') {
      if (typeof val !== 'string') throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a string.`)
      returnedMongoQuery[key] = val

    } else if (rule === 'number') {
      const num = parseFloat(val)
      if (isNaN(num)) throw new Error(`The "${key}" filter should be a number, but received "${val}".`)
      returnedMongoQuery[key] = num

    } else if (rule === 'boolean') {
      const bool = val === 'true' ? true : val === 'false' ? false : undefined
      if (bool === undefined) throw new Error(`The "${key}" filter should be a boolean, but received "${val}".`)
      returnedMongoQuery[key] = bool

    } else if (rule === 'dateRange') {
      const [start, end] = val.split(',').map(Number)
      if (isNaN(start) && isNaN(end)) throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a date range.`)
      else if (isNaN(start)) returnedMongoQuery[key] = { $gte: 0, $lte: end }
      else if (isNaN(end)) returnedMongoQuery[key] = { $gte: start }
      else returnedMongoQuery[key] = { $gte: start, $lte: end }

    } else if (Array.isArray(rule)) { // EnumArray
      // Detetect the entire array's type from the first item
      const type = typeof rule[0]
      if (!['string', 'number', 'boolean'].includes(type)) {
        throw new Error(`The rule for "${key}" should only contain strings, numbers or booleans, but received "${type}".`)
      }
      // Parse the value to the correct type and compare it to the rule item
      for (const ruleItem of rule) {
        let valParsed: string | number | boolean | undefined = val
        if (type === 'number') valParsed = parseFloat(val)
        else if (type === 'boolean') valParsed = val === 'true' ? true : val === 'false' ? false : undefined
        if (valParsed === ruleItem) returnedMongoQuery[key] = valParsed
      }
    
    } else if (typeof rule === 'object' && 'rule' in rule && rule.rule === 'ids') { // ids
      if (!rule.parseId) {
        throw new Error(`The "${key}" filter has an invalid rule. Expected a parseId function.`)
      }
      const ids = val.split(',').map(id => {
        if (!isHex24(id)) throw new Error(`Invalid id "${id}" passed to the "${key}" filter.`)
        else return rule.parseId(id)
      })
      if (!ids.length) throw new Error(`Please pass at least one id to the "${key}" filter.`)
      returnedMongoQuery[key] = { $in: ids }

    } else if (rule === 'text') {
      if (typeof val !== 'string') throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a string.`)
      returnedMongoQuery['$text'] = { $search: '"' + val + '"' }

    } else if (typeof rule === 'object' && 'rule' in rule && rule.rule === 'text') {
      if (typeof val !== 'string') {
        throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a string.`)
      } else if (!Array.isArray(rule.numberFields) || !rule.numberFields.length) {
        throw new Error(`The "${key}" filter has an invalid rule. Expected an numberFields to be a non-empty array.`)
      }
      const ors = []
      const num = parseFloat(val)
      ors.push({ $text: { $search: val } })
      if (!isNaN(num)) {
        for (const field of rule.numberFields) {
          ors.push({ [field]: num })
        }
      }
      returnedMongoQuery.$or = ors

    } else if (typeof rule === 'object' && 'rule' in rule && rule.rule === 'search') {
      if (typeof val !== 'string') throw new Error(`The "${key}" filter has an invalid value "${val}". Expected a string.`)
      const output = deepSetWithMatch(rule, '{VALUE}', val) as SearchOperators // replace {VALUE} with the value
      delete output.rule // need to remove rule from the object
      returnedMongoQuery['$search'] = output
    } else {
      throw new Error(`Unknown filter type "${rule}" in the config.`)
    }
  }

  return returnedMongoQuery
}

/**
 * Parses req.query "pagination" and "sorting" fields and returns a monastery-compatible options object.
 * @param query - req.query
 *   E.g. { 
 *     page: '1', 
 *     sort: '1', 
 *     sortBy: 'createdAt' 
 *   }
 * @param model - The Monastery model
 * @param limit - pass 0 to exclude limit/skip, regardless of pagination (default: 10)
 * @param hasMore - hasMore parameter on parseSortOptions has been deprecated.
 * @example returned object (using the examples above):
 *   E.g. {
 *     limit: 10,
 *     skip: undefined,
 *     sort: { createdAt: 1 },
 *   }
 */
export function parseSortOptions(
  query: { page?: string, sort?: '1' | '-1', sortBy?: string },
  model: { fieldsFlattened: {[key: string]: unknown}, name: string },
  limit = 10,
  hasMore?: boolean
) {
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
 */
export function pick (obj: {[key: string]: unknown}, keys: string | RegExp | string[] | RegExp[]) {
  // Similiar to underscore.pick
  if (!isObject(obj) && !isFunction(obj)) return {}
  const keysArr = toArray(keys)
  const output: {[key: string]: unknown} = {}
  for (const key of keysArr) {
    if (typeof key === 'string' && obj.hasOwnProperty(key)) output[key] = obj[key]
    else if (key instanceof RegExp ) {
      for (const key2 in obj) {
        if (obj.hasOwnProperty(key2) && key2.match(key)) output[key2] = obj[key2]
      }
    }
  }
  return output
}

/**
 * Parses a query string into an object, or returns the last known matching cache
 * @param searchString - location.search e.g. '?page=1&book=my+%2B+book&date.0=1234567890'
 * @param options - options
 * @param options.emptyStringAsTrue - assign true to empty values
 * @param options.splitCommaSeparated - split comma-separated values into arrays (default: true)
 * @param options.groupArrayIndexes - group splayed array indexes into real arrays (default: true)
 *   E.g. 'date.0'='1234567890' -> 'date' = ['1234567890']
 * 
 * todo: maybe add toDeepObject param? be kinda cool to have
 */
export function queryObject (
  searchString: string,
  options: {
    emptyStringAsTrue?: boolean
    splitCommaSeparated?: boolean
    groupArrayIndexes?: boolean
  } = {}
) {
  if (searchString.startsWith('?')) searchString = searchString.slice(1)
  const { emptyStringAsTrue = false, splitCommaSeparated = true, groupArrayIndexes = true } = options
  const uniqueKey = searchString + (emptyStringAsTrue ? '-true' : '')

  if (searchString === '') return {}
  if (queryObjectsCache[uniqueKey]) return queryObjectsCache[uniqueKey]

  const params = new URLSearchParams(searchString)
  const flattened: {[key: string]: string | true} = Object.fromEntries(params.entries())
  const result: QueryObjectCache = {}
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

  queryObjectsCache[uniqueKey] = result
  return result
}

/**
 * Parses a query string into an array of objects
 * @param searchString - location.search, e.g. '?page=1'
 */
export function queryArray (searchString: string) {
  const query = queryObject(searchString)
  return Object.keys(query).map((key) => {
    return { [key]: query[key] }
  })
}

/**
 * Parses an object and returns a query string (deep value keys are flatterned, e.g. 'job.location=1')
 * @param _path - path to the object
 * @param _output - output object
 * @param options - options
 * @param options.concatenateArrays - will concatenate arrays into a comma-separated string, rather than separate keys (default: true)
 *   E.g. { date: [1,2] } -> 'date=1,2'
 */
export function queryString (
  obj: {[key: string]: unknown},
  _path = '',
  _output?: {[key: string]: string},
  options: { concatenateArrays?: boolean } = {}
) {
  const output: {[key: string]: string} = _output || {}
  const { concatenateArrays = true } = options

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] == 'undefined' || obj[key] === '') {
        continue
      } else if (concatenateArrays && Array.isArray(obj[key])) {
        output[_path + key] = (obj[key] as unknown[]).join(',')
      } else if (typeof obj[key] == 'object' && obj[key] !== null) { // ts: added null check
        queryString(obj[key] as {[key: string]: unknown}, _path+key+'.', output, options)
      } else {
        output[_path + key] = obj[key] + ''
      }
    }
  }
  if (_path) return output as unknown as string
  const qs = new URLSearchParams(output).toString()
  return qs ? `?${qs}` : ''
}

/**
 * Axios request to the route
 * @param route - e.g. 'post /api/user'
 * @param data - payload
 * @param event - event to prevent default
 * @param isLoading - [isLoading, setIsLoading]
 * @param setState - if passed, state.errors will be reset before the request
 * @param options - options
 * @param options.axiosConfig - withCredentials=true by default, see https://axios-http.com/docs/req_config
 * @returns {Promise<any>}
 * 
 * @example
 *   - request('post /api/user', { name: 'John' })
 *   - request(`get  /api/user/${id}`, undefined, e, isLoading)
 * 
 * @warning
 *   If wanting to use axios directly in your project rather than request(), make sure to manually handle:
 *   - error formnatting via util.getResponseErrors(errs)
 *   - loading states
 *   - using the correct axios instance via util.axios()
 */
export async function request<T> (
  route: string,
  data?: {[key: string]: unknown},
  event?: {preventDefault?: () => void},
  isLoading?: [boolean, (value: boolean) => void],
  setState?: Dispatch<SetStateAction<T>>,
  options?: { axiosConfig?: AxiosRequestConfig }
) {
  try {
    if (event?.preventDefault) event.preventDefault()
    const uri = route.replace(/^(post|put|delete|get) /, '')
    const axiosConfig = { withCredentials: true, ...(options?.axiosConfig || {}) }
    const method = (route.match(/^(post|put|delete|get) /)?.[1] || 'post').trim() as 'post' | 'put' | 'delete' | 'get'

    // show loading
    if (isLoading) {
      if (isLoading[0]) return
      else isLoading[1](true)
    }

    // warning, not persisting through re-renders, but should be fine until loading is finished
    data = data || {}
    if (setState) setState((prev) => ({ ...prev, errors: [] }))

    // Find out if the data has files?
    let hasFiles = false
    const recurse = (o: unknown) => {
      if (o instanceof File || hasFiles) hasFiles = true
      else if (o && typeof o === 'object') each(o as Array<unknown>, recurse)
    }
    recurse(data)

    // If yes, convert to form data
    const formData2: FormData | undefined = hasFiles ? formData({ ...data }, { allowEmptyArrays: true, indices: true }) : undefined

    // send the request
    const axiosFn = axios()[method]
    const axiosPromise = (method === 'get' || method === 'delete') 
      ? axiosFn(uri, axiosConfig)
      : axiosFn(uri, formData2 || data, axiosConfig)

    const [res] = await Promise.allSettled([
      axiosPromise,
      // setTimeoutPromise(() => {}, 200), // eslint-disable-line
    ])

    // success
    if (isLoading) isLoading[1](false)
    if (res.status == 'rejected') throw res.reason
    return res.value.data

  } catch (err) {
    if (isLoading) isLoading[1](false)
    throw getClientErrors(err)
  }
}

/**
 * Removes undefined from an array or object
 */
export function removeUndefined (variable: unknown[] | {[key: string]: unknown}) {
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
 * @param awsUrl - e.g. 'https://s3.amazonaws.com/...'
 * @param imageOrArray - file object/array
 * @param size - overrides to 'full' when the image sizes are still processing (default: 'full')
 * @param i - array index
 */
export function s3Image (
  awsUrl: string,
  imageOrArray: Image[] | Image,
  size = 'full',
  i?: number
) {
  const lambdaDelay = 7000
  const usingMilliseconds = true

  const image = (Array.isArray(imageOrArray) ? imageOrArray[i||0] : imageOrArray) as Image | undefined
  if (!image) return ''
  // Alway use preview if available
  if (image.base64) return image.base64
  // Wait a moment before the different sizes are generated by lambda
  if (((usingMilliseconds ? (image.date || 0) : (image.date || 0) * 1000) + lambdaDelay) > new Date().getTime()) size = 'full'
  const key = size == 'full' ? image.path : `${size}/${image.path.replace(/^full\/|\.[a-z0-9]{3,4}$/ig, '')}.jpg`
  return awsUrl + image.bucket + '/' + key
}

/**
 * Sanitize and encode all HTML in a user-submitted string
 */
export function sanitizeHTML (string: string) {
  var temp = document.createElement('div')
  temp.textContent = string
  return temp.innerHTML
}

/**
 * Process scrollbar width once.
 * @param paddingClass - class name to give padding to
 * @param marginClass - class name to give margin to
 * @param marginClassNegative - class name to give negative margin to
 * @param maxWidth - enclose css in a max-width media query
 */
export function scrollbar (
  paddingClass?: string,
  marginClass?: string,
  marginClassNegative?: string,
  maxWidth?: number
) {
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
 * @param padMinute - Whether to pad minutes with leading zero
 */
export function secondsToTime (seconds: number, padMinute?: boolean) {
  seconds = Math.round(seconds)
  const hours = Math.floor(seconds / (60 * 60))
  const divisor_for_minutes = seconds % (60 * 60)
  const minutes = Math.floor(divisor_for_minutes / 60)
  const divisor_for_seconds = divisor_for_minutes % 60
  const secs = Math.ceil(divisor_for_seconds)
  const data = {
    h: (hours + ''),
    m: (minutes + '').padStart(padMinute ? 2 : 1, '0'),
    s: (secs + ''),
  }
  return data.h + ':' + data.m
}

/**
 * Promise wrapper for setTimeout
 */
export function setTimeoutPromise (func: () => void, milliseconds: number): Promise<void> {
  return new Promise(function(resolve) {
    setTimeout(() => resolve(func()), milliseconds)
  })
}

/**
 * Sort an array of objects by a key
 */
export function sortByKey (collection: {[key: string]: unknown}[], key: string) {
  return collection.sort(function (a, b) {
    var textA = (key in a ? (a[key] as string).toUpperCase() : '').toString().toUpperCase()
    var textB = (key in b ? (b[key] as string).toUpperCase() : '').toString().toUpperCase()
    return textA < textB ? -1 : textA > textB ? 1 : 0
  })
}

/**
 * Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds
 * 
 * @param func - The function to throttle.
 * @param wait - the number of milliseconds to throttle invocations to (default: 0)
 * @param options - options object
 * @param options.leading - invoke on the leading edge of the timeout (default: true)
 * @param options.trailing - invoke on the trailing edge of the timeout (default: true)
 * @example const throttled = throttle(updatePosition, 100)
 * @see lodash
 */
export function throttle<T extends (...args: any[]) => any>( // eslint-disable-line @typescript-eslint/no-explicit-any
  func: T,
  wait = 0,
  options?: {
    leading?: boolean
    trailing?: boolean
  }
): ((...args: Parameters<T>) => ReturnType<T>) & {
  cancel: () => void
  flush: () => ReturnType<T>
} {
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
 */
export function toArray<T>(variable: T | undefined): T extends unknown[] ? T : T[] {
  if (variable === undefined) {
    return [] as T extends unknown[] ? T : T[]
  }
  return (Array.isArray(variable) ? variable : [variable]) as T extends unknown[] ? T : T[]
}

/**
 * Custom tailwind merge instance
 */
const customTailwindMerge = createTailwindMerge(() => {
  const config = getDefaultConfig()

  /**
   * @param baseNames - base names for x-axis (e.g. 'input-x')
   */
  function newSpacingSizes(baseNames: string[]) {
    const obj = {
      pl: [...(config.classGroups.pl as unknown as string[] ?? [])],
      pr: [...(config.classGroups.pr as unknown as string[] ?? [])],
      pt: [...(config.classGroups.pt as unknown as string[] ?? [])],
      pb: [...(config.classGroups.pb as unknown as string[] ?? [])],
      px: [...(config.classGroups.px as unknown as string[] ?? [])],
      py: [...(config.classGroups.py as unknown as string[] ?? [])],
      p: [...(config.classGroups.p as unknown as string[] ?? [])],
      ml: [...(config.classGroups.ml as unknown as string[] ?? [])],
      mr: [...(config.classGroups.mr as unknown as string[] ?? [])],
      mt: [...(config.classGroups.mt as unknown as string[] ?? [])],
      mb: [...(config.classGroups.mb as unknown as string[] ?? [])],
      mx: [...(config.classGroups.mx as unknown as string[] ?? [])],
      my: [...(config.classGroups.my as unknown as string[] ?? [])],
      m: [...(config.classGroups.m as unknown as string[] ?? [])],
      gap: [...(config.classGroups.gap as unknown as string[] ?? [])],
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
 * @param args - false, 0, 0n are considered undefined
 */
export function twMerge(...args: (string | null | undefined | false | 0 | 0n)[]): string {
  const raw = twJoin(args)
  if (!raw.includes('(')) return customTailwindMerge(raw)

  // 1) Tokenize: either "(...)" group chunks or normal non-space tokens.
  const tokens: { cls: string, groupId: number }[] = []
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
  const out: (string | null)[] = []
  const groupIds: number[] = []

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
 */
export function ucFirst (string: string) {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}
