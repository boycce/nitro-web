import { css } from '@emotion/react'
import { cloneElement } from 'react'
import { toArray } from '../../../util.js'
import { forwardRef } from 'react'
import { getSelectStyle } from '../form/select.jsx'
import { CheckCircleIcon } from '@heroicons/react/24/solid'


/**
 * Dropdown component
 * 
 * @param {boolean} animate 
 * @param {React.ReactNode} children
 * @param {string} className
 * @param {'bottom-left'|'bottom-right'|'top-left'|'top-right'} [dir='bottom-left'] - The direction of the menu
 * @param {[{ label, onClick, isSelected, icon, className }]} options - Menu options
 * @param {boolean} isHoverable - Whether the dropdown is hoverable
 * @param {number} minWidth - The minimum width of the menu
 * @param {React.ReactNode} menuChildren - The content to render inside the top of the dropdown
 * @param {boolean} menuIsOpen - Whether the menu is open
 * @param {boolean} menuToggles - Whether the menu toggles
 * @param {function} toggleCallback - The callback function to call when the menu is toggled
 */
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
}, ref) {
  // https://letsbuildui.dev/articles/building-a-dropdown-menu-component-with-react-hooks
  isHoverable = isHoverable && !menuIsOpen
  const dropdownRef = useRef(null)
  const [isActive, setIsActive] = useState(menuIsOpen)
  const menuStyle = getSelectStyle({ name: 'menu', usePrefixes: true })

  // Expose the setIsActive function to the parent component
  useImperativeHandle(ref, () => ({ setIsActive }))

  useEffect(() => {
    const pageClick = (e) => {
      try {
        // If the active element exists and is clicked outside of the dropdown, toggle the dropdown
        if (dropdownRef.current !== null && !dropdownRef.current.contains(e.target)) setIsActive(!isActive)
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
  
  function onMouseDown(e) {
    if (e.key && e.key != 'Enter') return
    if (e.key) e.preventDefault() // for button, stops buttons firing twice
    if (!isHoverable && !menuIsOpen && ((menuToggles || e.key) || !isActive)) setIsActive(!isActive)
  }

  function onClick(option, e) {
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
                onClick={(e) => onClick(option, e)}
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

const style = () => css`
  ul {
    transition: transform 0.15s ease, opacity 0.15s ease, visibility 0s 0.15s ease;
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


