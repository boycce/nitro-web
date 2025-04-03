import { Drop, Dropdown, Field, Select, Button, Checkbox, GithubLink, isDemo, Modal, Calendar } from 'nitro-web'
import { getCountryOptions, getCurrencyOptions, ucFirst } from 'nitro-web/util'
import { CheckIcon } from '@heroicons/react/20/solid'
import { Config } from 'types'

export function Styleguide({ config }: { config: Config }) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [showModal1, setShowModal1] = useState(false)
  const [state, setState] = useState({
    address: '',
    amount: 100,
    brandColor: '#F3CA5F',
    country: 'us',
    currency: 'nzd', // can be commented too
    date: Date.now(),
    'date-range': [Date.now(), Date.now() + 1000 * 60 * 60 * 24 * 33],
    calendar: [Date.now(), Date.now() + 1000 * 60 * 60 * 24 * 8],
    firstName: 'Bruce',
    errors: [
      { title: 'address', detail: 'Address is required' },
    ],
  })

  // Example of updating state
  // useEffect(() => {
  //   setTimeout(() => {
  //     setState({ ...state, amount: 123456, currency: 'usd', brandColor: '#8656ED' })
  //   }, 2000)
  // }, [])

  const options = [
    { label: 'Open customer preview' },
    { label: 'Add a payment', isSelected: true },
    { label: 'Email invoice' },
    { label: 'Download' },
    { label: 'Edit' },
    { label: 'Copy' },
    { label: 'Delete' },
  ]

  function onInputChange (e: { target: { id: string, value: unknown } }) {
    if ((e.target.id == 'customer' || e.target.id == 'customer2') && e.target.value == '') {
      setCustomerSearch('')
      e.target.value = null // clear the selected value
    }
    setState(s => ({ ...s, [e.target.id]: e.target.value }))
  }

  function onCustomerSearch (search: string) {
    setCustomerSearch(search || '')
  }

  return (
    <div class="mb-10 text-left max-w-[1100px]">
      <GithubLink filename={__filename} />
      <div class="mb-7">
        <h1 class="h1">{isDemo ? 'Design System' : 'Style Guide'}</h1>
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
            <Button type="white" IconRight2="v" class="gap-x-3">Dropdown bottom-right</Button>
          </Dropdown>
        </div>
        <div>
          <Dropdown options={options} dir="top-left" minWidth="250px">
            <Button type="white" IconRight2="v" class="gap-x-3">Dropdown top-left</Button>
          </Dropdown>
        </div>
      </div>

      <h2 class="h3">Buttons</h2>
      <div class="flex flex-wrap gap-x-6 gap-y-4 mb-10">
        <div><Button color="primary">primary (default)</Button></div>
        <div><Button color="secondary">secondary button</Button></div>
        <div><Button color="white">white button</Button></div>
        <div><Button color="primary" size="xs">*-xs button</Button></div>
        <div><Button color="primary" size="sm">*-sm button</Button></div>
        <div><Button color="primary">*-md (default)</Button></div>
        <div><Button color="primary" size="lg">*-lg button</Button></div>
        <div><Button IconLeft={<CheckIcon class="size-5 -my-5 -mx-0.5" />}>IconLeft=Element</Button></div>
        <div><Button IconRight="v">IconRight=&quot;v&quot;</Button></div>
        <div><Button IconRight2="v" className="w-[200px]">IconRight2=&quot;v&quot;</Button></div>
        <div><Button color="primary" IconRight="v" isLoading>primary isLoading</Button></div>
      </div>

      <h2 class="h3">Checkboxes</h2>
      <div class="grid grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="input2">Label</label>
          <Checkbox name="input2" type="toggle" text="Toggle sm" subtext="some additional text here." class="!mb-0"  defaultChecked />
          <Checkbox name="input3" type="toggle" text="Toggle md" size="md" subtext="some additional text here." />
        </div>
        <div>
          <label for="input1">Label</label>
          <Checkbox name="input1" type="radio" text="Radio 1" subtext="some additional text here 1." id="input1-1" class="!mb-0" 
            defaultChecked />
          <Checkbox name="input1" type="radio" text="Radio 2" subtext="some additional text here 2." id="input1-2" class="!mt-0" />
        </div>
        <div>
          <label for="input0">Label</label>
          <Checkbox name="input0" type="checkbox" text="Checkbox" subtext="some additional text here." defaultChecked />
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
            options={[
              { value: 'edit', label: 'Edit' },
              { value: 'delete', label: 'Delete' },
            ]}
          />
        </div>
        <div>
          <label for="multi">Mutli Select</label>
          <Select 
            name="multi"
            isMulti={true}
            options={[
              { value: 'blue', label: 'Blue' },
              { value: 'green', label: 'Green' },
              { value: 'yellow', label: 'Yellow' },
            ]}
          />
        </div>
        <div>
          <label for="country">Countries</label>
          <Select
            // https://github.com/lipis/flag-icons
            name="country" 
            type="country" 
            state={state} 
            options={useMemo(() => getCountryOptions(config.countries), [])} 
            onChange={onInputChange}
          />
        </div>
        <div>
          <label for="customer">List Item with Action</label>
          <Select
            // menuIsOpen={true}
            placeholder="Select or add customer..."
            name="customer" 
            type="customer"
            state={state}
            onChange={onInputChange}
            onInputChange={onCustomerSearch}
            options={[ 
              { 
                className: 'bb', 
                fixed: true,
                value: '', 
                label: (
                  <>
                    <b>New Customer</b>
                    {customerSearch ? <> / Add <b>{ucFirst(customerSearch)}</b></> : ''}
                  </>
                ), 
              },
              { value: '1', label: 'Iron Man Industries' },
              { value: '2', label: 'Captain America' },
              { value: '3', label: 'Thor Limited' },
            ]} 
          />
        </div>
        <div>
          <label for="currency">Currencies (Error)</label>
          <Select 
            name="currency"
            state={state} 
            options={useMemo(() => getCurrencyOptions(config.currencies), [])} 
            onChange={onInputChange}
          />
        </div>
      </div>

      <h2 class="h3">Inputs</h2>
      <div class="grid grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="firstName">First Name</label>
          <Field name="firstName" state={state} onChange={onInputChange} />
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
          <label for="search">Search</label>
          <Field name="search" type="search" placeholder="Search..." />
        </div>
        <div>
          <label for="filter">Filter by Code</label>
          <Field name="filter" type="filter" iconPos="left"  />
        </div>
        <div>
          <label for="address">Input Error</label>
          <Field name="address" placeholder="Address..." state={state} onChange={onInputChange} />
        </div>
        <div>
          <label for="description">Description</label>
          <Field name="description" type="textarea" rows={2} />
        </div>
        <div>
          <label for="brandColor">Brand Color</label>
          <Field name="brandColor" type="color" state={state} iconPos="left" onChange={onInputChange} />
        </div>
        <div>
          <label for="amount">Amount ({state.amount})</label>
          <Field name="amount" type="currency" state={state} currency={state.currency || 'nzd'} onChange={onInputChange} config={config} />
        </div>
      </div>

      <h2 class="h3">Date Inputs</h2>
      <div class="grid grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="date">Date</label>
          <Field name="date" type="date" state={state} onChange={onInputChange} />
        </div>
        <div>
          <label for="date-range">Date range with prefix</label>
          <Field name="date-range" type="date" mode="range" prefix="Date:" state={state} onChange={onInputChange} />
        </div>
      </div>

      <h2 class="h3">File Inputs & Calendar</h2>
      <div class="grid grid-cols-3 gap-x-6 mb-4">
        <div>
          <label for="avatar">Avatar</label>
          <Drop class="is-small" name="avatar" state={state} onChange={onInputChange} awsUrl={config.awsUrl} />
        </div>
        <div>
          <label for="calendar">Calendar</label>
          <Calendar mode="range" value={state.calendar} numberOfMonths={1} onChange={(mode, value) => {
            onInputChange({ target: { id: 'calendar', value: value } })
          }} />
        </div>
      </div>

      <Modal show={showModal1} setShow={setShowModal1} class="p-9">
        <h3 class="h3">Edit Profile</h3>
        <p class="mb-5">An example modal containing a basic form for editing profiles.</p>
        <form class="mb-8 text-left">
          <div>
            <label for="firstName2">First Name</label>
            <Field name="firstName2" state={state} onChange={onInputChange} />
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
    </div>
  )
}
