import { forwardRef, Dispatch, SetStateAction, useRef, useEffect, useImperativeHandle } from 'react'
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
  [key: string]: string | true
}

type FiltersProps = {
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

export type FiltersHandleType = {
  submit: (includePagination?: boolean) => void
}

const debounceTime = 250

export const Filters = forwardRef<FiltersHandleType, FiltersProps>(({ 
  filters, 
  setState: setState2,
  state: state2,
  buttonProps,
  buttonCounterClassName,
  buttonText, 
  dropdownProps, 
  dropdownFiltersClassName,
  elements,
}, ref) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [lastUpdated, setLastUpdated] = useState(0)
  const [debouncedSubmit] = useState(() => debounce(submit, debounceTime))
  const [state3, setState3] = useState(() => ({ ...queryObject(location.search) }))
  const [state, setState] = [state2 || state3, setState2 || setState3]
  const stateRef = useRef(state)
  const locationRef = useRef(location)
  const count = useMemo(() => Object.keys(state).filter((k) => state[k] && filters?.some((f) => f.name === k)).length, [state, filters])

  const Elements = {
    Button: elements?.Button || Button,
    Dropdown: elements?.Dropdown || Dropdown,
    Field: elements?.Field || Field,
    Select: elements?.Select || Select,
    FilterIcon: elements?.FilterIcon || ListFilterIcon,
  }

  useImperativeHandle(ref, () => ({
    submit: debouncedSubmit,
  }))
  
  useEffect(() => {
    return () => debouncedSubmit.cancel()
  }, [])
  
  useEffect(() => {
    stateRef.current = state
  }, [state])
  
  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    // Only update the state if the filters haven't been input changed in the last 500ms
    if (Date.now() - lastUpdated > (debounceTime + 250)) {
      setState(() => ({
        ...queryObject(location.search),
      }))
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
    setState((s) => ({ ...s, [e.target.name]: e.target.value as string })) 
    onAfterChange()
  }

  function onAfterChange() {
    setLastUpdated(Date.now())
    debouncedSubmit()
  }

  // Update the URL by replacing the current entry in the history stack
  function submit(includePagination?: boolean) {
    const queryStr = queryString(omit(stateRef.current, includePagination ? [] : ['page']))
    navigate(locationRef.current.pathname + queryStr, { replace: true })
  }
  
  function getBasisWidth(width: 'full' | 'half' | 'third' | 'quarter' | 'fifth') {
    // Need to splay out the classnames for tailwind to work
    if (width == 'full') return 'w-full'
    else if (width == 'half') return 'shrink basis-[calc(50%-8px)]'
    else if (width == 'third') return 'shrink basis-[calc(33.33%-8px)]'
    else if (width == 'quarter') return 'shrink basis-[calc(25%-8px)]'
    else if (width == 'fifth') return 'shrink basis-[calc(20%-8px)]'
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
              filters?.map(({label, width='full', rowClassName, ...filter}, i) => (
                <div key={i} class={twMerge(getBasisWidth(width), rowClassName || '')}>
                  <div class="flex justify-between"> 
                    <label for={filter.id || filter.name}>{label || camelCaseToTitle(filter.name)}</label>
                    <a href="#" class="label font-normal text-secondary underline" onClick={(e) => reset(e, filter)}>Reset</a>
                  </div>
                  {
                    filter.type === 'select' && 
                    <Elements.Select
                      {...filter}
                      class="!mb-0"
                      // `filter.name` is a full path e.g. 'job.location', not just the key `location`
                      value={typeof state[filter.name] === 'undefined' ? '' : state[filter.name]} 
                      onChange={onInputChange}
                      type={undefined}
                    />
                  }
                  {
                    filter.type !== 'select' && 
                    <Elements.Field 
                      {...filter}
                      class="!mb-0"
                      // `filter.name` is a full path e.g. 'job.location', not just the key `location`
                      value={typeof state[filter.name] === 'undefined' ? '' : state[filter.name] as string} 
                      onChange={onInputChange}
                    />
                  }
                </div>
              ))
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
})

Filters.displayName = 'Filters'