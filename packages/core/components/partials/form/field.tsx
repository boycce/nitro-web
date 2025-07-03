/* eslint-disable @typescript-eslint/no-explicit-any */
// fill-current tw class for lucide icons (https://github.com/lucide-icons/lucide/discussions/458)
import { css } from 'twin.macro'
import { FieldCurrency, FieldCurrencyProps, FieldColor, FieldColorProps, FieldDate, FieldDateProps } from 'nitro-web'
import { twMerge, getErrorFromState, deepFind } from 'nitro-web/util'
import { Errors, type Error } from 'nitro-web/types'
import { MailIcon, CalendarIcon, FunnelIcon, SearchIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { memo } from 'react'

type FieldType = 'text' | 'password' | 'email' | 'filter' | 'search' | 'textarea' | 'currency' | 'date' | 'color'
type InputProps = React.InputHTMLAttributes<HTMLInputElement>
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
type FieldExtraProps = {
  /** field name or path on state (used to match errors), e.g. 'date', 'company.email' */
  name: string
  /** name is applied if id is not provided */
  id?: string
  /** state object to get the value, and check errors against */
  state?: { errors?: Errors, [key: string]: any }
  /** type of the field */
  type?: FieldType
  /** icon to show in the input */
  icon?: React.ReactNode
  iconPos?: 'left' | 'right'
  /** Dependencies to break the implicit memoization of onChange/onInputChange */
  deps?: unknown[]
  placeholder?: string
}
type IconWrapperProps = {
  iconPos: 'left' | 'right'
  icon?: React.ReactNode
  [key: string]: unknown
}
// Discriminated union (https://stackoverflow.com/a/77351290/1900648)
export type FieldProps = (
  | ({ type?: 'text' | 'password' | 'email' | 'filter' | 'search' } & InputProps & FieldExtraProps)
  | ({ type: 'textarea' } & TextareaProps & FieldExtraProps)
  | ({ type: 'currency' } & FieldCurrencyProps & FieldExtraProps)
  | ({ type: 'color' } & FieldColorProps & FieldExtraProps)
  | ({ type: 'date' } & FieldDateProps & FieldExtraProps)
)
type IsFieldCachedProps = {
  name: string
  state?: FieldProps['state']
  deps?: FieldProps['deps']
}

export const Field = memo(FieldBase, (prev, next) => {
  return isFieldCached(prev, next)
})

function FieldBase({ state, icon, iconPos: ip, ...props }: FieldProps) {
  // `type` must be kept as props.type for TS to be happy and follow the conditions below
  let value!: string
  let Icon!: React.ReactNode
  const error = getErrorFromState(state, props.name)
  const type = props.type
  const iconPos = ip == 'left' || (type == 'color' && !ip) ? 'left' : 'right'
  const id = props.id || props.name

  if (!props.name) {
    throw new Error('Field component requires a `name` prop')
  }
  
  // Input type
  const [inputType, setInputType] = useState(() => { // eslint-disable-line
    return type == 'password' ? 'password' : (type == 'textarea' ? 'textarea' : 'text')
  })
  
  // Value: Input is always controlled if state is passed in
  if (props.value) value = props.value as string
  else if (typeof state == 'object') {
    const v = deepFind(state, props.name) as string | undefined
    value = v ?? ''
  }

  // Icon
  if (type == 'password') {
    Icon = <IconWrapper 
      iconPos={iconPos} 
      icon={icon || inputType == 'password' ? <EyeOffIcon /> : <EyeIcon />} 
      onClick={() => setInputType(o => o == 'password' ? 'text' : 'password')}
      className="size-[15px] size-input-icon pointer-events-auto"
    />
  } else if (type == 'email') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <MailIcon />} className="size-[14px] size-input-icon" />
  } else if (type == 'filter') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <FunnelIcon />} className="size-[14px] size-input-icon" />
  } else if (type == 'search') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <SearchIcon />} className="size-[14px] size-input-icon" />
  } else if (type == 'color') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <ColorSvg hex={value}/>} className="size-[17px]" />
  } else if (type == 'date') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <CalendarIcon />} className="size-[14px] size-input-icon" />
  } else if (icon) {
    Icon = <IconWrapper iconPos={iconPos} icon={icon} className="size-[14px] size-input-icon" />
  }

  // Classname
  const inputClassName = getInputClasses({ error, Icon, iconPos, type })
  const commonProps = { id: id, value: value, className: inputClassName }

  // Type has to be referenced as props.type for TS to be happy
  if (!type || type == 'text' || type == 'password' || type == 'email' || type == 'filter' || type == 'search') {
    return (
      <FieldContainer error={error} className={props.className}>
        {Icon}<input {...props} {...commonProps} type={inputType} />
      </FieldContainer>
    )
  } else if (type == 'textarea') {
    return (
      <FieldContainer error={error} className={props.className}>
        {Icon}<textarea {...props} {...commonProps} />
      </FieldContainer>
    )
  } else if (type == 'currency') {
    return (
      <FieldContainer error={error} className={props.className}>
        {Icon}<FieldCurrency {...props} {...commonProps} />
      </FieldContainer>
    )
  } else if (type == 'color') {
    return (
      <FieldContainer error={error} className={props.className}>
        <FieldColor {...props} {...commonProps} Icon={Icon} />
      </FieldContainer>
    )
  } else if (type == 'date') { 
    return (
      <FieldContainer error={error} className={props.className}>
        <FieldDate {...props} {...commonProps} Icon={Icon} />
      </FieldContainer>
    )
  }
}

