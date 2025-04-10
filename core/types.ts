// Expected config to be available
export type Config = {
  clientUrl: string
  countries: { [key: string]: { numberFormats: { currency: string } } } // for input-currency.tsx
  currencies: { [key: string]: { symbol: string, digits: number } } // for input-currency.tsx
  env: string
  name: string
  version: string

  awsUrl?: string
  beforeApp?: () => Promise<object>
  beforeStoreUpdate?: (prevStore: Store | null, newData: Store) => Store
  googleMapsApiKey?: string
  isStatic?: boolean
  middleware?: Record<string, (route: unknown, store: Store) => undefined | { redirect: string }>
  placeholderEmail?: string
  stripePublishableKey?: string
  titleSeparator?: string
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

export type Svg = React.FC<React.SVGProps<SVGElement>>
