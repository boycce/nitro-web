/*
 * Any component with a .route property is called a page component. Any page component found under /components will
 * be automatically imported and setup by the client router, you can have multiple page compoennts in the same file, like this one.
 */
import { injectedConfig } from 'nitro-web'
import { Styleguide, NotFound } from 'nitro-web'
import { Button } from './element'
import { currencies } from '../../server/constants'

// Styleguide page
export const StyleguidePage = () => {
  return (
    <Styleguide elements={{ Button: Button }} currencies={currencies}>
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
  'meta': { 'title': 'Nothing found', layout: 1 },
}