function FieldContainer({ children, className, error }: { children: React.ReactNode, className?: string, error?: Error }) {
  return (
    <div css={style} className={'mt-2.5 mb-6 ' + twMerge(`mt-input-before mb-input-after grid grid-cols-1 nitro-field ${className || ''}`)}>
      {children}
      {error && <div class="mt-1.5 text-xs text-danger-foreground nitro-error">{error.detail}</div>}
    </div>
  )
}

function getInputClasses({ error, Icon, iconPos, type }: { error?: Error, Icon?: React.ReactNode, iconPos: string, type?: string }) {
  // not twMerge
  const px = 'px-[12px]'
  const py = 'py-[9px] py-input-y'
  return (
    'block col-start-1 row-start-1 w-full rounded-md bg-white text-input-base outline outline-1 -outline-offset-1 ' +
    'placeholder:text-input-placeholder focus:outline focus:outline-2 focus:-outline-offset-2 ' + `${py} ${px} ` +
    (iconPos == 'right' && Icon ? 'pr-[32px] pr-input-x-icon pl-input-x ' : '') +
    (iconPos == 'left' && Icon ? 'pl-[32px] pl-input-x-icon pr-input-x ' : 'px-input-x ') +
    (iconPos == 'left' && Icon && type == 'color' ? 'indent-[5px] ' : '') +
    (error 
      ? 'text-danger-foreground outline-danger focus:outline-danger ' 
      : 'text-input outline-input-border focus:outline-input-border-focus ') + 
    (iconPos == 'right' ? 'justify-self-start ' : 'justify-self-end ') + 
    'nitro-input'
  )
}

function IconWrapper({ icon, iconPos, ...props }: IconWrapperProps) {
  return (
    !!icon && 
    <div
      {...props}
      className={
        'z-[0] col-start-1 row-start-1 self-center text-[#c6c8ce] text-input-icon select-none [&>svg]:size-full ' +
        (iconPos == 'right' ? 'justify-self-end mr-[12px] mr-input-x ' : 'justify-self-start ml-[12px] ml-input-x ') + 
        props.className || ''
      }
    >{icon}</div>
  )
}

function ColorSvg({ hex }: { hex?: string }) {
  return (
    <span class="block size-full rounded-md" style={{ backgroundColor: hex ? hex : '#f1f1f1' }}></span>
  )
}

export function isFieldCached(prev: IsFieldCachedProps, next: IsFieldCachedProps) {
  // Check if the field is cached, onChange/onInputChange doesn't affect the cache
  const path = prev.name
  const state = prev.state || {}
  // If the state value has changed, re-render!
  if (deepFind(state, path) !== deepFind(next.state || {}, path)) return false
  // If the state error has changed, re-render!
  if (getErrorFromState(state, path) !== getErrorFromState(next.state || {}, path)) return false
  // If `deps` have changed, handy for onChange/onInputChange, re-render!
  if ((next.deps?.length !== prev.deps?.length) || next.deps?.some((v, i) => v !== prev.deps?.[i])) return false

  // Check if any prop has changed, except `onChange`/`onInputChange`
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)])
  for (const k of allKeys) {
    if (k === 'state' || k === 'onChange' || k === 'onInputChange') continue
    if (prev[k as keyof typeof prev] !== next[k as keyof typeof next]) {
      // console.log(4, 'changed', path, k)
      return false
    }
  }
  // All good, use cached version
  return true
}

const style = css`
  input {
    appearance: textfield;
    -moz-appearance: textfield;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* tw4 we can use calc to determine the padding-left with css variables...
  .inputt {
    padding-left: calc(var(--input-x) * 2);
  } */
`