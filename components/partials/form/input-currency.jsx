/*eslint-disable*/
import { NumericFormat } from 'react-number-format'
import { getCurrencyPrefixWidth } from '../../../util.js'

/**
 * @param {string} id - field name or path on state
 * @param {object} config - e.g. { currencies: { nzd: { symbol: '$', digits: 2 } } }
 * @param {string} [currency] - currency iso
 * @param {function} [onChange] - e.g. (event) => onInputChange(event)
 * @param {string} [placeholder] - e.g. 'Amount'
 * @param {cents} [value] - e.g. 123 (input is always controlled if state is passed in)
 */
export function InputCurrency({ id, config, className, currency='nzd', onChange, placeholder, value }) {
  if (!config?.currencies || !config?.countries) {
    throw new Error(
      'InputCurrency: `config.currencies` and `config.countries` is required, check out the nitro example for more info.'
    )
  }
  const ref = useRef()
  const [dontFix, setDontFix] = useState()
  const [settings, setSettings] = useState(() => getCurrencySettings(currency))
  const [dollars, setDollars] = useState(() => toDollars(value, true, settings))
  const [prefixWidth, setPrefixWidth] = useState()
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
    setPrefixWidth(settings.prefix == '$' ? getCurrencyPrefixWidth(settings.prefix, 1) : 0)
  }, [settings.prefix])

  function toCents(num) {
    if (!num && num !== 0) return null
    const value = Math.round(num * Math.pow(10, ref.current.settings.maxDecimals)) // e.g. 1.23 => 123
    // console.log('toCents', num, value)
    return value
  }

  function toDollars(num, toFixed, settings) {
    if (!num && num !== 0) return null
    const value = num / Math.pow(10, (settings||ref.current.settings).maxDecimals) // e.g. 1.23 => 123
    // console.log('toDollars', num, value)
    return toFixed ? value.toFixed((settings||ref.current.settings).maxDecimals) : value
  }

  function getCurrencySettings(currency) {
    /**
     * parse CLDR currency format, e.g. '¤#,##0.00'
     * @param {string} currency - currency iso
     * @returns {object}
     * {
     *   currency: 'nzd',
     *   decimalSeparator: '.',
     *   thousandSeparator: ',',
     *   minDecimals: 2,
     *   maxDecimals: 2,
     *   prefix: '$',
     *   suffix: '',
     * }
     */
    const output = { currency }
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
        id={id}
        className={className}
        decimalSeparator={settings.decimalSeparator}
        thousandSeparator={settings.thousandSeparator}
        decimalScale={settings.maxDecimals}
        onValueChange={!onChange ? undefined : ({ floatValue }, e) => {
          // console.log('onValueChange', floatValue, e)
          if (e.source === 'event') setDontFix(true)
          onChange({ target: { id: id, value: toCents(floatValue) }})
        }}
        onBlur={() => { setDollars(toDollars(value, true))}}
        placeholder={placeholder || '0.00'}
        value={dollars}
        style={{ textIndent: `${prefixWidth}px` }}
      />
      <span
        class={`absolute top-[1px] bottom-0 left-3 inline-flex items-center select-none text-gray-500 text-sm sm:text-sm/6 ${dollars !== null && settings.prefix == '$' ? 'text-dark' : ''}`}
      >
        {settings.prefix || settings.suffix}
      </span>
    </div>
  )
}
