import { Link, useLocation } from 'react-router-dom'
import { getIsActive, twMerge } from 'nitro-web'

export type TabsProps = {
  tabs: {
    label: React.ReactNode
    to?: string
    toMatcher?: (pathname: string, search?: string) => boolean
    disabled?: boolean
  }[]
  className?: string
}

// Underlined link tabs, the active tab is matched against the current location
export function Tabs({ tabs, className }: TabsProps) {
  const location = useLocation()
  return (
    <div className={twMerge('relative flex gap-10 items-end', className)}>
      {tabs.map((tab, i) => {
        const isActive = getIsActive(location, tab)
        return (
          <Link
            key={i}
            className={`relative h4 mb-0 pb-[8px] leading-[18px] text-foreground select-none ${tab.disabled ? 'cursor-not-allowed' : ''}`}
            to={tab.to || ''}
            draggable={false}
            onClick={tab.disabled ? (e) => e.preventDefault() : undefined}
          >
            <span>{tab.label}</span>
            <span className={`absolute bottom-0 left-0 w-full h-[3px] bg-primary ${isActive ? 'opacity-100' : 'opacity-0'}`} />
          </Link>
        )
      })}
    </div>
  )
}
