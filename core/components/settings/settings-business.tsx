//@ts-nocheck
// todo: finish tailwind conversio

////// look at the select type error below
import * as util from 'nitro-web/util'
import SvgTick from 'nitro-web/client/imgs/icons/tick.svg'
import { Button, Field, Select, Topbar, Tabbar, injectedConfig } from 'nitro-web'

export function SettingsBusiness() {
  const isLoading = useState(false)
  const [{ user }, setStore] = sharedStore.useTracked()
  const [state, setState] = useState(() => {
    const company = user.company
    return {
      business: {
        address: company.business.address?.full || '',
        country: company.business.country || 'nz',
        currency: company.business.currency || 'nzd',
        name: company.business.name || '',
        number: company.business.number || '',
        phone: company.business.phone || '',
        website: company.business.website || '',
      },
    }
  })

  async function onSubmit (e) {
    try {
      const company = await util.request(`put /api/company/${user.company._id}`, state, e, isLoading)
      setStore((s) => ({ ...s, user: { ...s.user, company }, message: 'Saved successfully 👍️' }))
    } catch (errors) {
      console.log(errors)
      return setState({ ...state, errors })
    }
  }

  return (
    <div>
      <Topbar 
        title={<>Settings</>} 
        submenu={
          <Tabbar class="is-underline" tabs={[
            { label: 'Business', path: '/settings/business' },
            { label: 'Team', path: '/settings/team' },
            { label: 'Account', path: '/settings/account' },
          ]} />
        }
        btns={
          <Button onClick={onSubmit} color="primary-sm" size="wide" IconLeft={SvgTick} isLoading={isLoading[0]}>
            Save Settings
          </Button>
        }
      />

      <div class="box p-box">
        <h3 class="h3">Business Settings</h3>

        <form class="form" onSubmit={onSubmit}>
          <div class="cols cols-6 cols-gap-3">
            <div class="col">
              <label for="business.country">Country</label>
              <Select
                // https://github.com/lipis/flag-icons
                name="business.country" 
                type="country" 
                state={state} 
                options={useMemo(() => util.getCountryOptions(injectedConfig.countries), [])} 
                onChange={onChange.bind(setState)}
              />
            </div>
            <div class="col">
              <label for="business.currency">Currency</label>
              <Select 
                name="business.currency" 
                type="country" 
                state={state} 
                options={useMemo(() => util.getCurrencyOptions(injectedConfig.currencies), [])}
                onChange={onChange.bind(setState)}
              />
            </div>
            <div class="col">
              <label for="business.name">Trading Name</label>
              <Field name="business.name" placeholder="E.g. Wayne Enterprises" state={state} onChange={onChange.bind(setState)} />
            </div>
            <div class="col">
              <Link to="#" class="label-right link2 underline2 is-active">Custom Address</Link>
              <label for="business.address">Address (Start Typing...)</label>
              <Field name="business.address.full" placeholder="" state={state} onChange={onChange.bind(setState)} />
            </div>
            <div class="col">
              <label for="business.website">Website</label>
              <Field name="business.website" placeholder="https://" state={state} onChange={onChange.bind(setState)} />
            </div>
            <div class="col">
              <label for="business.phone">Mobile Number</label>
              <Field name="business.phone" placeholder="" state={state} onChange={onChange.bind(setState)} />
            </div>
            <div class="col">
              <Link to="#" class="label-right link2 underline2 is-active">What&apos;s this for?</Link>
              <label for="tax.number">GST Number</label>
              <Field class="mb-0" name="tax.number" placeholder="Appears on your documents" state={state} 
                onChange={onChange.bind(setState)} />
            </div>
            <div class="col">
              <Link to="#" class="label-right link2 underline2 is-active">What&apos;s this for?</Link>
              <label for="business.number">NZBN</label>
              <Field class="mb-0" name="business.number" type="text" rows="23" placeholder="Appears on your documents" state={state} 
                onChange={onChange.bind(setState)} />
            </div>
          </div>
        </form>
      </div>

    </div>
  )
}

