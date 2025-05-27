import React, { useState, useMemo, useCallback, JSX, useEffect } from 'react'
import { css, theme } from 'twin.macro'
import { Dropdown } from 'nitro-web'
import ClockIcon from '../icons/clock'

export interface FieldTimeProps {
  className?: string;
  placeholder?: string;
  id?: string;
  onChange: (values: { id: string; value: number; isFalse: boolean }) => void;
  value: string;
  isFull?: boolean;
  Icon?: JSX.Element;
  required?: boolean;
  onFalseCondition?: (id: string, time: number) => boolean
}

export function FieldTime({
  className, placeholder = '', id = '', onChange, value, isFull = true, Icon = <ClockIcon />, required = false, onFalseCondition, ...rest
}: FieldTimeProps) {

  // Parse the incoming time value
  const [time, setTime] = useState(() => Number(value) || 0)

  const handleTimeChange = useCallback((isHour: boolean, e: React.ChangeEvent<HTMLSelectElement>) => {
    const timeStr = e.target.value
    const number = parseInt(timeStr)
    const hours = Math.floor(time / (60 * 60 * 1000))
    const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000))
    const newTime = isHour ? (number * 60 * 60 * 1000) + (minutes * 60 * 1000) : (hours * 60 * 60 * 1000) + (number * 60 * 1000)

    const isFalse = onFalseCondition ? onFalseCondition(id, newTime) : false // if false, not update

    if (!isFalse) setTime(newTime)

    if (onChange) onChange({ id: id, value: newTime, isFalse: isFalse })

  }, [time, id, onChange, onFalseCondition])

  const hoursTime = useMemo(() => Math.floor(time / (60 * 60 * 1000)), [time])

  const minutesTime = useMemo(() => Math.floor((time % (60 * 60 * 1000)) / (60 * 1000)), [time])

  const [displayTime, setDisplayTime] = useState('00:00')

  const secondOptions = useMemo(() => {
    const [_hours, minutes] = displayTime.split(':').map(Number)
    return [...new Set([minutes, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])]
  }, [displayTime])

  useEffect(() => {
    setDisplayTime(`${String(hoursTime).padStart(2, '0')}:${String(minutesTime).padStart(2, '0')}`)
  }, [hoursTime, minutesTime])

  return (
    <Dropdown
      className={isFull ? 'w-full' : 'w-auto'}
      // @ts-ignore
      css={style}
      menuToggles={false}
      animate={false}
      menuChildren={
        <div className="time-picker-container">
          <div className="time-picker-selectors">
            <select
              className="time-select"
              value={hoursTime}
              onChange={(e) => handleTimeChange(true, e)}
            >
              {[...Array(24).keys()].map(i => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
              ))}
            </select>
            <span className="time-separator">:</span>
            <select
              className="time-select"
              value={minutesTime}
              onChange={(e) => handleTimeChange(false, e)}
            >
              {secondOptions.map(option => (
                <option key={option} value={option}>{String(option).padStart(2, '0')}</option>
              ))}
            </select>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1">
        {Icon}
        <input
          {...rest}
          key={id}
          id={id}
          autoComplete="off"
          className={`hide-time-icon font-medium text-sm placeholder-font-medium placeholder-sm ${className}`}
          value={displayTime}
          onChange={(e) => {
            const newStr = e.target.value
            const isValid = /^[0-9]{2}:[0-9]{2}$/.test(newStr)
            if (!isValid) {
              setDisplayTime(newStr)
              return
            }
            const [hours, minutes] = newStr.split(':').map(Number)
            const newNum = (hours * 60 + minutes) * 60 * 1000

            setTime(newNum)
            setDisplayTime(newStr)
          }}
          placeholder={placeholder}
          required={required}
        />
      </div>
    </Dropdown>
  )
}

export default FieldTime

const style = css`
  .time-picker-container {
    padding: 15px;
    font-size: 14px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .time-picker-selectors {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }

  .time-separator {
    font-size: 18px;
    font-weight: bold;
  }

  .time-select {
    width: 60px;
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .time-confirm-btn {
    padding: 8px 16px;
    font-size: 16px;
    background-color: ${theme`colors.primary`};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
  }

  .time-confirm-btn:hover {
    background-color: ${theme`colors.primary`};
  }
`
