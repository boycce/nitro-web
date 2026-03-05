// todo: finish tailwind conversion
// todo: integrate into field (state, styling, etc)
import { Address } from 'nitro-web/types'

declare global {
  interface Window {
    initMap?: () => void,
    google?: Google
  }
}
type Google = {
  maps: {
    places: {
      Autocomplete: new (element: HTMLElement, options: { types: string[], componentRestrictions: { country: string[] } }) => {
        setFields: (fields: string[]) => void
        addListener: (event: string, callback: () => void) => void
      }
    }
  }
}
type Place = {
  formatted_address: string
  address_components: {
    long_name: string
    short_name: string
    types: string[]
  }[]
  geometry: {
    location: {
      lng: () => number
      lat: () => number
    }
    viewport: {
      getSouthWest: () => {
        lng: () => number
        lat: () => number
      }
      getNorthEast: () => {
        lng: () => number
        lat: () => number
      }
    }
  }
}
type Full = string
type LocationOnInputChangeEvent = { target: { name: string, value: Full } }
type LocationOnChangeEvent = { target: { name: string, value: Address } }
type LocationProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  clear: boolean
  id?: string
  name: string
  onInputChange?: (event: LocationOnInputChangeEvent) => void
  onChange?: (event: LocationOnChangeEvent) => void
  placeholder?: string
  placeTypes?: string[]
  value?: Address
  googleMapsApiKey: string
}

/**
 * Get location or area of place (requires both 'maps javascript' and 'places' APIs)
 * @param clear - clear input after select
 * @param onInputChange - called when the input value changes
 * @param onChange - called when a place is selected
 * @param value - e.g. {full, line1, ..etc}
 *
 * Handy box tester, see also util.mongoAddKmsToBox(): https://www.keene.edu/campus/maps/tool/
 *
 * Returned Google places viewport (area), i.e. `place.geometry.viewport`
 * {
 *   Qa: {g: 174.4438160493033, h: 174.9684260722261} == [btmLng, topLng]
 *   zb: {g: -37.05901990116617, h: -36.66060184426172} == [btmLat, topLat]
 * }
 */
