import { Button, Field, FormError, Topbar, request, injectedConfig, onChange } from 'nitro-web'
import { Errors } from 'nitro-web/types'

type signupProps = {
  className?: string,
  elements?: { Button?: typeof Button },
  redirectTo?: string,
}

export function Signup({ className, elements, redirectTo }: signupProps) {
  const navigate = useNavigate()
  const isLoading = useState(false)
  const [, setStore] = useTracked()
  const [state, setState] = useState({
    email: injectedConfig.env === 'development' ? (injectedConfig.placeholderEmail || '') : '',
    name: injectedConfig.env === 'development' ? 'Bruce Wayne' : '',
    business: { name: injectedConfig.env === 'development' ? 'Wayne Enterprises' : '' },
    password: injectedConfig.env === 'development' ? '' : '',
    errors: [] as Errors,
  })

  const Elements = {
    Button: elements?.Button || Button,
  }

  async function onSubmit (e: React.FormEvent<HTMLFormElement>) {
    try {
      const data = await request('post /api/signup', state, e, isLoading, setState)
      setStore((prev) => ({ ...prev, ...data }))
      setTimeout(() => navigate(redirectTo || '/'), 0) // wait for setStore
    } catch (e) {
      setState((prev) => ({ ...prev, errors: e as Errors }))
    }
  }
  
  return (
    <div className={className}>
      <Topbar title={<>Start your 21 day Free Trial</>} />

      <form onSubmit={onSubmit} class="mb-0">
        <div class="grid grid-cols-2 gap-6">  
          <div>
            <label for="name">Your Name</label>
            <Field name="name" placeholder="E.g. Bruce Wayne" state={state} 
              onChange={(e) => onChange(setState, e)} 
              errorTitle={/^(name|firstName|lastName)$/} // if different from `name`
            />
          </div>
          <div>
            <label for="business.name">Company Name</label>
            <Field name="business.name" placeholder="E.g. Wayne Enterprises" state={state} onChange={(e) => onChange(setState, e)} />
          </div>
        </div>
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" state={state} onChange={(e) => onChange(setState, e)} placeholder="Your email address..." />
        </div>
        <div>
          <label for="password">Password</label>
          <Field name="password" type="password" state={state} onChange={(e) => onChange(setState, e)}/>
        </div>
        
        <div class="mb-14">
          Already have an account? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Elements.Button class="w-full" isLoading={isLoading[0]} type="submit">Create Account</Elements.Button>
      </form>
    </div>
  )
}
