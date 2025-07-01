import GithubIcon from 'nitro-web/client/imgs/github.svg'

export function GithubLink({ filename }: { filename: string }) {
  const base = 'https://github.com/boycce/nitro-web/blob/master/packages/'
  // Filenames are relative to the webpack start directory
  // 1. Remove ../ from filename (i.e. for _example build)
  // 2. Remove node_modules/nitro-web/ from filename (i.e. for packages using nitro-web)
  const link = base + filename.replace(/^(\.\.\/|.*node_modules\/nitro-web\/)/, '')
  
  return (
    // <a href={link}>Go to Github</a>
    <a href={link} className="fixed top-0 right-0 nitro-github">
      <GithubIcon />
    </a>
  )
}
