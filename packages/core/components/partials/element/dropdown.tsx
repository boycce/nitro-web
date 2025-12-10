import { css } from 'twin.macro'
import { forwardRef, cloneElement } from 'react'
import { getSelectStyle, twMerge } from 'nitro-web'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export type DropdownProps = {
  allowOverflow?: boolean
  animate?: boolean
  children?: React.ReactNode
  className?: string
  css?: string
  /** The direction of the menu **/
  dir?: 'bottom-left'|'bottom-right'|'top-left'|'top-right'
  options?: { 
    label: string|React.ReactNode,
    onClick?: Function,
    isSelected?: boolean,
    icon?: React.ReactNode,
    iconLeft?: React.ReactNode,
    /** Prevent the dropdown from closing when the option is clicked */
    preventCloseOnClick?: boolean,
    className?: string 
  }[]
  /** Whether the dropdown is hoverable **/
  isHoverable?: boolean
  /** The content to render inside the top of the dropdown **/
  menuContent?: React.ReactNode
  menuClassName?: string
  menuOptionClassName?: string
  /** force open the menu */
  menuIsOpen?: boolean
  menuToggles?: boolean
  /** The minimum width of the menu **/
  minWidth?: number | string
  maxHeight?: number | string
  toggleCallback?: (isActive: boolean) => void
  /** when keeping active when the children clicked **/
  preventCloseOnClickChild?: boolean
}

