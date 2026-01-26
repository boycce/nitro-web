import { hsvaToHex, hexToHsva, validHex, HsvaColor } from '@uiw/color-convert'
import Saturation from '@uiw/react-color-saturation'
import Hue from '@uiw/react-color-hue'
import { currency, Dropdown, util } from 'nitro-web'

export type FieldColorProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> & {
  name: string
  /** name is applied if id is not provided */
  id?: string 
  Icon?: React.ReactNode
  onChange?: (event: { target: { name: string, value: string } }) => void
  value?: string // e.g. '#333'
  defaultValue?: string // e.g. '#333'
}

export function FieldColor({ defaultValue='#000', Icon, onChange: onChangeProp, ...props }: FieldColorProps) {
  const isInvalid = props.className?.includes('is-invalid') ? 'is-invalid' : ''
  const id = props.id || props.name

  // Since value and onChange are optional, we need need to create an internal value state
  const [internalValue, setInternalValue] = useState<FieldColorProps['value']>(props.value ?? defaultValue)
  const inputValue = internalValue

  // Update the internal value when the value changes outside of the component
  useEffect(() => {
    if (internalValue !== (props.value ?? defaultValue)) setInternalValue(props.value ?? defaultValue)
  }, [props.value])

  function onChange(e: { target: { name: string, value: string } }) {
    if (onChangeProp) onChangeProp({ target: { name: props.name, value: e.target.value }})
    else setInternalValue(e.target.value)
  }

  return (
    <Dropdown 
      dir="bottom-left"
      menuToggles={false}
      menuContent={
        <ColorPicker defaultValue={defaultValue} name={props.name} value={internalValue} onChange={onChange} />
      }
    >
      <div className="grid grid-cols-1">
        {Icon}
        <input
          {...props}
          className={(props.className || '') + ' ' + isInvalid}
          id={id}
          value={inputValue}
          onChange={onChange}
          onBlur={() => !validHex(internalValue||'') && onChange({ target: { name: props.name, value: '' }})} // wipe if invalid
          autoComplete="off"
          type="text"
        />
      </div>
    </Dropdown>
  )
}

function ColorPicker({ name='', onChange, value='', defaultValue='' }: FieldColorProps) {
  const [hsva, setHsva] = useState(() => hexToHsva(validHex(value) ? value : defaultValue))
  const [debounce] = useState(() => util.throttle(callOnChange, 50))

  // Update the hsva when the internal value changes
  useEffect(() => {
    if (validHex(value)) setHsva(hexToHsva(value))
  }, [value])

  function callOnChange(newHsva: HsvaColor) {
    if (onChange) onChange({ target: { name: name, value: hsvaToHex(newHsva) }})
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



