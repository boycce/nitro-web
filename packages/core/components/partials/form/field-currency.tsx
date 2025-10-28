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
  /** currency iso, e.g. 'nzd' */
  currency: string
  /** override the default currencies array used to lookup currency symbol and digits, e.g. {nzd: { symbol: '$', digits: 2 }} */
  currencies?: { [key: string]: { symbol: string, digits: number } }, 
  /** override the default CLDR country currency format, e.g. '¤#,##0.00' */
  format?: string, 
  onChange?: (event: { target: { name: string, value: string|number|null } }) => void
  /** value should be in cents */
  value?: string|number|null
  defaultValue?: number | string | null
}

export function FieldCurrency({ currency='nzd', currencies, format, onChange, value, defaultValue, ...props }: FieldCurrencyProps) {
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
    setPrefixWidth(settings.prefix ? getPrefixWidth(settings.prefix, 1) : 0)
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

    let _format = format || defaultFormat
    const _currencies = currencies ?? defaultCurrencies
    const currencyObject = _currencies[currency as keyof typeof _currencies]
    if (!currencyObject && currencies) {
      console.error(
        `The currency field "${props.name}" is using the currency "${currency}" which is not found in your currencies object`
      )
    } else if (!currencyObject && !currencies) {
      console.error(
        `The currency field "${props.name}" is using the currency "${currency}" which is not found in the 
        default currencies, please provide a currencies object.`
      )
    }
    const symbol = currencyObject ? currencyObject.symbol : ''
    const digits = currencyObject ? currencyObject.digits : 2

    // Check for currency symbol (¤) and determine its position
    if (_format.indexOf('¤') !== -1) {
      const position = _format.indexOf('¤') === 0 ? 'prefix' : 'suffix'
      output[position] = symbol
      _format = _format.replace('¤', '')
    }

    // Find and set the thousands separator
    const thousandMatch = _format.match(/[^0-9#]/)
    if (thousandMatch) output.thousandSeparator = thousandMatch[0]

    // Find and set the decimal separator and fraction digits
    const decimalMatch = _format.match(/0[^0-9]/)
    if (decimalMatch) {
      output.decimalSeparator = decimalMatch[0].slice(1)
      if (typeof digits !== 'undefined') {
        output.minDecimals = digits
        output.maxDecimals = digits
      } else {
        const fractionDigits = _format.split(output.decimalSeparator)[1]
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
        class={`absolute top-0 bottom-0 left-[12px] left-input-x inline-flex items-center select-none text-gray-500 text-input-base ${dollars !== null && settings.prefix == '$' ? 'text-foreground' : ''}`}
      >
        {settings.prefix || settings.suffix}
      </span>
    </div>
  )
}

export const defaultCurrencies: { [key: string]: { name: string, symbol: string, digits: number } } = {
  nzd: { name: 'New Zealand Dollar', symbol: '$', digits: 2 },
  aud: { name: 'Australian Dollar', symbol: '$', digits: 2 },
  usd: { name: 'US Dollar', symbol: '$', digits: 2 },
  btc: { name: 'Bitcoin', symbol: '₿', digits: 8 },
  aed: { name: 'UAE Dirham', symbol: 'د.إ', digits: 2 },
  ars: { name: 'Argentine Peso', symbol: '$', digits: 2 },
  bdt: { name: 'Bangladeshi Taka', symbol: '৳', digits: 2 },
  bhd: { name: 'Bahraini Dinar', symbol: '.د.ب', digits: 3 },
  brl: { name: 'Brazilian Real', symbol: 'R$', digits: 2 },
  cad: { name: 'Canadian Dollar', symbol: '$', digits: 2 },
  chf: { name: 'Swiss Franc', symbol: 'Fr', digits: 2 },
  clp: { name: 'Chilean Peso', symbol: '$', digits: 0 },
  cny: { name: 'Chinese Yuan', symbol: '¥', digits: 2 },
  cop: { name: 'Colombian Peso', symbol: '$', digits: 2 },
  czk: { name: 'Czech Koruna', symbol: 'Kč', digits: 2 },
  dkk: { name: 'Danish Krone', symbol: 'kr', digits: 2 },
  egp: { name: 'Egyptian Pound', symbol: '£', digits: 2 },
  eur: { name: 'Euro', symbol: '€', digits: 2 },
  gbp: { name: 'Great Britain Pound', symbol: '£', digits: 2 },
  hkd: { name: 'Hong Kong Dollar', symbol: '$', digits: 2 },
  huf: { name: 'Hungarian Forint', symbol: 'Ft', digits: 0 },
  idr: { name: 'Indonesian Rupiah', symbol: 'Rp', digits: 0 },
  ils: { name: 'Israeli Shekel', symbol: '₪', digits: 2 },
  inr: { name: 'Indian Rupee', symbol: '₹', digits: 2 },
  jod: { name: 'Jordanian Dinar', symbol: 'د.ا', digits: 3 },
  jpy: { name: 'Japanese Yen', symbol: '¥', digits: 0 },
  kes: { name: 'Kenyan Shilling', symbol: 'Sh', digits: 2 },
  krw: { name: 'South Korean Won', symbol: '₩', digits: 0 },
  kwd: { name: 'Kuwaiti Dinar', symbol: 'د.ك', digits: 3 },
  lkr: { name: 'Sri Lankan Rupee', symbol: 'Rs', digits: 2 },
  mad: { name: 'Moroccan Dirham', symbol: 'د.م.', digits: 2 },
  mxn: { name: 'Mexican Peso', symbol: '$', digits: 2 },
  myr: { name: 'Malaysian Ringgit', symbol: 'RM', digits: 2 },
  ngn: { name: 'Nigerian Naira', symbol: '₦', digits: 2 },
  nok: { name: 'Norwegian Krone', symbol: 'kr', digits: 2 },
  omr: { name: 'Omani Rial', symbol: '﷼', digits: 3 },
  pen: { name: 'Peruvian Sol', symbol: 'S/', digits: 2 },
  php: { name: 'Philippine Peso', symbol: '₱', digits: 2 },
  pkt: { name: 'Pakistani Rupee', symbol: '₨', digits: 2 },
  pln: { name: 'Polish Zloty', symbol: 'zł', digits: 2 },
  qar: { name: 'Qatari Riyal', symbol: '﷼', digits: 2 },
  ron: { name: 'Romanian Leu', symbol: 'lei', digits: 2 },
  rub: { name: 'Russian Ruble', symbol: '₽', digits: 2 },
  sar: { name: 'Saudi Riyal', symbol: '﷼', digits: 2 },
  sek: { name: 'Swedish Krona', symbol: 'kr', digits: 2 },
  sgd: { name: 'Singapore Dollar', symbol: '$', digits: 2 },
  thb: { name: 'Thai Baht', symbol: '฿', digits: 2 },
  try: { name: 'Turkish Lira', symbol: '₺', digits: 2 },
  twd: { name: 'New Taiwan Dollar', symbol: 'NT$', digits: 2 },
  uah: { name: 'Ukrainian Hryvnia', symbol: '₴', digits: 2 },
  vnd: { name: 'Vietnamese Dong', symbol: '₫', digits: 0 },
  zar: { name: 'South African Rand', symbol: 'R', digits: 2 },
}

const defaultFormat = '¤#,##0.00'
