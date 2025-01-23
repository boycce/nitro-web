// Component: https://tailwindui.com/components/application-ui/application-shells/sidebar#component-a69d85b6237ea2ad506c00ef1cd39a38
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import avatarImg from '../../../client/imgs/avatar.jpg'
import {
  Bars3Icon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  ArrowLeftCircleIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline'

const sidebarWidth = 'lg:w-80'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function Sidebar({ Logo }) {
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
            <SidebarContents Logo={Logo} />
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col ${sidebarWidth}`}>
        <SidebarContents Logo={Logo} />
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

function SidebarContents ({ Logo }) {
  const location = useLocation()
  const [{ user }] = sharedStore.useTracked()

  function isActive(path) {
    if (path == '/' && location.pathname == path) return 'is-active'
    else if (path != '/' && location.pathname.match(`^${path}`)) return 'is-active'
    else return ''
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Pricing (example)', href: '/pricing', icon: UsersIcon },
    { name: 'Styleguide', href: '/styleguide', icon: PaintBrushIcon },
    { name: 'Signout', href: '/signout', icon: ArrowLeftCircleIcon },
  ]

  const teams = [
    { id: 1, name: 'Team 1', href: '#', initial: 'T' },
    { id: 2, name: 'Team 2', href: '#', initial: 'H' },
  ]

  // Sidebar component, swap this element with another sidebar if you like
  return (
    <div className="flex grow flex-col gap-y-8 overflow-y-auto bg-white py-5 px-10 lg:border-r lg:border-gray-200">
      <div className="flex h-16 shrink-0 items-center">
        <Logo alt="Nitro" width="70" />
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={classNames(
                      isActive(item.href)
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 items-center rounded-md p-2 text-sm/6 font-semibold'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        isActive(item.href) ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                        'size-5 shrink-0'
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <div className="text-xs/6 font-semibold text-gray-400">Your teams</div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {teams.map((team) => (
                <li key={team.name}>
                  <Link
                    to={team.href}
                    className={classNames(
                      isActive(team.href)
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                      'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold'
                    )}
                  >
                    <span
                      className={classNames(
                        isActive(team.href)
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