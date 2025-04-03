import { format, isValid, parse } from 'date-fns'
import { getPrefixWidth } from 'nitro-web/util'
import { Calendar, Dropdown } from 'nitro-web'

type Mode = 'single' | 'multiple' | 'range'
type DropdownRef = {
  setIsActive: (value: boolean) => void
}
export type FieldDateProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string
  id?: string 
  mode?: Mode
  // an array is returned for non-single modes
  onChange?: (e: { target: { id: string, value: null|number|(null|number)[] } }) => void
  prefix?: string
  value?: null|number|string|(null|number|string)[]
  numberOfMonths?: number
  Icon?: React.ReactNode
}

export function FieldDate({ mode='single', onChange, prefix='', value, numberOfMonths, Icon, ...props }: FieldDateProps) {
  const localePattern = 'd MMM yyyy'
  const [prefixWidth, setPrefixWidth] = useState(0)
  const dropdownRef = useRef<DropdownRef>(null)
  const id = props.id || props.name
  const [month, setMonth] = useState<number|undefined>()

  // Convert the value to an array of valid* dates
  const dates = useMemo(() => {
    const _dates = Array.isArray(value) ? value : [value]
    return _dates.map(date => isValid(date) ? new Date(date as number) : null) /// change to null
  }, [value])

  // Hold the input value in state
  const [inputValue, setInputValue] = useState(() => getInputValue(dates))

  // Get the prefix content width
  useEffect(() => {
    setPrefixWidth(getPrefixWidth(prefix, 4))
  }, [prefix])

  function onCalendarChange(mode: Mode, value: null|number|(null|number)[]) {
    if (mode == 'single') dropdownRef.current?.setIsActive(false) // Close the dropdown
    setInputValue(getInputValue(value))
    if (onChange) onChange({ target: { id: id, value: value }})
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
    if (mode == 'range') split.length = 2
    else if (mode == 'multiple') split = split.filter(o => o) // remove invalid dates

    // Swap dates if needed
    if (mode == 'range' && (split[0] || 0) > (split[1] || 0)) split = [split[0], split[0]]

    // Set month
    for (let i=split.length; i--;) {
      if (split[i]) setMonth((split[i] as Date).getTime())
      break
    }
    
    // Update 
    const value = mode == 'single' ? split[0]?.getTime() ?? null : split.map(d => d?.getTime() ?? null)
    if (onChange) onChange({ target: { id, value }})
  }

  return (
    <Dropdown
      ref={dropdownRef}
      menuToggles={false}
      animate={false}
      // menuIsOpen={true}
      minWidth={0}
      menuChildren={
        <Calendar {...{ mode, value, numberOfMonths, month }} onChange={onCalendarChange} className="px-3 pt-1 pb-2" />
      }
    > 
      <div className="grid grid-cols-1">
        {Icon}
        {
          prefix && 
          // Similar classNames to the input.tsx:IconWrapper()
          <span className="relative col-start-1 row-start-1 self-center select-none z-[1] justify-self-start text-sm ml-3">{prefix}</span>
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
