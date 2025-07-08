import { Dashboard } from 'nitro-web'

// Dashboard page
export const DashboardPage = () => <Dashboard />
DashboardPage.route = { 
  '/': true, 
  'meta': { 'title': 'Dashboard', layout: 1 },
}
