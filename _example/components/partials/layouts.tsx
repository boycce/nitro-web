import { Layout1 as L1, Layout2 as L2 } from 'nitro-web'
import Logo from '../../client/imgs/logo/logo.svg'

const links = [
  { name: 'Nitro on Github', to: 'https://github.com/boycce/nitro-web', initial: 'G' },
]

export const Layout1 = () => { return <L1 Logo={Logo} links={links} /> }
export const Layout2 = () => { return <L2 Logo={Logo} /> }
