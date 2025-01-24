import GithubIcon from '../../../client/imgs/github.svg'

export function GithubLink({ filename }) {
  const base = 'https://github.com/boycce/nitro-web/blob/master/'
  // Since webpack is started from ./_example, we need to remove ../ from filename
  const link = base + filename.replace(/^\.\.\//, '')
  
  return (
    // <a href={link}>Go to Github</a>
    <a href={link} className="fixed top-0 right-0">
      <GithubIcon />
    </a>
  )
}