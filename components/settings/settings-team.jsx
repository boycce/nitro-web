// todo: finish tailwind conversion
import * as util from '../../util.js'
import SvgPlus from '../../client/imgs/icons/plus.svg'
import { Button } from '../partials/element/button.jsx'
import { Table } from '../partials/element/table.jsx'
import { Avatar } from '../partials/element/avatar.jsx'
import { Tabbar } from '../partials/element/tabbar.jsx'
import { Topbar } from '../partials/element/topbar.jsx'
import { SettingsTeamMember } from './settings-team--member.jsx'

export function SettingsTeam({ config }) {
  const isLoading = useState('')
  const [showModal, setShowModal] = useState()
  const [{ user }] = sharedStore.useTracked()
  const [state] = useState({
    users: user?.company?.users || [],
  })
  
  function addTeamMember() {
    //... open modal
  }

  return (
    <div>
      <Topbar
        title={<>Settings</>} 
        submenu={
          <Tabbar class="is-underline" tabs={[
            { label: 'Business', path: '/settings/business' },
            { label: 'Team', path: '/settings/team' },
            { label: 'Account', path: '/settings/account' },
          ]} />
        }
        btns={
          <Button onClick={addTeamMember} color="primary-sm" IconLeft={SvgPlus} isLoading={isLoading[0]}>
            Add Team Member
          </Button>
        }
      />

      <Table
        columns={[
          { label: 'Member\'s Name', key: 'name', width: 1 },
          { label: 'Email', key: 'email' },
          { label: 'Joined On', key: 'joinedOn', align: 'center' },
          { label: 'Role', key: 'role', width: '110px' },
        ]}
        rowOnClick={(e, user) => setShowModal(user)}
        rows={
          state.users.map(user => ({
            ...user,
            key: user._id,
            name: (
              <>
                <Avatar awsUrl={config.awsUrl} user={user} isRound={true} class="mt--1 mb--1" />
                <b>{util.ucFirst(user.name)}</b>
                {user.status != 'invited' && <span class="text-grey">(Invitation pending)</span>}
              </>
            ),
            joinedOn: user.status == 'invited' ? <a href="#">Resend Invite</a> : util.date(user.createdAt),
            role: util.ucFirst(user.role),
          }))
        }
        actions={[
          { label: 'Remove', onClick: (_row, _i) => console.log('remove') },
        ]}
        actionsAll={[
          { label: 'Remove All', onClick: () => console.log('remove all') },
        ]}
      />

      {/* Member modal */}
      <SettingsTeamMember showModal={showModal} setShowModal={setShowModal} />
    </div>
  )
}