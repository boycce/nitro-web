/*
 * Any component with a .route property is called a page component. Any page component found under /components will
 * be automatically imported and setup by the client router, you can have multiple page compoennts in the same file, like this one.
 */
import { injectedConfig } from 'nitro-web'
import { Dashboard, Styleguide, NotFound } from 'nitro-web'

// Dashboard page
export const DashboardPage = () => <Dashboard />
DashboardPage.route = { 
  '/': true, 
  'meta': { 'title': 'Dashboard', layout: 1 },
}

// Styleguide page
export const StyleguidePage = () => <Styleguide />
StyleguidePage.route = {
  '/styleguide': true,
  'meta': { title: `${injectedConfig.isDemo ? 'Design System' : 'Style Guide'}`, layout: 1 },
}

// Not found page
export const NotFoundPage = () => <NotFound />
NotFoundPage.route = {
  '*': true,
  'meta': { 'title': 'Nothing found', layout: 1 },
}

