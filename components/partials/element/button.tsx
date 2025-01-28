import { twMerge } from 'tailwind-merge'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

type Props = {
  color?: 'primary'|'secondary'|'white'
  size?: 'xs'|'sm'|'md'|'lg'
  className?: string
  isLoading?: boolean
  IconLeft?: React.ReactNode|'v'
  IconRight?: React.ReactNode|'v'
  IconRight2?: React.ReactNode|'v'
  children?: React.ReactNode|'v'
  [key: string]: unknown
}

export function Button({ color='primary', size='md', className, isLoading, IconLeft, IconRight, IconRight2, children, ...props }: Props) {
  // const size = (color.match(/xs|sm|md|lg/)?.[0] || 'md') as 'xs'|'sm'|'md'|'lg'
  const iconPosition = IconLeft ? 'left' : IconRight ? 'right' : IconRight2 ? 'right2' : 'none'
  const base = 'relative inline-block font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

  // Button types
  const primary = 'bg-primary text-white shadow-sm hover:bg-primary-hover focus-visible:outline-primary'
  const secondary = 'bg-secondary text-white shadow-sm hover:bg-secondary-hover focus-visible:outline-secondary'
  const white = 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm hover:bg-gray-50'

  // Button sizes
  const sizes = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-2.5 py-1.5 text-sm rounded-md',
    md: 'px-3 py-2 text-sm rounded-md',
    lg: 'px-3.5 py-2.5 text-sm rounded-md',
  }

  // Icon position
  const contentLayouts = {
    left: 'w-full inline-flex items-center gap-x-1.5',
    right: 'w-full inline-flex items-center gap-x-1.5',
    right2: 'w-full inline-flex items-center justify-between gap-x-1.5',
    none: 'w-full gap-x-1.5',
  }

  let colorAndSize = ''
  if (color.match(/primary/)) colorAndSize = `${primary} ${sizes[size]}`
  else if (color.match(/secondary/)) colorAndSize = `${secondary} ${sizes[size]}`
  else if (color.match(/white/)) colorAndSize = `${white} ${sizes[size]}`

  const contentLayout = `${contentLayouts[iconPosition]}`
  const loading = isLoading ? '[&>*]:opacity-0 text-opacity-0' : ''

  function getIcon(Icon: React.ReactNode | 'v') {
    if (Icon == 'v') return <ChevronDownIcon className="size-6 -my-6 -mx-1" />
    else return Icon
  }
  
  return (
    <button class={twMerge(`${base} ${colorAndSize} ${contentLayout} ${loading} ${className||''}`)} {...props}>
      {IconLeft && getIcon(IconLeft)}
      {children}
      {IconRight && getIcon(IconRight)}
      {IconRight2 && getIcon(IconRight2)}
      {
        isLoading && 
        <span class="!opacity-100 absolute inset-0 flex items-center justify-center">
          <span className="w-4 h-4 rounded-full animate-spin border-2 border-t-transparent border-white" />
        </span>
      }
    </button>
  )
}
