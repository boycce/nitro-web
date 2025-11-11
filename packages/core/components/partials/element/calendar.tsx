import { DayPicker, getDefaultClassNames, DayPickerProps as DayPickerPropsBase } from 'react-day-picker'
import { isValid } from 'date-fns'
import 'react-day-picker/style.css'
import { IsFirstRender } from 'nitro-web'

export const dayButtonClassName = 'size-[33px] text-sm'

type Mode = 'single'|'multiple'|'range'
type ModeSelection<T extends Mode> = (
  T extends 'single' ? Date | undefined
  : T extends 'multiple' ? Date[]
  : { from?: Date; to?: Date }
)
export type DayPickerProps = Omit<DayPickerPropsBase, 
  'mode' | 'selected' | 'onSelect' | 'modifiersClassNames' | 'classNames' | 'numberOfMonths'  | 'month' | 'onMonthChange'>

export type CalendarProps = DayPickerProps & {
  mode?: Mode
  onChange?: (value: null|number|(null|number)[]) => void
  value?: null|number|string|(null|number|string)[]
  numberOfMonths?: number
  month?: number // the value may be updated from an outside source, thus the month may have changed
  className?: string
  preserveTime?: boolean // just for single mode
}

export function Calendar({ mode='single', onChange, value, numberOfMonths, month: monthProp, className, preserveTime, 
  ...props }: CalendarProps) {
  const isFirstRender = IsFirstRender()
  const isRange = mode == 'range'

  // Convert the value to an array of valid* dates
  const dates = useMemo(() => {
    const _dates = Array.isArray(value) ? value : [value]
    return _dates.map(date => isValid(date) ? new Date(date as number) : undefined) ////change to null
  }, [value])

  // Hold the month in state to control the calendar when the input changes
  const [month, setMonth] = useState(dates[0])

  // Update the month if its changed from an outside source
  useEffect(() => {
    if (!isFirstRender && monthProp) setMonth(new Date(monthProp))
  }, [monthProp])

  function handleDayPickerSelect<T extends Mode>(newDate: ModeSelection<T>) {
    switch (mode as T) {
      case 'single': {
        const date = newDate as ModeSelection<'single'>
        preserveTimeFn(date)
        onChange?.(date?.getTime() ?? null)
        break
      }
      case 'range': {
        const { from, to } = (newDate ?? {}) as ModeSelection<'range'>
        onChange?.(from ? [from.getTime() || null, to?.getTime() || null] : null)
        break
      }
      case 'multiple': {
        const dates = (newDate as ModeSelection<'multiple'>)?.filter(Boolean) ?? []
        onChange?.(dates.map((d) => d.getTime()))
        break
      }
    }
  }

  function preserveTimeFn(date?: Date) {      
    // Preserve time from the original date if needed
    if (preserveTime && dates[0] && date) {
      const originalDate = dates[0]
      date.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds(),
        originalDate.getMilliseconds()
      )
    }
  }
  
  const d = getDefaultClassNames()
  const common = {
    month: month,
    onMonthChange: setMonth,
    onSelect: handleDayPickerSelect,
    numberOfMonths: numberOfMonths || (isRange ? 2 : 1),
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
        mode === 'single' ? (
          <DayPicker  {...props} {...common} mode="single" selected={dates[0]} className={className} />
        ) : mode === 'range' ? (
          <DayPicker {...props} {...common} mode="range" selected={{ from: dates[0], to: dates[1] }} className={className} />
        ) : (
          <DayPicker {...props} {...common} mode="multiple" selected={dates.filter((d) => !!d)} className={className} />
        )
      }
    </div>
  )
}
