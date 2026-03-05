/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Express as _Express, Request as _Request, Response as _Response, NextFunction } from 'express'
import { returnServerErrors, type ServerErrorRaw } from '../util.errors'
import http from 'http'

// PathParams is not exported from express, so define it locally
type PathParams = string | RegExp | Array<string | RegExp>

// Custom RequestHandler that uses our extended Request
type ExtendedRequestHandler<TRequestExt, TResponseExt> = (
  req: ExtendedRequest<TRequestExt>,
  res: ExtendedResponse<TResponseExt>,
  next: NextFunction
) => void

// Custom ErrorRequestHandler that uses our extended Request
type ExtendedErrorRequestHandler<TRequestExt, TResponseExt> = (
  err: unknown,
  req: ExtendedRequest<TRequestExt>,
  res: ExtendedResponse<TResponseExt>,
  next: NextFunction
) => void

// Custom RequestParamHandler that uses our extended Request
type ExtendedRequestParamHandler<TRequestExt, TResponseExt> = (
  req: ExtendedRequest<TRequestExt>,
  res: ExtendedResponse<TResponseExt>,
  next: NextFunction,
  value: any,
  name: string
) => any

// Mirror Express RequestHandlerParams: union of 3-arg and 4-arg handlers
type ExtendedRequestHandlerParams<TRequestExt, TResponseExt> =
  | ExtendedRequestHandler<TRequestExt, TResponseExt>
  | ExtendedErrorRequestHandler<TRequestExt, TResponseExt>
  | Array<ExtendedRequestHandler<TRequestExt, TResponseExt> | ExtendedErrorRequestHandler<TRequestExt, TResponseExt>>

// Mirror Express IRouterMatcher: RequestHandler overloads + RequestHandlerParams overloads
type ExtendedIRouterMatcher<TRequestExt, TResponseExt, T> = {
  <Route extends string>(path: Route, ...handlers: Array<ExtendedRequestHandler<TRequestExt, TResponseExt>>): T;
  <Path extends string>(path: Path, ...handlers: Array<ExtendedRequestHandlerParams<TRequestExt, TResponseExt>>): T;
  (path: PathParams, ...handlers: Array<ExtendedRequestHandler<TRequestExt, TResponseExt>>): T;
  (path: PathParams, ...handlers: Array<ExtendedRequestHandlerParams<TRequestExt, TResponseExt>>): T;
  (path: PathParams, subApplication: _Express): T; // todo: Express = ExtendedExpress<TRequestExt, TResponseExt>???
}

// Mirror Express IRouterHandler: RequestHandler-only overload first, then RequestHandlerParams (union)
type ExtendedIRouterHandler<TRequestExt, TResponseExt, T> = {
  (...handlers: Array<ExtendedRequestHandler<TRequestExt, TResponseExt>>): T;
  (...handlers: Array<ExtendedRequestHandlerParams<TRequestExt, TResponseExt>>): T;
}

// Extended IRoute interface
interface ExtendedIRoute<TRequestExt, TResponseExt, _Route extends string = string> {
  path: string;
  stack: any[];
  all: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  delete: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  get: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  head: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  options: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  patch: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  post: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  put: ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
}

/** Extended Express interface with TRequestExt and TResponseExt generics */
interface ExtendedExpressType<TRequestExt, TResponseExt> extends Omit<_Express, 
  'use' | 'all' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'route' | 'param'
> {
  // New properties
  // --------------------------------------------
  /** Request type for handlers - use as req: NonNullable<typeof instance['Request']> */
  readonly Request?: ExtendedRequest<TRequestExt>;
  /** Response type for handlers - use as res: NonNullable<typeof instance['Response']> */
  readonly Response?: ExtendedResponse<TResponseExt>;
  /** NextFunction type for handlers - use as next: NonNullable<typeof instance['Next']> */
  readonly Next?: NextFunction;
  // --------------------------------------------

  use: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this> & ExtendedIRouterHandler<TRequestExt, TResponseExt, this>;
  all: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  delete: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  get: ((name: string) => any) & ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  head: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  options: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  patch: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  post: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  put: ExtendedIRouterMatcher<TRequestExt, TResponseExt, this>;
  
  // Route and param methods
  route<T extends string>(prefix: T): ExtendedIRoute<TRequestExt, TResponseExt, T>;
  route(prefix: PathParams): ExtendedIRoute<TRequestExt, TResponseExt>;
  param(name: string, handler: ExtendedRequestParamHandler<TRequestExt, TResponseExt>): this;
  param(name: string | string[], handler: ExtendedRequestParamHandler<TRequestExt, TResponseExt>): this;
  param(callback: (name: string, matcher: RegExp) => ExtendedRequestParamHandler<TRequestExt, TResponseExt>): this;
}

