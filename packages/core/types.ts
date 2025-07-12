/* eslint-disable @typescript-eslint/no-explicit-any */

type InjectedConfig = {
  awsUrl?: string
  clientUrl: string
  countries: { [key: string]: { name: string, numberFormats: { currency: string } } } // for input-currency.tsx
  currencies: { [key: string]: { name: string, symbol: string, digits: number } } // for input-currency.tsx
  env: string
  googleMapsApiKey?: string
  isDemo: boolean // implicitly defined by webpack
  isStatic: boolean // implicitly defined by webpack
  jwtName: string // implicitly defined by webpack
  name: string
  placeholderEmail?: string
  stripePublishableKey?: string
  titleSeparator?: string
  version: string
}

export type Config = InjectedConfig & {
  // Non-injectable config on the client
  beforeApp?: () => Promise<object>
  beforeStoreUpdate?: (prevStore: Store | null, newData: Store) => Store
  middleware?: {[key: string]: (route: any, store: any) => undefined | { redirect: string }}
}

export type User = {
  _id?: string
  firstName?: string
  lastName?: string
  name?: string
  avatar?: MonasteryImage
}

export type Error = { title: string, detail: string }
export type Errors = Error[]

export type MonasteryImage = {
  url: string
  filename: string
  path: string
  bucket: string
  date?: number
}

export type MessageObject = {
  date?: number
  text: string | React.ReactNode
  type?: 'error' | 'info' | 'success' | 'warning'
  timeout?: number
}

export type Store = {
  apiAvailable?: boolean
  jwt?: string
  message?: MessageObject | string
  user?: User,
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