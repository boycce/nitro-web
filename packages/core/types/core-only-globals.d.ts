import { Store } from 'nitro-web/types'
import { Dispatch, SetStateAction } from 'react'
import type { AxiosStatic } from 'axios'
import 'axios-retry'

declare global {
  // useTracked global (normally defined in your project's /client/index.ts)
  const useTracked: () => [Store, Dispatch<SetStateAction<Store>>]
}

export type AxiosWithRetry = AxiosStatic

export {}