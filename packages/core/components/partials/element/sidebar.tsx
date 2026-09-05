// Component: https://tailwindui.com/components/application-ui/application-shells/sidebar#component-a69d85b6237ea2ad506c00ef1cd39a38
import { css } from 'twin.macro'
import avatarImg from 'nitro-web/client/imgs/avatar.jpg'
import { injectedConfig } from 'nitro-web'
import React from 'react'
import { House, LogOut, Menu, Paintbrush, Users, XIcon } from 'lucide-react'

const sidebarWidth = 'w-80'

export type SidebarProps = {
  Logo?: React.FC<{ width?: string, height?: string }>;
  menu?: { name: string; to: string; toMatcher?: ToMatcher; Icon: React.FC<{ className?: string }> }[]
  links?: { name: string; to: string; toMatcher?: ToMatcher; initial: string }[]
}

type ToMatcher = (pathname: string, search?: string) => boolean

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Sidebar({ Logo, menu, links }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <React.Fragment>
      {/* desktop sidebar */}
      <div css={style} className={
        'fixed inset-y-0 z-50 flex flex-col ease-in-out lg:left-0 lg:translate-x-0 lg:!delay-0 lg:!duration-0 ' +
        (
          sidebarOpen 
            ? 'left-0 translate-x-[0px] sidebar-transition ' 
            : 'left-[-100%] translate-x-[-100%]  sidebar-transition-delay '
        ) + 
        sidebarWidth
      }>
        <div className={
          'absolute left-full top-0 flex w-16 justify-center pt-5 lg:hidden duration-300 ease ' +
          (sidebarOpen ? 'opacity-100' : 'opacity-0')
        }>
          <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
            <XIcon aria-hidden="true" strokeWidth={1.5} size={24} className="text-white" />
          </button>
        </div>
        <SidebarContents Logo={Logo} menu={menu} links={links} />
      </div>

      {/* mobile backdrop */}
      <div 
        css={style} 
        onClick={() => setSidebarOpen(false)}
        className={'fixed w-full z-[49] inset-0 bg-gray-900/70 ease-linear lg:hidden ' + 
          (
            sidebarOpen 
              ? 'left-0 opacity-100 sidebar-transition ' 
              : 'left-[-100%] opacity-0 sidebar-transition-delay '
          )
        }
      />
      
      {/* mobile sidebar topbar */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
          <Menu aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-gray-900">Dashboard</div>
        <Link to="#">
          <img alt="" src={avatarImg} className="size-8 rounded-full bg-gray-50" />
        </Link>
      </div>
      
      <div class={`${sidebarWidth}`} />
    </React.Fragment>
  )
}

function SidebarContents ({ Logo, menu, links }: SidebarProps) {
  const location = useLocation()
  const [store] = useTracked()
  const user = store.user
  
  const isActive = (item: { to: string, toMatcher?: ToMatcher }) => getIsActive(location, item)

  const _menu = menu || [
    { name: 'Dashboard', to: '/', Icon: House },
    { name: injectedConfig.isDemo ? 'Design System' : 'Style Guide', to: '/styleguide', Icon: Paintbrush }, 
    { name: 'Pricing', to: '/pricing', Icon: Users },
    { name: 'Signout', to: '/signout', Icon: LogOut },
  ]

  const _links = links || [
    { name: 'Nitro on Github', to: 'https://github.com/boycce/nitro-web', initial: 'G' },
  ]

  // Sidebar component, swap this element with another sidebar if you like
  return (
    <div className="flex grow flex-col gap-y-8 overflow-y-auto bg-white py-5 px-10 lg:border-r lg:border-gray-200">
      {Logo && (
        <div className="flex h-16 shrink-0 items-center gap-2 justify-between">
          <Link to="/">
            <Logo width="70" height={undefined} />
          </Link>
          <span className="text-[9px] text-gray-900 font-semibold mt-4">{injectedConfig.version}</span>
        </div>
      )}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {_menu.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.to}
                    className={classNames(
                      isActive(item)
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 items-center rounded-md p-2 text-md/6 font-semibold'
                    )}
                  >
                    { item.Icon && 
                      <item.Icon
                        className={classNames(
                          isActive(item) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                          'size-5 shrink-0'
                        )}
                      />
                    }
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <div className="text-xs/6 font-semibold text-gray-400">Other Links</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {_links.map((team) => (
                <li key={team.name}>
                  <Link
                    to={team.to}
                    className={classNames(
                      isActive(team)
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 rounded-md p-2 text-md/6 font-semibold'
                    )}
                  >
                    <span
                      className={classNames(
                        isActive(team)
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600',
                        'flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium'
                      )}
                    >
                      {team.initial}
                    </span>
                    <span className="truncate">{team.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>

          <li className="-mx-6 mt-auto hidden lg:block">
            <Link
              to="#"
              className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50"
            >
              <img alt="" src={avatarImg} className="size-8 rounded-full bg-gray-50" />
              <span aria-hidden="true" class="truncate1 flex-1">{user?.name || 'Guest'}</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

const style = css`
  &.sidebar-transition-delay {
    transition: transform 300ms, opacity 300ms, left 0ms 300ms;
  }
  &.sidebar-transition {
    transition: transform 300ms, opacity 300ms, left 0ms 0ms;
  }
`

// Active class for a menu/tab item, `toMatcher` overrides the default path prefix match
export function getIsActive(
  location: { pathname: string, search: string },
  item?: { toMatcher?: ToMatcher, to?: string } | null
) {
  if (item?.toMatcher) return item.toMatcher(location.pathname, location.search) ? 'is-active' : ''
  else if (item?.to == '/' && location.pathname == item.to) return 'is-active'
  else if (item?.to && item.to != '/' && location.pathname.match(`^${item.to}`)) return 'is-active'
  else return ''
}
