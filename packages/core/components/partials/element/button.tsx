import { twMerge } from 'nitro-web'
import { ChevronDown, ChevronUp } from 'lucide-react'

type Button = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: 'primary'|'secondary'|'black'|'dark'|'white'|'clear'|'custom'
  size?: 'xs'|'sm'|'md'|'lg'
  customColor?: string
  className?: string
  isLoading?: boolean
  IconLeft?: React.ReactNode|'v'
  IconLeftEnd?: React.ReactNode|'v'
  IconRight?: React.ReactNode|'v'
  IconRightEnd?: React.ReactNode|'v'
  IconCenter?: React.ReactNode|'v'
  children?: React.ReactNode|'v'
}

export function Button({
  size='md', 
  color='primary',
  customColor,
  className, 
  isLoading, 
  IconLeft, 
  IconLeftEnd, 
  IconRight, 
  IconRightEnd,
  IconCenter,
  children,
  type='button',
  ...props 
}: Button) {
  // const size = (color.match(/xs|sm|md|lg/)?.[0] || 'md') as 'xs'|'sm'|'md'|'lg'
  const iconPosition = 
    IconLeft ? 'left' : IconLeftEnd ? 'leftEnd' : IconRight ? 'right' : IconRightEnd ? 'rightEnd' : IconCenter ? 'center' : 'none'
  const base = 
    'relative inline-flex items-center justify-center text-center font-medium shadow-sm focus-visible:outline ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 ring-inset ring-1' + (children ? '' : ' aspect-square')

  // Button colors, you can use custom colors by using className instead
  const colors = {
    'primary': 'bg-primary hover:bg-primary-hover ring-transparent text-white [&>.loader]:border-white',
    'secondary': 'bg-secondary hover:bg-secondary-hover ring-transparent text-white [&>.loader]:border-white',
    'black': 'bg-black hover:bg-gray-800 ring-transparent text-white [&>.loader]:border-white',
    'dark': 'bg-gray-800 hover:bg-gray-700 ring-transparent text-white [&>.loader]:border-white',
    'white': 'bg-white hover:bg-gray-50 ring-gray-300 text-gray-900 [&>.loader]:border-black', // maybe change to text-foreground
    'clear': 'hover:bg-gray-50 ring-gray-300 text-foreground [&>.loader]:border-foreground !shadow-none',
  }
  
  // Button sizes (px is better for height consistency)
  const sizes = {
    xs: 'px-[6px]  h-[25px] px-button-x-xs h-button-h-xs text-xs !text-button-xs rounded',
    sm: 'px-[10px] h-[32px] px-button-x-sm h-button-h-sm text-button-md text-button-sm rounded-md',
    md: 'px-[12px] h-[38px] px-button-x-md h-button-h-md text-button-md rounded-md', // default
    lg: 'px-[18px] h-[42px] px-button-x-lg h-button-h-lg text-button-md !text-button-lg rounded-md',
  }
  
  const appliedColor = color === 'custom' ? customColor : colors[color]
  const contentLayout = `gap-x-1.5 ${iconPosition == 'none' ? '' : ''}`
  const loading = isLoading ? '[&>*]:opacity-0 text-opacity-0' : ''

  function getIcon(Icon: React.ReactNode | 'v') {
    if (Icon == 'v' || Icon == 'down') return <ChevronDown size={16.5} className="mt-[-1.4rem] mb-[-1.5rem] -mx-0.5" />
    if (Icon == '^' || Icon == 'up') return <ChevronUp size={16.5} className="mt-[-1.4rem] mb-[-1.5rem] -mx-0.5" />
    else return Icon
  }
  
  return (
    <button
      type={type} 
      class={twMerge(`${base} ${sizes[size]} ${appliedColor} ${contentLayout} ${loading} nitro-button ${className||''}`)} 
      {...props}
    >
      {
        IconCenter && 
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {getIcon(IconCenter)}
        </span>
      }
      {(IconLeft || IconLeftEnd) && getIcon(IconLeft || IconLeftEnd)}
      <span class={`flex items-center ${iconPosition == 'leftEnd' || iconPosition == 'rightEnd' ? 'flex-1 justify-center' : ''}`}>
        <span className="w-0">&nbsp;</span> {/* for min-height */}
        {children}
      </span>
      {(IconRight || IconRightEnd) && getIcon(IconRight || IconRightEnd)}
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
