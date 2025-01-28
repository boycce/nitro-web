// Component: https://tailwindui.com/components/application-ui/application-shells/sidebar#component-a69d85b6237ea2ad506c00ef1cd39a38
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import avatarImg from 'nitro-web/client/imgs/avatar.jpg'
import { isDemo } from 'nitro-web'
import {
  Bars3Icon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  ArrowLeftCircleIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline'

const sidebarWidth = 'lg:w-80'

export type SidebarProps = {
  Logo: React.FC<{ width?: string, height?: string, alt?: string }>;
  menu?: { name: string; to: string; Icon: React.FC<{ className?: string }> }[]
  links?: { name: string; to: string; initial: string }[]
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Sidebar({ Logo, menu, links }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <>
      {/* mobile sidebar opened */}
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out 
            data-[closed]:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            <SidebarContents Logo={Logo} menu={menu} links={links} />
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col ${sidebarWidth}`}>
        <SidebarContents Logo={Logo} menu={menu} links={links} />
      </div>
      
      {/* mobile sidebar closed */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-gray-900">Dashboard</div>
        <Link to="#">
          <img alt="" src={avatarImg} className="size-8 rounded-full bg-gray-50" />
        </Link>
      </div>
      
      <div class={`${sidebarWidth}`} />
    </>
  )
}

function SidebarContents ({ Logo, menu, links }: SidebarProps) {
  const location = useLocation()
  const [store] = useTracked()
  const user = store.user
  
  function isActive(path: string) {
    if (path == '/' && location.pathname == path) return 'is-active'
    else if (path != '/' && location.pathname.match(`^${path}`)) return 'is-active'
    else return ''
  }

  const _menu = menu || [
    { name: 'Dashboard', to: '/', Icon: HomeIcon },
    { name: isDemo ? 'Design System' : 'Style Guide', to: '/styleguide', Icon: PaintBrushIcon }, 
    { name: 'Pricing', to: '/pricing', Icon: UsersIcon },
    { name: 'Signout', to: '/signout', Icon: ArrowLeftCircleIcon },
  ]

  const _links = links || [
    { name: 'Team 1', to: '#', initial: 'T' },
    { name: 'Team 2', to: '#', initial: 'H' },
  ]

  // Sidebar component, swap this element with another sidebar if you like
  return (
    <div className="flex grow flex-col gap-y-8 overflow-y-auto bg-white py-5 px-10 lg:border-r lg:border-gray-200">
      <div className="flex h-16 shrink-0 items-center">
        <Link to="/">
          <Logo alt="Nitro" width="70" height={undefined} />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {_menu.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.to}
                    className={classNames(
                      isActive(item.to)
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 items-center rounded-md p-2 text-sm/6 font-semibold'
                    )}
                  >
                    { item.Icon && 
                      <item.Icon
                        className={classNames(
                          isActive(item.to) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
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
                      isActive(team.to)
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold'
                    )}
                  >
                    <span
                      className={classNames(
                        isActive(team.to)
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
              <span aria-hidden="true" class="truncate1">{user?.name || 'Guest'}</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}