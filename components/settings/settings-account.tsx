// @ts-nocheck
// todo: finish tailwind conversion
import * as util from 'nitro-web/util'
import SvgTick from 'nitro-web/client/imgs/icons/tick.svg'
import { Button, FormError, Input, Modal, Topbar, Tabbar } from 'nitro-web'

export function SettingsAccount() {
  const isLoading = useState('')
  const [removeModal, setRemoveModal] = useState()
  const [{user}, setStore] = sharedStore.useTracked()
  const [state, setState] = useState({
    avatar: user.avatar || '',
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  })

  async function onSubmit (e) {
    try {
      const res = await util.request(e, `put /api/user/${user._id}?files=true`, state, isLoading)
      setStore((s) => ({ ...s, user: { ...s.user, ...res }, message: 'Saved successfully 👍️' }))
    } catch (errors) {
      return setState({ ...state, errors })
    }
  }

  return (
    <div css={style}>
      <Topbar 
        title={<>Settings</>} 
        submenu={
          <Tabbar class="is-underline"tabs={[
            { label: 'Business', path: '/settings/business' },
            { label: 'Team', path: '/settings/team' },
            { label: 'Account', path: '/settings/account' },
          ]} />
        }
        btns={
          <Button onClick={onSubmit} color="primary-sm" size="wide" IconLeft={SvgTick} isLoading={isLoading[0]}>
            Save Settings
          </Button>
        }
      />
      <div class="box p-box">
        <h3 class="h3">Account Info</h3>

        <form class="form" onSubmit={onSubmit}>
          <div class="cols cols-6 cols-gap-3">
            <div class="col">
              <label for="firstName">First Name(s)</label>
              <Input name="firstName" placeholder="E.g. Bruce" state={state} onChange={onChange(setState)} />
            </div>
            <div class="col">
              <label for="lastName">Last Name</label>
              <Input name="lastName" placeholder="E.g. Wayne" state={state} onChange={onChange(setState)} />
            </div>
            <div class="col">
              <label for="email">Email Address</label>
              <Input name="email" type="email" placeholder="Your email address..." state={state} 
                onChange={onChange(setState)} />
            </div>
            <div class="col">
              <Link to="/reset" class="label-right link2 underline2 is-active">Reset Password?</Link>
              <label for="password">Password</label>
              <Input name="password" placeholder="•••••••••••" disabled={true} />
            </div>
          </div>
          
          <div class="py-0-5 mb-12">
            Warning: to remove all your data and delete your
            account, <a href="#" onClick={() => setRemoveModal(user)} class="link2 underline2 is-active">click here</a>.
            <FormError state={state} class="pt-2" />
          </div>
        </form>
      </div>

      <RemoveModal show={removeModal} setShow={setRemoveModal} />
    </div>
  )
}

export function RemoveModal ({ show, setShow }) {
  // @param {object} showModal - user
  const navigate = useNavigate()
  const isLoading = useState(false)
  const [, setStore] = sharedStore.useTracked()
  const [state, setState] = useState({})

  useEffect(() => {
    if (show?._id) setState({ _id: show._id })
  }, [show?._id])

  async function onSubmit (e) {
    try {
      await util.request(e, `delete /api/account/${state._id}`, null, isLoading)
      close()
      setStore(o => ({ ...o, message: 'Data deleted successfully, Goodbye 👋...' }))
      setTimeout(() => navigate('/signout'), 6000) // wait for setStore
    } catch (errors) {
      return setState({ ...state, errors })
    }
  }

  function close() {
    setShow(false)
    setTimeout(() => setState(false), 300)
  }

  return (
    <Modal show={show} setShow={close} css={style} class="p-modal-small" maxWidth={560} minHeight={0}>
      <h2 class="h2"><em>Delete</em> Your Account?</h2>
      <p class="text-paragraph py-2">
        This will remove all the data against your account and including all companies owned by you.<br/>
        <br/>
        <b>Warning:</b> This cannot be undone.
      </p>
      <form class="form" onSubmit={onSubmit}>
        <div class="py-0-5 mb-4">
          <FormError state={state} class="pt-2" />
        </div>
        <Button onClick={onSubmit} color="secondary-sm" isLoading={isLoading[0]}>
          Delete Account
        </Button>
      </form>
    </Modal>
  )
}

import { css } from 'twin.macro'
const style = css`
  /* input[type='file'] {
    padding: 8px 18px;
    font-size: 12px;
  }
  .avatar {
    width: 38px;
    height: 38px;
  } */
 `
