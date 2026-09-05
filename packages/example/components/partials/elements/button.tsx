// Example of extending the Button component with a new colors and sizes, and overriding the existing values
import { Button as BaseButton } from 'nitro-web'

type BaseButtonProps = React.ComponentProps<typeof BaseButton>
type ButtonProps = Omit<BaseButtonProps, 'color' | 'size'> & { 
  color?: BaseButtonProps['color'] | keyof typeof colors
  size?: BaseButtonProps['size'] | keyof typeof sizes
}

// Extend the existing colors or sizes
const colors = {
  'blue-light': 'bg-blue-100 hover:bg-blue-200 text-blue-900 ring-blue-300',
}
const sizes = {
  //...
}

export function Button({ color='primary', size='md', ...props }: ButtonProps) {
  return (
    <BaseButton
      color={color in colors ? 'custom' : color as BaseButtonProps['color']}
      size={size in sizes ? 'custom' : size as BaseButtonProps['size']}
      customColor={color in colors ? colors[color as keyof typeof colors] : undefined}
      customSize={size in sizes ? sizes[size as keyof typeof sizes] : undefined}
      {...props}
    />
  )
}