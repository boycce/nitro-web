/*
 * Any component with a .route property is called a page component. Any page component found under /components 
 * will be automatically imported and setup by the client router, we're just listing them all here for the sake of example.
 */
import { css, theme } from 'twin.macro'
import { 
  Signin, 
  Signup, 
  ResetInstructions, 
  ResetPassword, 
  Dashboard,
  Styleguide, 
  NotFound,
  // SettingsAccount, 
  // SettingsBusiness, 
  // SettingsTeam, 
} from 'nitro-web'

import config from '../client/config'

// Signin page (can be saved onto a seperate .jsx/.tsx file under the components folder)
export const SigninPage = () => <Signin config={config} />
SigninPage.route = {
  '/signin': true,
  '/signout': true,
  'meta': { 'title': 'Sign In - Nitro', layout: 2 },
}

// Signup page
export const SignupPage = () => <Signup config={config} />
SignupPage.route = {
  '/signup': true,
  'meta': { 'title': 'Sign Up - Nitro', layout: 2 },
}

// Reset instructions page
export const ResetInstructionsPage = () => <ResetInstructions />
ResetInstructionsPage.route = {
  '/reset': true,
  'meta': { 'title': 'Reset password - Nitro', layout: 2 },
}

// Reset password page
export const ResetPasswordPage = () => <ResetPassword />
ResetPasswordPage.route = {
  '/reset/:token': true,
  'meta': { 'title': 'Reset password - Nitro', layout: 2 },
}

// // Settings Account page
// export const SettingsAccountPage = () => <SettingsAccount />
// SettingsAccountPage.route = {
//   '/settings/account': ['isUser'],
//   'meta': { 'title': 'Account Settings - Nitro', layout: 1 },
// }

// // Settings Business page
// export const SettingsBusinessPage = () => <SettingsBusiness config={config} />
// SettingsBusinessPage.route = {
//   '/settings/business': ['isUser'],
//   'meta': { 'title': 'Business Settings - Nitro', layout: 1 },
// }

// // Settings Team page
// export const SettingsTeamPage = () => <SettingsTeam config={config} />
// SettingsTeamPage.route = {
//   '/settings/team': ['isUser'],
//   'meta': { 'title': 'Team Settings - Nitro', layout: 1 },
// }

// Dashboard page
export const DashboardPage = () => <Dashboard config={config} />
DashboardPage.route = {
  '/': true,
  'meta': { 'title': 'Dashboard - Nitro', layout: 1 },
}

// Styleguide page
export const StyleguidePage = () => <Styleguide config={config} />
StyleguidePage.route = {
  '/styleguide': true,
  'meta': { title: 'Style Guide - Nitro', layout: 1 },
}

// Not found page
export const NotFoundPage = () => <NotFound />
NotFoundPage.route = {
  '*': true,
  'meta': { 'title': 'Nothing found - Nitro', layout: 1 },
}

// Custom Tailwind UI page example
export function PricingPage() {
  const tiers = [
    {
      name: 'Hobby',
      id: 'tier-hobby',
      href: '#',
      priceMonthly: '$29',
      description: 'The perfect plan if you\'re just getting started with our product.',
      features: ['25 products', 'Up to 10,000 subscribers', 'Advanced analytics', '24-hour support response time'],
      featured: false,
    },
    {
      name: 'Enterprise',
      id: 'tier-enterprise',
      href: '#',
      priceMonthly: '$99',
      description: 'Dedicated support and infrastructure for your company.',
      features: [
        'Unlimited products',
        'Unlimited subscribers',
        'Advanced analytics',
        'Dedicated support representative',
        'Marketing automations',
        'Custom integrations',
      ],
      featured: true,
    },
  ]
  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }
  return (
    <div className="relative isolate bg-white py-12 md:py-16 px-6" css={style}>
      <div aria-hidden="true" className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%,'
              +' 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="mx-auto aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
        />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base/7 font-semibold text-indigo-600">Pricing</h2>
        <p className="mt-2 text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Choose the right plan for you
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-pretty text-center text-lg font-medium text-gray-600 sm:text-xl/8">
        Choose an affordable plan that’s packed with the best features for engaging your audience, creating customer
        loyalty, and driving sales.
      </p>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured ? 'relative bg-gray-900 shadow-2xl' : 'bg-white/60 sm:mx-8 lg:mx-0',
              tier.featured
                ? ''
                : tierIdx === 0
                  ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-bl-3xl lg:rounded-tr-none'
                  : 'sm:rounded-t-none lg:rounded-bl-none lg:rounded-tr-3xl',
              'rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10'
            )}
          >
            <h3
              id={tier.id}
              className={classNames(tier.featured ? 'text-indigo-400' : 'text-indigo-600', 'text-base/7 font-semibold')}
            >
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={classNames(
                  tier.featured ? 'text-white' : 'text-gray-900',
                  'text-5xl font-semibold tracking-tight'
                )}
              >
                {tier.priceMonthly}
              </span>
              <span className={classNames(tier.featured ? 'text-gray-400' : 'text-gray-500', 'text-base')}>/month</span>
            </p>
            <p className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'mt-6 text-base/7')}>
              {tier.description}
            </p>
            <ul
              role="list"
              className={classNames(
                tier.featured ? 'text-gray-300' : 'text-gray-600',
                'mt-8 space-y-3 text-sm/6 sm:mt-10'
              )}
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  {/* <CheckIcon
                    aria-hidden="true"
                    className={classNames(tier.featured ? 'text-indigo-400' : 'text-indigo-600', 'h-6 w-5 flex-none')}
                  /> */}
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={tier.href}
              aria-describedby={tier.id}
              className={classNames(
                tier.featured
                  ? 'bg-indigo-500 text-white shadow-sm hover:bg-indigo-400 focus-visible:outline-indigo-500'
                  : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300 focus-visible:outline-indigo-600',
                'mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline '
                + 'focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10'
              )}
            >
              Get started today
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
const style = css`
  .example-usage-of-tailwind-variable {
    color: ${theme('colors.dark')};
  }
`
PricingPage.route = {
  '/pricing': true,
  'meta': { 'title': 'Pricing - Nitro', layout: 1 },
}
