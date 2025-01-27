// Expected config to be available
export type Config = {
  clientUrl: string
  env: string
  awsUrl?: string
  currencies?: object
  countries?: object
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

export type Errors = Array<{ title: string, detail: string }> | null

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