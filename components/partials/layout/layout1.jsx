import { css } from 'twin.macro'
import { Outlet } from 'react-router-dom'
import { Message } from '../element/message.jsx'
import { Sidebar } from '../element/sidebar.jsx'

// Dashboard, app screens (only the <Outlet/> receives `params` and `location`)
export function Layout1({ Logo }) {
  const [store] = sharedStore.useTracked()

  return (
    <div css={style} class="bg-[#F3F3F3]">
      <Message />
      <div class="flex-1">
        <div class="wrapper lg:flex min-h-[100%] w-[100%] bg-[#FDFDFD] shadow-[0_0_40px_0_rgb(237_237_237)]">
          <Sidebar Logo={Logo} />
          <div class="py-10 px-14 flex-1" key={store?.company?._id}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

const style = () => css`
  .wrapper {
    position: relative;
    max-width: 1800px;
    margin: 0 auto;
  }
`

