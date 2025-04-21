// Required Global Types
import '../types/required-globals.d.ts'

// export const pi = parseFloat(3.142)
// Utility functions
export * from '../util.js'
export * as util from '../util.js'
export * from '../types'

// Main app functions
export { setupApp, updateJwt } from './app'
export { createStore, exposedStoreData, preloadedStoreData, setStoreWrapper } from './store'

// Component Pages
export { Signin } from '../components/auth/signin'
export { Signup } from '../components/auth/signup'
export { ResetInstructions, ResetPassword } from '../components/auth/reset'
export { Dashboard } from '../components/dashboard/dashboard'
export { NotFound } from '../components/partials/not-found'
export { Styleguide } from '../components/partials/styleguide'
// export { SettingsAccount } from '../components/settings/settings-account'
// export { SettingsBusiness } from '../components/settings/settings-business'
// export { SettingsTeamMember } from '../components/settings/settings-team--member'
// export { SettingsTeam } from '../components/settings/settings-team'

// Component Elements
export { Accordion } from '../components/partials/element/accordion'
export { Avatar } from '../components/partials/element/avatar'
export { Button } from '../components/partials/element/button'
export { Calendar, type CalendarProps } from '../components/partials/element/calendar'
export { Dropdown } from '../components/partials/element/dropdown'
export { GithubLink } from '../components/partials/element/github-link'
export { Initials } from '../components/partials/element/initials'
export { Message } from '../components/partials/element/message'
export { Modal } from '../components/partials/element/modal'
export { Sidebar, type SidebarProps } from '../components/partials/element/sidebar'
export { Tooltip } from '../components/partials/element/tooltip'
export { Topbar } from '../components/partials/element/topbar'

// Component Form
export { Checkbox } from '../components/partials/form/checkbox'
export { Drop } from '../components/partials/form/drop'
export { DropHandler } from '../components/partials/form/drop-handler'
export { FormError } from '../components/partials/form/form-error'
export { Field } from '../components/partials/form/input'
export { FieldColor, type FieldColorProps } from '../components/partials/form/input-color'
export { FieldCurrency, type FieldCurrencyProps } from '../components/partials/form/input-currency'
export { FieldDate, type FieldDateProps } from '../components/partials/form/input-date'
export { Location } from '../components/partials/form/location'
export { Select, getSelectStyle } from '../components/partials/form/select'
export { Toggle } from '../components/partials/form/toggle'

// Component Other
export { IsFirstRender } from '../components/partials/is-first-render'

// Expose the injected config
export const injectedConfig = { ...INJECTED_CONFIG } as import('types').Config
