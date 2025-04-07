import { css } from 'twin.macro'
import { Outlet } from 'react-router-dom'
import { Message, Sidebar, SidebarProps } from 'nitro-web'

export function Layout1({ Logo, menu, links, config }: SidebarProps) {
  // Dashboard, app screens (only the <Outlet/> receives `params` and `location`)
  return (
    <div css={style} class="bg-[#F3F3F3]">
      <Message />
      <div class="flex-1">
        <div class="wrapper lg:flex min-h-[100%] w-[100%] bg-[#FDFDFD] shadow-[0_0_40px_0_rgb(237_237_237)]">
          <Sidebar Logo={Logo} menu={menu} links={links} config={config} />
          <div class="py-10 px-14 flex-1">
            <Outlet />
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
`

