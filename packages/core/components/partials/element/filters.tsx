/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, SetStateAction, useRef, useEffect, useLayoutEffect } from 'react'
import { Button, Dropdown, Field, Select, type FieldProps, type SelectProps } from 'nitro-web'
import { camelCaseToTitle, debounce, omit, queryString, queryObject, twMerge } from 'nitro-web/util'
import { ListFilterIcon } from 'lucide-react'

type CommonProps = {
  label?: string
  width?: 'full' | 'half' | 'third' | 'quarter' | 'fifth'
  rowClassName?: string
}
export type FilterType = (
  | FieldProps & CommonProps
  | ({ type: 'select' } & SelectProps & CommonProps)
)

type FilterState = {
  [key: string]: any
}

type FiltersProps = {
  /** State passed to the component, values must be processed, i.e. real numbers for dates, etc. */
  state?: FilterState
  setState?: Dispatch<SetStateAction<FilterState>>
  filters?: FilterType[]
  elements?: {
    Button?: typeof Button
    Dropdown?: typeof Dropdown
    Field?: typeof Field
    Select?: typeof Select
    FilterIcon?: typeof ListFilterIcon
  }
  buttonProps?: Partial<React.ComponentProps<typeof Button>>
  buttonText?: string
  buttonCounterClassName?: string
  dropdownProps?: Partial<React.ComponentProps<typeof Dropdown>>
  dropdownFiltersClassName?: string
}

const debounceTime = 250

