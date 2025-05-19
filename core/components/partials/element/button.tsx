import { twMerge } from 'tailwind-merge'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'

type Button = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: 'primary'|'secondary'|'black'|'white'
  size?: 'xs'|'sm'|'md'|'lg'
  className?: string
  isLoading?: boolean
  IconLeft?: React.ReactNode|'v'
  IconLeftEnd?: React.ReactNode|'v'
  IconRight?: React.ReactNode|'v'
  IconRightEnd?: React.ReactNode|'v'
  children?: React.ReactNode|'v'
}

export function Button({ 
  size='md', 
  color='primary',
  className, 
  isLoading, 
  IconLeft, 
  IconLeftEnd, 
  IconRight, 
  IconRightEnd, 
  children, 
  ...props 
}: Button) {
  // const size = (color.match(/xs|sm|md|lg/)?.[0] || 'md') as 'xs'|'sm'|'md'|'lg'
  const iconPosition = IconLeft ? 'left' : IconLeftEnd ? 'leftEnd' : IconRight ? 'right' : IconRightEnd ? 'rightEnd' : 'none'
  const base = 
    'relative inline-block text-center font-medium shadow-sm focus-visible:outline focus-visible:outline-2 ' +
    'focus-visible:outline-offset-2 text-white [&>.loader]:border-white'

  // Button colors, you can use custom colors by using className instead
  const colors = {
    primary: 'bg-primary hover:bg-primary-hover',
    secondary: 'bg-secondary hover:bg-secondary-hover',
    black: 'bg-black hover:bg-gray-700',
    white: 'bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 text-gray-900 [&>.loader]:border-black',
  }
  
  // Button sizes
  const sizes = {
    xs: 'px-2 py-1 px-button-x-xs py-button-y-xs text-xs rounded',
    sm: 'px-2.5 py-1.5 px-button-x-sm py-button-y-sm text-sm rounded-md',
    md: 'px-3 py-2 px-button-x py-button-y text-sm rounded-md',
    lg: 'px-3.5 py-2.5 px-button-x-lg py-button-y-lg text-sm rounded-md',
  }

  const contentLayout = `w-full gap-x-1.5 ${iconPosition == 'none' ? '' : 'inline-flex items-center justify-center'}`
  const loading = isLoading ? '[&>*]:opacity-0 text-opacity-0' : ''

  function getIcon(Icon: React.ReactNode | 'v') {
    if (Icon == 'v' || Icon == 'down') return <ChevronDownIcon className="size-5 -my-6 -mx-1" />
    if (Icon == '^' || Icon == 'up') return <ChevronUpIcon className="size-5 -my-6 -mx-1" />
    else return Icon
  }
  
  return (
    <button class={twMerge(`${base} ${colors[color]} ${sizes[size]} ${contentLayout} ${loading} nitro-button ${className||''}`)} {...props}>
      {IconLeft && getIcon(IconLeft)}
      {IconLeftEnd && getIcon(IconLeftEnd)}
      <span class={`${iconPosition == 'leftEnd' || iconPosition == 'rightEnd' ? 'flex-1' : ''}`}>{children}</span>
      {IconRight && getIcon(IconRight)}
      {IconRightEnd && getIcon(IconRightEnd)}
      {
        isLoading &&
        <span className={
          'loader !opacity-100 absolute top-[50%] left-[50%] w-[1rem] h-[1rem] ml-[-0.5rem] mt-[-0.5rem] ' +
          'rounded-full animate-spin border-2 !border-t-transparent'
        } />
      }
    </button>
  )
}
