import { s3Image } from '../../../util.js'
import { Initials } from './initials.jsx'

export function Avatar({ awsUrl, isRound, user, showPlaceholderImage, className }) {
  const classes = 'rounded-full w-[30px] h-[30px] object-cover transition-all duration-150 ease ' + (className || '')

  function getInitials(user) {
    const text = (user.firstName ? [user.firstName, user.lastName] : user.name.split(' ')).map((o) => o.charAt(0))
    if (text.length == 1) return text[0]
    if (text.length > 1) return `${text[0]}${text[text.length - 1]}`
    return ''
  }

  function getHex(user) {
    let colors = ['#067306', '#AA33FF', '#FF54AF', '#F44336', '#c03c3c', '#7775f2', '#d88c1b']
    let charIndex = (user.firstName||'a').toLowerCase().charCodeAt(0) - 97
    let charIndexLimited = (charIndex < 0 || charIndex > 25) ? 25 : charIndex
    let index = Math.round(charIndexLimited / 25 * (colors.length-1))
    return colors[index]
  }

  return (
    user.avatar 
    ? <img class={classes} src={s3Image(awsUrl, user.avatar, 'small')} /> 
    : showPlaceholderImage ? <img class={classes} src="/assets/imgs/icons/user.svg" width="30px" /> 
    : <Initials class={classes} icon={{ initials: getInitials(user), hex: getHex(user) }} isRound={isRound} isMedium={true} />
  )
}