export function Location({ 
  clear, 
  onInputChange: onInputChangeProp, 
  onChange: onChangeProp, 
  placeTypes, 
  value: valueProp, 
  googleMapsApiKey, 
  ...props
}: LocationProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = props.id || props.name
  if (!googleMapsApiKey) throw new Error('`googleMapsApiKey` is required!')

  // Since value and onChange are optional, we need to hold the value in state if not provided
  const [internalValue, setInternalValue] = useState(valueProp?.full || '' as Full)
  const value = valueProp?.full ?? internalValue
  const onChange = onChangeProp ?? ((e: LocationOnChangeEvent) => setInternalValue(e.target.value?.full || ''))

  useEffect(() => {
    if (value !== internalValue) setInternalValue(value)
  }, [value])

  useEffect(() => {
    // Load Google Maps API, and then setup the autocomplete on the element
    loadGoogleMaps(googleMapsApiKey).then(() => {
      if (inputRef.current && window.google) {
        const autoComplete = new window.google.maps.places.Autocomplete(
          inputRef.current, 
          {
            types: placeTypes ? placeTypes : ['address'],
            componentRestrictions: { country: ['nz'] },
          }
        )
        autoComplete.setFields(['address_components', 'formatted_address', 'geometry'])
        autoComplete.addListener('place_changed', onChangePlace)
        inputRef.current.addEventListener('keydown', onKeyDown)
      }
    })
    return () => {
      // It seems like autoComplete cleans up both listeners, handy links if needing to remove sooner..
      // Cleanup listners: https://stackoverflow.com/a/22862011/1900648
      // Cleanup .pac-container: https://stackoverflow.com/a/21419890/1900648
      for (const elem of document.getElementsByClassName('pac-container')) elem.remove()
    }
  }, [])

  function onChangePlace(this: { getPlace: () => Place }) {
    const place = this.getPlace()
    if (!place.geometry) return
    const address = getAddressFromPlace(place)
    if (clear) setInternalValue('')
    else setInternalValue(address.full || '')
    onChange({ target: { name: props.name, value: address } })
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInternalValue(event.target.value)
    if (onInputChangeProp) onInputChangeProp({ target: { name: props.name, value: event.target.value } })
  }

  function onFocus(event: React.FocusEvent<HTMLInputElement>) {
    // Required to disable the chrome autocomplete, https://stackoverflow.com/a/57131179/4553162
    if (event.target.autocomplete) {
      event.target.autocomplete = 'off'
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    // Stop form submission if there is a google autocomplete dropdown opened
    let prevented
    if (event.key === 'Enter') {
      for (const el of document.getElementsByClassName('pac-container')) {
        if ((el as HTMLElement).offsetParent !== null && !prevented) { // google autocomplete opened somewhere
          event.preventDefault()
          prevented = true
        }
      }
    }
  }

  return (
    <input
      {...props}
      id={id}
      onChange={onInputChange}
      onFocus={onFocus}
      ref={inputRef}
      type="text"
      value={value}
    />
  )
}

/**
 * Format a Google Places API place object into a monastery schema address object
 * @param place - Google Places API place object
 * @returns Address object
 */
function getAddressFromPlace(place: Place) {
  console.log(place)
  const componentsToParsedMapping = {
    city: ['locality'],
    country: ['country'],
    number: ['street_number'],
    postcode: ['postal_code'],
    region: [
      'administrative_area_level_1',
      'administrative_area_level_2',
      'administrative_area_level_3',
      'administrative_area_level_4',
      'administrative_area_level_5',
    ],
    street: ['street_address', 'route'],
    suburb: [
      'sublocality',
      'sublocality_level_1',
      'sublocality_level_2',
      'sublocality_level_3',
      'sublocality_level_4',
    ],
    unit: ['subpremise'],
  }
  const parsed = {
    city: '',
    country: '',
    number: '',
    postcode: '',
    region: '',
    street: '',
    suburb: '',
    unit: '',
  }

  // 1. Map place components into a parsed object
  place.address_components.forEach((component) => {
    for (var key in componentsToParsedMapping) {
      if (componentsToParsedMapping[key as keyof typeof componentsToParsedMapping].indexOf(component.types[0]) !== -1) {
        parsed[key as keyof typeof parsed] = component.long_name
      }
    }
  })
  if (!parsed.city) {
    parsed.city = parsed.suburb
    parsed.suburb = ''
  }

  // 2. Return the address object
  const address: Address = {
    city: parsed.city,
    country: parsed.country,
    full: place.formatted_address,
    line1: [[parsed.unit, parsed.number].filter(o => o).join('/'), parsed.street].join(' '),
    line2: [parsed.suburb, parsed.postcode].filter(o => o).join(', '),
    number: parsed.number,
    postcode: parsed.postcode,
    suburb: parsed.suburb,
    unit: parsed.unit,
    location: place.geometry.location && [place.geometry.location.lng(), place.geometry.location.lat()],
    area: place.geometry.viewport && {
      bottomLeft: [
        place.geometry.viewport.getSouthWest().lng(),
        place.geometry.viewport.getSouthWest().lat(),
      ],
      topRight: [
        place.geometry.viewport.getNorthEast().lng(),
        place.geometry.viewport.getNorthEast().lat(),
      ],
    },
  }
  return address
}

/**
 * Load Google Maps API. The promise is returned once loaded.
 * Warning: requires both 'maps javascript api' and 'places api' within Goolge Cloud Platform
 * @param googleMapsApiKey - Google Maps API key
 */
function loadGoogleMaps(googleMapsApiKey: string) {
  // Requires both 'maps javascript api' and 'places api' within Goolge Cloud Platform
  if (!window.initMap) {
    window.initMap = () => {/*noop to prevent warning*/}
  }

  return new Promise<void>((res) => {
    const scriptId = 'googleMapsUrl'
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null
    // script not yet inserted
    if (existingScript === null) {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.id = scriptId
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`+
        '&libraries=places&callback=initMap'
      script.onload = () => res()
      document.getElementsByTagName('head')[0].appendChild(script)
    // script has already been inserted
    } else {
      // script has already loaded
      if (window.google) {
        res()
      // script hasn't been loaded yet
      } else {
        const cachedCallback = existingScript.onload as () => void
        existingScript.onload = () => {
          cachedCallback?.()
          res()
        }
      }
    }
  })
}

// Styles are in custom.css