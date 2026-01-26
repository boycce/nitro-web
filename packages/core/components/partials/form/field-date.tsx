/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, isValid, parse } from 'date-fns'
import { tz as _tz, TZDate } from '@date-fns/tz'
import { getPrefixWidth } from 'nitro-web/util'
import { Button, Calendar, Dropdown, DropdownProps, TimePicker } from 'nitro-web'
import { DayPickerProps } from '../element/calendar'

type Timestamp = null | number
type TimestampArray = null | Timestamp[]
type DropdownRef = {
  setIsActive: (value: boolean) => void
}

type PreFieldDateProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> & {
  /** field name or path on state (used to match errors), e.g. 'date', 'company.email' **/
  name: string
  /** name is used as the id if not provided */
  id?: string
  /** mode of the date picker */
  mode: 'single' | 'multiple' | 'range' | 'time'
  /** show the time picker for single mode*/
  showTime?: boolean
  /** prefix to add to the input */
  prefix?: string
  /** number of months to show in the dropdown */
  numberOfMonths?: number
  /** icon to show in the input */
  Icon?: React.ReactNode
  /** direction of the dropdown */
  dir?: 'bottom-left'|'bottom-right'|'top-left'|'top-right'
  /** Calendar props */
  DayPickerProps?: DayPickerProps
  /** Dropdown props */
  DropdownProps?: DropdownProps
  /** timezone to use for the date picker */
  tz?: string
}

// Discriminated union types based on mode
type FieldDatePropsSingle = PreFieldDateProps & {
  mode: 'single' | 'time'
  defaultValue?: Timestamp
  onChange?: (e: { target: { name: string, value: Timestamp } }) => void
  value?: Timestamp // gracefully handles falsey values
}

type FieldDatePropsMultiple = PreFieldDateProps & {
  mode: 'multiple' | 'range'
  defaultValue?: TimestampArray
  onChange?: (e: { target: { name: string, value: TimestampArray } }) => void
  value?: TimestampArray // gracefully handles falsey values
}

export type FieldDateProps = FieldDatePropsSingle | FieldDatePropsMultiple
const errors: string[] = []

