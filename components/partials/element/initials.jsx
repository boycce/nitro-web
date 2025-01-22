import { css } from 'twin.macro'

export function Initials({ icon, isBig, isMedium, isSmall, isRound, className }) {
  return (
    <span 
      css={style} 
      class={
        'initials-square' +
        (isBig ? ' is-big' : '') + 
        (isMedium ? ' is-medium' : '') + 
        (isSmall ? ' is-small' : '') + 
        (isRound ? ' is-round' : '') + 
        (icon ? '' : ' is-empty') + 
        (className ? ' ' + className : '')
      }
      style={icon ? {backgroundColor: icon?.hex + '15', color: icon?.hex} : {}}
    >
      {icon?.initials}
    </span>
  )
}

const style = (_theme) => css`
  // seen in input.jsx
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-weight: 700;
  font-size: 11px;
  width: 24px;
  height: 24px;
  // new
  &.is-medium {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }
  // seen in select.jsx
  &.is-small {
    width: 22px;
    height: 22px;
    font-size: 11px;
  }
  &.is-big {
    width: 48px;
    height: 48px;
    font-size: 14px;
  }
  &.is-round {
    border-radius: 50%;
  }
  &.is-empty {
    width: 0;
  }
`