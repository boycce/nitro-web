import { css } from 'twin.macro'
import { Outlet } from 'react-router-dom'
import { Message } from 'nitro-web'
import { Config } from 'types'

// Signin, reset password, etc
export function Layout2({ Logo, config }: { Logo: React.ComponentType<{ alt: string; width: string }>, config: Config }) {
  return (
    <div css={style} class="bg-[#F3F3F3]">
      <Message />
      <div class="wrapper bg-[#FDFDFD] shadow-[0_0_40px_0_rgb(237_237_237)] flex flex-col min-h-full w-full">
        <div class="flex-1 w-full wrapper-2 px-5 py-10">
          <div class="border-b mb-6">
            <Link to="/signin" class="logo relative block -ml-1 -mt-1 p-1">
              <Logo alt={config?.name || 'Nitro'} width="60" />
            </Link>
          </div>
          <Outlet />
        </div>

        <div class="wrapper-2 w-full px-5 pb-4 flex items-center text-sm text-[#1F1F1F]">
          <ul class="flex-1 flex gap-4 list-style-none">
            <li><Link class="underline1" to="/">Home</Link></li>
            <li><Link class="underline1" to="/about">About</Link></li>
            <li><Link class="underline1" to="/support">Support</Link></li>
          </ul>
          <div>
            2025 © {config?.name || 'Nitro'}
          </div>
        </div>

      </div>
    </div>
  )
}

const style = css`
  .wrapper {
    position: relative;
    max-width: 1800px;
    margin: 0 auto;
  }
  .wrapper-2 {
    max-width: 700px;
    margin: 0 auto;
    box-sizing: border-box;
  }
`
