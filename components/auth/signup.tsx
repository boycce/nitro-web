import { Button, Input, FormError, Topbar, util } from 'nitro-web'
import { Config, Errors } from 'types'

export function Signup({ config }: { config: Config}) {
  const navigate = useNavigate()
  const isLoading = useState('')
  const [, setStore] = useTracked()
  const [state, setState] = useState({
    email: config.env === 'development' ? config.placeholderEmail : '',
    name: config.env === 'development' ? 'Bruce Wayne' : '',
    business: { name: config.env === 'development' ? 'Wayne Enterprises' : '' },
    password: config.env === 'development' ? '1234' : '',
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
            <Input name="name" placeholder="E.g. Bruce Wayne" state={state} onChange={onChange.bind(setState)} />
          </div>
          <div>
            <label for="business.name">Company Name</label>
            <Input name="business.name" placeholder="E.g. Wayne Enterprises" state={state} onChange={onChange.bind(setState)} />
          </div>
        </div>
        <div>
          <label for="email">Email Address</label>
          <Input name="email" type="email" state={state} onChange={onChange.bind(setState)} placeholder="Your email address..." />
        </div>
        <div>
          <label for="password">Password</label>
          <Input name="password" type="password" state={state} onChange={onChange.bind(setState)}/>
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
