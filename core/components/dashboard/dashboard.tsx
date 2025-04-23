import { css, theme } from 'twin.macro'
import { injectedConfig } from 'nitro-web'

export function Dashboard() {
  const [store] = useTracked()
  const textColor = store.apiAvailable ? 'text-green-700' : injectedConfig.isStatic ? 'text-gray-700' : 'text-pink-700'
  const fillColor = store.apiAvailable ? 'fill-green-500' : injectedConfig.isStatic ? 'fill-gray-500' : 'fill-pink-500'
  const bgColor = store.apiAvailable ? 'bg-green-100' : injectedConfig.isStatic ? 'bg-[#eeeeee]' : 'bg-pink-100'

  return (
    <div css={style}>
      <h1 className="h1 mb-8">Dashboard</h1>
      <p className="mb-4">
        Welcome to Nitro, a modular React/Express base project, styled using Tailwind 🚀.
      </p>
      <p className="text-gray-700">
        <span className={`inline-flex items-center gap-x-1.5 rounded-md ${bgColor} px-1.5 py-0.5 text-xs font-medium ${textColor}`}>
          <svg viewBox="0 0 6 6" aria-hidden="true" className={`size-1.5 ${fillColor}`}>
            <circle r={3} cx={3} cy={3} />
          </svg>
          { store.apiAvailable ? 'API Available' : `API Unavailable${injectedConfig.isStatic ? ' (Static Example)' : ''}` }
        </span>
      </p>
    </div>
  )
}

const style = css`
  .example-usage-of-tailwind-variable {
    color: ${theme('colors.dark')};
  }
`