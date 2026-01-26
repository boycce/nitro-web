import { isValid, format } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { twMerge } from 'nitro-web'
import { dayButtonClassName } from '../element/calendar'

type Timestamp = null | number
export type TimePickerProps = {
  className?: string
  onChange?: (value: Timestamp) => void
  tz?: string
  value?: Timestamp
}

export function TimePicker({ value, onChange, className, tz }: TimePickerProps) {
  const refs = {
    hour: useRef<HTMLDivElement>(null),
    minute: useRef<HTMLDivElement>(null),
    period: useRef<HTMLDivElement>(null),
  }
  const lists = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // hours
    [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 
      51, 52, 53, 54, 55, 56, 57, 58, 59,
    ], // minutes
    ['AM', 'PM'], // AM/PM
  ]

  // Convert the value to an valid* date
  const internalValue = useMemo(() => {
    return value && isValid(value) ? new TZDate(value, tz) : undefined
  }, [value])
  
  // Get current values from date or use defaults
  const hour = useMemo(() => internalValue ? parseInt(format(internalValue, 'h')) : undefined, [internalValue])
  const minute = useMemo(() => internalValue ? parseInt(format(internalValue, 'm')) : undefined, [internalValue])
  const period = useMemo(() => internalValue ? format(internalValue, 'a') : undefined, [internalValue])

  // Scroll into view when the date changes
  useEffect(() => {
    if (hour !== undefined) scrollIntoView('hour', hour)
    if (minute !== undefined) scrollIntoView('minute', minute)
    if (period) scrollIntoView('period', period)
  }, [hour, minute, period])
  
  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: string | number) => {
    // use original internValue or new TZDate, make sure to use the same timezone to base it from
    const _internalValue = internalValue ?? new TZDate(new Date(), tz)
    const isPm = format(_internalValue, 'a') === 'PM'
    if (type === 'hour') {
      const newHour = value === 12 ? 0 : value as number
      _internalValue.setHours(newHour + (isPm ? 12 : 0))
    } else if (type === 'minute') {
      _internalValue.setMinutes(value as number)
    } else if (type === 'period') {
      const newHours = _internalValue.getHours() + (isPm && value === 'AM' ? -12 : !isPm && value === 'PM' ? 12 : 0)
      _internalValue.setHours(newHours)
    }
    
    onChange?.(_internalValue.getTime())  
  }

  function scrollIntoView (type: 'hour' | 'minute' | 'period', value: string | number) {
    const container = refs[type].current
    if (!container) return
    const element = container.querySelector(`[data-val="${value}"]`) as HTMLElement
    if (!element) return
  
    const target =
      element.offsetTop
      - (container.clientHeight / 2)
      + (element.clientHeight / 2)

    container.scrollTo({ top: target, behavior: 'smooth' })
  }

  return (
    <div className={twMerge('flex justify-center min-h-[250px]', className)}>
      {
        lists.map((list, i) => {
          const type = i === 0 ? 'hour' : i === 1 ? 'minute' : 'period'
          const currentValue = i === 0 ? hour : i === 1 ? minute : period
          return (
            <div 
              key={i}
              ref={refs[type]}
              className="w-[60px] relative overflow-hidden hover:overflow-y-auto border-l border-gray-100 sm-scrollbar first:border-l-0"
            >
              <div className="w-[60px] absolute flex flex-col items-center py-2">
                {/* using absolute since the scrollbar takes up space  */}
                {list.map(item => (
                  <div 
                    className="py-[1px] flex group cursor-pointer"
                    data-val={item}
                    key={item}
                    onClick={(_e) => {
                      handleTimeChange(type, item)
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
      }
    </div>
  )
}
