import { twMerge } from 'nitro-web/util'

type InitialsProps = {
  icon?: { initials: string, hex: string }
  isBig?: boolean
  isMedium?: boolean
  isSmall?: boolean
  isRound?: boolean
  className?: string
}

export function Initials({ icon, isBig, isMedium, isSmall, isRound, className }: InitialsProps) {
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
      style={icon ? {backgroundColor: icon?.hex + '15', color: icon?.hex} : {}}
    >
      {icon?.initials}
    </span>
  )
}