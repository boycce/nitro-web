import { twMerge } from 'nitro-web/util'

type InitialsProps = {
  icon?: { initials: string, hex?: string }
  isBig?: boolean
  isMedium?: boolean
  isSmall?: boolean
  isRound?: boolean
  className?: string
}

export function Initials({ icon, isBig, isMedium, isSmall, isRound, className }: InitialsProps) {
  const color = icon?.hex || icon?.initials && getColorByLetter(icon?.initials) || '#000000'
  return (
    <span 
      className={twMerge(
        'nitro-initials flex items-center justify-center rounded-[5px] font-bold text-[11px] size-[24px]',
        isBig && 'size-[40px] text-sm',
        isMedium && 'size-[30px] text-xs',
        isSmall && 'size-[22px]',
        isRound && 'rounded-full',
        !icon && 'w-0',
        className
      )}
      style={icon ? {backgroundColor: color + '18', color: color} : {}}
    >
      {icon?.initials}
    </span>
  )
}

export function getColorByLetter(letter: string) {
  const colors = ['#067306', '#AA33FF', '#FF54AF', '#F44336', '#c03c3c', '#5451e0', '#d88c1b']
  const charIndex = letter.toLowerCase().charCodeAt(0) - 97
  const charIndexLimited = (charIndex < 0 || charIndex > 25) ? 25 : charIndex
  const index = Math.round(charIndexLimited / 25 * (colors.length-1))
  return colors[index]
}