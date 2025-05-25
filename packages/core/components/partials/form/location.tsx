// @ts-nocheck
// todo: finish tailwind conversion
import * as util from 'nitro-web/util'

type LocationProps = {
  clear: boolean
  id?: string
  name: string
  onInput?: (place: Place) => void
  onSelect?: (place: Place) => void
  placeholder?: string
  placeTypes?: string[]
  value?: Place
  googleMapsApiKey: string
}

export function Location({ clear, id, name, onInput, onSelect, placeholder, placeTypes, value, googleMapsApiKey }: LocationProps) {
  /**
   * Get location or area of place (requires both 'maps javascript' and 'places' APIs)
   *
   * @param {boolean} clear - clear input after select
   * @param {function(place)} onInput - called when the input value changes, with an
   *   empty place, e.g. {full: '...', fullModified: true}
   * @param {function(place)} onSelect - called when a place is selected
   * @param {object} value - {full, line1, ..etc}
   *
   * Handy box tester (see also util.mongoAddKmsToBox())
   * https://www.keene.edu/campus/maps/tool/
   *
   * Returned Google places viewport (area), i.e. `place.geometry.viewport`
   * {
   *   Qa: {g: 174.4438160493033, h: 174.9684260722261} == [btmLng, topLng]
   *   zb: {g: -37.05901990116617, h: -36.66060184426172} == [btmLat, topLat]
   * }
   */
  const inputRef = useRef(null)
  const full = (value || {}).full || ''
  const [inputValue, setInputValue] = useState(full)

  useEffect(() => {
    if (!onSelect) console.error('Please pass `onSelect` to location.jsx')
    let autoComplete
    loadGoogleMaps(googleMapsApiKey).then(() => {
      if (inputRef.current) {
        autoComplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: placeTypes ? placeTypes : ['address'],
          componentRestrictions: { country: ['nz'] },
        })
        autoComplete.setFields(['address_components', 'formatted_address', 'geometry'])
        autoComplete.addListener('place_changed', onPlaceSelect)
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

  useEffect(() => {
    if (full !== inputValue) setInputValue(full)
  }, [full])

  function formatAddressObject(place) {
    console.log(place)
    var addressMap = {
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
    var address = {
      city: '',
      country: '',
      number: '',
      postcode: '',
      region: '',
      street: '',
      suburb: '',
      unit: '',
    }
    place.address_components.forEach((component) => {
      for (var key in addressMap) {
        if (addressMap[key].indexOf(component.types[0]) !== -1) {
          address[key] = component.long_name
        }
      }
    })
    if (!address.city) {
      address.city = address.suburb
      address.suburb = ''
    }
    return address
  }

  function onPlaceSelect() {
    const place = this.getPlace()
    if (!place.geometry) return
    if (clear) setInputValue('')
    else setInputValue(place.formatted_address)
    const addressObject = formatAddressObject(place)
    onSelect({
      city: addressObject.city,
      country: addressObject.country,
      line1: [[addressObject.unit, addressObject.number].filter(o=>o).join('/'), addressObject.street].join(' '),
      line2: [addressObject.suburb, addressObject.postcode].filter(o=>o).join(', '),
      full: place.formatted_address,
      number: addressObject.number,
      postcode: addressObject.postcode,
      suburb: addressObject.suburb,
      location: {
        coordinates: [place.geometry.location.lng(), place.geometry.location.lat()],
        type: 'Point',
      },
      unit: addressObject.unit,
      area: !util.deepFind(place, 'geometry.viewport') ? undefined : {
        bottomLeft: [
          place.geometry.viewport.getSouthWest().lng(),
          place.geometry.viewport.getSouthWest().lat(),
        ],
        topRight: [
          place.geometry.viewport.getNorthEast().lng(),
          place.geometry.viewport.getNorthEast().lat(),
        ],
      },
    })
  }

  function onChange(event) {
    // On input change
    setInputValue(event.target.value)
    if (onInput) onInput({
      full: event.target.value,
      fullModified: true,
    })
  }

  function onFocus(event) {
    // Required to disable the chrome autocomplete, https://stackoverflow.com/a/57131179/4553162
    if (event.target.autocomplete) {
      event.target.autocomplete = 'off'
    }
  }

  function onKeyDown(event) {
    // Stop form submission if there is a google autocomplete dropdown opened
    let prevented
    if (event.key === 'Enter') {
      for (const el of document.getElementsByClassName('pac-container')) {
        if (el.offsetParent !== null && !prevented) { // google autocomplete opened somewhere
          event.preventDefault()
          prevented = true
        }
      }
    }
  }

  return (
    <input
      id={id||name}
      name={name||id}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      ref={inputRef}
      type="text"
      value={inputValue}
    />
  )
}

function loadGoogleMaps(googleMapsApiKey) {
  // Requires both 'maps javascript api' and 'places api' within Goolge Cloud Platform
  if (!window.initMap) {
    window.initMap = () => {/*noop to prevent warning*/}
  }

  return new Promise((res) => {
    const scriptId = 'googleMapsUrl'
    let script = document.getElementById(scriptId)
    // script not yet inserted
    if (script === null) {
      script = document.createElement('script')
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
        const cachedCallback = script.onload
        script.onload = () => {
          cachedCallback()
          res()
        }
      }
    }
  })
}

// Styles are in custom.css