// @ts-nocheck
// todo: finish tailwind conversion
import { Button, FormError, Field, Modal, Select, injectedConfig } from 'nitro-web'
import SvgTick from 'nitro-web/client/imgs/icons/tick.svg'

type SettingsTeamMemberProps = {
  showModal: boolean
  setShowModal: (showModal: boolean) => void
}

export function SettingsTeamMember ({ showModal, setShowModal }: SettingsTeamMemberProps) {
  // @param {object} showModal - user
  const [{ user }] = sharedStore.useTracked()
  const [isLoading] = useState(false)
  const [state, setState] = useState({
    business: {
      name: '',
      address: '',
      website: '',
      phone: '',
    },
  })

  // permit polit changes
  // typescripty, 

  function onSubmit(_e) {
    //... save
  }

  return (
    <Modal show={showModal} setShow={setShowModal} class="p-modal">

      <h2 class="h2"><em>Add</em> Team Member</h2>
      <p class="subtitle">Invite a new team member to collaborate with you on {injectedConfig?.name || 'Nitro'}.</p>
      
      <form class="form" onSubmit={onSubmit}>
        <div class="cols cols-6 cols-gap-2-5">
          <div class="col">
            <label for="role">Member Role</label>
            <Select 
              name="role"
              isSearchable={false}
              placeholder="Select a role"
              onChange={(e) => onChange(setState, e)} 
              state={state}
              minMenuWidth={460}
              options={[
                { 
                  className: 'bb',
                  value: 'owner', 
                  labelControl: 'Owner',
                  label: <>
                    <div class="mb-0-5"><b>Owner</b></div>
                    <div>Full access.</div>
                  </>,
                },
                { 
                  className: 'bb',
                  value: 'manager', 
                  labelControl: 'Manager',
                  label: <>
                    <div class="mb-0-5"><b>Manager</b></div>
                    <div>No access to billing or the ability to remove your account.</div>
                  </>,
                },
              ]}
            />
          </div>
          <div class="col">
            <label for="email">Email Address</label>
            <Field 
              name="email" type="email" placeholder="Your email address..." state={state} 
              onChange={(e) => onChange(setState, e)} 
            />
          </div>
          <div class="col">
            <label for="firstName">First Name</label>
            <Field name="firstName" placeholder="E.g. Bruce" state={state} onChange={(e) => onChange(setState, e)} />
          </div>
          <div class="col">
            <label for="lastName">Last Name</label>
            <Field name="lastName" placeholder="E.g. Wayne" state={state} onChange={(e) => onChange(setState, e)} />
          </div>
          <div class="col-12">
            <label for="message">Invitation Message</label>
            <Field 
              name="message" 
              type="textarea" 
              placeholder={`${user.firstName} is inviting you to collaborate on ${injectedConfig?.name || 'Nitro'}.`} 
              state={state} 
              onChange={(e) => onChange(setState, e)} 
            />
          </div>
        </div>
        
        <div class="py-0-5 mb-4">
          <FormError state={state} class="pt-2" />
        </div>
        <Button onClick={onSubmit} color="primary-sm" IconLeft={SvgTick} isLoading={isLoading[0]}>
          Send Invitation
        </Button>
      </form>
    </Modal>
  )
}