export function Filters({ 
  filters, 
  setState: setStateProp,
  state: stateProp, // state passed
  buttonProps,
  buttonCounterClassName,
  buttonText, 
  dropdownProps, 
  dropdownFiltersClassName,
  elements,
}: FiltersProps) {
  const location = useLocation()
  const [lastUpdated, setLastUpdated] = useState(0)
  const [stateDefault, setStateDefault] = useState<FilterState>(() => processState({ ...queryObject(location.search) }, filters))
  const [state, setState] = [stateProp || stateDefault, setStateProp || setStateDefault]
  const count = useMemo(() => Object.keys(state).filter((k) => state[k] && filters?.some((f) => f.name === k)).length, [state, filters])
  const pushChangesToPath = usePushChangesToPath(state)

  const Elements = {
    Button: elements?.Button || Button,
    Dropdown: elements?.Dropdown || Dropdown,
    Field: elements?.Field || Field,
    Select: elements?.Select || Select,
    FilterIcon: elements?.FilterIcon || ListFilterIcon,
  }
  
  useLayoutEffect(() => {
    // Only update the state if the filters haven't been input changed in the last 500ms (calls initially since lastUpdated is 0)
    if (Date.now() - lastUpdated > (debounceTime + 250)) {
      setState(() => processState({ ...queryObject(location.search) }, filters))
    }
  }, [location.search])

  function reset(e: React.MouseEvent<HTMLAnchorElement>, filter: FilterType) {
    e.preventDefault()
    setState((s) => omit(s, [filter.name]) as FilterState)
    onAfterChange()
  }

  function resetAll(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    setState((s) => omit(s, filters?.map((f) => f.name) || []) as FilterState)
    onAfterChange()
  }

  async function onInputChange(e: {target: {name: string, value: unknown}}) {
    // console.log('onInputChange', e.target.name, e.target.value)
    // the state is flattened for the query string, so here we se full paths as the key names e.g. 'job.location': '10')
    setState((s) => ({ ...s, [e.target.name]: e.target.value as unknown })) 
    onAfterChange()
  }

  function onAfterChange() {
    setLastUpdated(Date.now())
    pushChangesToPath()
  }

  function getBasisWidth(width: 'full' | 'half' | 'third' | 'quarter' | 'fifth') {
    // Need to splay out the classnames for tailwind to work
    if (width == 'full') return 'w-full'
    else if (width == 'half') return 'shrink basis-[calc(50%-8px)]'
    else if (width == 'third') return 'shrink basis-[calc(33.33%-8px)]'
    else if (width == 'quarter') return 'shrink basis-[calc(25%-8px)]'
    else if (width == 'fifth') return 'shrink basis-[calc(20%-8px)]'
  }

  function processState(state: FilterState, filters: FilterType[]|undefined) {
    // Since queryObject returns a string|true|(string|true)[], we need to parse the values to the correct type for the Fields/Selects
    const output: FilterState = {...state}
    for (const filter of filters || []) {
      const name = filter.name
      // Undefined values
      if (typeof state[name] === 'undefined') {
        output[name] = undefined
      
      // Date single needs to be null|string
      } else if (filter.type === 'date' && (filter.mode === 'single' || filter.mode === 'time')) {
        output[name] = parseDateValue(state[name], name)

      } else if (filter.type === 'date' && (filter.mode === 'range' || filter.mode === 'multiple')) {
        if (!state[name]) state[name] = undefined
        else if (!Array.isArray(state[name])) console.error(`The "${name}" filter expected an array, received:`, state[name])
        else output[name] = state[name].map((v, i) => parseDateValue(v, name + '.' + i))

      // Remaining filters should accept text values
      } else {
        output[filter.name] = state[filter.name] + ''
      }
    }
    return output
  }

  function parseDateValue(input: unknown, name: string) {
    const number = parseFloat(input + '')
    if (typeof input === 'undefined') return undefined
    else if (input === null) return null
    if (isNaN(number)) console.error(`The "${name}" filter expected a number, received:`, input)
    else return number
  }

  return (
    <Elements.Dropdown 
      // menuIsOpen={true}
      dir="bottom-right"
      allowOverflow={true}
      {...dropdownProps}
      menuClassName={twMerge(`min-w-[330px] ${dropdownProps?.menuClassName || ''}`)}
      menuContent={
        <div>
          <div class="flex justify-between items-center border-b p-4 py-3.5">
            <div class="text-lg font-semibold">Filters</div>
            <Button color="clear" size="sm" onClick={resetAll}>Reset All</Button>
          </div>
          {/* <div class="w-[1330px] bg-red-500 absolute">
            This div shouldnt produce a page scrollbar when the dropdown is closed.
            But should be visibile if allowedOverflow is true.
          </div> */}
          <div class={twMerge(`flex flex-wrap gap-[16px] p-[16px] pb-6 ${dropdownFiltersClassName || ''}`)}>
            {
              filters?.map(({label, width='full', rowClassName, ...filter}, i) => {
                // `filter.name` is a full path e.g. 'job.location', not just the key `location`
                const common = { className: '!mb-0', onChange: onInputChange  }
                return (
                  <div key={i} class={twMerge(getBasisWidth(width), rowClassName || '')}>
                    <div class="flex justify-between"> 
                      <label for={filter.id || filter.name}>{label || camelCaseToTitle(filter.name)}</label>
                      <a href="#" class="label font-normal text-secondary underline" onClick={(e) => reset(e, filter)}>Reset</a>
                    </div>
                    {
                      // Note: ignore typings for field, it has been sanitised in processState()
                      filter.type === 'select' 
                        ? <Elements.Select {...filter} {...common} value={state[filter.name] ?? ''} type={undefined} />
                        : filter.type === 'date' 
                          ? <Elements.Field {...filter} {...common} value={state[filter.name] as null ?? null} /> 
                          : <Elements.Field {...filter} {...common} value={state[filter.name] as string ?? ''} />
                    }
                  </div>
                )
              })
            }
          </div>
        </div>
      }
    >
      <Elements.Button 
        color="white" 
        IconLeft={<Elements.FilterIcon size={16} />} 
        {...buttonProps}
        className={twMerge(`flex gap-x-2.5 ${buttonProps?.className || ''}`)}
      >
        <span class="flex items-center gap-x-2.5">
          { buttonText || 'Filter By' }
          {
            !!count && 
            <span 
              class={twMerge(`inline-flex items-center justify-center rounded-full text-white bg-primary box-content w-[1em] h-[1em] p-[2px] ${buttonCounterClassName || ''}`)}
            >
              <span class="text-xs">{count}</span>
            </span>
          }
        </span>
      </Elements.Button>
    </Elements.Dropdown>
  )
}

Filters.displayName = 'Filters'

export function usePushChangesToPath(state: { [key: string]: unknown }) {
  // Return a debounced function which updates the query path using the state
  const navigate = useNavigate()
  const location = useLocation()
  const [debouncedPush] = useState(() => debounce(push, debounceTime))
  const stateRef = useRef(state)
  const locationRef = useRef(location)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    return () => debouncedPush.cancel()
  }, [])

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Update the URL by replacing the current entry in the history stack
  function push(includePagination?: boolean) {
    const queryStr = queryString(omit(stateRef.current, includePagination ? [] : ['page']))
    navigate(locationRef.current.pathname + queryStr, { replace: true })
  }

  return debouncedPush
}
