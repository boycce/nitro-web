type InjectedConfig = {
  awsUrl?: string
  clientUrl: string
  countries: { [key: string]: { numberFormats: { currency: string } } } // for input-currency.tsx
  currencies: { [key: string]: { symbol: string, digits: number } } // for input-currency.tsx
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
  middleware?: Record<string, (route: unknown, store: Store) => undefined | { redirect: string }>
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
  jwt?: string
}

export type Svg = React.FC<React.SVGProps<SVGElement>>
