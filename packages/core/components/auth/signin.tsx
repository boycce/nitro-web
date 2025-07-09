import { Topbar, Field, Button, FormError, util, injectedConfig, updateJwt } from 'nitro-web'
import { Errors } from 'nitro-web/types'

export function Signin() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignout = location.pathname == '/signout'
  const isLoading = useState(isSignout)
  const [, setStore] = useTracked()
  const [state, setState] = useState({
    email: injectedConfig.env == 'development' ? (injectedConfig.placeholderEmail || '') : '',
    password: injectedConfig.env == 'development' ? '1234' : '',
    errors: [] as Errors,
  })

  useEffect(() => {
    // Autofill the email input from ?email=
    const query = util.queryObject(location.search, true)
    if (query.email) setState({ ...state, email: query.email as string })
  }, [location.search])

  useEffect(() => {
    if (isSignout) {
      setStore((s) => ({ ...s, user: undefined }))
      // util.axios().get('/api/signout')
      Promise.resolve()
        .then(() => isLoading[1](false))
        .then(() => updateJwt())
        .then(() => navigate({ pathname: '/signin', search: location.search }, { replace: true }))
        .catch(err => (console.error(err), isLoading[1](false)))
    }
  }, [isSignout])

  async function onSubmit (e: React.FormEvent<HTMLFormElement>) {
    try {
      const data = await util.request('post /api/signin', state, e, isLoading, setState)
      // Keep it loading until we navigate
      isLoading[1](true)
      setStore((s) => ({ ...s, ...data }))
      setTimeout(() => { // wait for setStore
        if (location.search.includes('redirect')) navigate(location.search.replace('?redirect=', ''))
        else navigate('/')
      }, 100) 
    } catch (e) {
      return setState({ ...state, errors: e as Errors})
    }
  }

  return (
    <div>
      <Topbar title={<>Sign in to your Account</>} />

      <form onSubmit={onSubmit}>
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" state={state} onChange={(e) => onChange(setState, e)}
            placeholder="Your email address..." />
        </div>
        <div>
          <div class="flex justify-between"> 
            <label for="password">Password</label>
            <Link to="/reset" class="label underline2">Forgot?</Link>
          </div>
          <Field name="password" type="password" state={state} onChange={(e) => onChange(setState, e)}/>
        </div>
        
        <div class="mb-14">
          Don&apos;t have an account? You can <Link to="/signup" class="underline2 is-active">sign up here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Button class="w-full" isLoading={isLoading[0]} type="submit">Sign In</Button>
      </form>
    </div>
  )
}
