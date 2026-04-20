/* eslint-disable @typescript-eslint/no-explicit-any */
import { css } from 'twin.macro'
import { memo, useMemo, Fragment } from 'react'
import ReactSelect, { 
  components, ControlProps, createFilter, OptionProps, SingleValueProps, ClearIndicatorProps,
  DropdownIndicatorProps, MultiValueRemoveProps, // ClassNamesConfig,
  ValueContainerProps,
  MenuProps,
} from 'react-select'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { ChevronsUpDownIcon, SearchIcon, XIcon } from 'lucide-react'
import { isFieldCached } from 'nitro-web'
import { getErrorFromState, deepFind, twMerge } from 'nitro-web/util'
import { Errors } from 'nitro-web/types'

const filterFn = createFilter()

type GetSelectClassName = {
  name: string
  isFocused?: boolean
  isSelected?: boolean
  isDisabled?: boolean
  hasError?: boolean
  usePrefixes?: boolean
  classNames?: ClassNames
}
export type SelectOption = { 
  value: unknown, 
  label: string | React.ReactNode, 
  labelSearch?: string,
  noTruncate?: boolean,
  fixed?: boolean,
  IconLeft?: React.ReactNode,
  flag?: string | React.ReactNode,
  data?: { [key: string]: unknown } 
}
/** Select (all other props are passed to react-select) **/
export type SelectProps = {
  /** field name or path on state (used to match errors), e.g. 'date', 'company.email' **/
  name: string
  /** inputId, the name is used if not provided **/
  id?: string
  /** 'container' id to pass to react-select **/
  containerId?: string
  /** The minimum width of the dropdown menu **/
  minMenuWidth?: number
  /** The prefix to add to the input **/
  prefix?: string
  /** The onChange handler **/
  onChange?: (event: { target: { name: string, value: unknown } }) => void
  /** The options to display in the dropdown, data is used to pass additional data to the option **/
  options: SelectOption[]
  /** The state object to get the value and check errors from **/
  state?: { errors?: Errors, [key: string]: any } // was unknown|unknown[]
  /** Select variations **/
  mode?: string
  /** Pass dependencies to break memoization, handy for onChange/onInputChange **/
  deps?: unknown[]
  /** title used to find related error messages */
  errorTitle?: string|RegExp
  /** Extend or override individual react-select part class names — merged with defaults via twMerge **/
  classNames?: ClassNames
  /** Show a search icon instead of the dropdown arrow **/
  showSearchIcon?: boolean
  /** All other props are passed to react-select **/
  [key: string]: unknown
}

export const Select = memo(SelectBase, (prev, next) => {
  return isFieldCached(prev, next)
})

