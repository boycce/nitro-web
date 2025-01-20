import * as util from '../../util.js'
import { Topbar } from '../partials/element/topbar.jsx'
import { Input } from '../partials/form/input.jsx'
import { Button } from '../partials/element/button.jsx'
import { FormError } from '../partials/form/form-error.jsx'

export function Signup({ config }) {
  const navigate = useNavigate()
  const isLoading = useState('')
  const [, setStore] = sharedStore.useTracked()
  const [state, setState] = useState({
    email: config.env === 'development' ? config.testEmail : '',
    name: config.env === 'development' ? 'Bruce Wayne' : '',
    business: { name: config.env === 'development' ? 'Wayne Enterprises' : '' },
    password: config.env === 'development' ? '1234' : '',
  })

  async function onSubmit (e) {
    try {
      const data = await util.request(e, 'post /api/signup', state, isLoading)
      isLoading[1]('is-loading')
      setStore(() => data)
      setTimeout(() => navigate('/'), 0) // wait for setStore
    } catch (errors) {
      return setState({ ...state, errors })
    }
  }
  
  return (
    <div class="">
      <Topbar title={<>Start your 21 day Free Trial</>} />

      <form onSubmit={onSubmit}>
        <div class="grid grid-cols-2 gap-6">  
          <div>
            <label for="name">Your Name</label>
            <Input name="name" placeholder="E.g. Tony Stark" state={state} onChange={onChange(setState)} />
          </div>
          <div>
            <label for="business.name">Company Name</label>
            <Input name="business.name" placeholder="E.g. Stark Industries" state={state} onChange={onChange(setState)} />
          </div>
        </div>
        <div>
          <label for="email">Email Address</label>
          <Input name="email" type="email" state={state} onChange={onChange(setState)} placeholder="Your email address..." />
        </div>
        <div>
          <label for="password">Password</label>
          <Input name="password" type="password" state={state} onChange={onChange(setState)}/>
        </div>
        
        <div class="mb-14">
          Already have an account? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} class="pt-2" />
        </div>

        <Button class="w-full" isLoading={isLoading[0]} type="submit">Create Account</Button>
      </form>
    </div>
  )
}
