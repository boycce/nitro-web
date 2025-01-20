import { css } from 'twin.macro'
import { hsvaToHex, hexToHsva, validHex } from '@uiw/color-convert'
import Saturation from '@uiw/react-color-saturation'
import Hue from '@uiw/react-color-hue'
import { Dropdown } from '../element/dropdown.jsx'
import { throttle } from '../../../util.js'

export function InputColor({ className, defaultColor='#333', iconEl, id, onChange, value, ...props }) {
  const [lastChanged, setLastChanged] = useState(() => `ic-${Date.now()}`)
  const isInvalid = className?.includes('is-invalid') ? 'is-invalid' : ''

  function onInputChange(e) {
    setLastChanged(`ic-${Date.now()}`)
    if (onChange) onChange(e)
  }

  return (
    <Dropdown
      css={style}
      menuToggles={false}
      menuChildren={
        <ColorPicker key={lastChanged} defaultColor={defaultColor} id={id} value={value} onChange={onChange} />
      }
    >
      <div className="grid grid-cols-1">
        {iconEl}
        <input 
          {...props} 
          className={className + ' ' + isInvalid} 
          id={id} 
          value={value} 
          onChange={onInputChange}
          onBlur={() => !validHex(value) && onInputChange({ target: { id: id, value: '' }})}
          autoComplete="off" 
        />
      </div>
    </Dropdown>
  )
}

function ColorPicker({ id, onChange, value, defaultColor }) {
  const [hsva, setHsva] = useState(() => hexToHsva(validHex(value) ? value : defaultColor))
  const [debounce] = useState(() => throttle(callOnChange, 50))

  function callOnChange(newHsva) {
    onChange({ target: { id: id, value: hsvaToHex(newHsva) }})
  }

  return (
    <>
      <Saturation
        hsva={hsva}
        onChange={(newHsva) => {
          setHsva(newHsva)
          if (onChange) debounce(newHsva)
        }}
      />
      <Hue
        hue={hsva.h}
        onChange={(newHue) => {
          setHsva({ ...hsva, ...newHue })
          if (onChange) debounce({ ...hsva, ...newHue })
        }}
      />
    </>
  )
}

const style = () => css`
  text-indent: 0 !important; // since is-color is on dropdown
  .w-color-interactive {
    width: 100% !important;
    height: 150px !important;
  }
`


