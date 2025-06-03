/* eslint-disable @typescript-eslint/no-explicit-any */
import { format, isValid, parse } from 'date-fns'
import { getPrefixWidth } from 'nitro-web/util'
import { Calendar, Dropdown } from 'nitro-web'

type Mode = 'single' | 'multiple' | 'range'
type DropdownRef = {
  setIsActive: (value: boolean) => void
}

type PreFieldDateProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  name: string
  mode: Mode
  id?: string 
  showTime?: boolean
  prefix?: string
  numberOfMonths?: number
  Icon?: React.ReactNode
  dir?: 'bottom-left'|'bottom-right'|'top-left'|'top-right'
}

// An array is returned for mode = 'multiple' or 'range'
export type FieldDateProps = (
  | ({ mode: 'single' } & PreFieldDateProps & {
      onChange?: (e: { target: { id: string, value: null|number } }) => void
      value?: null|number|string
    })
  | ({ mode: 'multiple' | 'range' } & PreFieldDateProps & { 
      onChange: (e: { target: { id: string, value: (null|number)[] } }) => void 
      value?: null|number|string|(null|number|string)[]
    })
)

type TimePickerProps = {
  date: Date|null
  onChange: (mode: Mode, value: number|null) => void
}

export function FieldDate({ 
  mode, onChange, prefix='', value, numberOfMonths, Icon, showTime, dir = 'bottom-left', ...props 
}: FieldDateProps) {
  const localePattern = `d MMM yyyy${showTime && mode == 'single' ? ' hh:mmaa' : ''}`
  const [prefixWidth, setPrefixWidth] = useState(0)
  const dropdownRef = useRef<DropdownRef>(null)
  const id = props.id || props.name
  const [month, setMonth] = useState<number|undefined>()
  const [lastUpdated, setLastUpdated] = useState(0)
  
  // Convert the value to an array of valid* dates
  const dates = useMemo(() => {
    const _dates = Array.isArray(value) ? value : [value]
    return _dates.map(date => isValid(date) ? new Date(date as number) : null) /// change to null
  }, [value])

  // Hold the input value in state
  const [inputValue, setInputValue] = useState(() => getInputValue(dates))

  // Update the date's inputValue (text) when the value changes outside of the component
  useEffect(() => {
    if (new Date().getTime() > lastUpdated + 100) setInputValue(getInputValue(dates))
  }, [value])

  // Get the prefix content width
  useEffect(() => {
    setPrefixWidth(getPrefixWidth(prefix, 4))
  }, [prefix])

  function onCalendarChange(mode: Mode, value: null|number|(null|number)[]) {
    if (mode == 'single' && !showTime) dropdownRef.current?.setIsActive(false) // Close the dropdown
    setInputValue(getInputValue(value))
    // Update the value
    if (onChange) {
      onChange({ target: { id: id, value: value as any } })
      setLastUpdated(new Date().getTime())
    }
  }

  function getInputValue(dates: Date|number|null|(Date|number|null)[]) {
    const _dates = Array.isArray(dates) ? dates : [dates]
    return _dates.map(o => o ? format(o, localePattern) : '').join(mode == 'range' ? ' - ' : ', ')
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (onChange) {
      onChange({ target: { id: id, value: value as any }})
      setLastUpdated(new Date().getTime())
    }
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
            {...{ mode, value, numberOfMonths, month }} 
            preserveTime={!!showTime} 
            onChange={onCalendarChange} 
            className="pt-1 pb-2  px-3" 
          />
          {!!showTime && mode == 'single' && <TimePicker date={dates?.[0]} onChange={onCalendarChange} />}
        </div>
      }
      dir={dir}
    > 
      <div className="grid grid-cols-1">
        {Icon}
        {
          prefix && 
          // Similar classNames to the input.tsx:IconWrapper()
          <span className="z-[0] col-start-1 row-start-1 self-center select-none justify-self-start text-sm text-sm-input ml-3">
            {prefix}
          </span>
        }
        <input 
          {...props}
          key={'k' + prefixWidth}
          id={id}
          autoComplete="off" 
          className={(props.className||'')}// + props.className?.includes('is-invalid') ? ' is-invalid' : ''} 
          value={inputValue}
          onChange={onInputChange}
          onBlur={() => setInputValue(getInputValue(dates))}
          style={{ textIndent: prefixWidth + 'px' }}
          type="text"
        />
      </div>
    </Dropdown>
  )
}

function TimePicker({ date, onChange }: TimePickerProps) {
  const lists = [
    [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // hours
    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], // minutes
    ['AM', 'PM'], // AM/PM
  ]
  
  // Get current values from date or use defaults
  const hour = date ? parseInt(format(date, 'h')) : undefined
  const minute = date ? parseInt(format(date, 'm')) : undefined
  const period = date ? format(date, 'a') : undefined
  
  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string | number) => {
    // Create a new date object from the current date or current time
    const newDate = new Date(date || new Date())
    
    if (type === 'hour') {
      // Parse the time with the new hour value
      const timeString = `${value}:${format(newDate, 'mm')} ${format(newDate, 'a')}`
      const updatedDate = parse(timeString, 'h:mm a', newDate)
      newDate.setHours(updatedDate.getHours(), updatedDate.getMinutes())
    } else if (type === 'minute') {
      // Parse the time with the new minute value
      const timeString = `${format(newDate, 'h')}:${value} ${format(newDate, 'a')}`
      const updatedDate = parse(timeString, 'h:mm a', newDate)
      newDate.setMinutes(updatedDate.getMinutes())
    } else if (type === 'period') {
      // Parse the time with the new period value
      const timeString = `${format(newDate, 'h')}:${format(newDate, 'mm')} ${value}`
      const updatedDate = parse(timeString, 'h:mm a', newDate)
      newDate.setHours(updatedDate.getHours())
    }
    
    onChange('single', newDate.getTime())
  }

  return (
    lists.map((list, i) => {
      const type = i === 0 ? 'hour' : i === 1 ? 'minute' : 'period'
      const currentValue = i === 0 ? hour : i === 1 ? minute : period

      return (
        <div key={i} className="w-[60px] py-1 relative overflow-hidden hover:overflow-y-auto border-l border-gray-100">
          <div className="w-[60px] absolute flex flex-col items-center">
            {list.map(item => (
              <div 
                className="py-1 flex group cursor-pointer"
                key={item}
                onClick={() => handleTimeChange(type, item)}
              >
                <button 
                  key={item}
                  className={
                    'size-[33px] rounded-full flex justify-center items-center group-hover:bg-gray-100 '
                    + (item === currentValue ? '!bg-input-border-focus text-white' : '')
                  }
                  onClick={() => handleTimeChange(type, item)}
                >
                  {item.toString().padStart(2, '0').toLowerCase()}
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    })
  )
}