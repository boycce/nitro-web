import { css } from 'twin.macro'
import { hsvaToHex, hexToHsva, validHex, HsvaColor } from '@uiw/color-convert'
import Saturation from '@uiw/react-color-saturation'
import Hue from '@uiw/react-color-hue'
import { Dropdown, util } from 'nitro-web'
import React from 'react'

type InputColorProps = {
  className?: string
  defaultColor?: string
  iconEl?: React.ReactNode
  id?: string
  onChange?: (e: { target: { id: string, value: string } }) => void
  value?: string
  [key: string]: unknown
}

export function InputColor({ className, defaultColor='#333', iconEl, id, onChange, value, ...props }: InputColorProps) {
  const [lastChanged, setLastChanged] = useState(() => `ic-${Date.now()}`)
  const isInvalid = className?.includes('is-invalid') ? 'is-invalid' : ''

  function onInputChange(e: { target: { id: string, value: string } }) {
    setLastChanged(`ic-${Date.now()}`)
    if (onChange) onChange(e)
  }

  return (
    <Dropdown 
      dir="bottom-left"
      menuToggles={false}
      menuChildren={
        <ColorPicker key={lastChanged} defaultColor={defaultColor} id={id} value={value} onChange={onChange} />
      }
    >
      <div className="grid grid-cols-1" css={style}>
        {iconEl}
        <input 
          {...props} 
          className={className + ' ' + isInvalid} 
          id={id} 
          value={value} 
          onChange={onInputChange}
          onBlur={() => !validHex(value||'') && onInputChange({ target: { id: id || '', value: '' }})}
          autoComplete="off" 
        />
      </div>
    </Dropdown>
  )
}

function ColorPicker({ id='', onChange, value='', defaultColor='' }: InputColorProps) {
  const [hsva, setHsva] = useState(() => hexToHsva(validHex(value) ? value : defaultColor))
  const [debounce] = useState(() => util.throttle(callOnChange, 50))

  function callOnChange(newHsva: HsvaColor) {
    if (onChange) onChange({ target: { id: id, value: hsvaToHex(newHsva) }})
  }

  return (
    <>
      <Saturation
        css={style}
        hsva={hsva}
        onChange={(newHsva) => {
          setHsva(newHsva)
          if (onChange) debounce(newHsva)
        }}
      />
      <Hue
        css={style}
        hue={hsva.h}
        onChange={(newHue) => {
          setHsva({ ...hsva, ...newHue })
          if (onChange) debounce({ ...hsva, ...newHue })
        }}
      />
    </>
  )
}

const style = css`
  /////////////////////
  .w-color-interactive {
    width: 100% !important;
    height: 150px !important;
  }
`


