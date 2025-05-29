import { css } from 'twin.macro'
import { twMerge } from 'tailwind-merge'
import { util, FieldCurrency, FieldCurrencyProps, FieldColor, FieldColorProps, FieldDate, FieldDateProps } from 'nitro-web'
import { Errors, type Error } from 'nitro-web/types'
import {
  EnvelopeIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/20/solid'
// Maybe use fill-current tw class for lucide icons (https://github.com/lucide-icons/lucide/discussions/458)

type InputProps = React.InputHTMLAttributes<HTMLInputElement>
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
type FieldExtraProps = {
  // field name or path on state (used to match errors), e.g. 'date', 'company.email'
  name: string
  id?: string
  // state object to get the value, and check errors against
  state?: { errors?: Errors, [key: string]: unknown }
  type?: 'text' | 'password' | 'email' | 'filter' | 'search' | 'textarea' | 'currency' | 'date' | 'color'
  icon?: React.ReactNode
  iconPos?: 'left' | 'right'
}
type IconWrapperProps = {
  iconPos: string
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

export function Field({ state, icon, iconPos: ip, ...props }: FieldProps) {
  // type must be kept as props.type for TS to be happy and follow the conditions below
  let error!: Error
  let value!: string
  let Icon!: React.ReactNode
  const type = props.type
  const iconPos = ip == 'left' || (type == 'color' && !ip) ? 'left' : 'right'

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
    const v = util.deepFind(state, props.name) as string | undefined
    value = v ?? ''
  }

  // Errors: find any that match this field path
  for (const item of (state?.errors || [])) {
    if (util.isRegex(props.name) && (item.title || '').match(props.name)) error = item
    else if (item.title == props.name) error = item
  }

  // Icon
  if (type == 'password') {
    Icon = <IconWrapper 
      iconPos={iconPos} 
      icon={icon || inputType == 'password' ? <EyeSlashIcon /> : <EyeIcon />} 
      onClick={() => setInputType(o => o == 'password' ? 'text' : 'password')}
      className="pointer-events-auto"
    />
  } else if (type == 'email') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <EnvelopeIcon />} />
  } else if (type == 'filter') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <FunnelIcon />} className="size-3"  />
  } else if (type == 'search') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <MagnifyingGlassIcon />} className="size-4" />
  } else if (type == 'color') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <ColorSvg hex={value}/>} className="size-[17px]" />
  } else if (type == 'date') {
    Icon = <IconWrapper iconPos={iconPos} icon={icon || <CalendarIcon />} className="size-4" />
  } else {
    Icon = <IconWrapper iconPos={iconPos} icon={icon} />
  }

  // Classname
  const inputClassName = getInputClasses({ error, Icon, iconPos, type })
  const commonProps = { id: props.name || props.id, value: value, className: inputClassName }

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
    <div css={style} className={`mt-2.5 mb-6 mt-input-before mb-input-after grid grid-cols-1 nitro-field ${className || ''}`}>
      {children}
      {error && <div class="mt-1.5 text-xs text-danger nitro-error">{error.detail}</div>}
    </div>
  )
}

function getInputClasses({ error, Icon, iconPos, type }: { error: Error, Icon?: React.ReactNode, iconPos: string, type?: string }) {
  const pl = 'pl-3 pl-input-x'
  const pr = 'pr-3 pr-input-x'
  const py = 'py-2 py-input-y'
  const plWithIcon = type == 'color' ? 'pl-9' : 'pl-8' // was sm:pl-8 pl-8, etc
  const prWithIcon = type == 'color' ? 'pr-9' : 'pr-8'
  return (
    `block ${py} col-start-1 row-start-1 w-full rounded-md bg-white text-sm leading-[1.65] outline outline-1 -outline-offset-1 ` +
    'placeholder:text-input-placeholder focus:outline focus:outline-2 focus:-outline-offset-2 ' +
    (iconPos == 'right' && Icon ? `${pl} ${prWithIcon} ` : (Icon ? `${plWithIcon} ${pr} ` : `${pl} ${pr} `)) +
    (error 
      ? 'text-red-900 outline-danger focus:outline-danger ' 
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
      className={twMerge(
        'relative size-[14px] col-start-1 row-start-1 self-center text-[#c6c8ce] select-none z-[1] ' +
        (iconPos == 'right' ? 'justify-self-end mr-3 ' : 'justify-self-start ml-3 ') + 
        props.className || ''
      )}
    >{icon}</div>
  )
}

function ColorSvg({ hex }: { hex?: string }) {
  return (
    <span class="block size-full rounded-md" style={{ backgroundColor: hex ? hex : '#f1f1f1' }}></span>
  )
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
`