function SelectBase({
  id, containerId, minMenuWidth, name, prefix='', onChange, options, state, mode='', errorTitle, classNames: classNamesProp, 
  showSearchIcon, className,
  ...props
}: SelectProps) {
  let value: unknown|unknown[]
  const error = getErrorFromState(state, errorTitle || name)
  if (!name) throw new Error('Select component requires a `name` and `options` prop')

  // Get value from value or state
  if (typeof props.value !== 'undefined') value = props.value
  else if (typeof state == 'object') value = deepFind(state, name)

  // If multi-select, filter options by value
  if (Array.isArray(value)) value = options.filter(o => (value as unknown[]).includes(o.value))
  else value = options.find(o => value === o.value)

  // Input is always controlled if state is passed in
  if (typeof state == 'object' && typeof value == 'undefined') value = ''

  // Merge class names (up to 1 level deep)
  const classNames = useMemo(() => {
    const merged = { ...selectClassNames }
    for (const key in classNamesProp) {
      const value = classNamesProp[key as keyof ClassNames]
      if (typeof value == 'object') {
        // @ts-expect-error
        merged[key] = { ...merged[key] }
        for (const key2 in value) {
          const value2 = value[key2 as keyof typeof value]
          // @ts-expect-error
          merged[key][key2] = twMerge(merged[key][key2], value2)
        }
      } else {
        // @ts-expect-error
        merged[key] = twMerge(merged[key], value)
      }
    }
    return merged
  }, [classNamesProp])

  return (
    <div css={style} class={'mt-2.5 mb-6 ' + twMerge(`mt-input-before mb-input-after nitro-select ${className || ''}`)}>
      <ReactSelect
        /**
         * react-select prop quick reference (https://react-select.com/props#api):
         *   isDisabled={false}
         *   isMulti={false}
         *   isSearchable={true}
         *   options={[{ value: 'chocolate', label: 'Chocolate' }]}
         *   placeholder="Select a color"
         *   value={options.find(o => o.code == state.color)} // to clear you need to set to null, not undefined
         *   isClearable={false}
         *   menuIsOpen={false}
         */
        {...props}
        // @ts-expect-error
        _nitro={{ prefix, mode, showSearchIcon }}
        key={value as string}
        unstyled={true}
        inputId={id || name}
        id={containerId}
        filterOption={(option, searchText) => {
          if ((option.data as {fixed?: boolean}).fixed) return true
          const labelSearch = (option.data as {labelSearch?: string}).labelSearch
          return filterFn(labelSearch ? { ...option, label: labelSearch } : option, searchText)
        }}
        menuPlacement="auto"
        minMenuHeight={250}
        onChange={!onChange ? undefined : (o) => {
          // Array returned for multi-select
          const value = Array.isArray(o) 
            ? o.map(v => typeof v == 'object' && v !== null && 'value' in v ? v.value : v) 
            : (typeof o == 'object' && o !== null && 'value' in o ? o.value : o)
          return onChange({ target: { name: name, value: value }})
        }}
        options={options}
        value={value}
        classNames={useMemo(() => ({
          // Input container
          control: (p) => getSelectClassName({ name: 'control', hasError: !!error, ...p, classNames: classNames }),
          valueContainer: () => getSelectClassName({ name: 'valueContainer', classNames: classNames }),
          // Input container objects
          input: () => getSelectClassName({ name: 'input', hasError: !!error, classNames: classNames }),
          multiValue: () => getSelectClassName({ name: 'multiValue', classNames: classNames }),
          multiValueLabel: () => '',
          multiValueRemove: () => getSelectClassName({ name: 'multiValueRemove', classNames: classNames }),
          placeholder: () => getSelectClassName({ name: 'placeholder', classNames: classNames }),
          singleValue: (p) => getSelectClassName({ name: 'singleValue', hasError: !!error, isDisabled: p.isDisabled,
            classNames: classNames }),
          // Indicators
          clearIndicator: () => getSelectClassName({ name: 'clearIndicator', classNames: classNames }),
          dropdownIndicator: () => getSelectClassName({ name: 'dropdownIndicator', classNames: classNames }),
          indicatorsContainer: () => getSelectClassName({ name: 'indicatorsContainer', classNames: classNames }),
          indicatorSeparator: () => getSelectClassName({ name: 'indicatorSeparator', classNames: classNames }),
          // Dropmenu
          menu: () => getSelectClassName({ name: 'menu', classNames: classNames }),
          groupHeading: () => getSelectClassName({ name: 'groupHeading', classNames: classNames }),
          noOptionsMessage: () => getSelectClassName({ name: 'noOptionsMessage', classNames: classNames }),
          option: (p) => getSelectClassName({ name: 'option', ...p, classNames: classNames }),
          // Nitro specific
          flag: () => getSelectClassName({ name: 'flag', classNames: classNames }),
        }), [!!error, classNames])}
        components={{
          Control,
          SingleValue,
          Option,
          DropdownIndicator,
          ClearIndicator,
          MultiValueRemove,
          ValueContainer,
          Menu,
          ...props.components as object,
        }}
        // menuIsOpen={!search ? false : undefined}
        styles={{
          menu: (base) => ({ 
            ...base, minWidth: minMenuWidth,
          }),
          // On mobile, the label will truncate automatically, so we want to
          // override that behaviour.
          multiValueLabel: (base) => ({
            ...base,
            whiteSpace: 'normal',
            overflow: 'visible',
          }),
          control: (base) => ({
            ...base,
            outline: undefined,
            transition: 'none',
          }),
        }}
        // menuIsOpen={true}
        // isSearchable={false}
        // isClearable={true}
        // isMulti={true}
        // isDisabled={true}
        // maxMenuHeight={200}
      />
      {error && <div class="mt-1.5 text-xs text-danger-foreground">{error.detail}</div>}
    </div>
  )
}

