import { isRegex } from './util'
import type { Dispatch, SetStateAction } from 'react'
import type express from 'express'

/** Server-side extended error object */ // removed { errors: (Error|ServerError)[] } field... double check
type ServerExtError = { title: string, detail: string | Error, status?: number, data?: {[key: string]: unknown} }
/** Mongo error */
type ServerMongoError = { name: string, code?: number, message?: string }
/** Stripe error */
type ServerStripeError = { type: string, message?: string }
/** Server-side raw error */
export type ServerErrorRaw = Error | ServerExtError | ServerExtError[] | ServerMongoError | ServerStripeError | string | unknown
/** Server-side error */
type ServerError = { title: string, detail: string, status: number, data?: {[key: string]: unknown} }

/** Axios response error  */
type ClientAxiosError = { response: { data: { error?: string, error_description?: string } & { errors?: Errors } } }
/** Client-side raw error */
type ClientErrorRaw = Error | ServerError | ServerError[] | ClientAxiosError | string | unknown
/** Client-side error */
export type ClientError = { title: string, detail: string }
/** Client-side errors */
export type Errors = ClientError[]

/**
 * Returns a formatted error response
 */
export function returnServerErrors(res: express.Response, err: ServerErrorRaw, status: number) {
  // parseInt until monastery removes or udpates status?
  status = parseInt((typeof err === 'object' && err &&  'status' in err && err.status || status) + '') 
  // Get the server errors
  const errors = getServerErrors(err, status)
  // Log internal server error
  console[status == 500 ? 'error' : 'log']('Sending ' + status + ' response: \n', errors)
  // Send json/html response
  res.status(status)
  if ((res.req as any).json) res.json({ errors }) // eslint-disable-line @typescript-eslint/no-explicit-any
  else res.send('<p>' + errors.map(e => e.detail).join('<br>') + '</p>')
}

export function getServerErrors (err: ServerErrorRaw, status: number): ServerError[] {
  let detail = ''
  if (status === 400) detail = 'Bad request made.'
  else if (status === 401) detail = 'You are unauthorised to make this request.'
  else if (status === 403) detail = 'You are unauthorised to make this request.'
  else if (status === 404) detail = 'Sorry, nothing found here.'
  else if (status === 500) detail = 'Internal server error, please contact the admin.'

  if (typeof err === 'string' || !err) {
    return [{ title: '', detail: (err || detail) as string, status: status }]
  
  // Mongo error (todo: fix these types, maybe check with Monastery the Error type we may expect)
  } else if (typeof err === 'object' && 'name' in err && (err as ServerMongoError).name.match(/Mongo|BulkWriteError/)) {
    if ('code' in err && err.code == 11000) {
      const [indexName] = duplicateKeyIndexAndValue(err as ServerMongoError)
      if (indexName == 'email') return  [{ title: 'email', detail: 'That email is already linked to an account.', status: status }]
      else return [{ title: indexName, detail: `Cannot insert duplicate values for "${indexName}".`, status: status }]
    } else {
      return [{ title: 'mongo', detail: (err as ServerMongoError).message || '', status: status }]
    }
    
  // Stripe error object (need to test)
  } else if (typeof err === 'object' && 'type' in err && (err as ServerStripeError).type.match(/Stripe/)) {
    return [{ title: 'error', detail: 'Stripe: ' + (err as ServerStripeError).message, status: status }]
    
  // Error object
  } else if (err instanceof Error) {
    if ((err as any).response) console.log('Error:', (err as any).response.data) // eslint-disable-line @typescript-eslint/no-explicit-any
    else console.error(err) // and stack
    return [getServerError({ title: 'error', detail: err.message }, status)]

  // Array of ServerErrors
  } else if (Array.isArray(err)) {
    return err.map(item => getServerError(item as ServerExtError, status))

  // Single ServerError
  } else if (typeof err === 'object' && 'title' in err) {
    return [getServerError(err as ServerExtError, status)]

  // Unknown error
  } else {
    console.log(err)
    console.error('Invalid data parsed into getServerErrors()')
    return [{ title: 'error', detail: 'Oops there was an error', status: status }]
  }
}

