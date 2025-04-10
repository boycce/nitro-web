import { Topbar, Field, FormError, Button, util } from 'nitro-web'
import { Errors } from 'nitro-web/types'

export function ResetInstructions() {
  const navigate = useNavigate()
  const isLoading = useState('')
  const [, setStore] = useTracked()
  const [state, setState] = useState({ email: '', errors: [] as Errors })

  async function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    try {
      await util.request(event, 'post /api/reset-instructions', state, isLoading)
      setStore(s => ({ ...s, message: 'Done! Please check your email.' }))
      navigate('/signin')
    } catch (e) {
      return setState({ ...state, errors: e as Errors })
    }
  }

  return (
    <div class="">
      <Topbar title={<>Reset your Password</>} />

      <form onSubmit={onSubmit}>
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" state={state} onChange={onChange.bind(setState)} placeholder="Your email address..." />
        </div>
        
        <div class="mb-14">
          Remembered your password? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Button className="w-full" isLoading={!!isLoading[0]} type="submit">Email me a reset password link</Button>
      </form>
    </div>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const params = useParams()
  const isLoading = useState('')
  const [, setStore] = useTracked()
  const [state, setState] = useState(() => ({
    password: '',
    password2: '',
    token: params.token,
    errors: [] as Errors,
  }))

  async function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    try {
      const data = await util.request(event, 'post /api/reset-password', state, isLoading)
      setStore(() => data)
      navigate('/')
    } catch (e) {
      return setState({ ...state, errors: e as Errors })
    }
  }

  return (
    <div class="">
      <Topbar title={<>Reset your Password</>} />

      <form onSubmit={onSubmit}>
        <div>
          <label for="password">Your New Password</label>
          <Field name="password" type="password" state={state} onChange={onChange.bind(setState)} />
        </div>
        <div>
          <label for="password2">Repeat Your New Password</label>
          <Field name="password2" type="password" state={state} onChange={onChange.bind(setState)} />
        </div>

        <div class="mb-14">
          Remembered your password? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Button class="w-full" isLoading={!!isLoading[0]} type="submit">Reset Password</Button>
      </form>
    </div>
  )
}