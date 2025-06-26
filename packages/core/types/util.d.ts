/**
 * Returns an address monastery schema which Google autocomplete should return
 */
export function addressSchema(): {
    city: {
        type: string;
    };
    country: {
        type: string;
        default: string;
    };
    full: {
        type: string;
        index: string;
    };
    line1: {
        type: string;
    };
    line2: {
        type: string;
    };
    number: {
        type: string;
    };
    postcode: {
        type: string;
    };
    suburb: {
        type: string;
    };
    unit: {
        type: string;
    };
    area: {
        bottomLeft: {
            type: string;
        }[];
        topRight: {
            type: string;
        }[];
    };
    location: {
        index: string;
        type: {
            type: string;
            default: string;
        };
        coordinates: [];
    };
};
/**
 * Returns an axios instance for the client
 * @returns {import('axios').AxiosStatic}
 *
 * To set the defaults (e.g. baseURL) other than ones below, simply set them yourself:
 * ```js
 *   import { axios } from 'nitro-web/util'
 *   axios().defaults.baseURL = 'https://example.com'
 * ```
 */
export function axios(): import("axios").AxiosStatic;
/**
 * Builds the url with params
 * @param {string} url
 * @param {{[key: string]: string}} parameters - Key value parameters
 * @returns {string}, e.g. 'https://example.com?param1=value1&param2=value2'
 */
export function buildUrl(url: string, parameters: {
    [key: string]: string;
}): string;
/**
 * Converts a string to camel case
 * @param {string} str
 * @param {boolean} [capitaliseFirst] - Capitalise the first letter
 * @param {boolean} [allowNumber] - Allow numbers
 * @returns {string}
 */
export function camelCase(str: string, capitaliseFirst?: boolean, allowNumber?: boolean): string;
/**
 * Converts camel case to title case
 * @param {string} str
 * @param {boolean} [captialiseFirstOnly] - Capitalise the first letter only
 * @returns {string}
 */
export function camelCaseToTitle(str: string, captialiseFirstOnly?: boolean): string;
/**
 * Converts camel case to hypen case
 * @param {string} str
 * @returns {string}
 */
export function camelCaseToHypen(str: string): string;
/**
 * Capitalises a string
 * @param {string} [str]
 * @returns {string}
 */
export function capitalise(str?: string): string;
/**
 * Formats a currency string
 * @param {number} cents
 * @param {number} [decimals=2]
 * @param {number} [decimalsMinimum]
 * @returns {string}
 */
export function currency(cents: number, decimals?: number, decimalsMinimum?: number): string;
/**
 * Converts a currency string to cents
 * @param {string} currency string, e.g. '$1,234.00'
 * @returns {string}
 */
export function currencyToCents(currency: string): string;
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
export function date(date?: number | Date, format?: string, timezone?: string): string;
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
 * @see https://lodash.com/docs/4.17.15#debounce
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait?: number, options?: {
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
}): ((...args: Parameters<T>) => ReturnType<T>) & {
    cancel: () => void;
    flush: () => ReturnType<T>;
};
/**
 * Deep clones an object or array, preserving its type
 * @template T
 * @param {T} obj - Object or array to deep clone
 * @returns {T}
 */
export function deepCopy<T>(obj: T): T;
/**
 * Retrieves a nested value from an object or array from a dot-separated path.
 * @param {object|any[]} obj - The source object or array.
 * @param {string} path - Dot-separated path (e.g. "owner.houses.0.color").
 * @returns {unknown}
 */
export function deepFind(obj: object | any[], path: string): unknown;
/**
 * Saves a deeply nested value without mutating the original object.
 * @template T
 * @param {T} obj - The source object or array.
 * @param {string} path - Dot-separated path to the nested property.
 * @param {unknown|function} value - The value to set, or a function to compute it from the current value.
 * @returns {T}
 */
export function deepSave<T>(obj: T, path: string, value: unknown | Function): T;
/**
 * Iterates over an object or array
 * @param {{[key: string]: any}|[]|null} obj
 * @param {function} iteratee
 * @param {object} [context]
 * @returns {object|[]|null}
 */
