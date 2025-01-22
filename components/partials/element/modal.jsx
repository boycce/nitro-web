// todo: finish tailwind conversion
import { css } from '@emotion/react'
import { IsFirstRender } from '../is-first-render.js'
import SvgX1 from '../../../client/imgs/icons/x1.svg'

export function Modal({ show, setShow, children, className, maxWidth, minHeight, dismissable = true }) {
  const [state, setState] = useState()
  const containerEl = useRef()
  const isFirst = IsFirstRender()

  useEffect(() => {
    createScrollbarClasses()
    return () => {
      elementWithScrollbar().classList.remove('scrollbarPadding')
    } // cleanup
  }, [])

  useEffect(() => {
    if (show) {
      elementWithScrollbar().classList.add('scrollbarPadding')
      setState('modal-open')
    } else if (!isFirst) {
      // Dont close if first render (forgot what use case this was needed for)
      setTimeout(() => {
        // If another modal is being opened, force close the container for a smoother transition
        if (document.getElementsByClassName('modal-open').length > 1) {
          setState('modal-close-immediately')
        } else {
          setState('')
          elementWithScrollbar().classList.remove('scrollbarPadding')
        }
      }, 10)
    }
  // There is a bug during hot-reloading where the modal does't open if we don't ensure 
  // the same truthy/falsey type is used.
  }, [!!show])

  function elementWithScrollbar() {
    // this needs to be non-body element otherwise the Modal.jsx doesn't open/close smoothly
    //document.getElementsByTagName('body')[0] // document.getElementsByClassName('page')[0]
    return document.getElementById('app')
  }
  
  function onClick(e) {
    let clickedOnContainer = containerEl.current && containerEl.current.contains(e.target)
    if (!clickedOnContainer && dismissable) {
      setShow(false)
    }
  }

  function createScrollbarClasses() {
    /**
     *  Creates reusable margin and padding classes containing the scrollbar width and
     *  sets window.scrollbarWidth
     *  @return width
     */
    if (typeof window.scrollbarWidth !== 'undefined') return

    var outer = document.createElement('div')
    outer.style.visibility = 'hidden'
    outer.style.width = '100px'
    outer.style.margin = '0px'
    outer.style.padding = '0px'
    outer.style.border = '0'
    document.body.appendChild(outer)

    var widthNoScroll = outer.offsetWidth
    // force scrollbars
    outer.style.overflow = 'scroll'

    // add innerdiv
    var inner = document.createElement('div')
    inner.style.width = '100%'
    outer.appendChild(inner)

    var widthWithScroll = inner.offsetWidth

    // Remove divs
    outer.parentNode.removeChild(outer)
    let width = (window.scrollbarWidth = widthNoScroll - widthWithScroll)

    // Create new inline stylesheet and append to the head
    let style = document.createElement('style')
    let css = (
      '.scrollbarPadding {padding-right:' + width + 'px !important; overflow:hidden !important;}' +
      '.scrollbarMargin {margin-right:' + width + 'px !important; overflow:hidden !important;}'
    )
    style.type = 'text/css'
    if (style.styleSheet) style.styleSheet.cssText = css //<=IE8
    else style.appendChild(document.createTextNode(css))
    document.getElementsByTagName('head')[0].appendChild(style)

    return width
  }

  return (
    <div css={style} class={`${state}`} onClick={(e) => e.stopPropagation()}>
      <div class="modal-bg wrapper scrollbarPadding"></div>
      <div class="modal-container">
        {/* we also need to be able to scroll without closing */}
        <div onMouseDown={onClick}> 
          <div 
            ref={containerEl} 
            style={{ maxWidth: maxWidth || '740px', minHeight: typeof minHeight == 'undefined' ? '487px' : minHeight }} 
            class={`modal1 ${className}`}
          >
            <div class="modal-close" onClick={() => { if (dismissable) { setShow(false) }}}><SvgX1 /></div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

const style = () => css`
  /* Modal structure */
  & {
    position: fixed;
    top: 0;
    width: 100%;
    height: calc(100vh);
    z-index: 699;
    .modal-bg {
      position: absolute !important;
      display: flex;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      box-sizing: content-box;
      &:before {
        content: '';
        display: block;
        flex: 1;
        background: rgba(255, 255, 255, 0.82);
        /* backdrop-filter: blur(1px);
        -webkit-backdrop-filter: blur(1px); */
      }
    }
    .modal-container {
      position: relative;
      height: calc(100vh);
      // horisontal centering
      > div {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        // vertical centering
        > div {
          margin: 30px 20px 90px;
          width: 100%;
        }
      }
    }
    &.modal-close-immediately {
      .modal-container > div > div {
        transition: none !important;
      }
    }
  }

  /* Animation */

  & {
    left: -100%;
    transition: left 0s 0.2s;
  }
  .modal-bg {
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .modal-container {
    /*overflow: hidden;*/
    overflow-y: scroll;
    overflow-x: auto;
  }
  .modal-container > div > div {
    opacity: 0;
    transform: scale(0.97);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  &.modal-open {
    left: 0;
    transition: none;
    .modal-bg {
      opacity: 1;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .modal-container {
      overflow-y: scroll;
      overflow-x: auto;
    }
    .modal-container > div > div {
      opacity: 1;
      transform: scale(1);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
  }

  /* Modal customisations */

  .modal1 {
    background: white;
    border: 2px solid #27242C;
    box-shadow: 0px 1px 29px rgba(31, 29, 36, 0.07);
    border-radius: 8px;
    .subtitle {
      margin-bottom: 34px; // same as form pages
    }
    .modal-close {
      position: absolute;
      margin: 10px;
      padding: 15px 20px;
      top: 0;
      right: 0;
      cursor: pointer;
      line {
        transition: all 0.1s;
      }
      &:hover {
        line {
          /* stroke: theme'colors.primary-dark'; */
        }
      }
    }
  }
`
