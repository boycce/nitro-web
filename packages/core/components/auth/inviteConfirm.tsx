import { Topbar, Field, FormError, Button, request, onChange, getResponseErrors, getSignoutStore, getInitialStore } from 'nitro-web'
import { Config, Errors } from 'nitro-web/types'
import { twMerge } from 'nitro-web/util'
import { Fragment, useEffect } from 'react'

type InviteConfirmProps = {
  className?: string,
  elements?: { Button?: typeof Button, Header?: React.ReactNode },
  redirectTo?: string,
  config: Pick<Config, 'getSignoutStore'>
}

export function InviteConfirm({ className, elements, redirectTo, config }: InviteConfirmProps) {
  const navigate = useNavigate()
  const params = useParams()
  const [, setStore] = useTracked()
  const getSignoutStoreFn = config.getSignoutStore || getSignoutStore
  const [isLoading, setIsLoading] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState<boolean | 'pending'>('pending')
  const [isAccepted, setIsAccepted] = useState(false)
  const [state, setState] = useState(() => ({
    firstName: '',
    lastName: '',
    password: '',
    password2: '',
    email: '',
    errors: [] as Errors,
  }))

  const Elements = {
    Button: elements?.Button || Button,
    Header: elements?.Header || null,
  }

  // Get invite details on mount
  useEffect(() => {
    preSubmit()
  }, [])

  async function preSubmit() {
    try {
      const result = await request(`get /api/invite-pre-confirm/${params.token}`)
      setIsExistingUser(result.isExistingUser)
      setState((s) => ({ ...s, email: result.email }))
      if (result.isExistingUser) submit({ token: params.token })
    } catch (e) {
      setState((s) => ({ ...s, errors: getResponseErrors(e) }))
    }
  }

  async function submit(data: object, event?: React.FormEvent<HTMLFormElement>) {
    try {
      if (isLoading) return
      const result = await request(`post /api/invite-confirm/${params.token}`, data, event, setIsLoading, setState)
      // Only update the store if the user was created AND refreshly signed in
      if (result?.jwt) setStore((s) => ({ ...getSignoutStoreFn(s, getInitialStore()), ...result }))
      setIsAccepted(true)
      setTimeout(() => navigate(redirectTo || '/'), 5000)
    } catch (e) {
      setState((s) => ({ ...s, errors: getResponseErrors(e) }))
    }
  }

  if (isExistingUser || isAccepted) {
    return (
      <div className={twMerge('min-h-[250px]', className)}>
        {isAccepted ? (
          <Fragment>
            <div class="text-2xl font-bold mb-4">Your invite has been accepted.</div>
            <p class="">You&apos;ll be redirected back to the <Link to="/">home page</Link> shortly...</p>
          </Fragment>
        ) : isExistingUser === 'pending' && !state.errors.length ? (
          <Fragment>
            <div class="text-2xl font-bold mb-4">One moment please...</div>
            <p class="">Verifying your token.</p>
          </Fragment>
        ) : (
          <Fragment>
            <div class="text-2xl font-bold mb-4">Something went wrong.</div>
            {state.errors.map((error, i) => {
              return (<span key={i} class="text-red-500 bg-red-50 p-1 rounded-md">{error.detail} <br /></span>)
            })}
          </Fragment>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      {!!Elements.Header && Elements.Header}
      <Topbar title={<Fragment>Accept Invitation</Fragment>} />

      <form onSubmit={(e) => submit(state, e)} class="mb-0">
        <div class="grid grid-cols-2 gap-6">  
          <div>
            <label for="firstName">First Name</label>
            <Field name="firstName" type="text" state={state} onChange={(e) => onChange(e, setState)} placeholder="Your first name..." 
              autoComplete="given-name" />
          </div>
          <div>
            <label for="lastName">Last Name</label>
            <Field name="lastName" type="text" state={state} onChange={(e) => onChange(e, setState)} placeholder="Your last name..." 
              autoComplete="off" />
          </div>
        </div>
        <div>
          <label for="email">Email Address</label>
          <Field name="email" type="email" state={state} placeholder="Your email address..." disabled={true} />
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
          <FormError state={state} className="pt-2" fields={['firstName', 'lastName', 'password', 'password2']} />
        </div>

        <Elements.Button class="w-full" isLoading={isLoading} type="submit">Accept Invite & Create Account</Elements.Button>
      </form>
    </div>
  )
}
