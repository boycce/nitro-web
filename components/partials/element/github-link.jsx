import { css } from 'twin.macro'
import GithubIcon from '../../../client/imgs/github.svg'

export function GithubLink({ filename }) {
  const base = 'https://github.com/boycce/nitro-web/blob/master/'
  // Filenames are relative to the webpack start directory
  // 1. Remove ../ from filename (i.e. for _example build)
  // 2. Remove node_modules/nitro-web/ from filename (i.e. for packages using nitro-web)
  const link = base + filename.replace(/^(\.\.\/|.*node_modules\/nitro-web\/)/, '')
  
  return (
    // <a href={link}>Go to Github</a>
    <a href={link} className="fixed top-0 right-0" css={style}>
      <GithubIcon />
    </a>
  )
}

const style = css`
  //
`