function Menu(props: MenuProps) {
  return props.options.length === 0 ? null : <components.Menu {...props} />
}

function Control({ children, ...props }: ControlProps) {
  // const selectedOption = props.getValue()[0]
  const _nitro = (props.selectProps as { _nitro?: { prefix?: string, mode?: string } })?._nitro
  return (
    <components.Control {...props}>
      {_nitro?.prefix
        ? <Fragment><span class="relative right-[2px]">{_nitro.prefix}</span>{children}</Fragment>
        : children
      }
    </components.Control>
  )
}

function ValueContainer({ children, ...props}: ValueContainerProps) {
  return (
    // <div class="cat-tre">
    <components.ValueContainer {...props}>{children}</components.ValueContainer>
    // </div>
  )
}

function SingleValue({ children, ...props }: SingleValueProps) {
  const selectedOption = props.getValue()[0] as { labelControl?: string } & SelectOption
  // @ts-expect-error 
  const flagClassName = props.getClassNames('flag')

  return (  
    <components.SingleValue {...props}>
      { 
        selectedOption?.labelControl
          ? <Fragment>{selectedOption.labelControl}</Fragment>
          : <Fragment>
              {selectedOption?.flag && <span className={flagClassName}>{selectedOption.flag}</span>}
              {selectedOption?.IconLeft}
              {selectedOption?.noTruncate 
                ? children
                : <span class="overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
              }
            </Fragment>
      }
    </components.SingleValue>
  )
}

function Option(props: OptionProps) {
  const data = props.data as { className?: string } & SelectOption
  // const _nitro = (props.selectProps as { _nitro?: { mode?: string } })?._nitro
  // @ts-expect-error
  const flagClassName = props.getClassNames('flag')
  return (
    <components.Option className={data.className} {...props}>
      <span class="flex-auto min-w-0">{data.flag && <span className={flagClassName}>{data.flag}</span>}{data.IconLeft}{props.label}</span>
      {props.isSelected && <CheckCircleIcon className="flex-shrink-0 size-[22px] text-primary -my-1 -mx-0.5" />}
    </components.Option>
  )
}

const DropdownIndicator = (props: DropdownIndicatorProps) => {
  const _nitro = (props.selectProps as { _nitro?: { showSearchIcon?: boolean } })?._nitro
  const isSearch = _nitro?.showSearchIcon
  const Icon = isSearch ? SearchIcon : ChevronsUpDownIcon
  return (
    <components.DropdownIndicator {...props}>
      <Icon size={isSearch ? 13 : 15} strokeWidth={isSearch ? 2.4 : undefined} 
        className="text-[#b6b8be] text-input-icon -my-0.5 -mx-[1px]" />
    </components.DropdownIndicator>
  )
}

const ClearIndicator = (props: ClearIndicatorProps) => {
  return (
    <components.ClearIndicator {...props}>
      <XIcon size={14} />
    </components.ClearIndicator>
  )
}

const MultiValueRemove = (props: MultiValueRemoveProps) => {
  return (
    <components.MultiValueRemove {...props}>
      <XIcon className="size-[1em] p-[1px]" />
    </components.MultiValueRemove>
  )
}

