import { getCountryOptions, getCurrencyOptions, ucFirst } from '../../util.js'
import { CheckIcon } from '@heroicons/react/20/solid'
import { Input } from './form/input.jsx'
import { Drop } from './form/drop.jsx'
import { Select } from './form/select.jsx'
import { Dropdown } from './element/dropdown.jsx'
import { Button } from './element/button.jsx'
import { Checkbox } from './form/checkbox.jsx'
import { GithubLink } from './element/github-link.jsx'

export function Styleguide({ config }) {
  const [customerSearch, setCustomerSearch] = useState('')
  const [state, setState] = useState({
    address: '',
    country: 'us',
    currency: 'nzd', // can be commented too
    amount: 100,
    brandColor: '#F3CA5F',
    firstName: 'Tony',
    date: Date.now(),
    errors: [
      { title: 'address', detail: 'Address is required' },
      { title: 'currency', detail: 'Currency is required' },
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

  function onInputChange (e) {
    if ((e.target.id == 'customer' || e.target.id == 'customer2') && e.target.value == '') {
      setCustomerSearch('')
      e.target.value = null // clear the selected value
    }
    setState(s => ({ ...s, [e.target.id]: e.target.value }))
  }

  function onCustomerSearch (search) {
    setCustomerSearch(search || '')
  }

  return (
    <div class="mb-10 text-left max-w-[1100px]">
      <GithubLink filename={__filename} />
      <div class="mb-7">
        <h1 class="h1 m-0">Styleguide</h1>
      </div>

      <h2 class="h3">Links</h2>
      <div class="mb-8">
        <a class="mr-2" href="#">Default</a>
        <a class="underline1 is-active mr-2" href="#">Underline1</a>
        <a class="underline2 is-active mr-2" href="#">Underline2</a>
      </div>

      <h2 class="h3">Checkboxes</h2>
      <div class="grid grid-cols-3 gap-x-6">
        <div>
          <label for="input0">Label</label>
          <Checkbox name="input0" type="checkbox" text="Checkbox" subtext="some additional text here." defaultChecked />
        </div>
        <div>
          <label for="input1">Label</label>
          <Checkbox name="input1" type="radio" text="Radio 1" subtext="some additional text here 1." id="input1-1" class="!mb-0" 
            defaultChecked />
          <Checkbox name="input1" type="radio" text="Radio 2" subtext="some additional text here 2." id="input1-2" class="!mt-0" />
        </div>
        <div>
          <label for="input2">Label</label>
          <Checkbox name="input2" type="toggle" text="Toggle" subtext="some additional text here." defaultChecked />
        </div>
      </div>

      <h2 class="h3">Dropdowns</h2>
      <div class="flex flex-wrap gap-x-6 gap-y-4 mb-8">
        <div>
          <Dropdown options={options} minWidth="250px">
            <Button IconRight2="v" class="gap-x-3">Dropdown</Button>
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
      <div class="flex flex-wrap gap-x-6 gap-y-4 mb-8">
        <div><Button color="primary">primary (default)</Button></div>
        <div><Button color="secondary">secondary button</Button></div>
        <div><Button color="white">white button</Button></div>
        <div><Button color="primary-xs">*-xs button</Button></div>
        <div><Button color="primary-sm">*-sm button</Button></div>
        <div><Button color="primary-md">*-md (default)</Button></div>
        <div><Button color="primary-lg">*-lg button</Button></div>
        <div><Button IconLeft={<CheckIcon class="size-5 -my-5 -mx-0.5" />}>IconLeft=Element</Button></div>
        <div><Button IconRight="v">IconRight=&quot;v&quot;</Button></div>
        <div><Button IconRight2="v" className="w-[200px]">IconRight2=&quot;v&quot;</Button></div>
        <div><Button color="primary" isLoading>primary isLoading</Button></div>
      </div>

      <h2 class="h3">Selects</h2>
      <div class="grid grid-cols-3 lg:grid-cols-3 gap-x-6">
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
                label: <>
                  <b>New Customer</b>
                  {customerSearch ? <> / Add <b>{ucFirst(customerSearch)}</b></> : ''}
                </>, 
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
          <Input name="firstName" state={state} onChange={onInputChange} />
        </div>
        <div>
          <label for="email">Email Address</label>
          <Input name="email" type="email" placeholder="Your email address..."/>
        </div>
        <div>
          <div class="flex justify-between"> 
            <label for="password">Password</label>
            <a href="#" class="label">Forgot?</a>
          </div>
          <Input name="password" type="password"/>
        </div>
        <div>
          <label for="search">Search</label>
          <Input name="search" type="search" placeholder="Search..."/>
        </div>
        <div>
          <label for="filter">Filter</label>
          <Input name="filter" type="filter" />
        </div>
        <div>
          <label for="address">Input Error</label>
          <Input name="address" type="address" placeholder="Address..." state={state} onChange={onInputChange} />
        </div>
        {/* <div>
          <label for="date">Date</label>
          <Input name="date" type="date" prefix="Date:" state={state} onChange={onInputChange} />
        </div> */}
        <div>
          <label for="brandColor">Brand Color</label>
          <Input name="brandColor" type="color" state={state} onChange={onInputChange} />
        </div>
        <div>
          <label for="description">Description</label>
          <Input name="description" type="textarea" />
        </div>
        <div>
          <label for="amount">Amount ({state.amount})</label>
          <Input name="amount" type="currency" state={state} currency={state.currency || 'nzd'} onChange={onInputChange} config={config} />
        </div>
        <div>
          <label for="avatar">Avatar</label>
          <Drop class="is-small" name="avatar" state={state} onChange={onInputChange} awsUrl={config.awsUrl} />
        </div>
      </div>

    </div>
  )
}
