import { 
  Drop, Dropdown, Field, Select, Button as ButtonNitro, Checkbox, GithubLink, Modal, Calendar, injectedConfig, 
  Filters, FiltersHandleType, FilterType, Table, TableColumn,
} from 'nitro-web'
import { date, getCountryOptions, getCurrencyOptions, onChange, ucFirst } from 'nitro-web/util'
import { Check, EllipsisVerticalIcon, FileEditIcon } from 'lucide-react'

const perPage = 10
const statusColors = function(status: string) {
  return {
    pending: 'bg-yellow-400',
    approved: 'bg-green-400',
    rejected: 'bg-red-400',
  }[status]
}

type StyleguideProps = {
  className?: string
  elements?: { Button?: typeof ButtonNitro }
  children?: React.ReactNode
  currencies?: { [key: string]: { name: string, symbol: string, digits: number } }
}

type QuoteExample = {
  _id?: string
  freightType: string
  destination: { code: string }
  date: number
  weight: number
  status: string
}

export function Styleguide({ className, elements, children, currencies }: StyleguideProps) {
  const Button = elements?.Button || ButtonNitro
  const [, setStore] = useTracked()
  const [customerSearch, setCustomerSearch] = useState('')
  const [showModal1, setShowModal1] = useState(false)
  const [state, setState] = useState({
    address: '',
    amount: 100,
    brandColor: '#F3CA5F',
    colorsMulti: ['blue', 'green'],
    country: 'nz',
    currency: 'nzd',
    date: Date.now(),
    'date-range': [Date.now(), Date.now() + 1000 * 60 * 60 * 24 * 33],
    'date-time': Date.now(),
    calendar: [Date.now(), Date.now() + 1000 * 60 * 60 * 24 * 8],
    firstName: 'Bruce',
    tableFilter: '',
    errors: [
      { title: 'address', detail: 'Address is required' },
    ],
  })

  const [filterState, setFilterState] = useState({})
  const filtersRef = useRef<FiltersHandleType>(null)
  const filters = useMemo(() => {
    const filters: FilterType[] = [
      { 
        type: 'date',
        name: 'dateRange',
        mode: 'range',
        placeholder: 'Select a range...',
      },
      {
        type: 'search',
        name: 'search',
        label: 'Keyword Search',
        placeholder: 'Job, employee name...',
      },
      {
        type: 'select',
        name: 'status',
        rowClassName: 'flex-1',
        options: [
          { label: 'Pending', value: 'pending' }, 
          { label: 'Approved', value: 'approved' }, 
          { label: 'Rejected', value: 'rejected' },
        ],
      },
      {
        type: 'color',
        name: 'color',
        label: 'Half column',
        placeholder: 'Select color...',
        rowClassName: 'flex-1',
      },
    ]
    return filters
  }, [])

  const options = useMemo(() => [
    { label: 'Open customer preview' },
    { label: 'Add a payment', isSelected: true },
    { label: 'Email invoice' },
    { label: 'Download' },
    { label: 'Edit' },
    { label: 'Copy' },
    { label: 'Delete' },
  ], [])

  const thead: TableColumn[] = useMemo(() => [
    { value: 'freightType', label: 'Freight Type' },
    { value: 'destination.code', label: 'Destination Code' },
    { value: 'date', label: 'Date' },
    { value: 'weight', label: 'Weight', align: 'center' },
    { value: 'status', label: 'Status' },
    { value: 'actions', label: 'Actions', disableSort: true, overflow: true, minWidth: 100, align: 'right' },
  ], [])

  const rows: QuoteExample[] = useMemo(() => [
    { _id: '1', freightType: 'air', destination: { code: 'nz' }, date: new Date().getTime(), weight: 100, status: 'pending' },
    { _id: '2', freightType: 'sea', destination: { code: 'nz' }, date: new Date().getTime(), weight: 200, status: 'approved' },
    { _id: '3', freightType: 'road', destination: { code: 'au' }, date: new Date().getTime(), weight: 300, status: 'rejected' },
    // normally you should filter the rows on the api using the query string
  ].filter((row) => row.freightType.match(new RegExp(state.tableFilter, 'i'))), [state.tableFilter])

  const onCustomerInputChange = (e: { target: { name: string, value: unknown } }) => {
    if (e.target.name == 'customer' && e.target.value == '0') {
      setCustomerSearch('')
      e.target.value = null // clear the select's selected value
      setTimeout(() => alert('Adding new customer...'), 0)
    }
    onChange(setState, e)
  }

  const onCustomerSearch = (search: string) => {
    setCustomerSearch(search || '')
  }

  const generateCheckboxActions = useCallback((selectedRowIds: string[]) => {
    return <div class='flex items-center gap-x-2'>
      <Button size='xs' color='dark' onClick={() => { console.log('set', selectedRowIds) }}>Set Status</Button>
      <Button size='xs' color='dark' onClick={() => { console.log('remove', selectedRowIds) }}>Delete</Button>
    </div>
  }, [])

  const generateTd = useCallback((col: TableColumn, row: QuoteExample, i: number) => {
    switch (col.value) {
      case 'freightType':
        return <div>{ucFirst(row.freightType)}</div>
      case 'destination.code':
        return <div>{row.destination.code.toUpperCase()}</div>
      case 'date':
        return <div>{date(row.date, 'dd mmm, yyyy')}</div>
      case 'weight':
        return <div>{row.weight}</div>
      case 'status':  
        return <div>{ucFirst(row.status)}</div>
      case 'actions':
        return (
          <Dropdown 
            options={[{ label: 'Set Status' }, { label: 'Delete' }]} 
            dir={rows.slice(0, perPage).length - 3 < i ? 'top-right' : 'bottom-right'} 
            minWidth={100}
          >
            <Button color='clear' className='ring-0' size='sm' IconCenter={<EllipsisVerticalIcon size={18} strokeWidth={1.5} />}  />
          </Dropdown>
        )
      default:
        console.error(`Error: unexpected thead value: ${col.value}`)
        return null
    }
  }, [rows.length])

  // Example of updating state
  // useEffect(() => {
  //   setTimeout(() => {
  //     setState({ ...state, amount: 123456, currency: 'usd', brandColor: '#8656ED' })
  //   }, 2000)
  // }, [])

  return (
    <div class={`text-left max-w-[1100px] ${className}`}>
      <Modal show={showModal1} setShow={setShowModal1}>
        <h3 class="h3">Edit Profile</h3>
        <p class="mb-5">An example modal containing a basic form for editing profiles.</p>
        <form class="mb-8 text-left">
          <div>
            <label for="firstName2">First Name</label>
            <Field name="firstName2" state={state} onChange={(e) => onChange(setState, e)} />
          </div>
          <div>
            <label for="email2">Email Address</label>
            <Field name="email2" type="email" placeholder="Your email address..."/>
          </div>
        </form>
        <div class="flex justify-end">
          <Button color="primary" onClick={() => setShowModal1(false)}>Save</Button>
        </div>
      </Modal>

      <GithubLink filename={__filename} />
      <div class="mb-7">
        <h1 class="h1">{injectedConfig.isDemo ? 'Design System' : 'Style Guide'}</h1>
        <p>
          Components are styled using&nbsp;
          <a href="https://v3.tailwindcss.com/docs/configuration" class="underline" target="_blank" rel="noreferrer">TailwindCSS</a>. 
        </p>
      </div>

      <h2 class="h3">Links</h2>
      <div class="mb-10">
        <a class="mr-2" href="#">Default</a>
        <a class="underline1 is-active mr-2" href="#">Underline1</a>
        <a class="underline2 is-active mr-2" href="#">Underline2</a>
      </div>

      <h2 class="h3">Modals</h2>
      <div class="flex flex-wrap gap-x-6 gap-y-4 mb-10">
        <div><Button color="primary" onClick={() => setShowModal1(true)}>Modal (default)</Button></div>
      </div>

      <h2 class="h3">Dropdowns</h2>
      <div class="flex flex-wrap gap-x-6 gap-y-4 mb-10">
        <div>
          <Dropdown options={options} minWidth="250px">
            <Button IconRight="v" class="gap-x-3">Dropdown</Button>
          </Dropdown>
        </div>
        <div>
          <Dropdown 
            // menuIsOpen={true}
            dir="bottom-right"
            minWidth="330px" 
            options={[{ label: <><b>New Customer</b> / Add <b>Bruce Lee</b></>, className: 'border-bottom-with-space' }, ...options]}
          >
            <Button color="white" IconRight="v" class="gap-x-3">Dropdown bottom-right</Button>
          </Dropdown>
        </div>
        <div>
          <Dropdown options={options} dir="top-left" minWidth="250px">
            <Button color="white" IconRight="v" class="gap-x-3">Dropdown top-left</Button>
          </Dropdown>
        </div>
      </div>

      <h2 class="h3">Filters</h2>
      <div class="flex flex-wrap gap-x-6 gap-y-4 mb-10">
        {/* Filter dropdown */}
        <Filters 
          ref={filtersRef} 
          filters={filters} 
          state={filterState} 
          setState={setFilterState}
          dropdownProps={{ dir: 'bottom-left' }}
          elements={{ Button: Button }}
        />
        {/* Search bar */}
        <Field
          class="!my-0 min-w-[242px]" 
          type="search" 
          name="search"
          id="search2"
          iconPos="left" 
          state={filterState}
          onChange={(e) => {
            onChange(setFilterState, e)
            filtersRef.current?.submit()
          }}
          placeholder="Linked search bar..."
        />
      </div>

      <h2 class="h3">Buttons</h2>
      <div class="flex flex-wrap gap-x-6 gap-y-4 mb-10">
        <div><Button color="primary">primary (default)</Button></div>
        <div><Button color="secondary">secondary button</Button></div>
        <div><Button color="black">black button</Button></div>
        <div><Button color="dark">dark button</Button></div>
        <div><Button color="white">white button</Button></div>
        <div><Button color="clear">clear button</Button></div>
        <div><Button color="primary" size="xs">*-xs button</Button></div>
        <div><Button color="primary" size="sm">*-sm button</Button></div>
        <div><Button color="primary">*-md (default)</Button></div>
        <div><Button color="primary" size="lg">*-lg button</Button></div>
        <div><Button IconLeft={<Check size={19} className="-my-5" />}>IconLeft</Button></div>
        <div><Button IconLeft={<Check size={19} className="-my-5" />} 
          className="w-[160px]">IconLeft 160px</Button></div>
        <div><Button IconLeftEnd={<Check size={19} className="-my-5" />} 
          className="w-[190px]">IconLeftEnd 190px</Button></div>
        <div><Button IconRight="v">IconRight</Button></div>
        <div><Button IconRightEnd="v" className="w-[190px]">IconRightEnd 190px</Button></div>
        <div><Button color="primary" IconRight="v" isLoading>primary isLoading</Button></div>
        <div><Button IconCenter={<FileEditIcon size={18}/>}></Button></div>
        <div><Button size="sm" IconCenter={<FileEditIcon size={16}/>}></Button></div>
        <div><Button size="xs" IconCenter={<FileEditIcon size={14}/>}></Button></div>
      </div>

      <h2 class="h3">Varients</h2>
      <div class="grid grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="input2">Toggles</label>
          <Checkbox name="input2" type="toggle" text="Toggle sm" subtext="some additional text here." class="!mb-0" 
            state={state} onChange={(e) => onChange(setState, e)} />
          <Checkbox name="input3" type="toggle" text="Toggle 22px" subtext="some additional text here." size={22} />
        </div>
        <div>
          <label for="input1">Radios</label>
          <Checkbox name="input1" type="radio" text="Radio" subtext="some additional text here 1." id="input1-1" class="!mb-0" 
            defaultChecked />
          <Checkbox name="input1" type="radio" text="Radio 16px" subtext="some additional text here 2." id="input1-2"  size={16} />
        </div>
        <div>
          <label for="input0">Checkboxes</label>
          <Checkbox name="input0" type="checkbox" text="Checkbox" subtext="some additional text here."  class="!mb-0" defaultChecked />
          <Checkbox name="input0.1" type="checkbox" text="Checkbox 16px" size={16}
            subtext="some additional text here which is a bit longer that will be line-wrap to the next line." />
        </div>
      </div>

      <h2 class="h3">Selects</h2>
      <div class="grid grid-cols-3 lg:grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="action">Default</label>
          <Select 
            // menuIsOpen={true}
            name="action"
            isSearchable={false}
            options={useMemo(() => [
              { value: 'edit', label: 'Edit' },
              { value: 'delete', label: 'Delete' },
            ], [])}
          />
        </div>
        <div>
          <label for="colorsMulti">Mutli Select</label>
          <Select 
            name="colorsMulti"
            isMulti={true}
            state={state}
            options={useMemo(() => [
              { value: 'blue', label: 'Blue' },
              { value: 'green', label: 'Green' },
              { value: 'yellow', label: 'Yellow' },
              { value: 'red', label: 'Red' },
              { value: 'orange', label: 'Orange' },
              { value: 'purple', label: 'Purple' },
              { value: 'pink', label: 'Pink' },
              { value: 'gray', label: 'Gray' },
              { value: 'black', label: 'Black' },
              { value: 'white', label: 'White' },
            ], [])}
            onChange={(e) => onChange(setState, e)}
          />
        </div>
        <div>
          <label for="country">Countries</label>
          <Select
            // https://github.com/lipis/flag-icons
            name="country" 
            mode="country"
            state={state} 
            options={useMemo(() => [{ value: 'nz', label: 'New Zealand' }, { value: 'au', label: 'Australia' }], [])} 
            onChange={(e) => onChange(setState, e)}
          />
        </div>
        <div>
          <label for="customer">List Item with Action</label>
          <Select
            // menuIsOpen={true}
            placeholder="Select or add customer..."
            name="customer" 
            mode="customer"
            state={state}
            onChange={onCustomerInputChange}
            onInputChange={onCustomerSearch}
            options={useMemo(() => [ 
              { 
                className: 'bb', 
                fixed: true,
                value: '0',
                label: (
                  <>
                    <b>New Customer</b> (and clear select)
                    {customerSearch ? <> / Add <b>{ucFirst(customerSearch)}</b></> : ''}
                  </>
                ), 
              },
              { value: '1', label: 'Iron Man Industries' },
              { value: '2', label: 'Captain America' },
              { value: '3', label: 'Thor Limited' },
            ], [customerSearch])}
          />
        </div>
        <div>
          <label for="currency">Currencies</label>
          <Select 
            name="currency"
            state={state} 
            options={useMemo(() => (currencies ? getCurrencyOptions(currencies) : [{ value: 'nzd', label: 'New Zealand Dollar' }, { value: 'aud', label: 'Australian Dollar' }]), [])} 
            onChange={(e) => onChange(setState, e)}
          />
        </div>
      </div>

      <h2 class="h3">Inputs</h2>
      <div class="grid grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="firstName">First Name</label>
          <Field name="firstName" state={state} onChange={(e) => onChange(setState, e)} />
        </div>
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" placeholder="Your email address..."/>
        </div>
        <div>
          <div class="flex justify-between"> 
            <label for="password">Password</label>
            <a href="#" class="label">Forgot?</a>
          </div>
          <Field name="password" type="password"/>
        </div>
        <div>
          <label for="search3">Search</label>
          <Field name="search" id="search3" type="search" placeholder="Search..." />
        </div>
        <div>
          <label for="filter">Filter by Code</label>
          <Field name="filter" type="filter" iconPos="left"  />
        </div>
        <div>
          <label for="address">Input Error</label>
          <Field name="address" placeholder="Address..." state={state} onChange={(e) => onChange(setState, e)} />
        </div>
        <div>
          <label for="description">Description</label>
          <Field name="description" type="textarea" rows={2} />
        </div>
        <div>
          <label for="brandColor">Brand Color</label>
          <Field name="brandColor" type="color" iconPos="left" state={state} onChange={(e) => onChange(setState, e)} />
        </div>
        <div>
          <label for="amount">Amount ({state.amount})</label>
          <Field 
            name="amount" type="currency" state={state} currency={state.currency || 'nzd'} onChange={(e) => onChange(setState, e)} 
            // Example of using a custom format and currencies, e.g. 
            format={'¤#,##0.00'} 
            currencies={currencies} 
          />
        </div>
      </div>

      <h2 class="h3">Date Inputs</h2>
      <div class="grid grid-cols-1 gap-x-6 mb-4 sm:grid-cols-3">
        <div>
          <label for="date">Date with time</label>
          <Field name="date-time" type="date" mode="single" showTime={true} state={state} onChange={(e) => onChange(setState, e)} />
        </div>
        <div>
          <label for="date-range">Date range with prefix</label>
          <Field name="date-range" type="date" mode="range" prefix="Date:" state={state} onChange={(e) => onChange(setState, e)} />
        </div>
        <div>
          <label for="date">Date multi-select (right aligned)</label>
          <Field name="date" type="date" mode="multiple" state={state} onChange={(e) => onChange(setState, e)} dir="bottom-right" />
        </div>
      </div>

      <h2 class="h3">File Inputs & Calendar</h2>
      <div class="grid grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="avatar">Avatar</label>
          <Drop class="is-small" name="avatar" state={state} onChange={(e) => onChange(setState, e)} awsUrl={injectedConfig.awsUrl} />
        </div>
        <div>
          <label for="calendar">Calendar</label>
          <Calendar mode="range" value={state.calendar} numberOfMonths={1} 
            onChange={(mode, value) => {
              onChange(setState, { target: { name: 'calendar', value: value } })
            }} 
          />
        </div>
      </div>

      <div class="flex justify-between items-start">
        <h2 class="h3">Tables</h2>
        <Field 
          name="tableFilter"
          type="search"
          state={state}
          placeholder="Basic table filter..."
          onChange={(e) => onChange(setState, e)} 
          className="!my-0 [&>input]:font-normal [&>input]:text-xs [&>input]:py-1.5" /////todo: need to allow twmerge here
        />
      </div>
      <div class="grid mb-4 last:mb-0">
        <Table
          rows={rows.slice(0, perPage)}
          columns={thead}
          rowSideColor={(row) => ({ className: row?.status == 'pending' ? 'bg-yellow-400' : '', width: 5 })}
          generateCheckboxActions={generateCheckboxActions}
          generateTd={generateTd}
          className="mb-6"
        />
        <Table
          rows={rows.slice(0, 2).map(row => ({ ...row, _id: row._id + '1' }))}
          columns={thead}
          rowLinesMax={1}
          headerHeightMin={35}
          rowGap={8}
          rowHeightMin={42}
          rowSideColor={(row) => ({ className: `rounded-l-xl ${statusColors(row?.status as string)}`, width: 10 })}
          rowOnClick={useCallback((row: QuoteExample) => {setStore(s => ({ ...s, message: `Row ${row?._id} clicked` }))}, [setStore])}
          generateCheckboxActions={generateCheckboxActions}
          generateTd={generateTd}
          className="mb-5"
          tableClassName="rounded-3px"
          rowClassName="[&:hover>div]:bg-gray-50"
          columnClassName="border-t-1 first:rounded-l-xl last:rounded-r-xl"
          columnSelectedClassName="bg-gray-50 border-indigo-300"
          columnHeaderClassName="text-gray-500 text-2xs uppercase border-none"
          checkboxClassName="rounded-[2px] shadow-none"
        />
      </div>

      {children}
    </div>
  )
}
