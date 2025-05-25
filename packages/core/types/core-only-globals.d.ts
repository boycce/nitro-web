import { Store } from 'nitro-web/types'
import { Dispatch, SetStateAction } from 'react'

// Core-only global, this global will be defined globally in the project (e.g. in ./client/index.ts)
declare global { 
  const useTracked: () => [Store, Dispatch<SetStateAction<Store>>]
}

export {}