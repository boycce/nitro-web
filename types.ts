// Expected config to be available
export type Config = {
  clientUrl: string
  env: string
  awsUrl?: string
  // needed for input-currency.tsx
  currencies: { [key: string]: { symbol: string, digits: number } }
  countries: { [key: string]: { numberFormats: { currency: string } } }
  googleMapsApiKey?: string
  isStatic?: boolean
  placeholderEmail?: string
  stripePublishableKey?: string
  middleware?: Record<string, (route: unknown, store: Store) => undefined | { redirect: string }>
  beforeApp?: () => Promise<object>
  beforeStoreUpdate?: (prevStore: Store | null, newData: Store) => Store
}

export type User = {
  _id?: string
  firstName?: string
  lastName?: string
  name?: string
  avatar?: MonasteryImage
}

export type Error = { title: string, detail: string }
export type Errors = Array<Error> | null

export type MonasteryImage = {
  url: string
  filename: string
}

export type MessageObject = {
  date?: number
  text: string | React.ReactNode
  type?: 'error' | 'info' | 'success' | 'warning'
  timeout?: number
}

export type Store = {
  message?: MessageObject | string | null
  user?: User | null,
  apiAvailable?: boolean
}