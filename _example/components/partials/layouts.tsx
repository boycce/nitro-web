import { Layout1 as L1, Layout2 as L2 } from 'nitro-web'
import Logo from '../../client/imgs/logo/logo.svg'
import { Config } from 'types'

const links = [
  { name: 'Nitro on Github', to: 'https://github.com/boycce/nitro-web', initial: 'G' },
]

export const Layout1 = ({ config }: { config: Config }) => { return <L1 Logo={Logo} links={links} config={config} /> }
export const Layout2 = ({ config }: { config: Config }) => { return <L2 Logo={Logo} config={config} /> }
