import { IsFirstRender, twMerge } from 'nitro-web'
import SvgX1 from 'nitro-web/client/imgs/icons/x1.svg'

type ModalProps = {
  show: boolean
  setShow: (show: boolean) => void
  children: React.ReactNode
  className?: string
  rootClassName?: string
  dismissable?: boolean
  maxWidth?: string
  minHeight?: string
  [key: string]: unknown
}

export function Modal({ show, setShow, children, maxWidth, minHeight, dismissable = true, className, rootClassName }: ModalProps) {
  const [state, setState] = useState(show ? 'open' : 'close')
  const containerEl = useRef<HTMLDivElement>(null)
  const isFirst = IsFirstRender()

  const states = {
    'close': { 
      root: 'left-[-100vw] transition-[left] duration-0 delay-200',
      bg: 'opacity-0',
      container: 'opacity-0 scale-[0.97]',
    },
    'close-now': { 
      root: '',
      bg: '',
      container: 'opacity-0 !transition-none',
    },
    'open': { 
      root: 'left-0 transition-none model-open',
      bg: 'opacity-100 duration-200',
      container: 'opacity-100 scale-[1] duration-200',
    },
  }
  const stateObj = states[state as keyof typeof states]

  useEffect(() => {
    if (isFirst) return
    if (show) {
      setState('open')
    } else {
      setTimeout(() => {
        // If another modal is being opened, force close the container for a smoother transition
        if (document.getElementsByClassName('modal-open').length > 1) {
          setState('close-now')
        } else {
          setState('close')
        }
      }, 10)
    }
  // There is a bug during hot-reloading where the modal does't open if we don't ensure 
  // the same truthy/falsey type is used.
  }, [!!show])
  
  function onClick(e: React.MouseEvent) {
    const clickedOnModal = containerEl.current && containerEl.current.contains(e.target as Node)
    if (!clickedOnModal && dismissable) {
      setShow(false)
    }
  }

  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      class={`${twMerge(`fixed top-0 w-[100vw] h-[100vh] z-[200] ${stateObj.root} ${rootClassName||''}`)} nitro-modal`}
    >
      <div class={`!absolute inset-0 box-content bg-gray-500/70 transition-opacity ${stateObj.bg}`}></div>
      <div class={`relative h-[100vh] overflow-y-auto transition-[opacity,transform] ${stateObj.container}`}>
        <div class="flex items-center justify-center min-h-full" onMouseDown={onClick}> 
          <div 
            ref={containerEl} 
            style={{ maxWidth: maxWidth || '550px', minHeight: minHeight }} 
            class={`relative w-full mx-6 mt-4 mb-8 bg-white rounded-lg shadow-lg p-9 ${className||''}`}
          >
            <div 
              class="absolute top-0 right-0 p-3 m-1 cursor-pointer" 
              onClick={() => { if (dismissable) { setShow(false) }}}
            >
              <SvgX1 />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