export const Dropdown = forwardRef(function Dropdown({
  allowOverflow=false,
  animate=true,
  children, 
  className,
  dir='bottom-left', 
  options, 
  isHoverable,
  menuClassName,
  menuOptionClassName,
  menuContent, 
  menuIsOpen, 
  menuToggles=true,
  minWidth,
  maxHeight,
  toggleCallback,
  preventCloseOnClickChild,
}: DropdownProps, ref) {
  // https://letsbuildui.dev/articles/building-a-dropdown-menu-component-with-react-hooks
  isHoverable = isHoverable && !menuIsOpen
  const dropdownRef = useRef<HTMLDivElement|null>(null)
  const [isActive, setIsActive] = useState(!!menuIsOpen)
  const menuStyle = getSelectStyle({ name: 'menu' })
  const [direction, setDirection] = useState<null | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>(null)
  const [ready, setReady] = useState(false)

  // Expose the setIsActive function to the parent component
  useImperativeHandle(ref, () => ({ setIsActive }))

  useEffect(() => {
    const pageClick = (event: MouseEvent | FocusEvent) => {
      try {
        // If the active element exists and is clicked outside of the dropdown, toggle the dropdown
        if (dropdownRef.current !== null && !dropdownRef.current.contains(event.target as Node)) setIsActive(!isActive)
      } catch (_e) {
        // Errors throw for contains() when the user clicks off the webpage when open
        setIsActive(!isActive)
      }
    }
    if (isActive && !menuIsOpen) {
      // Wait for the next event loop in the case of mousedown'ing the dropdown, while loosing click focus from a checkbox  
      setTimeout(() => {
        window.addEventListener('mousedown', pageClick)
        window.addEventListener('focus', pageClick, true) // true needed to capture focus events
      }, 0)
    }
    return () => {
      window.removeEventListener('mousedown', pageClick)
      window.removeEventListener('focus', pageClick, true) // true needed to capture focus events
    }
  }, [isActive, dropdownRef])

  useEffect(() => {
    if (toggleCallback) toggleCallback(isActive)
  }, [isActive])

  useEffect(() => {
    setReady(false)
    if (!isActive || !dropdownRef.current) return
    
    const ul = dropdownRef.current.querySelector('ul') as HTMLElement
    if (!ul) return
  
    // Temporarily show the ul for measurement
    const originalMaxHeight = ul.style.maxHeight
    const originalVisibility = ul.style.visibility
    const originalOpacity = ul.style.opacity
    const originalPointerEvents = ul.style.pointerEvents
  
    ul.style.maxHeight = 'none'
    ul.style.visibility = 'hidden'
    ul.style.opacity = '0'
    ul.style.pointerEvents = 'none'
  
    const dropdownHeight = ul.getBoundingClientRect().height
  
    // Revert styles
    ul.style.maxHeight = originalMaxHeight
    ul.style.visibility = originalVisibility
    ul.style.opacity = originalOpacity
    ul.style.pointerEvents = originalPointerEvents
  
    const rect = dropdownRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
  
    const side = dir.endsWith('right') ? 'right' : 'left'
  
    const newDirection = dir.startsWith('bottom')
      ? `${spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'top' : 'bottom'}-${side}`
      : `${spaceAbove < dropdownHeight && spaceBelow > dropdownHeight ? 'bottom' : 'top'}-${side}`
  
    setDirection(newDirection as 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right')
  
    requestAnimationFrame(() => {
      setReady(true)
    })
  }, [isActive, dir])

  function onMouseDown(e: { key: string, preventDefault: Function, target: EventTarget | null }) {
    if (e.key && e.key != 'Enter') return
    if (e.key) e.preventDefault() // for button, stops buttons firing twice

    if (!isHoverable && !menuIsOpen && ((menuToggles || e.key) || !isActive)) {
      if (isActive && preventCloseOnClickChild && dropdownRef.current?.contains(e.target as Node)) return // keep active
      setIsActive(!isActive)
    }
  }

  function onClick(option: { onClick?: Function, preventCloseOnClick?: boolean }, e: React.MouseEvent) {
    if (option.onClick) option.onClick(e, option)
    if (!menuIsOpen && !option?.preventCloseOnClick) setIsActive(!isActive)
  }

  return (
    <div 
      class={
        `relative is-${direction || dir}` + // until hovered, show the original direction to prevent scrollbars
        (isHoverable ? ' is-hoverable' : '') +
        (isActive ? ' is-active' : '') +
        (!animate ? ' no-animation' : '') +
        (allowOverflow ? ' is-allowOverflow' : '') +
        ' nitro-dropdown' +
        (className ? ` ${className}` : '')
      }
      onClick={(e) => e.stopPropagation()} // required for dropdowns inside row links
      ref={dropdownRef} 
      css={style}
    >
      {
        (Array.isArray(children) ? children : [children]).map((el, key) => {
          const onKeyDown = onMouseDown 
          if (!el.type) throw new Error('Dropdown component requires a valid child element')
          return cloneElement(el, { key, onMouseDown, onKeyDown }) // adds onClick
        })
      }
      <ul
        style={{ 
          minWidth: minWidth, 
          maxHeight: maxHeight, 
          ...(maxHeight ? { overflow: 'auto' } : {}),
        }}
        class={
          twMerge(`${menuStyle} ${ready ? 'is-ready' : ''} absolute invisible opacity-0 select-none min-w-full z-[1] ${menuClassName||''}`)}
      >
        {menuContent}
        {
          options && options.map((option, i) => {
            const optionStyle = getSelectStyle({ name: 'option', usePrefixes: true, isSelected: option.isSelected })
            return (
              <li 
                key={i} 
                className={twMerge(`${optionStyle} ${option.className} ${menuOptionClassName}`)}
                onClick={(e: React.MouseEvent) => onClick(option, e)}
              >
                { !!option.iconLeft && option.iconLeft }
                <span class="flex-auto">{option.label}</span>
                { !!option.icon && option.icon }
                { option.isSelected && <CheckCircleIcon className="size-[22px] text-primary -my-1 -mx-0.5" /> }
              </li>
            )
          })
        }
      </ul>
    </div>
  )
})

const style = css`
  &>ul {
    transition: transform 0.15s ease, opacity 0.15s ease, visibility 0s 0.15s ease, max-width 0s 0.15s ease, max-height 0s 0.15s ease;
    max-width: 0; // handy if the dropdown ul exceeds the viewport width
    max-height: 0; // handy if the dropdown ul exceeds the viewport height
    pointer-events: none;
  }
  &.is-bottom-right,
  &.is-top-right {
    ul {
      left: auto;
      right: 0;
    }
  }
  &.is-bottom-left,
  &.is-bottom-right {
    &>ul {
      top: 100%;
      transform: translateY(6px);
    }
  }
  &.is-top-left,
  &.is-top-right {
    &>ul {
      bottom: 100%;
      transform: translateY(-10px);
    }
  }
  // active submenu
  &.is-hoverable:hover,
  &:focus,
  &.is-active,
  &>ul>li:hover,
  &>ul>li:focus,
  &>ul>li.is-active {
    &>ul.is-ready {
      opacity: 1;
      visibility: visible;
      transition: transform 0.15s ease, opacity 0.15s ease;
      max-width: 1000px;
      max-height: 1000px;
      pointer-events: auto;
    }
    &.is-allowOverflow > ul {
      overflow: visible;
    }
    &.is-bottom-left > ul,
    &.is-bottom-right > ul {
      transform: translateY(3px) !important;
    }
    &.is-top-left > ul,
    &.is-top-right > ul {
      transform: translateY(-7px) !important;
    }
  }
  // no animation
  &.no-animation {
    &>ul {
      transition: none;
    }
  }
`


