/*
 * Any component with a .route property is called a page component. Any page component found under /components will
 * be automatically imported and setup by the client router, you can have multiple page compoennts in the same file, like this one.
 */
//todo: rename to misc-pages?
import { injectedConfig } from 'nitro-web'
import { Styleguide, NotFound } from 'nitro-web'
import { Button } from './element'

// Styleguide page
export const StyleguidePage = () => {
  return (
    <Styleguide elements={{ Button: Button }}>
      <div>
        <h3 className="h3">Custom Buttons</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <div><Button color="blue-light">blue-light button</Button></div>
        </div>
      </div>
    </Styleguide>
  )
}
StyleguidePage.route = {
  '/styleguide': true,
  'meta': { title: `${injectedConfig.isDemo ? 'Design System' : 'Style Guide'}`, layout: 1 },
}

// Not found page
export const NotFoundPage = () => <NotFound />
NotFoundPage.route = {
  '*': true,
  'meta': { 'title': 'Page Not Found', layout: 2 },
}

// Client Middleware Example page
export const ResearchFloorPage = () => <div>Welcome to the Research and Development Floor.</div>
ResearchFloorPage.route = {
  '/research-floor': ['hasExecutiveAccess'], // middleware name (see client/config.ts)
  'meta': { 'title': 'Research and Development Floor', layout: 2 },
}
