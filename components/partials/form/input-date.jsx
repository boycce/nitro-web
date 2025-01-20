// todo: finish tailwind conversion
import { css, theme } from 'twin.macro'
import { DayPicker } from 'react-day-picker'
import { format, isValid, parse } from 'date-fns'
import { getCurrencyPrefixWidth } from '../../../util.js'
import { Dropdown } from '../element/dropdown.jsx'
import 'react-day-picker/dist/style.css'

export function InputDate({ className, prefix, id, onChange, mode='single', value, ...props }) {
  /**
   * @param {string} mode - 'single'|'range'|'multiple' - an array is returned for non-single modes
   */
  const localePattern = 'd MMM yyyy'
  const isInvalid = className?.includes('is-invalid') ? 'is-invalid' : ''
  const [prefixWidth, setPrefixWidth] = useState()
  const ref = useRef(null)

  const dates = useMemo(() => {
    // Convert the value to an array of valid* dates
    const _dates = Array.isArray(value) ? value : [value]
    return _dates.map(date => isValid(date) ? new Date(date) : undefined)
  }, [value])

  // Hold the month in state to control the calendar when the input changes
  const [month, setMonth] = useState(dates[0])

  // Hold the input value in state
  const [inputValue, setInputValue] = useState(() => getInputValue(dates))

  useEffect(() => {
    // Get the prefix content width
    setPrefixWidth(getCurrencyPrefixWidth(prefix, 4))
  }, [prefix])

  function handleDayPickerSelect(newDate) {
    if (mode == 'single') {
      ref.current.setIsActive(false) // close the dropdown
      callOnChange(newDate?.getTime() || null)
      setInputValue(getInputValue([newDate]))

    } else if (mode == 'range') {
      const {from, to} = newDate || {} // may not exist
      callOnChange(from ? [from?.getTime() || null, to?.getTime() || null] : null)
      setInputValue(getInputValue(from ? [from, to] : []))

    } else {
      callOnChange(newDate.filter(o => o).map(d => d.getTime()))
      setInputValue(getInputValue(newDate.filter(o => o)))
    }
  }

  function handleInputChange(e) {
    setInputValue(e.target.value) // keep the input value in sync

    let split = e.target.value.split(/-|,/).map(o => {
      const date = parse(o.trim(), localePattern, new Date())
      return isValid(date) ? date : null
    })
    
    // For single/range we need limit the array
    if (mode == 'range') split.length = 2
    else if (mode == 'multiple') split = split.filter(o => o) // remove invalid dates

    // Swap dates if needed
    if (mode == 'range' && split[0] > split[1]) split = [split[0], split[0]]

    // Set month
    for (let i=split.length; i--;) {
      if (split[i]) setMonth(split[i])
      break
    }
    
    // Set dates
    callOnChange(mode == 'single' ? split[0] : split)
  }

  function getInputValue(dates) {
    return dates.map(o => o ? format(o, localePattern) : '').join(mode == 'range' ? ' - ' : ', ')
  }

  function callOnChange(value) {
    if (onChange) onChange({ target: { id: id, value: value }}) // timestamp|[timestamp]
  }

  return (
    <Dropdown
      ref={ref}
      css={style}
      menuToggles={false}
      animate={false}
      // menuIsOpen={true}
      menuChildren={
        <DayPicker 
          mode={mode}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={mode == 'range' ? 2 : 1}
          selected={mode === 'single' ? dates[0] : mode == 'range' ? { from: dates[0], to: dates[1] } : dates}
          onSelect={handleDayPickerSelect}
        />
      }
    > 
      <div>
        {prefix && <span class={`input-prefix ${inputValue ? 'has-value' : ''}`}>{prefix}</span>}
        <input 
          {...props}
          key={'k'+prefixWidth}
          id={id}
          autoComplete="off" 
          className={
            className + ' ' + isInvalid
          } 
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => setInputValue(getInputValue(dates))}
          style={{ textIndent: prefixWidth + 'px' }}
        />
      </div>
    </Dropdown>
  )
}

const style = () => css`
  .rdp {
    --rdp-cell-size: 34px;
    --rdp-caption-font-size: 12px;
    --rdp-accent-color: ${theme('colors.primary')};
    font-size: 13px;
    margin: 0 12px 11px;
    svg {
      width: 13px;
      height: 13px;
    }
    .rdp-caption_label {
      height: var(--rdp-cell-size);
    }
    .rdp-head_cell {
      text-align: center !important;
    }
    tr {
      display: flex;
      justify-content: space-around;
      align-items: center;
      th,
      td {
        display: flex;
        align-items: center;
        margin-left: -1px;
        margin-top: -1px;
        .rdp-day {
          border: 0 !important;
          position: relative;
          border-radius: 0 !important;
          color: inherit;
          background-color: transparent !important;
          &:before {
            content: '';
            position: absolute;
            display: block;
            left: 0px;
            top: 0px;
            bottom: 0px;
            right: 0px;
            z-index: -1;
          }
        }
        .rdp-day:focus,
        .rdp-day:hover,
        .rdp-day:active {
          &:not([disabled]):not(.rdp-day_selected) {
            &:before {
              left: 1px;
              top: 1px;
              bottom: 1px;
              right: 1px;
              border-radius: 50%;
              background-color: #e7edff;
            }
            &:active {
              color: white;
              &:before {
                background-color: ${theme('colors.primary')};
              }
            }
          }
        }
        .rdp-day_selected {
          color: white;
          :before {
            border-radius: 50%;
            background-color: ${theme('colors.primary')};
          }
        }
        .rdp-day_range_middle {
          color: ${theme('colors.dark')};
          :before {
            border-radius: 0;
            border: 1px solid rgb(151 133 185);
            background-color: ${theme('colors.primary-light')};
          }
        }
        .rdp-day_range_start,
        .rdp-day_range_end {
          position: relative;
          z-index: 1;
          &.rdp-day_range_start:before {
            border-top-right-radius: 0px;
            border-bottom-right-radius: 0px;
          }
          &.rdp-day_range_end:before {
            border-top-left-radius: 0px;
            border-bottom-left-radius: 0px;
          }
          &.rdp-day_range_start.rdp-day_range_end:before {
            border-radius: 50%;
          }
        }
      }
    }
  }
`