export function each(obj: {
    [key: string]: any;
} | [] | null, iteratee: Function, context?: object): object | [] | null;
/**
 * Downloads a file
 * @param {string|Blob|File} data
 * @param {string} filename
 * @param {string} [mime]
 * @param {string} [bom]
 * @returns {void}
 *
 * @link https://github.com/kennethjiang/js-file-download
 */
export function fileDownload(data: string | Blob | File, filename: string, mime?: string, bom?: string): void;
/**
 * Formats a string into a name
 * @param {string} string
 * @param {boolean} [ignoreHyphen]
 * @returns {string}
 */
export function formatName(string: string, ignoreHyphen?: boolean): string;
/**
 * Formats a string into a slug
 * @param {string} string
 * @returns {string}
 */
export function formatSlug(string: string): string;
/**
 * Serializes objects to FormData instances
 * @param {object} obj
 * @param {{ allowEmptyArrays?: boolean, indices?: boolean, nullsAsUndefineds?: boolean, booleansAsIntegers?: boolean }} [cfg] - config
 * @param {FormData} [existingFormData]
 * @param {string} [keyPrefix]
 * @returns {FormData}
 * @link https://github.com/therealparmesh/object-to-formdata
 */
export function formData(obj: object, cfg?: {
    allowEmptyArrays?: boolean;
    indices?: boolean;
    nullsAsUndefineds?: boolean;
    booleansAsIntegers?: boolean;
}, existingFormData?: FormData, keyPrefix?: string): FormData;
/**
 * Returns capitalized full name
 * @param {{firstName: string, lastName: string}} object
 * @returns {string}
 */
export function fullName(object: {
    firstName: string;
    lastName: string;
}): string;
/**
 * Splits a full name into first and last names
 * @param {string} string
 * @returns {string[]} e.g. ['John', 'Smith']
 */
export function fullNameSplit(string: string): string[];
/**
 * Returns a list of country options
 * @param {{ [key: string]: { name: string } }} countries
 * @returns {{ value: string, label: string, flag: string }[]}
 */
export function getCountryOptions(countries: {
    [key: string]: {
        name: string;
    };
}): {
    value: string;
    label: string;
    flag: string;
}[];
/**
 * Returns a list of currency options
 * @param {{ [iso: string]: { name: string } }} currencies
 * @returns {{ value: string, label: string }[]}
 */
export function getCurrencyOptions(currencies: {
    [iso: string]: {
        name: string;
    };
}): {
    value: string;
    label: string;
}[];
/**
 * Returns an error from a state object matching the path
 * @param {{ errors?: { title: string, detail: string }[] }|undefined} state
 * @param {string} path
 * @returns {{ title: string, detail: string }|undefined}
 */
export function getErrorFromState(state: {
    errors?: {
        title: string;
        detail: string;
    }[];
} | undefined, path: string): {
    title: string;
    detail: string;
} | undefined;
/**
 * Get the width of a prefix
 * @param {string} prefix
 * @param {number} [paddingRight=0]
 * @returns {number}
 */
export function getPrefixWidth(prefix: string, paddingRight?: number): number;
/**
 * Returns a list of project directories
 * @param {{ join: (...args: string[]) => string }} path - e.g. `import path from 'path'`
 * @param {string} [pwd]
 * @returns {object}
 */
export function getDirectories(path: {
    join: (...args: string[]) => string;
}, pwd?: string): object;
/**
 * Returns a Stripe client promise
 * @param {string} stripePublishableKey
 * @returns {Promise<import('@stripe/stripe-js').Stripe|null>}
 */
export function getStripeClientPromise(stripePublishableKey: string): Promise<import("@stripe/stripe-js").Stripe | null>;
/**
 * Returns a list of response errors
 *
 * @typedef {{ title: string, detail: string }} NitroError
 * @typedef {{ toJSON: () => { message: string } }} MongoError
 * @typedef {{ response: { data: { errors?: NitroError[], error?: string, error_description?: string } } }} AxiosWithErrors
 *
 * @typedef {Error|NitroError[]|MongoError|AxiosWithErrors|string|any} NitroErrorRaw
 *
 * @param {NitroErrorRaw} errs
 * @returns {NitroError[]}
 */
export function getResponseErrors(errs: NitroErrorRaw): NitroError[];
/**
 * Checks if a value is in an array (todo, update this to not use optional key)
 * @param {any[]} array
 * @param {unknown} [value]
 * @param {string} [key] - optional, to match across on a colleciton of objects
 * @returns {boolean}
 */
