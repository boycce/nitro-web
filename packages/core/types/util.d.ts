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
        coordinates: any;
    };
};
export function axios(): import("@hokify/axios").AxiosStatic;
export function buildUrl(url: any, parameters: any): string;
export function camelCase(str: any, capitaliseFirst: any, allowNumber: any): any;
export function camelCaseToTitle(str: any, captialiseFirstOnly: any): any;
export function camelCaseToHypen(str: any): any;
export function capitalise(str: any): any;
export function currency(cents: any, decimals: number, decimalsMinimum: any): string;
export function currencyToCents(currency: any): string;
export function date(date: any, format: any, timezone: any): any;
export function debounce(func: any, wait: any, options: any): {
    (...args: any[]): any;
    cancel: () => void;
    flush: () => any;
};
export function deepCopy(obj: any): any;
export function deepFind(obj: any, path: any): any;
export function deepSave(obj: any, path: any, value: any): any;
export function each(obj: any, iteratee: any, context: any): any;
export function fileDownload(data: any, filename: any, mime: any, bom: any): void;
export function formatName(string: any, ignoreHyphen: any): any;
export function formatSlug(string: any): any;
export function formData(obj: any, cfg: any, fd: any, pre: any): any;
export function fullName(object: any): string;
export function fullNameSplit(string: any): any[];
export function getCountryOptions(countries: any): {
    value: string;
    label: any;
    flag: string;
}[];
export function getCurrencyOptions(currencies: any): {
    value: string;
    label: any;
}[];
/**
 * Get the width of a prefix
 * @param {string} prefix
 * @param {number} paddingRight
 * @returns {number}
 */
export function getPrefixWidth(prefix: string, paddingRight?: number): number;
export function getDirectories(path: any, pwd: any): {
    clientDir: any;
    componentsDir: any;
    distDir: any;
    emailTemplateDir: any;
    imgsDir: any;
    tmpDir: any;
};
export function getLink(obj: any, query: any): string;
export function getStripeClientPromise(stripePublishableKey: any): any;
export function getResponseErrors(errs: any): any;
export function inArray(array: any, key: any, value: any): any;
export function isArray(variable: any): variable is any[];
export function isDate(variable: any): boolean;
export function isDefined(variable: any): boolean;
export function isEmail(email: any): boolean;
export function isEmpty(obj: any, truthyValuesOnly: any): boolean;
export function isFunction(variable: any): boolean;
export function isHex24(value: any): boolean;
export function isNumber(variable: any): boolean;
/**
 * Checks if a variable is an object
 * @param {unknown} variable
 * @returns {boolean}
 */
export function isObject(variable: unknown): boolean;
export function isRegex(variable: any): boolean;
export function isString(variable: any): boolean;
export function lcFirst(string: any): any;
export function maxLength(string: any, len: any, showEllipsis: any): any;
export function mongoAddKmsToBox(km: any, bottomLeft: any, topRight: any): any[][];
export function mongoDocWithinPassedAddress(address: any, km: any, prefix: any): {
    $geoNear: {
        near: {
            type: string;
            coordinates: any[];
        };
        distanceField: string;
        maxDistance: number;
        spherical: boolean;
    };
} | {
    [x: string]: {
        $geoWithin: {
            $box: any[][];
        };
    };
    $geoNear?: undefined;
} | {
    [x: string]: {
        $geoWithin: {
            $centerSphere: (number | any[])[];
        };
    };
    $geoNear?: undefined;
};
export function mongoPointDifference(point1: any, point2: any): string;
export function objectMap(object: any, fn: any): {};
export function omit(obj: any, fields: any): any;
/**
 * Updates state from an input event, you can also update deep state properties
 * @param {Event|Array[{string},{string|number|fn}]}
 *   {Event} - pass the event object            e.g. <input onChange={(e) => onChange.call(setState, e)}>
 *   {Array} - pass an array with [path, value] e.g. <input onChange={(e) => onChange.call(setState, e, ['name', 'Joe'])}>
 * @param {Function} [beforeSetState] - optional function to run before setting the state
 * @this {Function} setState
 * @return {Promise({state, chunks, target})}
 */
export function onChange(this: Function, event: any, beforeSetState?: Function): Promise<any>;
export function pad(num: any, padLeft: any, fixedRight: any): any;
export function pick(obj: any, keys: any): {};
export function queryObject(search: any, assignTrue: any): any;
export function queryString(obj: any): string;
export function request(route: any, data: any, event: any, isLoading: any): Promise<any>;
export function removeUndefined(variable: any): any;
export function s3Image(awsUrl: any, image: any, size: string, i: any): any;
export function sanitizeHTML(string: any): string;
export function scrollbar(paddingClass: any, marginClass: any, maxWidth: any): any;
export function secondsToTime(seconds: any, padMinute: any): string;
export function setTimeoutPromise(func: any, milliseconds: any): Promise<any>;
export function showError(setStore: any, errs: any): void;
export function sortByKey(objects: any, key: any): any;
export function sortFromQuery(req: any, sortMap: any, sortByDefault?: string): any;
export function throttle(func: any, wait: any, options: any): {
    (...args: any[]): any;
    cancel: () => void;
    flush: () => any;
};
export function toArray(variable: any): any[];
export function trim(string: any): any;
export function ucFirst(string: any): any;
export const dateFormat: any;
//# sourceMappingURL=util.d.ts.map