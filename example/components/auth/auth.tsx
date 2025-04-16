import { 
  Signin, 
  Signup, 
  ResetInstructions, 
  ResetPassword,
} from 'nitro-web'

// Signin page (can be saved onto a seperate .jsx/.tsx file under the components folder)
export const SigninPage = () => <Signin />
SigninPage.route = {
  '/signin': true,
  '/signout': true,
  'meta': { 'title': 'Sign In', layout: 2 },
}

// Signup page
export const SignupPage = () => <Signup />
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
export const ResetPasswordPage = () => <ResetPassword />
ResetPasswordPage.route = {
  '/reset/:token': true,
  'meta': { 'title': 'Reset password', layout: 2 },
}
