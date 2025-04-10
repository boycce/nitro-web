import { Initials } from 'nitro-web'
import { s3Image } from 'nitro-web/util'
import noImage from 'nitro-web/client/imgs/no-image.svg'
import avatarImg from 'nitro-web/client/imgs/avatar.jpg'
import { User } from 'nitro-web/types'

type AvatarProps = {
  awsUrl: string
  isRound?: boolean
  user: User,
  showPlaceholderImage?: boolean
  className?: string
}

export function Avatar({ awsUrl, isRound, user, showPlaceholderImage, className }: AvatarProps) {
  const classes = 'rounded-full w-[30px] h-[30px] object-cover transition-all duration-150 ease ' + (className || '')

  function getInitials(user: User) {
    const text = (user.firstName ? [user.firstName, user.lastName] : (user?.name||'').split(' ')).map((o) => o?.charAt(0))
    if (text.length == 1) return text[0] || ''
    if (text.length > 1) return `${text[0]}${text[text.length - 1]}`
    return ''
  }

  function getHex(user: User) {
    const colors = ['#067306', '#AA33FF', '#FF54AF', '#F44336', '#c03c3c', '#7775f2', '#d88c1b']
    const charIndex = (user.firstName||'a').toLowerCase().charCodeAt(0) - 97
    const charIndexLimited = (charIndex < 0 || charIndex > 25) ? 25 : charIndex
    const index = Math.round(charIndexLimited / 25 * (colors.length-1))
    return colors[index]
  }

  return (
    user.avatar 
    ? <img class={classes} src={s3Image(awsUrl, user.avatar, 'small') || noImage} /> 
    : showPlaceholderImage ? <img class={classes} src={avatarImg} width="30px" /> 
    : <Initials className={classes} icon={{ initials: getInitials(user), hex: getHex(user) }} isRound={isRound} isMedium={true} />
  )
}

