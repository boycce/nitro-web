// todo: finish tailwind conversion
import { css } from '@emotion/react'

export function Tooltip({ text, children, className, classNamePopup, isSmall }) {
  return (
    <div class={`${className} relative inline-block align-middle`} css={style}>
      {
        text?.length || text?.props
        ? <>
            <div class="tooltip-trigger ">{children}</div>
            <div class={`tooltip-popup ${classNamePopup||''} ${isSmall ? 'is-small' : ''}`}>{text}</div>
          </>
        : children
      }
    </div>
  )
}

const style = () => css`
  .tooltip-popup {
    position: absolute;
    display: block;
    margin-top: -10000px;
    width: 200px;
    padding: 14px;
    font-weight: 400;
    font-size: 11.5px;
    line-height: 1.3;
    letter-spacing: 0.5px;
    text-align: center;
    border-radius: 6px;
    background: black;
    color: white;
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease, margin-top 0s 0.15s;
    white-space: break-spaces;
    overflow-wrap: break-word;
    pointer-events: none;
    z-index: 9999;
    &:after {
      content: '';
      position: absolute;
      border-width: 6px;
      border-style: solid;
    }
    // Variation
    &.is-small {
      width: 160px;
      padding: 10px;
      font-size: 11px;
    }
    // Positions
    &.is-top, 
    &.is-top-left,
    &:not(.is-top-left):not(.is-left):not(.is-right):not(.is-bottom):not(.is-bottom-left) {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-15px);
      &:after {
        top: 100%;
        left: 50%;
        margin-left: -6px;
        border-color: black transparent transparent transparent;
      }
      &.is-top-left {
        left: 0px;
        transform: translateX(0%) translateY(-15px);
        &:after {
          left: 28px;
        }
      }
    }
    &.is-bottom,
    &.is-bottom-left {
      top: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(15px) ;
      &:after {
        bottom: 100%;
        left: 50%;
        margin-left: -6px;
        border-color: transparent transparent black transparent;
      }
      &.is-bottom-left {
        left: 0px;
        transform: translateX(0%) translateY(15px);
        &:after {
          left: 28px;
        }
      }
    }
    &.is-left  {
      top: 50%;
      right: 100%;
      transform: translateX(-15px) translateY(-50%);
      &:after {
        top: 50%;
        right: -12px;
        margin-top: -6px;
        border-color: transparent transparent transparent black;
      }
    }
    &.is-right  {
      top: 50%;
      left: 100%;
      transform: translateX(15px) translateY(-50%);
      &:after {
        top: 50%;
        left: -12px;
        margin-top: -6px;
        border-color: transparent black transparent transparent;
      }
    }
  }
  .tooltip-trigger {
    /* trigger can come before tooltip-popup or wrap it */
    position: relative !important;
    &:hover .tooltip-popup,
    &:hover + .tooltip-popup,
    .tooltip-popup.is-active,
    & + .tooltip-popup.is-active {
      opacity: 1;
      margin-top: 0;
      transition: opacity 0.15s ease, transform 0.15s ease, margin-top 0s 0s;
      &.is-top,
      &:not(.is-top-left):not(.is-left):not(.is-right):not(.is-bottom):not(.is-bottom-left) {
        transform: translateX(-50%) translateY(-10px);
      }
      &.is-top-left {
        transform: translateX(0%) translateY(-10px);
      }
      &.is-bottom {
        transform: translateX(-50%) translateY(10px);
      }
      &.is-bottom-left {
        transform: translateX(0%) translateY(10px);
      }
      &.is-left {
        transform: translateX(-10px) translateY(-50%);
      }
      &.is-right {
        transform: translateX(10px) translateY(-50%);
      }
    }
  }
`
