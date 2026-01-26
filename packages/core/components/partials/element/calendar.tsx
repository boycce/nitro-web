import { DayPicker, getDefaultClassNames, DayPickerProps as DayPickerPropsBase, TZDate } from 'react-day-picker'
import { isValid } from 'date-fns'
import 'react-day-picker/style.css'
import { IsFirstRender } from 'nitro-web'

export const dayButtonClassName = 'size-[33px] text-sm'

type Timestamp = null | number
type TimestampArray = null | Timestamp[]
type Mode = 'single'|'multiple'|'range'
type DayPickerSelection<T extends Mode> = (
  T extends 'single' ? Date | undefined
  : T extends 'multiple' ? Date[]
  : { from?: Date; to?: Date }
)

export type DayPickerProps = Omit<DayPickerPropsBase, 
  'mode' | 'selected' | 'onSelect' | 'modifiersClassNames' | 'classNames' | 'numberOfMonths'  | 'month' | 'onMonthChange'>

type PreCalendarProps = DayPickerProps & {
  numberOfMonths?: number
  /** month to display in the calendar (the value may be updated from an outside source, thus the month may have changed) */
  month?: number 
  className?: string
  /** single mode only: preserve the time of the original date if needed */
  preserveTime?: boolean 
  /** timezone to display and set the dates in for the calendar (output always a timestamp) */
  tz?: string 
}

// Discriminated union types based on mode
type CalendarPropsSingle = PreCalendarProps & {
  mode: 'single'
  onChange?: (value: Timestamp) => void
  value?: Timestamp // gracefully handles falsey values
}

type CalendarPropsMultiple = PreCalendarProps & {
  mode: 'multiple' | 'range'
  onChange?: (value: TimestampArray) => void
  value?: TimestampArray // gracefully handles falsey values
}

export type CalendarProps = CalendarPropsSingle | CalendarPropsMultiple

export function Calendar({ value, numberOfMonths, month: monthProp, className, preserveTime, tz, ...props }: CalendarProps) {
  const isFirstRender = IsFirstRender()
  const isRange = props.mode == 'range'

  // Convert the value to an array of valid dates
  const internalValue = useMemo(() => {
    const _dates = value ? (Array.isArray(value) ? value : [value]) : []
    return _dates.map(date => date && isValid(date) ? new TZDate(date, tz) : undefined)// DayPicker uses undefined (allgood, we output null)
  }, [value])

  // Hold the month in state to control the calendar when the input changes
  const [month, setMonth] = useState(internalValue[0] as Date)

  // Update the month if its changed from an outside source
  useEffect(() => {
    if (!isFirstRender && monthProp) setMonth(new TZDate(monthProp, tz))
  }, [monthProp])

  function handleDayPickerSelect(value: DayPickerSelection<CalendarProps['mode']>) {
    switch (props.mode) {
      case 'single': {
        const date = preserveTimeFn(value as DayPickerSelection<'single'>)
        props.onChange?.(date ? date.getTime() : null)
        break
      }
      case 'range': {
        const { from, to } = (value ?? {}) as DayPickerSelection<'range'>
        props.onChange?.(from ? [from.getTime() || null, to?.getTime() || null] : null)
        break
      }
      case 'multiple': {
        const dates = (value as DayPickerSelection<'multiple'>)?.filter(Boolean)
        props.onChange?.(dates.length ? dates.map((d) => d.getTime()) : null)
        break
      }
    }
  }

  function preserveTimeFn(newDate?: Date) {      
    // Preserve time from the original date if needed. Since internalValue[0] is a TZDate object, we need to make sure the 
    // new date is also a TZDate object in the same timezone.
    if (newDate && preserveTime && internalValue[0]) {
      const tzDate = new TZDate(newDate, tz)
      tzDate.setHours(
        internalValue[0].getHours(),
        internalValue[0].getMinutes(),
        internalValue[0].getSeconds(),
        internalValue[0].getMilliseconds()
      )
      return tzDate
    } else {
      return newDate
    }
  }
  
  const d = getDefaultClassNames()
  const common = {
    month: month,
    onMonthChange: setMonth,
    onSelect: handleDayPickerSelect,
    numberOfMonths: numberOfMonths || (isRange ? 2 : 1),
    timeZone: tz,
    modifiersClassNames: {
      // Add a class without _, TW seems to replace this with a space in the css definition, e.g. &:not(.range middle)
      range_middle: `${d.range_middle} rangemiddle`,
    },
    classNames: {
      root: `${d.root} flex nitro-calendar`,
      months: `${d.months} flex-nowrap`,
      month_caption: `${d.month_caption} text-2xs pl-2`,
      caption_label: `${d.caption_label} z-auto`,
      button_previous: `${d.button_previous} size-8`,// [&:hover>svg]:fill-input-border-focus`,
      button_next: `${d.button_next} size-8`,// [&:hover>svg]:fill-input-border-focus`,
      chevron: `${d.chevron} fill-black size-[18px]`,

      // Days
      weekday: `${d.weekday} text-[11px] font-bold uppercase`,
      day: `${d.day} size-[33px]`,
      day_button: `${d.day_button} ${dayButtonClassName}`,

      // States
      focused: `${d.focused} [&>button]:bg-gray-200 [&>button]:border-gray-200`,
      range_start: `${d.range_start} [&>button]:!bg-input-border-focus [&>button]:!border-input-border-focus`,
      range_end: `${d.range_end} [&>button]:!bg-input-border-focus [&>button]:!border-input-border-focus`,
      selected: `${d.selected} font-normal `
        + '[&:not(.rangemiddle)>button]:!text-white '
        + '[&:not(.rangemiddle)>button]:!bg-input-border-focus '
        + '[&:not(.rangemiddle)>button]:!border-input-border-focus ',
    },
  }

  return (
    <div>
      {
        props.mode === 'single' ? (
          <DayPicker  {...props} {...common} mode="single" selected={internalValue[0]} className={className} />
        ) : props.mode === 'range' ? (
          <DayPicker {...props} {...common} mode="range" selected={{ from: internalValue[0], to: internalValue[1] }} 
            className={className} />
        ) : (
          <DayPicker {...props} {...common} mode="multiple" selected={internalValue.filter((d) => !!d)} className={className} />
        )
      }
    </div>
  )
}
