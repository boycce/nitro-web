import { Signin, Signup, ResetInstructions, ResetPassword, InviteConfirm } from 'nitro-web'
import config from '../../client/config'

// Signin page
export const SigninPage = () => <Signin config={config} />
SigninPage.route = {
  '/signin': true,
  '/signout': true,
  'meta': { 'title': 'Sign In', layout: 2 },
}

// Signup page
export const SignupPage = () => <Signup config={config} />
SignupPage.route = {
  '/signup': true,
  'meta': { 'title': 'Sign Up', layout: 2 },
}

// Reset instructions page
export const ResetInstructionsPage = () => <ResetInstructions />
ResetInstructionsPage.route = {
  '/reset': true,
  'meta': { 'title': 'Reset password', layout: 2 },
}

// Reset password page
export const ResetPasswordPage = () => <ResetPassword config={config} />
ResetPasswordPage.route = {
  '/reset/:token': true,
  'meta': { 'title': 'Reset password', layout: 2 },
}

// Invite confirm page
export const InviteConfirmPage = () => <InviteConfirm config={config} />
InviteConfirmPage.route = {
  '/invite/:token': true,
  'meta': { 'title': 'Accept invite', layout: 2 },
}
