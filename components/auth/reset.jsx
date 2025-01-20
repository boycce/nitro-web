import * as util from '../../util.js'
import { Topbar } from '../partials/element/topbar.jsx'
import { Input } from '../partials/form/input.jsx'
import { FormError } from '../partials/form/form-error.jsx'
import { Button } from '../partials/element/button.jsx'

export function ResetInstructions() {
  const navigate = useNavigate()
  const isLoading = useState('')
  const [, setStore] = sharedStore.useTracked()
  const [state, setState] = useState({ email: '' })

  async function onSubmit (e) {
    try {
      await util.request(e, 'post /api/reset-instructions', state, isLoading)
      setStore(s => ({ ...s, message: 'Done! Please check your email.' }))
      navigate('/signin')
    } catch (errors) {
      return setState({ ...state, errors })
    }
  }

  return (
    <div class="">
      <Topbar title={<>Reset your Password</>} />

      <form onSubmit={onSubmit}>
        <div>
          <label for="email">Email Address</label>
          <Input name="email" type="email" state={state} onChange={onChange(setState)} placeholder="Your email address..." />
        </div>
        
        <div class="mb-14">
          Remembered your password? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} class="pt-2" />
        </div>

        <Button class="w-full" isLoading={isLoading[0]} type="submit">Email me a reset password link</Button>
      </form>
    </div>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const params = useParams()
  const isLoading = useState('')
  const [, setStore] = sharedStore.useTracked()
  const [state, setState] = useState(() => ({
    password: '',
    password2: '',
    token: params.token,
  }))

  async function onSubmit (e) {
    try {
      const data = await util.request(e, 'post /api/reset-password', state, isLoading)
      setStore(() => data)
      navigate('/')
    } catch (errors) {
      return setState({ ...state, errors })
    }
  }

  return (
    <div class="">
      <Topbar title={<>Reset your Password</>} />

      <form onSubmit={onSubmit}>
        <div>
          <label for="password">Your New Password</label>
          <Input name="password" type="password" state={state} onChange={onChange(setState)} />
        </div>
        <div>
          <label for="password2">Repeat Your New Password</label>
          <Input name="password2" type="password" state={state} onChange={onChange(setState)} />
        </div>

        <div class="mb-14">
          Remembered your password? You can <Link to="/signin" class="underline2 is-active">sign in here</Link>.
          <FormError state={state} class="pt-2" />
        </div>

        <Button class="w-full" isLoading={isLoading[0]} type="submit">Reset Password</Button>
      </form>
    </div>
  )
}