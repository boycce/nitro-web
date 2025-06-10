import { forwardRef, Dispatch, SetStateAction, useRef, useEffect, useImperativeHandle } from 'react'
import { Button, Dropdown, Field, Select, twMerge } from 'nitro-web'
import { camelCaseToTitle, debounce, omit, queryString, queryObject } from 'nitro-web/util'
import { ListFilterIcon } from 'lucide-react'

export type FilterType = {
  name: string
  type: 'text'|'date'|'search'|'select'
  label?: string
  enums?: { label: string, value: string }[]
  placeholder?: string
}

type FilterState = {
  [key: string]: string | true
}

type FiltersProps = {
  filters?: FilterType[]
  state: FilterState
  setState: Dispatch<SetStateAction<FilterState>>
  elements?: {
    Button?: typeof Button
    Dropdown?: typeof Dropdown
    Field?: typeof Field
    Select?: typeof Select
    FilterIcon?: typeof ListFilterIcon
  }
  dropdownProps?: Partial<React.ComponentProps<typeof Dropdown>>
  buttonProps?: Partial<React.ComponentProps<typeof Button>>
  buttonClassName?: string
  buttonText?: string
  buttonCounterClassName?: string
}

export type FiltersHandleType = {
  submit: (includePagination?: boolean) => void
}

export const Filters = forwardRef<FiltersHandleType, FiltersProps>(({ 
  filters, state, setState, elements, dropdownProps, buttonProps, buttonClassName, buttonText, buttonCounterClassName,
}, ref) => {
  const location = useLocation()
  const stateRef = useRef(state)
  const [debouncedSubmit] = useState(() => debounce(submit, 150))
  const count = Object.keys(state).length - (Object.keys(state).includes('page') ? 1 : 0)
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
    setState(() => ({
      ...queryObject(location.search),
    }))
  }, [location.search])

  function reset(e: React.MouseEvent<HTMLAnchorElement>, filter: FilterType) {
    e.preventDefault()
    setState((s) => omit(s, [filter.name]) as FilterState)
    debouncedSubmit()
  }

  function resetAll(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    setState((s) => ({
      ...(s.page ? { page: s.page } : {}), // keep pagination
    } as FilterState))
    debouncedSubmit()
  }

  async function _onChange(e: {target: {name: string, value: unknown}}) {
    await onChange(setState, e)
    debouncedSubmit()
  }

  // Submit the filters and update the URL
  function submit(includePagination?: boolean) {
    const queryStr = queryString(omit(stateRef.current, includePagination ? [] : ['page']))
    history.pushState(null, '', location.pathname + queryStr)
  }

  if (!filters) return null
  return (
    <Elements.Dropdown 
      dir="bottom-right"
      // menuIsOpen={true}
      menuClassName="!rounded-lg"
      menuContent={
        <div class="w-[330px]">
          <div class="flex justify-between items-center border-b p-4 py-3.5">
            <div class="text-lg font-semibold">Filters</div>
            <Button color="clear" size="sm" onClick={resetAll}>Reset All</Button>
          </div>
          <div class="flex flex-col px-4 py-4 mb-[-6px]">
            {
              filters.map((filter) => (
                <div key={filter.name}>
                  <div class="flex justify-between"> 
                    <label for={filter.name}>{filter.label || camelCaseToTitle(filter.name)}</label>
                    <a href="#" class="label font-normal text-secondary underline" onClick={(e) => reset(e, filter)}>Reset</a>
                  </div>
                  {
                    (filter.type === 'text' || filter.type === 'search') &&
                    <Elements.Field 
                      class="mb-4"
                      name={filter.name}
                      type={filter.type}
                      placeholder={filter.placeholder} 
                      state={state} 
                      onChange={_onChange}
                    />
                  }
                  {
                    filter.type === 'date' &&
                    <Elements.Field
                      class="mb-4"
                      name={filter.name}
                      type="date"
                      mode="range"
                      state={state}
                      onChange={_onChange}
                      placeholder={filter.placeholder || 'Select range...'}
                    />
                  }
                  {
                    filter.type === 'select' &&
                    <Elements.Select
                      class="mb-4"
                      name={filter.name} 
                      type="country" 
                      state={state} 
                      options={filter.enums || []} 
                      onChange={_onChange}
                      placeholder={filter.placeholder}
                    />
                  }
                </div>
              ))
            }
          </div>
        </div>
      }
      {...dropdownProps}
    >
      <Elements.Button 
        color="white" 
        IconLeft={<Elements.FilterIcon size={16} />} 
        className={twMerge(`flex gap-x-2.5 ${buttonClassName || ''}`)}
        {...buttonProps}
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