// Core globals for package development-only, not included in Nitro
import { Store } from 'nitro-web/types'
import { Dispatch, SetStateAction } from 'react'

declare global {
  // useTracked global (needs to be defined in your project's /client/index.ts)
  const useTracked: () => [Store, Dispatch<SetStateAction<Store>>]
}

export {}