export function FieldDate({
  dir = 'bottom-left',
  Icon,
  numberOfMonths,
  onChange: onChangeProp,
  prefix = '',
  showTime,
  DayPickerProps,
  DropdownProps,
  tz,
  ...props
}: FieldDateProps) {
  const [month, setMonth] = useState<number|undefined>()
  const [preventInputValueUpdates, setPreventInputValueUpdates] = useState(false)
  const [prefixWidth, setPrefixWidth] = useState(0)
  const dropdownRef = useRef<DropdownRef>(null)
  const pattern = props.mode == 'time' ? 'hh:mmaa' :  `d MMM yyyy${showTime && props.mode == 'single' ? ' hh:mmaa' : ''}`
  const id = props.id || props.name

  // Since value and onChange are optional, we need need to create an internal value state
  const [internalValue, setInternalValue] = useState<Timestamp[]>(() => preInternalValue(props))
  const inputValue = useMemo(() => getInputValue(internalValue), [internalValue])
  const [inputValueSticky, setInputValueSticky] = useState(() => inputValue)
  
  // Update the internal value when the value changes outside of the component
  useEffect(() => {
    const newValue = preInternalValue(props)
    for (let i=0; i<Math.max(internalValue.length, newValue.length); i++) {
      if (internalValue[i] !== newValue[i]) {
        setInternalValue(newValue)
        break
      }
    }
  }, [props.value])
  
  // Only update the sticky input when the input is blurred
  useEffect(() => {
    if (!preventInputValueUpdates) setInputValueSticky(inputValue)
  }, [inputValue, preventInputValueUpdates])

  // Get the prefix content width
  useEffect(() => {
    setPrefixWidth(getPrefixWidth(prefix, 4))
  }, [prefix])

  function preInternalValue(props: FieldDateProps) {
    // Even though we are using types, the value may be different coming from the state, so lets sanitise/parse it.
    // We need to use props.* to get type narrowing.
    switch (props.mode) {
      case 'single':
      case 'time': {
        const value = props?.value ?? props?.defaultValue
        return [value && isValid(value) ? new Date(value).getTime() : null]
      }
      case 'multiple':
      case 'range': {
        const value = props.value ?? props?.defaultValue
        if (!value || !Array.isArray(value)) {
          const error = `FieldDate: ${props.name} value needs to be an array for mode 'multiple' or 'range', received`
          if (value && !errors.includes(error)) { errors.push(error); console.error(error, value) }
          return []
        } else {
          return value.map((timestamp) => {
            return timestamp && isValid(timestamp) ? new Date(timestamp).getTime() : null
          })
        }
      }
    }
  }

  function getInputValue(value: Timestamp[]) {
    return value.map(o => date(o, pattern, tz)).join(props.mode == 'range' ? ' - ' : ', ')
  }

  function onChange<T>(value: T) {
    if (props.mode == 'single' && !showTime) dropdownRef.current?.setIsActive(false) // Close the dropdown
    if (onChangeProp) onChangeProp({ target: { name: props.name, value: value as any } }) // type enforced in the parameter
    else setInternalValue(preInternalValue({ ...props, value: value } as FieldDateProps))
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Calls onChange (should update state, thus updating the value) with "raw" values
    setInputValueSticky(e.target.value) // keep the sticky input value in sync
    setPreventInputValueUpdates(true)

    // Parse the datestring into timestamps
    let timestamps = e.target.value.split(/-|,/).map(o => {
      return parseDateString(o.trim(), pattern, tz)
    })

    // For range mode we need limit the array to 2
    if (props.mode == 'range' && timestamps.length > 1) timestamps.length = 2

    // Swap range dates if needed
    if (props.mode == 'range' && (timestamps[0] || 0) > (timestamps[1] || 0)) timestamps = [timestamps[0], timestamps[0]]

    // Remove/nullify invalid dates
    if (props.mode == 'range') timestamps = timestamps.map(o => o ?? null)
    else if (props.mode == 'multiple') timestamps = timestamps.filter(o => o)

    // Set month for date mode
    if (props.mode != 'time') {
      for (let i=timestamps.length; i--;) {
        if (timestamps[i]) setMonth(timestamps[i] as number)
        break
      }
    }
    
    // Update the value
    const value = props.mode == 'single' || props.mode == 'time' ? timestamps[0] ?? null : timestamps
    onChange(value)
  }

  function onNowClick() {
    onChange(new Date().getTime())
  }
  
  // Common props for the Calendar component
  const commonCalendarProps = { 
    className: 'pt-1 pb-2 px-3', month: month, numberOfMonths: numberOfMonths, preserveTime: !!showTime, tz: tz, ...DayPickerProps,
  }
  
  return (
    <Dropdown
      ref={dropdownRef}
      menuToggles={false}
      // animate={false}
      // menuIsOpen={true}
      minWidth={0}
      dir={dir}
      menuContent={
        <div>
          <div className="flex">
            {
              props.mode == 'single' &&
              <Calendar {...commonCalendarProps} mode="single" value={internalValue[0]} onChange={onChange<Timestamp>} />
            }
            {
              (props.mode == 'range' || props.mode == 'multiple') &&
              <Calendar {...commonCalendarProps} mode={props.mode} value={internalValue} onChange={onChange<TimestampArray>} />
            }
            {
              (props.mode == 'time' || (!!showTime && props.mode == 'single')) &&
              <TimePicker value={internalValue?.[0]} onChange={onChange<Timestamp>} 
                className={`border-l border-gray-100 ${props.mode == 'single' ? 'min-h-[0]' : ''}`} 
              />
            }
          </div>
          {
            props.mode == 'time' && 
            <div className="flex justify-between p-2 border-t border-gray-100">
              <Button color="secondary" size="xs" onClick={() => onNowClick()}>Now</Button>
              <Button color="primary" size="xs" onClick={() => dropdownRef.current?.setIsActive(false)}>Done</Button>
            </div>
          }
        </div>
      }
      {...DropdownProps}
    > 
      <div className="grid grid-cols-1">
        {Icon}
        {
          prefix && 
          // Similar classNames to the input.tsx:IconWrapper()
          <span className="z-[0] col-start-1 row-start-1 self-center select-none justify-self-start text-input-base ml-[12px] ml-input-x">
            {prefix}
          </span>
        }
        <input
          {...props}
          key={'k' + prefixWidth}
          id={id}
          autoComplete="off" 
          className={(props.className || '')}// + props.className?.includes('is-invalid') ? ' is-invalid' : ''} 
          onChange={onInputChange}
          onBlur={() => setPreventInputValueUpdates(false)}
          style={{ textIndent: prefixWidth + 'px' }}
          type="text"
          value={inputValueSticky} // allways controlled
          defaultValue={undefined}
        />
      </div>
    </Dropdown>
  )
}

/**
 * Parse a date string into a timestamp, optionally, from another timezone
 * @param value - date string to parse
 * @param pattern - date format pattern
 * @param [referenceDate] - required if value doesn't contain a date, e.g. for time only
 * @param [tz] - timezone
 */
function parseDateString(value: string, pattern: string, tz?: string, referenceDate?: Date) {
  const parsedDate = parse(value.trim(), pattern, referenceDate ?? new Date(), tz ? { in: _tz(tz) } : undefined)
  if (!isValid(parsedDate)) return null
  else return parsedDate.getTime()
}

/**
 * Returns a formatted date string
 * @param [value] - timestamp or date
 * @param [format] - e.g. "dd mmmm yy" (https://date-fns.org/v4.1.0/docs/format#)
 * @param [tz] - display in this timezone
 */
export function date(value?: null|number|Date, pattern?: string, tz?: string) {
  if (!value || !isValid(value)) return ''
  return format((tz ? new TZDate(value as number, tz) : value), pattern ?? 'do MMMM')
}
