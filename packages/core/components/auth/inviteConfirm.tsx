import { Topbar, Field, FormError, Button, request, onChange, getResponseErrors, showError } from 'nitro-web'
import { Errors } from 'nitro-web/types'
import { Fragment, useEffect } from 'react'

type InviteConfirmProps = {
  className?: string,
  elements?: { Button?: typeof Button },
  redirectTo?: string,
}

export function InviteConfirm({ className, elements, redirectTo }: InviteConfirmProps) {
  const navigate = useNavigate()
  const params = useParams()
  const [store, setStore] = useTracked()
  const [isLoading, setIsLoading] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [state, setState] = useState(() => ({
    firstName: '',
    lastName: '',
    password: '',
    password2: '',
    token: params.token,
    errors: [] as Errors,
  }))

  const Elements = {
    Button: elements?.Button || Button,
  }

  // Auto-confirm on mount for already signed-in users
  useEffect(() => {
    if (store.user) submit({ token: params.token })
  }, [])

  async function submit(data: object, event?: React.FormEvent<HTMLFormElement>) {
    try {
      if (isLoading) return
      const result = await request('post /api/invite-confirm', data, event, setIsLoading, setState)
      setStore((s) => ({ ...s, ...result }))
      setAccepted(true)
      setTimeout(() => navigate(redirectTo || '/'), 5000)
    } catch (e) {
      showError(setStore, e)
      setState((s) => ({ ...s, errors: getResponseErrors(e) }))
    }
  }

  if (store.user) {
    return (
      <div className={className}>
        <div class="py-12 text-center">
          {accepted ? (
            <Fragment>
              <p class="text-lg font-semibold">Your invite has been accepted.</p>
              <p class="text-sm text-gray-500 mt-1">You&apos;ll be redirected back to the <Link to="/">home page</Link> shortly...</p>
            </Fragment>
          ) : isLoading ? (
            <Fragment>
              <p class="text-lg font-semibold">Accepting your invite...</p>
              <p class="text-sm text-gray-500 mt-1">Please wait while we confirm your invite.</p>
            </Fragment>
          ) : (
            <Fragment>
              <p class="text-lg font-semibold mb-2">Oops! Something went wrong.</p>
              <span class="text-sm text-red-500 bg-red-50 p-1 rounded-md mt-1">{state.errors.map((error) => error.detail).join(', ')}</span>
            </Fragment>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Topbar title={<Fragment>Accept Your Invite</Fragment>} />

      <form onSubmit={(e) => submit(state, e)} class="mb-0">
        <div class="grid grid-cols-2 gap-6">  
          <div>
            <label for="firstName">First Name</label>
            <Field name="firstName" type="text" state={state} onChange={(e) => onChange(e, setState)} placeholder="Your first name..." />
          </div>
          <div>
            <label for="lastName">Last Name</label>
            <Field name="lastName" type="text" state={state} onChange={(e) => onChange(e, setState)} placeholder="Your last name..." />
          </div>
        </div>
        <div>
          <label for="password">Choose a Password</label>
          <Field name="password" type="password" state={state} onChange={(e) => onChange(e, setState)} />
        </div>
        <div>
          <label for="password2">Repeat Your Password</label>
          <Field name="password2" type="password" state={state} onChange={(e) => onChange(e, setState)} />
        </div>

        <div class="mb-14">
          Already have an account? <Link to="/signin" class="underline2 is-active">Sign in here</Link> first then revisit this link.
          <FormError state={state} className="pt-2" />
        </div>

        <Elements.Button class="w-full" isLoading={isLoading} type="submit">Accept Invite & Create Account</Elements.Button>
      </form>
    </div>
  )
}
