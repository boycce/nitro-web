// Example of extending the Button component with a new colors, or even overriding the existing ones
import { Button as BaseButton } from 'nitro-web'

type BaseButtonProps = React.ComponentProps<typeof BaseButton>
type ButtonProps = Omit<BaseButtonProps, 'color'> & { color?: BaseButtonProps['color'] | 'blue-light' }

export function Button({ color='primary', ...props }: ButtonProps) {
  const extraColors = {
    // Override or add new colors
    'blue-light': 'bg-blue-100 hover:bg-blue-200 text-blue-900 ring-blue-300',
  }

  return (
    <BaseButton
      color={color in extraColors ? 'custom' : color as BaseButtonProps['color']}
      customColor={color in extraColors ? extraColors[color as keyof typeof extraColors] : undefined}
      {...props}
    />
  )
}