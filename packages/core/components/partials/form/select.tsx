/* eslint-disable @typescript-eslint/no-explicit-any */
import { css } from 'twin.macro'
import { memo } from 'react'
import ReactSelect, { components, ControlProps, createFilter, OptionProps, SingleValueProps, ClearIndicatorProps,
  DropdownIndicatorProps, MultiValueRemoveProps } from 'react-select'
import { ChevronUpDownIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { isFieldCached } from 'nitro-web'
import { getErrorFromState, deepFind, twMerge } from 'nitro-web/util'
import { Errors } from 'nitro-web/types'

const filterFn = createFilter()

type GetSelectStyle = {
  name: string
  isFocused?: boolean
  isSelected?: boolean
  hasError?: boolean
  usePrefixes?: boolean
}

/** Select (all other props are passed to react-select) **/
type SelectProps = {
  /** field name or path on state (used to match errors), e.g. 'date', 'company.email' **/
  name: string
  /** name used if not provided **/
  inputId?: string
  /** The minimum width of the dropdown menu **/
  minMenuWidth?: number
  /** The prefix to add to the input **/
  prefix?: string
  /** The onChange handler **/
  onChange?: (event: { target: { name: string, value: unknown } }) => void
  /** The options to display in the dropdown **/
  options: { value: unknown, label: string | React.ReactNode, fixed?: boolean, [key: string]: unknown }[]
  /** The state object to get the value and check errors from **/
  state?: { errors?: Errors, [key: string]: any } // was unknown|unknown[]
  /** Select variations **/
  type?: 'country'|'customer'|''
  /** Pass dependencies to break memoization, handy for onChange/onInputChange **/
  deps?: unknown[]
  /** All other props are passed to react-select **/
  [key: string]: unknown
}

export const Select = memo(SelectBase, (prev, next) => {
  return isFieldCached(prev, next)
})

function SelectBase({ inputId, minMenuWidth, name, prefix='', onChange, options, state, type='', ...props }: SelectProps) {
  let value: unknown|unknown[]
  const error = getErrorFromState(state, name)
  if (!name) throw new Error('Select component requires a `name` and `options` prop')

  // Get value from value or state
  if ('value' in props) value = props.value
  else if (typeof state == 'object') value = deepFind(state, name)

  // If multi-select, filter options by value
  if (Array.isArray(value)) value = options.filter(o => (value as unknown[]).includes(o.value))
  else value = options.find(o => value === o.value)

  // Input is always controlled if state is passed in
  if (typeof state == 'object' && typeof value == 'undefined') value = ''

  return (
    <div css={style} class={twMerge(`mt-2.5 mb-6 mt-input-before mb-input-after nitro-select ${props.className||''}`)}>
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
        _nitro={{ prefix, type }}
        key={value as string}
        unstyled={true}
        inputId={inputId || name}
        filterOption={(option, searchText) => {
          if ((option.data as {fixed?: boolean}).fixed) return true
          return filterFn(option, searchText)
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
        classNames={{
          // Input container
          control: (p) => getSelectStyle({ name: 'control', hasError: !!error, ...p }),
          valueContainer: () => getSelectStyle({ name: 'valueContainer' }),
          // Input container objects
          input: () => getSelectStyle({ name: 'input', hasError: !!error }),
          multiValue: () => getSelectStyle({ name: 'multiValue' }),
          multiValueLabel: () => '',
          multiValueRemove: () => getSelectStyle({ name: 'multiValueRemove' }),
          placeholder: () => getSelectStyle({ name: 'placeholder' }),
          singleValue: () => getSelectStyle({ name: 'singleValue', hasError: !!error }),
          // Indicators
          clearIndicator: () => getSelectStyle({ name: 'clearIndicator' }),
          dropdownIndicator: () => getSelectStyle({ name: 'dropdownIndicator' }),
          indicatorsContainer: () => getSelectStyle({ name: 'indicatorsContainer' }),
          indicatorSeparator: () => getSelectStyle({ name: 'indicatorSeparator' }),
          // Dropmenu
          menu: () => getSelectStyle({ name: 'menu' }),
          groupHeading: () => getSelectStyle({ name: 'groupHeading' }),
          noOptionsMessage: () => getSelectStyle({ name: 'noOptionsMessage' }),
          option: (p) => getSelectStyle({ name: 'option', ...p }),
        }}
        components={{ 
          Control, 
          SingleValue, 
          Option,
          DropdownIndicator, 
          ClearIndicator, 
          MultiValueRemove,
        }}
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
      {error && <div class="mt-1.5 text-xs text-danger">{error.detail}</div>}
    </div>
  )
}

function Control({ children, ...props }: ControlProps) {
  // Add flag and prefix to the input (control)
  // todo: check that the flag/prefix looks okay
  const selectedOption = props.getValue()[0]
  const optionFlag = (selectedOption as { flag?: string })?.flag
  const _nitro = (props.selectProps as { _nitro?: { prefix?: string, type?: string } })?._nitro
  return (
    <components.Control {...props}>
      {
        (() => {
          if (_nitro?.prefix) {
            return (
              <>
                <span class="relative right-[2px]">{_nitro?.prefix}</span>
                {children}
              </>
            )
          } else if (_nitro?.type == 'country') {
            return (
              <>
                { optionFlag && <Flag flag={optionFlag} /> }
                {children}
              </>
            )
          } else { 
            return children
          }
        })()
      }
    </components.Control>
  )
}

function SingleValue(props: SingleValueProps) {
  const selectedOption = props.getValue()[0] as { labelControl?: string }
  return (
    <components.SingleValue {...props}>
      <>{selectedOption?.labelControl || props.children}</>
    </components.SingleValue>
  )
}

function Option(props: OptionProps) {
  // todo: check that the flag looks okay
  const data = props.data as { className?: string, flag?: string }
  const _nitro = (props.selectProps as { _nitro?: { type?: string } })?._nitro
  return (
    <components.Option className={data.className} {...props}>
      { _nitro?.type == 'country' && <Flag flag={data.flag} /> }
      <span class="flex-auto">{props.label}</span>
      {props.isSelected && <CheckCircleIcon className="size-[22px] text-primary -my-1 -mx-1" />}
    </components.Option>
  )
}

const DropdownIndicator = (props: DropdownIndicatorProps) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronUpDownIcon className="text-gray-400 size-[17px] -my-0.5 -mx-0.5" />
    </components.DropdownIndicator>
  )
}

const ClearIndicator = (props: ClearIndicatorProps) => {
  return (
    <components.ClearIndicator {...props}>
      <XMarkIcon className="size-4 my-0.5" />
    </components.ClearIndicator>
  )
}

const MultiValueRemove = (props: MultiValueRemoveProps) => {
  return (
    <components.MultiValueRemove {...props}>
      <XMarkIcon className="size-[1em] p-[1px]" />
    </components.MultiValueRemove>
  )
}

function Flag({ flag }: { flag?: string }) {
  if (!flag) return null
  // todo: public needs to come from webpack
  const publicPath = '/'
  return (
    <span class="flag" style={{ backgroundImage: `url(${publicPath}assets/imgs/flags/${flag}.svg)` }} />
  )
}

const selectStyles = {
  // Based off https://www.jussivirtanen.fi/writing/styling-react-select-with-tailwind
  // Input container
  control: {
    base: 'rounded-md bg-white hover:cursor-pointer text-sm text-input-size outline outline-1 -outline-offset-1 '
      + '!min-h-0 outline-input-border',
    focus: 'outline-2 -outline-offset-2 outline-input-border-focus',
    error: 'outline-danger',
  },
  valueContainer: 'py-[9px] px-[12px] py-input-y px-input-x gap-1',
  // Input container objects
  input: {
    base: 'text-input',
    error: 'text-red-900',
  },
  multiValue: 'bg-primary text-white rounded items-center pl-2 pr-1.5 gap-1.5',
  multiValueLabel: 'text-xs',
  multiValueRemove: 'border border-black/10 bg-clip-content bg-white rounded-md text-foreground hover:bg-red-50',
  placeholder: 'text-input-placeholder',
  singleValue: {
    base: 'text-input',
    error: 'text-red-900',
  },
  // Icon indicators
  clearIndicator: 'text-gray-500 p-1 rounded-md hover:bg-red-50 hover:text-red-800',
  dropdownIndicator: 'p-1 hover:bg-gray-100 text-gray-500 rounded-md hover:text-black',
  indicatorsContainer: 'p-1 px-2 gap-1',
  indicatorSeparator: 'py-0.5 before:content-[""] before:block before:bg-gray-100 before:w-px before:h-full',
  // Dropdown menu
  menu: 'mt-1.5 border border-dropdown-ul-border bg-white rounded-md text-sm text-input-size overflow-hidden shadow-dropdown-ul',
  groupHeading: 'ml-3 mt-2 mb-1 text-gray-500 text-sm text-input-size',
  noOptionsMessage: 'm-1 text-gray-500 p-2 bg-gray-50 border border-dashed border-gray-200 rounded-sm',
  option: {
    base: 'relative px-3 py-2 !flex items-center gap-2 cursor-default',
    hover: 'bg-gray-50',
    selected: '!bg-gray-100 text-primary-dark',
  },
}

export function getSelectStyle({ name, isFocused, isSelected, hasError, usePrefixes }: GetSelectStyle) {
  // Returns a class list that conditionally includes hover/focus modifier classes, or uses CSS modifiers, e.g. hover:, focus:
  // @ts-expect-error
  const obj = selectStyles[name]
  let output = obj?.base
  if (typeof obj == 'string') return obj // no modifiers

  if (usePrefixes) {
    if (obj.focus) output += ' ' + obj.focus.split(' ').map((part: string) => `focus:${part}`).join(' ')
    if (obj.hover) output += ' ' + obj.hover.split(' ').map((part: string) => `hover:${part}`).join(' ')
  } else {
    if (obj.focus && isFocused) output += ` ${obj.focus}`
    if (obj.hover && isFocused) output += ` ${obj.hover}`
  }
  if (obj.error && hasError) output += ` ${obj.error}`
  if (obj.selected && isSelected) output += ` ${obj.selected}`
  
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

  /*
  .flag {
    // https://github.com/lipis/flag-icons
    flex-shrink: 0;
    margin-right: 10px;
    width: 21px;
    height: 14px;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 3px;
    overflow: hidden; 
  }*/
`