import { Fragment } from 'react'
import { Outlet } from 'react-router-dom'
import { injectedConfig, Message, MessageIcons, Sidebar, ThemeToggle } from 'nitro-web'
import LogoDark from '../../client/imgs/logo/logo.svg'
import LogoWhite from '../../client/imgs/logo/logo-white.svg'
import { CreditCard, House, LogOut, Paintbrush, Users } from 'lucide-react'

// Logo per theme
const Logo = (props: { width?: string, height?: string }) => (
  <Fragment>
    <LogoDark {...props} className="dark:hidden" />
    <LogoWhite {...props} className="hidden dark:block" />
  </Fragment>
)

// Sidebar links
const menu = [
  { name: 'Dashboard', to: '/', Icon: House },
  { name: 'Employees', to: '/employees', Icon: Users },
  { name: 'Pricing', to: '/pricing', Icon: CreditCard },
  { name: injectedConfig.isDemo ? 'Design System' : 'Style Guide', to: '/styleguide', Icon: Paintbrush },
  { name: 'Signout', to: '/signout', Icon: LogOut },
]

// Dashboard, app screens (only the <Outlet/> receives `params` and `location`)
export function Layout1() {
  return (
    <div class="bg-background min-w-fit">
      <Message icons={{} as MessageIcons} />
      <div class="flex-1">
        <div class="max-w-[1800px] mx-auto lg:flex min-h-[100%] w-[100%] min-w-fit">
          <Sidebar Logo={Logo} menu={menu} />
          <div class="py-10 px-14 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

// Signin, reset password, etc
export function Layout2() {
  return (
    <div class="bg-background">
      <Message icons={{} as MessageIcons} />
      <div class="max-w-[1800px] mx-auto flex flex-col min-h-full w-full">
        <div class="max-w-[700px] mx-auto flex-1 w-full px-5 py-10">
          <div class="border-b mb-6">
            <Link to="/signin" class="logo relative block -ml-1 -mt-1 p-1">
              <Logo width="60" />
            </Link>
          </div>
          <Outlet />
        </div>

        <div class="max-w-[700px] mx-auto w-full px-5 pb-4 flex items-center text-sm text-foreground">
          <ul class="flex-1 flex gap-4 list-style-none">
            <li><Link class="underline1" to="/">Home</Link></li>
            <li><Link class="underline1" to="/about">About</Link></li>
            <li><Link class="underline1" to="/research-floor">Middleware Example</Link></li>
          </ul>
          <ThemeToggle className="mr-2" />
          <div>
            2025 © {injectedConfig?.name || 'Nitro'}
          </div>
        </div>

      </div>
    </div>
  )
}