function createExtendedExpress<TRequestExt, TResponseExt=unknown>(setupResponseExtensions?: (res: _Response) => TResponseExt) {
  const instance = express() as unknown as ExtendedExpressType<TRequestExt, TResponseExt>
  // Extend response with custom response handlers, if provided
  if (setupResponseExtensions) Object.assign(instance.response, setupResponseExtensions(instance.response))
  // Return type with `& Express`, so its compatible with the original express type
  return instance as ExtendedExpressType<TRequestExt, TResponseExt> & _Express
}

type _ExtendedExpress<TRequestExt, TResponseExt=unknown> = ReturnType<typeof createExtendedExpress<TRequestExt, TResponseExt>>
type ExtendedRequest<TRequestExt> = _Request & TRequestExt
type ExtendedResponse<TResponseExt> = _Response & TResponseExt

// ---- Nitro defaults --------------------------

function setupResponseExtensions(version: string, response: _Response) {
  return {
    error: function(a?: ServerErrorRaw) { returnServerErrors(response, a, 400) },
    unauthorized: function(a?: ServerErrorRaw) { returnServerErrors(response, a, 401) },
    forbidden: function(a?: ServerErrorRaw) { returnServerErrors(response, a, 403) },
    notFound: function(a?: ServerErrorRaw) { returnServerErrors(response, a, 404) },
    serverError: function(a?: ServerErrorRaw) { returnServerErrors(response, a, 500) },
    version: version,
  }
}
type RequestExt<TUser> = {
  // Added automatically in the default/auth middleware
  version: string,
  json: boolean,
  env: string,
  rawHeaders: http.IncomingHttpHeaders,
  rawBody: string,
  user?: TUser, // from auth middleware
}
type ResponseExt = ReturnType<typeof setupResponseExtensions>
export function createExpress<TUser>(version?: string) {
  return createExtendedExpress<RequestExt<TUser>, ResponseExt>(setupResponseExtensions.bind(null, version || ''))
}
export type Express<TUser> = ReturnType<typeof createExpress<TUser>>
export type Request<TUser> = _Request & RequestExt<TUser>
export type Response = _Response & ResponseExt
export type Next = NextFunction

// // ---- Type Testing ----------------------------

// // Consumer code: Setup

// type User = { name: string, email: string, category?: 'admin' | 'user' }
// const sre = setupResponseExtensions.bind(null, '')
// const instance = createExtendedExpress<RequestExt<User>, ResponseExt>(sre)
// const _instance2: _Express = createExtendedExpress<RequestExt<User>, ResponseExt>(sre) // tests Express compatibility

// // Consumer code: Usage

// // The `user` must inheritly be available on use/get/post/etc methods without having to type it below
// instance.use((req, res, next) => {
//   req.user = { name: 'John Doe', email: 'john.doe@example.com' }
//   next()
// })
// // GET handler
// instance.get('/test', (req, res) => {
//   if (req.user) {
//     res.json({ name: req.user.name, email: req.user.email })
//     console.log(res.send('Hello World')) // works too, nice
//   }
// })
// // POST handler
// instance.post('/test', (req, res) => {
//   try {
//     if (req.user) {
//       res.json({ name: req.user.name, email: req.user.email })
//     }
//   } catch (error) {
//     res.unauthorized(error as Error)
//   }
// })
// // Error handler (requires types from instance)
// instance.use((
//   err: unknown, 
//   req: NonNullable<typeof instance['Request']>, 
//   res: NonNullable<typeof instance['Response']>, 
//   _next: NonNullable<typeof instance['Next']>
// ) => {
//   console.error(err instanceof Error ? err.stack : err)
//   res.status(500).send('Something broke!')
// })
// // Param handler
// instance.param('userId', (req, res, next, value, name) => {
//   if (req.user) {
//     console.log(`Param ${name} = ${value} for user ${req.user.name}`)
//   }
//   next()
// })
// // Route method
// instance.route('/api/users')
//   .get((req, res, _next) => {
//     if (req.user) {
//       res.json({ user: req.user })
//     }
//   })
//   .post((req, res) => {
//     if (req.user) {
//       res.json({ created: true, user: req.user })
//     }
//   })