export function inArray(array: any[], value?: unknown, key?: string): boolean;
/**
 * Checks if a variable is an array
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isArray(variable: unknown): boolean;
/**
 * Checks if a variable is a date
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isDate(variable: unknown): boolean;
/**
 * Checks if a variable is defined
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isDefined(variable: unknown): boolean;
/**
 * Checks if a variable is an email
 * @param {string} email
 * @returns {boolean}
 */
export function isEmail(email: string): boolean;
/**
 * Checks if an object is empty
 * @param {{[key: string]: unknown}|null} [obj]
 * @param {boolean} [truthyValuesOnly]
 * @returns {boolean}
 */
export function isEmpty(obj?: {
    [key: string]: unknown;
} | null, truthyValuesOnly?: boolean): boolean;
/**
 * Checks if a variable is a function
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isFunction(variable: unknown): boolean;
/**
 * Checks if a variable is a hex string
 * @param {unknown} value
 * @returns {boolean}
 */
export function isHex24(value: unknown): boolean;
/**
 * Checks if a variable is a number
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isNumber(variable: unknown): boolean;
/**
 * Checks if a variable is an object
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isObject(variable: unknown): boolean;
/**
 * Checks if a variable is a regex
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isRegex(variable: unknown): boolean;
/**
 * Checks if a variable is a string
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isString(variable: unknown): boolean;
/**
 * Converts the first character of a string to lowercase
 * @param {string} string
 * @returns {string}
 */
export function lcFirst(string: string): string;
/**
 * Trims a string to a maximum length, and removes any partial words at the end
 * @param {string} string
 * @param {number} [len=100]
 * @param {boolean} [showEllipsis=true]
 * @returns {string}
 */
export function maxLength(string: string, len?: number, showEllipsis?: boolean): string;
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
export function mongoAddKmsToBox(km: number, bottomLeftOrBox: Point | Box, topRight?: Point): [Point, Point] | null;
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
export function mongoDocWithinPassedAddress(address: {
    area?: {
        bottomLeft: [number, number];
        topRight: [number, number];
    };
    location?: {
        coordinates: [number, number];
    };
}, km: number, prefix: string): any;
/**
 * Find the distance in km between to points
 * @param {number[]} point1 - [lng, lat] ([192.2132.., 212.23323..])
 * @param {number[]} point2 - [lng, lat] ([192.2132.., 212.23323..])
 * @return {number} kms
 */
export function mongoPointDifference(point1: number[], point2: number[]): number;
/**
 * Maps over an object
 * @param {{ [key: string]: any }} object
 * @param {(value: any, key: string) => any} fn
 */
export function objectMap(object: {
    [key: string]: any;
}, fn: (value: any, key: string) => any): {
    [key: string]: any;
};
/**
 * Omits fields from an object
 * @param {{ [key: string]: unknown }} obj
 * @param {string[]} fields
 * @returns {{ [key: string]: unknown }}
 */
export function omit(obj: {
    [key: string]: unknown;
}, fields: string[]): {
    [key: string]: unknown;
};
/**
 * Updates state from an input event (deep state properties are supported)
 * E.g. setState(s => ({ ...s, [e.target.id]: e.target.value }))
 *
 * @template T
 * @param {React.Dispatch<React.SetStateAction<T>>} setState
 * @param {{target: {name: string, value: unknown}}|[string, function|unknown]} eventOrPathValue
 * @param {Function} [beforeSetState] - optional function to run before setting the state
 * @returns {Promise<T>}
 *
 * @example
 *   - <input onChange={(e) => onChange(setState, e)} />
 *   - <input onChange={() => onChange(setState, ['address.name', 'Joe'])} />
 */
export function onChange<T>(setState: React.Dispatch<React.SetStateAction<T>>, eventOrPathValue: {
    target: {
        name: string;
        value: unknown;
    };
} | [string, Function | unknown], beforeSetState?: Function): Promise<T>;
/**
 * Pads a number
 * @param {number} [num=0]
 * @param {number} [padLeft=0]
 * @param {number} [fixedRight]
 * @returns {string}
 */