function getServerError(error: ServerExtError, status: number): ServerError {
  const serverError: ServerError = {
    title: error.title,
    detail: error.detail instanceof Error ? error.detail.message : error.detail,
    status: error.status || status,
  }
  if (error.data) serverError.data = error.data
  return serverError
}

/**
 * Returns the index name and value of a duplicate key error
 * @link https://github.com/Automattic/mongoose/issues/2129#issuecomment-280507821
 * @example
 *   E.g. E11000 duplicate key error collection: anamata-production.person index:
 *        email_1 dup key: { email: "person1@gmail.com" }
 *   = ['email', 'person1@gmail.com']
 */
function duplicateKeyIndexAndValue(error: ServerMongoError) {
  const regex = /index: (?:.*\.)?\$?(?:([_a-z0-9]*)(?:_\d*)|([_a-z0-9]*))\s*dup key/i
  const match = error.message?.match(regex)
  if (!match) return ['', '']
  const indexName = match[1] || match[2] // e.g. email
  const value = (error.message?.match(/.*{.*?: (.*) }/i)?.[1]||'').replace(/"/g, '') // e.g. person1@gmail.com
  return [indexName, value]
}

/**
 * Returns a list of client-side errors
 * @param err - Client-side raw error
 */
export function getClientErrors (err: ClientErrorRaw): ClientError[] {
  // Array of ClientErrors
  if (Array.isArray(err)) {
    return err as Errors
  
  // Axios response with server side errors (ServerErrors[])
  } else if (typeof err === 'object' && (err as ClientAxiosError)?.response?.data?.errors) {
    return (err as ClientAxiosError).response.data.errors || [{ title: 'error', detail: 'Oops there was an error' }]

  // Axios response with an internal error message
  } else if (typeof err === 'object' && (err as ClientAxiosError)?.response?.data?.error) {
    return [{ 
      title: (err as ClientAxiosError).response.data.error || '', 
      detail: (err as ClientAxiosError).response.data.error_description || '',
    }]

  // Native Error
  } else if (err instanceof Error) {
    return [{ title: 'error', detail: err?.message || 'Oops there was an error' }]

    // // Mongo error message (when called on the backend) // THIS is only used on the front end
    // } else if (typeof err === 'object' && err !== null && 'toJSON' in err) {
    //   return [{ title: 'error', detail: (errs as MongoServerError).toJSON().message }]      

  // String error message
  } else if (typeof err === 'string') {
    return [{ title: 'error', detail: err }]

  // Unknown error
  } else {
    console.info('getResponseErrors(): ', err)
    return [{ title: 'error', detail: 'Oops there was an error' }]
  }
}

/**
 * Return the error matching the path
 * @param errors - Client errors 
 * @param path - String match, or regex match against errors.[].title
 */
export function getMatchingError (errors: Errors | undefined, path: string | RegExp) {
  if (!errors) return undefined
  for (const item of errors) {
    if (isRegex(path) && (item.title || '').match(path)) return item
    else if (item.title == path) return item
  }
}

/**
 * Return the first system error message (which has title === 'error')
 * @param errors - Client errors
 */
export function getSystemErrorMessage (errors: Errors | undefined) {
  const systemError = errors?.find(error => error.title === 'error')
  return systemError?.detail || ''
}

/**
 * Shows the first error message as a notification
 * @param setStore - Set store function (store should handle the notification)
 * @param err - Client-side raw error
 */
export function showErrorNotification (setStore: Dispatch<SetStateAction<{[key: string]: unknown}>>, err: ClientErrorRaw) {
  const detail = getClientErrors(err)?.[0].detail
  setStore((o) => ({ ...o, message: { type: 'error', text: detail } }))
}
