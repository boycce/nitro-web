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
  // Check if hex colors were passed, otherwise use the themed color by letter
  const colorFgHex = colorFgClass ? undefined : (color || getColorByLetter(initials, colors))
  const colorBgHex = colorBgClass ? undefined : (colorBg || colorFgHex)

  const sizeStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {}

  return (
    <span
      style={{ color: colorFgHex, ...sizeStyle }}
      className={twMerge(
        (
          'nitro-initials flex-shrink-0 inline-flex items-center justify-center font-bold text-[11px] size-[24px] relative rounded-md ' +
          `overflow-hidden ring-1 ring-inset ring-foreground/10 ${colorFgClass}`
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

// Default palette lives in nitro-web/client/css/theme.css (--initials-1..7) so it can differ per theme
export function getColorByLetter(letter: string, colors?: string[]) {
  const colors2 = colors || [1, 2, 3, 4, 5, 6, 7].map(i => `rgb(var(--initials-${i}))`)
  const charIndex = letter.toLowerCase().charCodeAt(0) - 97
  const charIndexLimited = (charIndex < 0 || charIndex > 25) ? 25 : charIndex
  const index = Math.round(charIndexLimited / 25 * (colors2.length-1))
  return colors2[index]
}