import { Topbar, Field, FormError, Button, request, onChange, getResponseErrors, getSignoutStore, getInitialStore } from 'nitro-web'
import { Config, Errors } from 'nitro-web/types'
import { twMerge } from 'nitro-web/util'
import { Fragment, useEffect, useRef } from 'react'
import { CheckIcon } from 'lucide-react'

type InviteConfirmProps = {
  className?: string,
  elements?: { Button?: typeof Button, Header?: React.ReactNode },
  redirectTo?: string,
  config: Pick<Config, 'getSignoutStore'>
}

export function InviteConfirm({ className, elements, redirectTo, config }: InviteConfirmProps) {
  const navigate = useNavigate()
  const params = useParams()
  const [{ user }, setStore] = useTracked()
  const getSignoutStoreFn = config.getSignoutStore || getSignoutStore
  const [isLoading, setIsLoading] = useState(false)
  const [isExistingUser, setIsExistingUser] = useState<boolean | 'pending'>('pending')
  const [isAccepted, setIsAccepted] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const redirectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
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

  // Get invite details on mount, and stop the redirect if the page is left first
  useEffect(() => {
    preSubmit()
    return () => clearTimeout(redirectTimer.current)
  }, [])

  async function preSubmit() {
    try {
      const result = await request(`get /api/invite-pre-confirm/${params.token}`)
      setIsExistingUser(result.isExistingUser)
      setState((s) => ({ ...s, email: result.email }))
      setCompanyName(result.companyName || '')
      if (result.isExistingUser) submit({ token: params.token }, undefined, result.email)
    } catch (e) {
      setState((s) => ({ ...s, errors: getResponseErrors(e) }))
    }
  }

  // Signed out, or signed in as someone other than the invited email
  function isOtherUser(email: string) {
    return !!email && user?.email?.toLowerCase() !== email.toLowerCase()
  }

  async function submit(data: object, event?: React.FormEvent<HTMLFormElement>, email = state.email) {
    try {
      if (isLoading) return
      const result = await request(`post /api/invite-confirm/${params.token}`, data, event, setIsLoading, setState)
      // Only update the store if the user was created AND refreshly signed in
      if (result?.jwt) setStore((s) => ({ ...getSignoutStoreFn(s, getInitialStore()), ...result }))
      setIsAccepted(true)
      redirectTimer.current = setTimeout(() => goNext(email, !!result?.jwt), 8000)
    } catch (e) {
      setState((s) => ({ ...s, errors: getResponseErrors(e) }))
    }
  }

  function goNext(email: string, isNewUser: boolean) {
    // New users are already signed in, others sign in as the invited email, or reload to show the new company
    if (isNewUser) navigate(redirectTo || '/')
    else if (isOtherUser(email)) navigate(`/signout?email=${encodeURIComponent(email)}`)
    else window.location.href = redirectTo || '/'
  }

  if (isExistingUser || isAccepted) {
    return (
      <div className={twMerge('min-h-[250px]', className)}>
        {isAccepted ? (
          <div class="text-center pt-4">
            {!!companyName && (
              <span class="relative inline-flex mb-6">
                <span class="flex items-center justify-center size-14 rounded-lg bg-gray-900 text-white text-lg font-semibold">
                  {companyName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </span>
                <span class="absolute -right-1.5 -bottom-1.5 flex items-center justify-center size-5 rounded-full
                  bg-green-500 ring-2 ring-white">
                  <CheckIcon size={12} className="text-white" strokeWidth={3.5} />
                </span>
              </span>
            )}
            <div class="text-2xl font-bold mb-3">{companyName ? `You've joined ${companyName}` : 'You\'re in!'}</div>
            <p class="text-gray-600 mb-8">
              {isExistingUser === true && isOtherUser(state.email)
                ? <Fragment>Sign in as <strong class="text-gray-900">{state.email}</strong> to get started.</Fragment>
                : 'Your invite has been accepted.'}
            </p>
            <Elements.Button class="w-full mb-3" onClick={() => goNext(state.email, isExistingUser === false)}>
              Continue
            </Elements.Button>
            <p class="text-xs text-gray-400">We&apos;ll take you there in a few seconds</p>
          </div>
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
