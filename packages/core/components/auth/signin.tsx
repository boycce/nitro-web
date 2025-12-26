import { Topbar, Field, Button, FormError, request, queryObject, injectedConfig, updateJwt, onChange } from 'nitro-web'
import { Errors } from 'nitro-web/types'
import { Fragment } from 'react'

type signinProps = {
  className?: string,
  elements?: { Button?: typeof Button },
  redirectTo?: string,
}

export function Signin({ className, elements, redirectTo }: signinProps) {
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
  
  const Elements = {
    Button: elements?.Button || Button,
  }

  useEffect(() => {
    // Autofill the email input from ?email=
    const query = queryObject(location.search, { emptyStringAsTrue: true })
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
      const data = await request('post /api/signin', state, e, isLoading, setState)
      // Keep it loading until we navigate
      isLoading[1](true)
      setStore((s) => ({ ...s, ...data }))
      setTimeout(() => { // wait for setStore
        if (location.search.includes('redirect')) navigate(location.search.replace('?redirect=', ''))
        else navigate(redirectTo || '/')
      }, 100) 
    } catch (e) {
      return setState({ ...state, errors: e as Errors})
    }
  }

  return (
    <div className={className}>
      <Topbar title={<Fragment>Sign in to your Account</Fragment>} />

      <form onSubmit={onSubmit} class="mb-0">
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" state={state} onChange={(e) => onChange(e, setState)}
            placeholder="Your email address..." />
        </div>
        <div>
          <div class="flex justify-between"> 
            <label for="password">Password</label>
            <Link to="/reset" class="label underline2">Forgot?</Link>
          </div>
          <Field name="password" type="password" state={state} onChange={(e) => onChange(e, setState)}/>
        </div>
        
        <div class="mb-14">
          Don&apos;t have an account? You can <Link to="/signup" class="underline2 is-active">sign up here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Elements.Button class="w-full" isLoading={isLoading[0]} type="submit">Sign In</Elements.Button>
      </form>
    </div>
  )
}
