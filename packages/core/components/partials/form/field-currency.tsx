import { NumericFormat } from 'react-number-format'
import { getPrefixWidth } from 'nitro-web/util'

// Declaring the type here because typescript fails to infer type when referencing NumericFormatProps from react-number-format
type NumericFormatProps = React.InputHTMLAttributes<HTMLInputElement> & {
  thousandSeparator?: boolean | string;
  decimalSeparator?: string;
  allowedDecimalSeparators?: Array<string>;
  thousandsGroupStyle?: 'thousand' | 'lakh' | 'wan' | 'none';
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  allowNegative?: boolean;
  allowLeadingZeros?: boolean;
  suffix?: string;
  prefix?: string;
}

export type FieldCurrencyProps = NumericFormatProps & {
  name: string
  /** name is applied if id is not provided */
  id?: string 
  /** e.g. { currencies: { nzd: { symbol: '$', digits: 2 } } } (check out the nitro example for more info) */
  config: {
    currencies: { [key: string]: { symbol: string, digits: number } }, 
    countries: { [key: string]: { numberFormats: { currency: string } } } 
  }
  /** currency iso, e.g. 'nzd' */
  currency: string
  onChange?: (event: { target: { name: string, value: string|number|null } }) => void
  /** value should be in cents */
  value?: string|number|null
  defaultValue?: number | string | null
}

export function FieldCurrency({ config, currency='nzd', onChange, value, defaultValue, ...props }: FieldCurrencyProps) {
  const [dontFix, setDontFix] = useState(false)
  const [settings, setSettings] = useState(() => getCurrencySettings(currency))
  const [dollars, setDollars] = useState(() => toDollars(value, true, settings))
  const [prefixWidth, setPrefixWidth] = useState(0)
  const ref = useRef({ settings, dontFix }) // was null
  const id = props.id || props.name
  ref.current = { settings, dontFix }

  useEffect(() => {
    if (settings.currency !== currency) {
      const settings = getCurrencySettings(currency)
      setSettings(settings)
      setDollars(toDollars(value, true, settings)) // required latest _settings
    }
  }, [currency])

  useEffect(() => {
    if (ref.current.dontFix) {
      setDollars(toDollars(value))
      setDontFix(false)
    } else {
      setDollars(toDollars(value, true))
    }
  }, [value])


  useEffect(() => {
    // Get the prefix content width
    setPrefixWidth(settings.prefix == '$' ? getPrefixWidth(settings.prefix, 1) : 0)
  }, [settings.prefix])

  function toCents(value?: string|number|null) {
    const maxDecimals = ref.current.settings.maxDecimals
    const parsed = parseFloat(value + '')
    if (!parsed && parsed !== 0) return null
    if (!maxDecimals) return parsed
    const value2 = Math.round(parsed * Math.pow(10, maxDecimals)) // e.g. 1.23 => 123
    // console.log('toCents', parsed, value2)
    return value2
  }

  function toDollars(value?: string|number|null, toFixed?: boolean, settings?: { maxDecimals?: number }) {
    const maxDecimals = (settings || ref.current.settings).maxDecimals
    const parsed = parseFloat(value + '')
    if (!parsed && parsed !== 0) return null
    if (!maxDecimals) return parsed
    const value2 = parsed / Math.pow(10, maxDecimals) // e.g. 1.23 => 123
    // console.log('toDollars', value, value2)
    return toFixed ? value2.toFixed(maxDecimals) : value2
  }

  function getCurrencySettings(currency: string) {
    // parse CLDR currency string format, e.g. '¤#,##0.00'
    const output: { 
      currency: string,           // e.g. 'nzd'
      decimalSeparator?: string,  // e.g. '.'
      thousandSeparator?: string, // e.g. ','
      minDecimals?: number,       // e.g. 2
      maxDecimals?: number,       // e.g. 2
      prefix?: string,            // e.g. '$'
      suffix?: string             // e.g. ''
    } = { currency }
    const { symbol, digits } = config.currencies[currency]
    let format = config.countries['nz'].numberFormats.currency

    // Check for currency symbol (¤) and determine its position
    if (format.indexOf('¤') !== -1) {
      const position = format.indexOf('¤') === 0 ? 'prefix' : 'suffix'
      output[position] = symbol
      format = format.replace('¤', '')
    }

    // Find and set the thousands separator
    const thousandMatch = format.match(/[^0-9#]/)
    if (thousandMatch) output.thousandSeparator = thousandMatch[0]

    // Find and set the decimal separator and fraction digits
    const decimalMatch = format.match(/0[^0-9]/)
    if (decimalMatch) {
      output.decimalSeparator = decimalMatch[0].slice(1)
      if (typeof digits !== 'undefined') {
        output.minDecimals = digits
        output.maxDecimals = digits
      } else {
        const fractionDigits = format.split(output.decimalSeparator)[1]
        if (fractionDigits) {
          output.minDecimals = fractionDigits.length 
          output.maxDecimals = fractionDigits.length
        }
      }
    }
    return output
  }

  return (
    <div className="relative">
      <NumericFormat
        {...props}
        id={id} 
        name={props.name}
        decimalSeparator={settings.decimalSeparator}
        thousandSeparator={settings.thousandSeparator}
        decimalScale={settings.maxDecimals}
        onValueChange={!onChange ? undefined : ({ floatValue }, e) => {
          // console.log('onValueChange', floatValue, e)
          if (e.source === 'event') setDontFix(true)
          onChange({ target: { name: props.name, value: toCents(floatValue) }})
        }}
        onBlur={() => { setDollars(toDollars(value, true))}}
        placeholder={props.placeholder || '0.00'}
        value={dollars}
        style={{ textIndent: `${prefixWidth}px` }}
        type="text"
        defaultValue={defaultValue}
      />
      <span
        class={`absolute top-0 bottom-0 left-3 inline-flex items-center select-none text-gray-500 text-input-base ${dollars !== null && settings.prefix == '$' ? 'text-foreground' : ''}`}
      >
        {settings.prefix || settings.suffix}
      </span>
    </div>
  )
}
