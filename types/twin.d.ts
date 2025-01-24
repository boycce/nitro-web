// Webpack: Twin.macro
// https://github.com/ben-rogerson/twin.examples/tree/master/react-emotion-typescript
import 'twin.macro'
import { css as cssImport } from '@emotion/react'
import styledImport from '@emotion/styled'
declare module 'twin.macro' {
  // The styled and css imports
  const styled: typeof styledImport
  const css: typeof cssImport
}

import { CSSInterpolation } from '@emotion/serialize'
declare module 'react' {
  // The tw and css prop
  interface DOMAttributes<> { // removed T
    tw?: string
    css?: CSSInterpolation
  }
}