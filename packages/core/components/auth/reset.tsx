import { Topbar, Field, FormError, Button, request, onChange } from 'nitro-web'
import { Errors } from 'nitro-web/types'
import { Fragment } from 'react'

type resetInstructionsProps = {
  className?: string,
  elements?: { Button?: typeof Button },
  redirectTo?: string,
}

export function ResetInstructions({ className, elements, redirectTo }: resetInstructionsProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [, setStore] = useTracked()
  const [state, setState] = useState({ email: '', errors: [] as Errors })

  const Elements = {
    Button: elements?.Button || Button,
  }

  async function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    try {
      if (isLoading) return
      await request('post /api/reset-instructions', state, event, setIsLoading, setState)
      setStore((s) => ({ ...s, message: 'Done! Please check your email.' }))
      navigate(redirectTo || '/signin')
    } catch (e) {
      return setState({ ...state, errors: e as Errors })
    }
  }

  return (
    <div className={className}>
      <Topbar title={<Fragment>Reset your Password</Fragment>} />

      <form onSubmit={onSubmit} class="mb-0">
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" state={state} onChange={(e) => onChange(e, setState)} placeholder="Your email address..." />
        </div>
        
        <div class="mb-14">
          Remembered your password? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Elements.Button className="w-full" isLoading={isLoading} type="submit">Email me a reset password link</Elements.Button>
      </form>
    </div>
  )
}

export function ResetPassword({ className, elements, redirectTo }: resetInstructionsProps) {
  const navigate = useNavigate()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [, setStore] = useTracked()
  const [state, setState] = useState(() => ({
    password: '',
    password2: '',
    token: params.token,
    errors: [] as Errors,
  }))
  
  const Elements = {
    Button: elements?.Button || Button,
  }

  async function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    try {
      if (isLoading) return
      const data = await request('post /api/reset-password', state, event, setIsLoading, setState)
      setStore((s) => ({ ...s, ...data }))
      setTimeout(() => navigate(redirectTo || '/'), 10) // wait for setStore
    } catch (e) {
      return setState({ ...state, errors: e as Errors })
    }
  }

  return (
    <div className={className}>
      <Topbar title={<Fragment>Reset your Password</Fragment>} />

      <form onSubmit={onSubmit} class="mb-0">
        <div>
          <label for="password">Your New Password</label>
          <Field name="password" type="password" state={state} onChange={(e) => onChange(e, setState)} />
        </div>
        <div>
          <label for="password2">Repeat Your New Password</label>
          <Field name="password2" type="password" state={state} onChange={(e) => onChange(e, setState)} />
        </div>

        <div class="mb-14">
          Remembered your password? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Elements.Button class="w-full" isLoading={isLoading} type="submit">Reset Password</Elements.Button>
      </form>
    </div>
  )
}