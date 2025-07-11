import { Store } from 'nitro-web/types'
import { Dispatch, SetStateAction } from 'react'

declare global {
  // useTracked global (normally defined in your project's /client/index.ts)
  const useTracked: () => [Store, Dispatch<SetStateAction<Store>>]
}

export {}