// const pi = parseFloat(3.142)
import '../types/globals.d.ts'

// Utility functions (since this file is an export, use export path for js declarations to work in host projects)
export * from 'nitro-web/util'
export * as util from 'nitro-web/util'

// Main types (since this file is an export, this needs to be a relative path, we cant use tsconfig path aliases)
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

// Component Elements
export { Accordion } from '../components/partials/element/accordion'
export { Avatar } from '../components/partials/element/avatar'
export { Button } from '../components/partials/element/button'
export { Calendar, type CalendarProps } from '../components/partials/element/calendar'
export { Dropdown } from '../components/partials/element/dropdown'
export { Filters, type FiltersHandleType, type FilterType } from '../components/partials/element/filters'
export { GithubLink } from '../components/partials/element/github-link'
export { Initials } from '../components/partials/element/initials'
export { Message } from '../components/partials/element/message'
export { Modal } from '../components/partials/element/modal'
export { Sidebar, type SidebarProps } from '../components/partials/element/sidebar'
export { Tooltip } from '../components/partials/element/tooltip'
export { Topbar } from '../components/partials/element/topbar'

// Component Form Elements
export { Checkbox } from '../components/partials/form/checkbox'
export { Drop } from '../components/partials/form/drop'
export { DropHandler } from '../components/partials/form/drop-handler'
export { FormError } from '../components/partials/form/form-error'
export { Field, isFieldCached, type FieldProps } from '../components/partials/form/field'
export { FieldColor, type FieldColorProps } from '../components/partials/form/field-color'
export { FieldCurrency, type FieldCurrencyProps } from '../components/partials/form/field-currency'
export { FieldDate, type FieldDateProps } from '../components/partials/form/field-date'
export { Location } from '../components/partials/form/location'
export { Select, getSelectStyle, type SelectProps } from '../components/partials/form/select'

// Component Other Components
export { IsFirstRender } from '../components/partials/is-first-render'

// Expose the injected config
export const injectedConfig = { ...INJECTED_CONFIG } as import('types').Config
