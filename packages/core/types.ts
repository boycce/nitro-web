/* eslint-disable @typescript-eslint/no-explicit-any */
export type { ClientError, Errors, ServerErrorRaw } from './util.errors'
import type { Request as NitroRequest, Response as NitroResponse, Next } from './server/express'

// On the exmaple app, the config and router/Request/Response/etc come from the config.ts file
// Question is, do we need these to be copied to the config.ts file?
export type UserMinimal = Pick<User, '_id' | 'stripeCustomer'> & (Pick<User, 'type'> | Pick<User, 'isAdmin'>)
export type Request = NitroRequest<UserMinimal>
export type Response = NitroResponse
export type Route = (Controller | string)[]
export type Routes = { [key: string]: (Controller | string)[] }
export type Controller = (req: Request, res: Response, next: Next) => Promise<void> | void
export type ControllerSetup = (middleware: NitroMiddleware<UserMinimal>, config: NitroConfigServer<UserMinimal>) => void

/** Expected client route (defining here so types dont build all components) */
export type RouteClient<TStore> = {
  component: React.FC<{ route?: NitroRouteClient<TStore>; config?: NitroConfigClient<TStore> }>
  middleware: string[]
  name: string
  path: string
  redirect?: string
  meta?: { title?: string; layout?: number }
}

/** Expected middleware config */
export type Middleware<TUser> = {
  [key: string]: (req: NitroRequest<TUser>, res: NitroResponse, next: Next) => void
}


/** Expected webpack config injected from webpack */
export interface NitroConfigWebpack extends NitroConfigShared {
  isDemo: boolean // added automatically by webpack
  isStatic: boolean // added automatically by webpack
  jwtName: string // added automatically by webpack
  awsUrl?: string
  googleMapsApiKey?: string
  placeholderEmail?: string
  stripePublishableKey?: string
  titleSeparator?: string
}

/** Expected server config */
export interface NitroConfigServer<TUser> extends NitroConfigShared {
  pwd: string
  webpack: NitroConfigWebpack
  emailFrom?: string
  emailReplyTo?: string
  emailTestMode?: boolean
  homepage?: string
  mailgunDomain?: string
  mailgunKey?: string
  masterPassword?: string
  mongoUrl?: string
  publicPath?: string
  stripeSecretKey?: string
  stripeWebhookSecret?: string
  isNotMultiTenant?: boolean
  monasteryOptions?: any
  middlewareOrder?: string[]
  middleware?: NitroMiddleware<TUser>
}

/** Expected client config */
export interface NitroConfigClient<TStore> extends NitroConfigWebpack {
  middleware: {[key: string]: (route: NitroRouteClient<TStore>, store: TStore) => undefined | { redirect: string }}
  beforeApp?: () => Promise<object>
}

/** Shared config between server and client */
type NitroConfigShared = {
  baseUrl: string
  env: string
  name: string
  version: string
}

export type User = { // <--- todo: change to NitroUser
  _id?: string
  firstName?: string
  lastName?: string
  name?: string
  avatar?: MonasteryImage
  isAdmin?: boolean
  isInvited?: boolean
  type?: string
  stripeCustomer?: {
    id: string
  }
}

export type MonasteryImage = {
  url: string
  filename: string
  path: string
  bucket: string
  date?: number
}

export type MessageObject = {
  text: string | React.ReactNode
  type?: 'error' | 'info' | 'success' | 'warning'
  timeout?: number
  _date?: number // internal usage only
}

export type Store = {
  apiAvailable?: boolean
  jwt?: string
  message?: MessageObject | string
  user?: User,
}

// util.addressSchema
export type Address = {
  city?: string
  country?: string
  full?: string
  fullModified?: boolean // virtual only
  line1?: string
  line2?: string
  number?: string
  postcode?: string
  suburb?: string
  unit?: string
  location?: [number, number]
  area?: {
    bottomLeft?: [number, number]
    topRight?: [number, number]
  }
}

export type Svg = React.FC<React.SVGProps<SVGElement>>



/*
// Create an `axios` instance type that contains the `axios-retry` global declarations.
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { IAxiosRetryConfigExtended } from 'axios-retry'

// Extend the config to be used below
export interface AxiosRequestConfigWithRetry extends AxiosRequestConfig {
  'axios-retry'?: IAxiosRetryConfigExtended
}

// We only need to fix the `get` method, the rest of the methods inherit the new extended config...
export interface AxiosInstanceWithRetry extends Omit<AxiosInstance, 'get'> { // | 'patch' | 'post' | 'put' | 'delete' | 'request'
  get<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfigWithRetry): Promise<R>;
  // patch<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfigWithRetry): Promise<R>;
  // post<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfigWithRetry): Promise<R>;
  // put<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfigWithRetry): Promise<R>;
  // delete<T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfigWithRetry): Promise<R>;
  // request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfigWithRetry): Promise<R>;
}
*/