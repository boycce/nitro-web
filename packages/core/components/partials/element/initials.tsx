import { twMerge } from 'nitro-web/util'

type NamedSize = 'big' | 'medium' | 'normal' | 'small'
type Size = NamedSize | number

type InitialsProps = {
  initials: string,
  color?: string, // e.g. '#067306' or 'text-primary'
  colorBg?: string, // e.g. '#06730618' or 'bg-primary' (if not passed, color will be used)
  opacityBg?: number, // e.g. 0.18
  colors?: string[], // e.g. ['#067306']
  size?: Size, // named ('big', 'medium', 'small') or pixel number (e.g. 20)
  isRound?: boolean
  className?: string
}

// Returns tailwind classes for the nearest named size bucket
function sizeClasses(size: Size): string {
  const px = typeof size === 'number' ? size : { big: 30, medium: 26, normal: 24, small: 21 }[size]
  if (px <= 21) return 'size-[21px] text-[10px]'
  else if (px <= 24) return 'size-[24px] text-[11px]' // default
  else if (px <= 26) return 'size-[26px] text-[12px]'
  else return 'size-[30px] text-[13px]'
}

export function Initials({ initials, color, colorBg, colors, opacityBg, size, isRound, className }: InitialsProps) {
  // Check if className colors were passed
  const colorFgClass = color?.startsWith('text-') ? color : undefined
  const colorBgClass = colorBg?.startsWith('bg-') ? colorBg : undefined
  if ((colorFgClass || colorBgClass) && (!color || !colorBg)) {
    throw new Error('When using className colors, `color` and `colorBg` params are required')
  }
  // Check if hex colors were passed, otherwise use the color by letter
  const colorFgHex = colorFgClass ? undefined : (color || getColorByLetter(initials, colors))
  const colorBgHex = colorBgClass ? undefined : (colorBg || colorFgHex)

  const sizeStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {}

  return (
    <span
      style={{ color: colorFgHex, ...sizeStyle }}
      className={twMerge(
        (
          'nitro-initials inline-flex items-center justify-center font-bold text-[11px] size-[24px] relative rounded-md ' +
          `overflow-hidden ring-1 ring-inset ring-[#00000012] ${colorFgClass}`
        ),
        sizeClasses(size || 'normal'),
        isRound && 'rounded-full',
        !initials && 'w-0',
        className
      )}
    >
      <span 
        style={colorBgHex ? { backgroundColor: colorBgHex } : {}} 
        className={`absolute inset-0  ${opacityBg || 'opacity-[10%]'} ${colorBgClass}`}
      />
      {initials}
    </span>
  )
}

export function getColorByLetter(letter: string, colors?: string[]) {
  const colors2 = colors || ['#067306', '#AA33FF', '#FF54AF', '#F44336', '#c03c3c', '#5451e0', '#d88c1b']
  const charIndex = letter.toLowerCase().charCodeAt(0) - 97
  const charIndexLimited = (charIndex < 0 || charIndex > 25) ? 25 : charIndex
  const index = Math.round(charIndexLimited / 25 * (colors2.length-1))
  return colors2[index]
}