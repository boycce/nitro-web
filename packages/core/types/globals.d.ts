import 'twin.macro'
import { css as cssImport } from '@emotion/react'
import styledImport from '@emotion/styled'
import { CSSInterpolation } from '@emotion/serialize'
// import 'axios'
// import type { IAxiosRetry } from 'axios-retry'
// // Webpack: axios-retry augment (since axios-retry is not imported in host project)
// declare module 'axios' {
//   export interface AxiosRequestConfig {
//     'axios-retry'?: IAxiosRetry.IAxiosRetryConfigExtended
//   }
// }


declare global {
  /** Webpack injected config variables */
  const INJECTED_CONFIG: Record<string, string|boolean|object>
  /** Webpack svg loader */
  declare module '*.svg' {
    const content: React.FC<React.SVGProps<SVGElement>>
    export default content
  }
  
  /** Webpack image loader */
  declare module '*.jpg' {
    const content: string
    export default content
  }
}

// Webpack: Twin.macro css extension
// https://github.com/ben-rogerson/twin.examples/tree/master/react-emotion-typescript
declare module 'twin.macro' {
  // The styled and css imports
  const styled: typeof styledImport
  const css: typeof cssImport
}

// Webpack: Twin & React-Html-Attrs babel plugins extend dom attributes
declare module 'react' {
  // The tw and css prop
  interface DOMAttributes<T> { // eslint-disable-line
    tw?: string
    css?: CSSInterpolation
    class?: string | undefined,
    for?: string | undefined
  }
}

export {}