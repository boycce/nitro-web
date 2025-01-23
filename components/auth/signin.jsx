import * as util from '../../util.js'
import { Topbar } from '../partials/element/topbar.jsx'
import { Input } from '../partials/form/input.jsx'
import { Button } from '../partials/element/button.jsx'
import { FormError } from '../partials/form/form-error.jsx'

export function Signin({ config }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignout = location.pathname == '/signout'
  const isLoading = useState(isSignout ? 'is-loading' : '')
  const [, setStore] = sharedStore.useTracked()
  const [state, setState] = useState({
    email: config.env == 'development' ? config.testEmail : '',
    password: config.env == 'development' ? '1234' : '',
  })

  useEffect(() => {
    // Autofill the email input from ?email=
    const query = util.queryObject(location.search, true)
    if (query.email) setState({ ...state, email: query.email })
  }, [location.search])

  useEffect(() => {
    if (isSignout) {
      setStore(() => ({ user: null }))
      util.axios().get('/api/signout')
        .then(() => isLoading[1](''))
        .then(() => navigate({ pathname: '/signin', search: location.search }, { replace: true }))
        .catch(err => console.error(err) || isLoading[1](''))
    }
  }, [isSignout])

  async function onSubmit (e) {
    try {
      const data = await util.request(e, 'post /api/signin', state, isLoading)
      isLoading[1]('is-loading')
      setStore(() => data)
      setTimeout(() => { // wait for setStore
        if (location.search.includes('redirect')) navigate(location.search.replace('?redirect=', ''))
        else navigate('/')
      }, 100) 
    } catch (errors) {
      return setState({ ...state, errors })
    }
  }

  return (
    <div>
      <Topbar title={<>Sign in to your Account</>} />

      <form onSubmit={onSubmit}>
        <div>
          <label for="email">Email Address</label>
          <Input name="email" type="email" state={state} onChange={onChange(setState)} placeholder="Your email address..." />
        </div>
        <div>
          <div class="flex justify-between"> 
            <label for="password">Password</label>
            <Link to="/reset" class="label underline2">Forgot?</Link>
          </div>
          <Input name="password" type="password" state={state} onChange={onChange(setState)}/>
        </div>
        
        <div class="mb-14">
          Don&apos;t have an account? You can <Link to="/signup" class="underline2 is-active">sign up here</Link>.
          <FormError state={state} class="pt-2" />
        </div>

        <Button class="w-full" isLoading={isLoading[0]} type="submit">Sign In</Button>
      </form>
    </div>
  )
}
