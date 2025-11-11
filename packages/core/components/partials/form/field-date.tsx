/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, isValid, parse } from 'date-fns'
import { getPrefixWidth } from 'nitro-web/util'
import { Calendar, Dropdown } from 'nitro-web'
import { DayPickerProps } from '../element/calendar'
import { TimePicker } from './field-time'

type Mode = 'single' | 'multiple' | 'range'
type DropdownRef = {
  setIsActive: (value: boolean) => void
}

type PreFieldDateProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  /** field name or path on state (used to match errors), e.g. 'date', 'company.email' **/
  name: string
  /** mode of the date picker */
  mode: Mode
  /** name is used as the id if not provided */
  id?: string
  /** show the time picker */
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
}

// An array is returned for mode = 'multiple' or 'range'
export type FieldDateProps = (
  | ({ mode: 'single' } & PreFieldDateProps & {
      onChange?: (e: { target: { name: string, value: null|number } }) => void
      value?: null|number|string
    })
  | ({ mode: 'multiple' | 'range' } & PreFieldDateProps & { 
      onChange?: (e: { target: { name: string, value: (null|number)[] } }) => void 
      value?: null|number|string|(null|number|string)[]
    })
)

export function FieldDate({
  dir = 'bottom-left',
  Icon,
  mode,
  numberOfMonths,
  onChange: onChangeProp,
  prefix = '',
  showTime,
  value: valueProp,
  DayPickerProps,
  ...props
}: FieldDateProps) {
  // Currently this displays the dates in local timezone and saves in utc. We should allow the user to display the dates in a 
  // different timezone.
  const localePattern = `d MMM yyyy${showTime && mode == 'single' ? ' hh:mmaa' : ''}`
  const [prefixWidth, setPrefixWidth] = useState(0)
  const dropdownRef = useRef<DropdownRef>(null)
  const [month, setMonth] = useState<number|undefined>()
  const [lastUpdated, setLastUpdated] = useState(0)
  const id = props.id || props.name

  // Since value and onChange are optional, we need to hold the value in state if not provided
  const [internalValue, setInternalValue] = useState<typeof valueProp>(valueProp)
  const value = valueProp ?? internalValue
  const onChange = onChangeProp ?? ((e: { target: { name: string, value: any } }) => setInternalValue(e.target.value))
    
  // Convert the value to an array of valid* dates
  const validDates = useMemo(() => {
    const arrOfNumbers = typeof value === 'string' 
      ? value.split(/\s*,\s*/g).map(o => parseFloat(o)) 
      : Array.isArray(value) ? value : [value]
    const out = arrOfNumbers.map(date => isValid(date) ? new Date(date as number) : null) /// changed to null
    return out
  }, [value])

  // Hold the input value in state
  const [inputValue, setInputValue] = useState(() => getInputValue(validDates))

  // Update the date's inputValue (text) when the value changes outside of the component
  useEffect(() => {
    if (new Date().getTime() > lastUpdated + 100) setInputValue(getInputValue(validDates))
  }, [validDates])

  // Get the prefix content width
  useEffect(() => {
    setPrefixWidth(getPrefixWidth(prefix, 4))
  }, [prefix])

  function onCalendarChange(value: null|number|(null|number)[]) {
    if (mode == 'single' && !showTime) dropdownRef.current?.setIsActive(false) // Close the dropdown
    setInputValue(getInputValue(value))
    // Update the value
    onChange({ target: { name: props.name, value: getOutputValue(value) } })
    setLastUpdated(new Date().getTime())
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Calls onChange (should update state, thus updating the value) with "raw" values
    setInputValue(e.target.value) // keep the input value in sync

    let split = e.target.value.split(/-|,/).map(o => {
      const date = parse(o.trim(), localePattern, new Date())
      return isValid(date) ? date : null
    })
    
    // For single/range we need limit the array
    if (mode == 'range' && split.length > 1) split.length = 2
    else if (mode == 'multiple') split = split.filter(o => o) // remove invalid dates

    // Swap dates if needed
    if (mode == 'range' && (split[0] || 0) > (split[1] || 0)) split = [split[0], split[0]]

    // Set month
    for (let i=split.length; i--;) {
      if (split[i]) setMonth((split[i] as Date).getTime())
      break
    }
    
    // Update the value
    const value = mode == 'single' ? split[0]?.getTime() ?? null : split.map(d => d?.getTime() ?? null)
    onChange({ target: { name: props.name, value: getOutputValue(value) }})
    setLastUpdated(new Date().getTime())
  } 

  function getInputValue(value: Date|number|null|(Date|number|null)[]) {
    const _dates = Array.isArray(value) ? value : [value]
    return _dates.map(o => o ? format(o, localePattern) : '').join(mode == 'range' ? ' - ' : ', ')
  }
  
  function getOutputValue(value: Date|number|null|(Date|number|null)[]): any {
    // console.log(value)
    return value
  }

  return (
    <Dropdown
      ref={dropdownRef}
      menuToggles={false}
      // animate={false}
      // menuIsOpen={true}
      minWidth={0}
      menuContent={
        <div className="flex">
          <Calendar 
            // Calendar actually accepts an array of dates, but the type is not typed correctly
            {...{ mode: mode, value: validDates as any, numberOfMonths: numberOfMonths, month: month }}
            {...DayPickerProps}
            preserveTime={!!showTime} 
            onChange={onCalendarChange} 
            className="pt-1 pb-2 px-3" 
          />
          {!!showTime && mode == 'single' && <TimePicker date={validDates?.[0] ?? undefined} onChange={onCalendarChange} />}
        </div>
      }
      dir={dir}
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
          className={(props.className||'')}// + props.className?.includes('is-invalid') ? ' is-invalid' : ''} 
          onBlur={() => setInputValue(getInputValue(validDates))} // onChange should of updated the value -> validValue by this point
          onChange={onInputChange}
          style={{ textIndent: prefixWidth + 'px' }}
          type="text"
          value={inputValue}
        />
      </div>
    </Dropdown>
  )
}