export function pad(num?: number, padLeft?: number, fixedRight?: number): string;
/**
 * Validates req.query "filters" against a config object, and returns a MongoDB-compatible query object.
 * @param {{ [key: string]: string }} query - req.query
 *   E.g. {
 *     dateRange: '1749038400000,1749729600000',
 *     location: '10-RS',
 *     status: 'incomplete',
 *     search: 'John'
 *   }
 * @param {{ [key: string]: 'string'|'number'|'search'|'dateRange'|string[] }} config - allowed filters and their rules
 *   E.g. {
 *     dateRange: 'dateRange',
 *     location: 'string',
 *     status: ['incomplete', 'complete'],
 *     search: 'string',
 *   }
 * @example returned object (using the examples above):
 *   E.g. {
 *     date: { $gte: 1749038400000, $lte: 1749729600000 },
 *     location: '10-RS',
 *     status: 'incomplete',
 *     search: 'John'
 *   }
 */
export function parseFilters(query: {
    [key: string]: string;
}, config: {
    [key: string]: "string" | "number" | "search" | "dateRange" | string[];
}): {
    [key: string]: string | number | string[] | {
        $gte: number;
        $lte?: number;
    } | {
        $search: string;
    };
};
/**
 * Parses req.query "pagination" and "sorting" fields and returns a monastery-compatible options object.
 * @param {{ fieldsFlattened: object, name: string }} model - The Monastery model
 * @param {{ page?: string, sort?: '1'|'-1', sortBy?: string }} query - req.query
 *   E.g. {
 *     page: '1',
 *     sort: '1',
 *     sortBy: 'createdAt'
 *   }
 * @param {number} [limit=10]
 * @example returned object (using the examples above):
 *   E.g. {
 *     limit: 10,
 *     skip: undefined,
 *     sort: { createdAt: 1 },
 *   }
 */
export function parseSortOptions(model: {
    fieldsFlattened: object;
    name: string;
}, query: {
    page?: string;
    sort?: "1" | "-1";
    sortBy?: string;
}, limit?: number): {
    limit: number;
    skip: number;
    sort: {
        createdAt?: number;
    };
};
/**
 * Picks fields from an object
 * @param {{ [key: string]: any }} obj
 * @param {string|RegExp|string[]|RegExp[]} keys
 */
export function pick(obj: {
    [key: string]: any;
}, keys: string | RegExp | string[] | RegExp[]): {
    [key: string]: unknown;
};
/**
 *
 * Parses a query string into an object, or returns the last known matching cache
 * @param {string} searchString - location.search e.g. '?page=1&book=my+%2B+book'
 * @param {boolean} [trueDefaults] - assign true to empty values
 * @returns {{[key: string]: string|true}} - e.g. { page: '1' }
 */
export function queryObject(searchString: string, trueDefaults?: boolean): {
    [key: string]: string | true;
};
/**
 * Parses a query string into an array of objects
 * @param {string} searchString - location.search, e.g. '?page=1'
 * @returns {object[]} - e.g. [{ page: '1' }]
 */
export function queryArray(searchString: string): object[];
/**
 * Parses an object and returns a query string
 * @param {{[key: string]: unknown}} [obj] - query object
 * @returns {string}
 */
export function queryString(obj?: {
    [key: string]: unknown;
}): string;
/**
 * Axios request to the route
 * @param {string} route - e.g. 'post /api/user'
 * @param {{ [key: string]: any }} [data] - payload
 * @param {{preventDefault?: function}} [event] - event to prevent default
 * @param {[boolean, (value: boolean) => void]} [isLoading] - [isLoading, setIsLoading]
 * @returns {Promise<any>}
 *
 * @example
 *   - request('post /api/user', { name: 'John' })
 *   - request(`get  /api/user/${id}`, undefined, e, isLoading)
 */
export function request(route: string, data?: {
    [key: string]: any;
}, event?: {
    preventDefault?: Function;
}, isLoading?: [boolean, (value: boolean) => void]): Promise<any>;
/**
 * Removes undefined from an array or object
 * @param {[]|{[key: string]: any}} variable
 * @returns {[]|{[key: string]: any}}
 */
