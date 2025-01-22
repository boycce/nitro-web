import { css } from 'twin.macro'
import * as util from '../../../util.js'
import { InputCurrency } from './input-currency.jsx'
import { InputColor } from './input-color.jsx'
// import { InputDate } from './input-date.jsx'
import {
  EnvelopeIcon,
  // CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/20/solid'

/**
 * Input
 * @param {string} name - field name or path on state (used to match errors), e.g. 'date', 'company.email'
 * @param {object} state - State object to get the value, and check errors against
 * @param {string} [id] - not required, name used if not provided
 * @param {('password'|'email'|'text'|'date'|'filter'|'search'|'color'|'textarea'|'currency')} [type='text']
 */
export function Input({ name='', state, id, type='text', ...props }) {
  let iconDir = 'right'
  let InputEl = 'input'
  const [inputType, setInputType] = useState(() => {
    return type == 'password' ? 'password' : (type == 'textarea' ? type : 'text')
  })

  if (!name) throw new Error('Input component requires a `name` prop')
  
  // Input is always controlled if state is passed in
  if (props.value) {
    var value = props.value
  } else if (typeof state == 'object') {
    value = util.deepFind(state, name)
    if (typeof value == 'undefined') value = ''
  }

  // Find any errors that match this input path
  for (let item of (state?.errors || [])) {
    if (util.isRegex(name) && (item.title||'').match(name)) var error = item
    else if (item.title == name) error = item
  }

  // Special input types
  if (type == 'password') {
    var onClick = () => setInputType(o => o == 'password' ? 'text' : 'password')
    var IconSvg = inputType == 'password' ? <EyeSlashIcon /> : <EyeIcon />
  } else if (type == 'email') { 
    IconSvg = <EnvelopeIcon />
  // } else if (type == 'date') { 
  //   IconSvg = <CalendarIcon />
  //   InputEl = InputDate
  } else if (type == 'filter') { 
    IconSvg = <FunnelIcon />
  } else if (type == 'search') { 
    IconSvg = <MagnifyingGlassIcon />
  } else if (type == 'color') {
    iconDir = 'left'
    IconSvg = <ColorIcon hex={value}/>
    InputEl = InputColor
  } else if (type == 'textarea') {
    InputEl = 'textarea'
  } else if (type == 'currency') {
    if (!props.config) throw new Error('Input: `config` is required when type=currency')
    InputEl = InputCurrency
  }

  // Icon
  const iconEl = <IconEl iconDir={iconDir} IconSvg={IconSvg} onClick={onClick} type={type} />

  // Create base props object
  const inputProps = {
    ...props,
    // autoComplete: props.autoComplete || 'off',
    id: id || name,
    type: inputType,
    value: value,
    iconEl: iconEl,
    className: 
      'col-start-1 row-start-1 block w-full rounded-md bg-white py-2 text-sm outline outline-1 -outline-offset-1 ' +
      'placeholder:text-input-placeholder focus:outline focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ' +
      (iconDir == 'right' && IconSvg ? 'sm:pr-9 pl-3 pr-10 ' : IconSvg ? 'sm:pl-9 pl-10 pr-3 ' : 'px-3 ') +
      (error ? 'text-red-900 outline-danger focus:outline-danger ' : 'text-input outline-input-border focus:outline-primary ') + 
      (iconDir == 'right' ? 'justify-self-start ' : 'justify-self-end '),
  }

  // Only add iconEl prop for custom components
  if (!['color', 'date'].includes(type)) delete inputProps.iconEl

  return (
    // https://tailwindui.com/components/application-ui/forms/input-groups#component-474bd025b849b44eb3c46df09a496b7a
    <div css={style} className={`mt-input-before mb-input-after grid grid-cols-1 ${props?.className || ''}`}>
      { !inputProps.iconEl && iconEl }
      <InputEl {...inputProps} />
      {error && <div class="mt-1.5 text-xs text-danger">{error.detail}</div>}
    </div>
  )
}

function IconEl({ iconDir, IconSvg, onClick, type }) {
  const iconSize = type == 'color' ? 'size-[18px]' : 'size-4'
  return (
    !!IconSvg && 
    <div 
      className={`col-start-1 row-start-1 ${iconSize} self-center text-[#c6c8ce] select-none relative z-[1] ` +
        `pointer-events-${type == 'password' ? 'auto' : 'none'} ` +
        (iconDir == 'right' ? 'justify-self-end mr-3' : 'justify-self-start ml-3')
      }
      onClick={onClick}
    >{IconSvg}</div>
  )
}

function ColorIcon({ hex }) {
  return (
    <span class="block size-full rounded-md" style={{ backgroundColor: hex ? hex : '#f1f1f1' }}></span>
  )
}

const style = () => css`
  input {
    appearance: textfield;
    -moz-appearance: textfield;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`