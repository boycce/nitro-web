import { hsvaToHex, hexToHsva, validHex, HsvaColor } from '@uiw/color-convert'
import Saturation from '@uiw/react-color-saturation'
import Hue from '@uiw/react-color-hue'
import { Dropdown, util } from 'nitro-web'

export type FieldColorProps = React.InputHTMLAttributes<HTMLInputElement> & {
  name: string
  id?: string 
  defaultColor?: string
  Icon?: React.ReactNode
  onChange?: (event: { target: { id: string, value: string|null } }) => void
  value?: string|null
}

export function FieldColor({ defaultColor='#333', Icon, onChange, value, ...props }: FieldColorProps) {
  const [lastChanged, setLastChanged] = useState(() => `ic-${Date.now()}`)
  const isInvalid = props.className?.includes('is-invalid') ? 'is-invalid' : ''
  const id = props.id || props.name

  function onInputChange(e: { target: { id: string, value: string|null } }) {
    setLastChanged(`ic-${Date.now()}`)
    if (onChange) onChange(e)
  }

  return (
    <Dropdown 
      dir="bottom-left"
      menuToggles={false}
      menuContent={
        <ColorPicker key={lastChanged} defaultColor={defaultColor} id={id} name={props.name} value={value} onChange={onChange} />
      }
    >
      <div className="grid grid-cols-1">
        {Icon}
        <input
          {...props}
          className={(props.className || '') + ' ' + isInvalid}
          id={id}
          value={value}
          onChange={onInputChange}
          onBlur={() => !validHex(value||'') && onInputChange({ target: { id: id, value: '' }})}
          autoComplete="off"
          type="text"
        />
      </div>
    </Dropdown>
  )
}

function ColorPicker({ id='', onChange, value='', defaultColor='' }: FieldColorProps) {
  const [hsva, setHsva] = useState(() => hexToHsva(validHex(value) ? value : defaultColor))
  const [debounce] = useState(() => util.throttle(callOnChange, 50))

  function callOnChange(newHsva: HsvaColor) {
    if (onChange) onChange({ target: { id: id, value: hsvaToHex(newHsva) }})
  }

  return (
    <>
      <Saturation
        className="!w-[100%] !h-[150px]"
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