const selectClassNames = {
  // Based off https://www.jussivirtanen.fi/writing/styling-react-select-with-tailwind
  // Input container
  control: {
    base: 'rounded-md bg-white hover:cursor-pointer text-input-base outline outline-1 -outline-offset-1 '
      + '!min-h-0 outline-input-border',
    focus: 'outline-2 -outline-offset-2 outline-input-border-focus',
    error: 'outline-danger',
    disabled: 'cursor-not-allowed bg-input-disabled-bg',
  },
  valueContainer: 'gap-1 (py-[9px] px-[12px] py-input-y px-input-x)', // dont twMerge (input-x is optional)
  // Input container objects
  input: {
    base: 'text-input',
    error: 'text-danger-foreground',
  },
  multiValue: 'bg-primary text-white rounded items-center pl-2 pr-1.5 gap-1.5',
  multiValueLabel: 'text-xs',
  multiValueRemove: 'border border-black/10 bg-clip-content bg-white rounded-md text-foreground hover:bg-red-50',
  placeholder: 'text-input-placeholder truncate',
  singleValue: {
    base: 'text-input !overflow-visible min-w-0 flex items-center',
    error: 'text-danger-foreground',
    disabled: 'text-input-disabled',
  },
  // Icon indicators
  clearIndicator: 'text-gray-500 p-1 rounded-md hover:bg-red-50 hover:text-danger-foreground',
  dropdownIndicator: 'p-1 hover:bg-gray-100 text-gray-500 rounded-md hover:text-black',
  indicatorsContainer: 'p-1 pl-0 pr-2 gap-1',
  indicatorSeparator: 'py-0.5 before:content-[""] before:block before:bg-gray-100 before:w-px before:h-full',
  // Dropdown menu
  menu: 'mt-1.5 border border-dropdown-ul-border bg-white rounded-md text-input-base overflow-hidden shadow-dropdown-ul',
  groupHeading: 'ml-3 mt-2 mb-1 text-gray-500 text-input-base',
  noOptionsMessage: 'm-1 text-gray-500 p-2 bg-gray-50 border border-dashed border-gray-200 rounded-sm',
  option: {
    base: 'relative px-3 py-2 !flex items-center gap-2 cursor-default',
    hover: 'bg-gray-50',
    selected: '!bg-gray-100 text-dropdown-selected-foreground',
  },
  // Nitro specific
  flag: 'align-middle text-[1.2em] leading-[1em] mr-1.5 flex-shrink-0',
} as const

type ClassNames = {
  // Input container
  control?: { base?: string, focus?: string, error?: string, disabled?: string }
  valueContainer?: string
  // Input container objects
  input?: { base?: string, error?: string, disabled?: string }
  multiValue?: string
  multiValueLabel?: string
  multiValueRemove?: string
  placeholder?: string
  singleValue?: { base?: string, error?: string, disabled?: string }
  // Icon indicators
  clearIndicator?: string
  dropdownIndicator?: string
  indicatorsContainer?: string
  indicatorSeparator?: string
  // Dropdown menu
  menu?: string
  groupHeading?: string
  noOptionsMessage?: string
  option?: { base?: string, hover?: string, selected?: string }
  // Nitro specific
  flag?: string
}

export function getSelectClassName({ name, isFocused, isSelected, isDisabled, hasError, usePrefixes, classNames }: GetSelectClassName) {
  // Returns a class list that conditionally includes hover/focus modifier classes, or uses CSS modifiers, e.g. hover:, focus:
  // @ts-expect-error
  const obj = classNames?.[name] || selectClassNames[name]
  let output = obj?.base
  
  if (typeof obj == 'string' && obj.includes('(')) return obj.replaceAll(/\(|\)/g, '') // no modifiers & still has group wrappers
  else if (typeof obj == 'string') return obj // no modifiers

  if (usePrefixes) {
    if (obj.focus) output += ' ' + obj.focus.split(' ').map((part: string) => `focus:${part}`).join(' ')
    if (obj.hover) output += ' ' + obj.hover.split(' ').map((part: string) => `hover:${part}`).join(' ')
  } else {
    if (obj.focus && isFocused) output += ` ${obj.focus}`
    if (obj.hover && isFocused) output += ` ${obj.hover}`
  }
  if (obj.error && hasError) output += ` ${obj.error}`
  if (obj.selected && isSelected) output += ` ${obj.selected}`
  if (obj.disabled && isDisabled) output += ` ${obj.disabled}`

  return twMerge(output)
}

const style = css`
  /*
  todo: add these as tailwind classes

  &.rs-medium {
    .rs__control {
      padding: 9px 13px;
      font-size: 13px;
      font-weight: 400;
      min-height: 0;
    }
    .rs__menu {
      .rs__option {
        font-size: 0.85rem;
      }
    }
  }
  &.rs-small {
    .rs__control {
      padding: 5px 13px;
      font-size: 12.5px;
      font-weight: 400;
      min-height: 0;
    }
    .rs__menu {
      .rs__option {
        font-size: 0.8rem;
      }
    }
  } */

`