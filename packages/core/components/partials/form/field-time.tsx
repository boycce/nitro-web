import { format, parse } from 'date-fns'
import { Button, Dropdown } from 'nitro-web'
import { dayButtonClassName } from '../element/calendar'

type Timestamp = number // timestamp on epoch day
type DropdownRef = {
  setIsActive: (value: boolean) => void
}
export type FieldTimeProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string
  id?: string 
  onChange?: (e: { target: { name: string, value: null|number } }) => void
  value?: string | Timestamp;
  Icon?: React.ReactNode
  dir?: 'bottom-left'|'bottom-right'|'top-left'|'top-right'
  // tz?: string
}
type TimePickerProps = {
  date?: Date
  onChange: (value: Timestamp) => void
  // tz?: string
}

export function FieldTime({ onChange, value, Icon, dir = 'bottom-left', ...props }: FieldTimeProps) {
  // time is viewed and set in local timezone, and saved as timestamp on epoch day. 
  // Note: timestamp is better than saving seconds so we can easily view this in a particular timezone
  const localePattern = 'hh:mmaa'
  const dropdownRef = useRef<DropdownRef>(null)
  const id = props.id || props.name

  // Convert the value to a valid time value
  const validValue = useMemo(() => {
    const num = typeof value === 'string' ? parseInt(value) : value
    console.log(11, num)
    return typeof num === 'number' && !isNaN(num) ? num : new Date(0).getTime()
  }, [value])

  // Hold the input value in state
  const [inputValue, setInputValue] = useState(() => getInputValue(validValue))

  function onTimePickerChange(value: Timestamp) {
    setInputValue(getInputValue(value))
    if (onChange) onChange({ target: { name: props.name, value: value }})
  }

  function getInputValue(timestamp: Timestamp) {
    // Get the input-value in local timezone
    return typeof timestamp === 'number' ? format(new Date(timestamp), localePattern) : '' 
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Assume the string is in local timezone, and calls onChange with "raw" values (should update state, thus updating the value). 
    setInputValue(e.target.value) // keep the input value in sync
    const [, _hour, _minute, _second, _period] = e.target.value.match(/(\d{1,2}):(\d{2})(:\d{2})?\s*(am|pm)/i) || []
    if (!_hour || !_minute) return
    const hour24 = parseInt(_hour) < 12 && _period.match(/pm/i) ? parseInt(_hour) + 12 : parseInt(_hour)
    const minute = parseInt(_minute)

    // Assume the time string is in the local timezone, and convert to UTC date from epoch
    const localDate = new Date(0)
    localDate.setHours(hour24, minute, _second ? parseInt(_second) : 0, 0)
    const value = localDate.getTime()
    if (onChange) onChange({ target: { name: props.name, value: value }})
  }

  function onNowClick() {
    const epochDay = new Date(0)
    const now = new Date()
    // now set hours, minutes, seconds to now but on epoch day
    epochDay.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0)
    onTimePickerChange(epochDay.getTime())
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
          <div className="flex justify-center h-[250px]">
            <TimePicker date={new Date(validValue)} onChange={onTimePickerChange} />
          </div>
          <div className="flex justify-between p-2 border-t border-gray-100">
            <Button color="secondary" size="xs" onClick={() => onNowClick()}>Now</Button>
            <Button color="primary" size="xs" onClick={() => dropdownRef.current?.setIsActive(false)}>Done</Button>
          </div>
        </div>
      }
    > 
      <div className="grid grid-cols-1">
        {Icon}
        <input 
          {...props}
          id={id}
          autoComplete="off"
          className={(props.className||'')}// + props.className?.includes('is-invalid') ? ' is-invalid' : ''} 
          value={inputValue}
          onChange={onInputChange}
          onBlur={() => setInputValue(getInputValue(validValue))} // onChange should of updated the value -> validValue by this point
          type="text"
        />
      </div>
    </Dropdown>
  )
}

export function TimePicker({ date, onChange }: TimePickerProps) {
  const lists = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // hours
    [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 
      51, 52, 53, 54, 55, 56, 57, 58, 59,
    ], // minutes
    ['AM', 'PM'], // AM/PM
  ]
  
  // Get current values from date or use defaults
  const hour = date ? parseInt(format(date, 'h')) : undefined
  const minute = date ? parseInt(format(date, 'm')) : undefined
  const period = date ? format(date, 'a') : undefined
  
  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string | number) => {
    // Creates a new date object in the local timezone, and calls onChange with the timestamp
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
    
    onChange(newDate.getTime())
  }

  function scrollIntoView(type: 'hour' | 'minute' | 'period', value: string | number, element: HTMLElement) {
    const container = element?.parentElement?.parentElement
    if (element && container) {
      const topContainerPadding = 0
      const scrollTop = element.offsetTop - container.offsetTop - topContainerPadding
      container.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  }

  return (
    lists.map((list, i) => {
      const type = i === 0 ? 'hour' : i === 1 ? 'minute' : 'period'
      const currentValue = i === 0 ? hour : i === 1 ? minute : period

      return (
        <div 
          key={i}
          className="w-[60px] py-2 relative overflow-hidden hover:overflow-y-auto border-l border-gray-100 sm-scrollbar first:border-l-0"
        >
          <div className="w-[60px] absolute flex flex-col items-center">
            {/* using absolute since the scrollbar takes up space  */}
            {list.map(item => (
              <div 
                className="py-[1px] flex group cursor-pointer"
                key={item}
                onClick={(e) => {
                  handleTimeChange(type, item)
                  scrollIntoView(type, item, e.currentTarget)
                }}
              >
                <button 
                  key={item}
                  className={
                    `${dayButtonClassName} rounded-full flex justify-center items-center group-hover:bg-gray-100 `
                    + (item === currentValue ? '!bg-input-border-focus text-white' : '')
                  }
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