export function removeUndefined(variable: [] | {
    [key: string]: any;
}): [] | {
    [key: string]: any;
};
/**
 * Build image URL from image array or object
 * @typedef {{path: string, bucket: string, base64?: string, date?: number}} Image
 * @param {string} awsUrl - e.g. 'https://s3.amazonaws.com/...'
 * @param {Image[]|Image} imageOrArray - file object/array
 * @param {string} [size] - overrides to 'full' when the image sizes are still processing
 * @param {number} [i] - array index
 * @returns {string}
 */
export function s3Image(awsUrl: string, imageOrArray: Image[] | Image, size?: string, i?: number): string;
/**
 * Sanitize and encode all HTML in a user-submitted string
 * @param {string} string
 * @returns {string}
 */
export function sanitizeHTML(string: string): string;
/**
 * Process scrollbar width once.
 * @param {string} [paddingClass] - class name to give padding to
 * @param {string} [marginClass] - class name to give margin to
 * @param {number} [maxWidth] - enclose css in a max-width media query
 * @param {string} [marginClassNegative] - class name to give negative margin to
 * @returns {number}
 *
 */
export function scrollbar(paddingClass?: string, marginClass?: string, marginClassNegative?: string, maxWidth?: number): number;
/**
 * Convert seconds to time
 * @param {number} seconds
 * @param {boolean} [padMinute]
 * @returns {string}
 */
export function secondsToTime(seconds: number, padMinute?: boolean): string;
/**
 * Promise wrapper for setTimeout
 * @param {function} func
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
export function setTimeoutPromise(func: Function, milliseconds: number): Promise<void>;
/**
 * Shows a global error
 * @param {function} setStore
 * @param {NitroErrorRaw} errs
 */
export function showError(setStore: Function, errs: NitroErrorRaw): void;
/**
 * Sort an array of objects by a key
 * @param {{[key: string]: any}[]} collection
 * @param {string} key
 * @returns {object[]}
 */
export function sortByKey(collection: {
    [key: string]: any;
}[], key: string): object[];
/**
   * Creates a throttled function that only invokes `func` at most once per every `wait` milliseconds
 * @param {(...args: any[]) => any} func
 * @param {number} [wait=0] - the number of milliseconds to throttle invocations to
 * @param {{
 *    leading?: boolean, // invoke on the leading edge of the timeout
 *    trailing?: boolean, // invoke on the trailing edge of the timeout
 * }} [options] - options object
 * @returns {function}
 * @example const throttled = util.throttle(updatePosition, 100)
 * @see lodash
 */
export function throttle(func: (...args: any[]) => any, wait?: number, options?: {
    leading?: boolean;
    trailing?: boolean;
}): Function;
/**
 * Convert a variable to an array, if not already an array.
 * @template T
 * @param {T | undefined} variable
 * @returns {(T extends any[] ? T : T[])}
 */
export function toArray<T>(variable: T | undefined): (T extends any[] ? T : T[]);
/**
 * Trim a string and replace multiple newlines with double newlines
 * @param {string} string
 * @returns {string}
 */
export function trim(string: string): string;
/**
 * Merge tailwind classes, but ignore classes that shouldn't be merged, and intended as an override
 * @param  {...string} args
 * @returns {string}
 */
export function twMerge(...args: string[]): string;
/**
 * Capitalize the first letter of a string
 * @param {string} string
 * @returns {string}
 */
export function ucFirst(string: string): string;
/**
 * Returns a list of response errors
 */
export type NitroError = {
    title: string;
    detail: string;
};
/**
 * Returns a list of response errors
 */
export type MongoError = {
    toJSON: () => {
        message: string;
    };
};
/**
 * Returns a list of response errors
 */
export type AxiosWithErrors = {
    response: {
        data: {
            errors?: NitroError[];
            error?: string;
            error_description?: string;
        };
    };
};
/**
 * Returns a list of response errors
 */
export type NitroErrorRaw = Error | NitroError[] | MongoError | AxiosWithErrors | string | any;
/**
 * - lng/lat
 */
export type Point = [number, number];
/**
 * Expands a mongodb lng/lat box in kms, and returns the expanded box
 */
export type Box = {
    bottomLeft: Point;
    topRight: Point;
};
/**
 * Build image URL from image array or object
 */
export type Image = {
    path: string;
    bucket: string;
    base64?: string;
    date?: number;
};
//# sourceMappingURL=util.d.ts.map