import { Button, Field, FormError, Topbar, util, injectedConfig } from 'nitro-web'
import { Errors } from 'nitro-web/types'

export function Signup() {
  const navigate = useNavigate()
  const isLoading = useState('')
  const [, setStore] = useTracked()
  const [state, setState] = useState({
    email: injectedConfig.env === 'development' ? (injectedConfig.placeholderEmail || '') : '',
    name: injectedConfig.env === 'development' ? 'Bruce Wayne' : '',
    business: { name: injectedConfig.env === 'development' ? 'Wayne Enterprises' : '' },
    password: injectedConfig.env === 'development' ? '1234' : '',
    errors: [] as Errors,
  })

  async function onSubmit (e: React.FormEvent<HTMLFormElement>) {
    try {
      const data = await util.request(e, 'post /api/signup', state, isLoading)
      isLoading[1]('is-loading')
      setStore(() => data)
      setTimeout(() => navigate('/'), 0) // wait for setStore
    } catch (e) {
      return setState({ ...state, errors: e as Errors })
    }
  }
  
  return (
    <div class="">
      <Topbar title={<>Start your 21 day Free Trial</>} />

      <form onSubmit={onSubmit}>
        <div class="grid grid-cols-2 gap-6">  
          <div>
            <label for="name">Your Name</label>
            <Field name="name" placeholder="E.g. Bruce Wayne" state={state} onChange={onChange.bind(setState)} />
          </div>
          <div>
            <label for="business.name">Company Name</label>
            <Field name="business.name" placeholder="E.g. Wayne Enterprises" state={state} onChange={onChange.bind(setState)} />
          </div>
        </div>
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" state={state} onChange={onChange.bind(setState)} placeholder="Your email address..." />
        </div>
        <div>
          <label for="password">Password</label>
          <Field name="password" type="password" state={state} onChange={onChange.bind(setState)}/>
        </div>
        
        <div class="mb-14">
          Already have an account? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Button class="w-full" isLoading={!!isLoading[0]} type="submit">Create Account</Button>
      </form>
    </div>
  )
}
