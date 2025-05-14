import { css } from 'twin.macro'
import { forwardRef, cloneElement } from 'react'
import { toArray } from 'nitro-web/util'
import { getSelectStyle } from 'nitro-web'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

type DropdownProps = {
  animate?: boolean
  children?: React.ReactNode
  className?: string
  css?: string
  /** The direction of the menu **/
  dir?: 'bottom-left'|'bottom-right'|'top-left'|'top-right'
  options?: { label: string|React.ReactNode, onClick?: Function, isSelected?: boolean, icon?: React.ReactNode, className?: string }[]
  /** Whether the dropdown is hoverable **/
  isHoverable?: boolean
  /** The minimum width of the menu **/
  minWidth?: number | string
  /** The content to render inside the top of the dropdown **/
  menuChildren?: React.ReactNode
  menuIsOpen?: boolean
  menuToggles?: boolean
  toggleCallback?: (isActive: boolean) => void
}

export const Dropdown = forwardRef(function Dropdown({
  animate=true,
  children, 
  className,
  dir, 
  options, 
  isHoverable,
  minWidth, 
  menuChildren, 
  menuIsOpen, 
  menuToggles=true,
  toggleCallback,
}: DropdownProps, ref) {
  // https://letsbuildui.dev/articles/building-a-dropdown-menu-component-with-react-hooks
  isHoverable = isHoverable && !menuIsOpen
  const dropdownRef = useRef<HTMLDivElement|null>(null)
  const [isActive, setIsActive] = useState(!!menuIsOpen)
  const menuStyle = getSelectStyle({ name: 'menu', usePrefixes: true })

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
  
  function onMouseDown(e: { key: string, preventDefault: Function }) {
    if (e.key && e.key != 'Enter') return
    if (e.key) e.preventDefault() // for button, stops buttons firing twice
    if (!isHoverable && !menuIsOpen && ((menuToggles || e.key) || !isActive)) setIsActive(!isActive)
  }

  function onClick(option: { onClick?: Function }, e: React.MouseEvent) {
    if (option.onClick) option.onClick(e)
    if (!menuIsOpen) setIsActive(!isActive)
  }

  return (
    <div 
      class={
        'relative' + 
        (dir ? ` is-${dir}` : ' is-bottom-left') +
        (isHoverable ? ' is-hoverable' : '') +
        (isActive ? ' is-active' : '') +
        (!animate ? ' no-animation' : '') +
        ' nitro-dropdown' +
        (className ? ` ${className}` : '')
      }
      onClick={(e) => e.stopPropagation()} // required for dropdowns inside row links
      ref={dropdownRef} 
      css={style}
    >
      {
        toArray(children).map((el, key) => {
          const onKeyDown = onMouseDown 
          if (!el.type) throw new Error('Dropdown component requires a valid child element')
          return cloneElement(el, { key, onMouseDown, onKeyDown }) // adds onClick
        })
      }
      <ul
        style={{ minWidth }}
        class={`${menuStyle} absolute invisible opacity-0 select-none min-w-full z-[1]`}
      >
        {menuChildren}
        {
          options && options.map((option, i) => {
            const optionStyle = getSelectStyle({ name: 'option', usePrefixes: true, isSelected: option.isSelected })
            return (
              <li 
                key={i} 
                className={`${optionStyle} ${option.className}`}
                onClick={(e: React.MouseEvent) => onClick(option, e)}
              >
                <span class="flex-auto">{option.label}</span>
                { !!option.icon && option.icon }
                { option.isSelected && <CheckCircleIcon className="size-[22px] text-primary -my-1 -mx-1" /> }
              </li>
            )
          })
        }
      </ul>
    </div>
  )
})

const style = css`
  ul {
    transition: transform 0.15s ease, opacity 0.15s ease, visibility 0s 0.15s ease, max-width 0s 0.15s ease, max-height 0s 0.15s ease;
    max-width: 0; // handy if the dropdown ul exceeds the viewport width
    max-height: 0; // handy if the dropdown ul exceeds the viewport height
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
    ul {
      top: 100%;
      transform: translateY(6px);
    }
  }
  &.is-top-left,
  &.is-top-right {
    ul {
      bottom: 100%;
      transform: translateY(-10px);
    }
  }
  // active submenu
  &.is-hoverable:hover,
  &:focus,
  &.is-active,
  li:hover,
  li:focus,
  li.is-active {
    ul {
      opacity: 1;
      visibility: visible;
      transition: transform 0.15s ease, opacity 0.15s ease;
      max-width: 1000px;
      max-height: 1000px;
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
    ul {
      transition: none;
    }
  }
`


