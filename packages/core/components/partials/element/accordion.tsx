import { css } from 'twin.macro'
import { IsFirstRender } from 'nitro-web'

type AccordionProps = {
  ariaControls?: string // pass to add aria-controls attribute to the accordion
  children: React.ReactNode // first child is the header, second child is the contents
  className?: string
  classNameWhenExpanded?: string // handy for group styling
  expanded?: boolean // initial value (or controlled value if onChange is passed)
  onChange?: (event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, index: number) => void 
    // called when the header is clicked
}

export function Accordion({ ariaControls, children, className, classNameWhenExpanded, expanded, onChange }: AccordionProps) {
  const [preState, setPreState] = useState(expanded)
  const [state, setState] = useState(expanded)
  const [height, setHeight] = useState('auto')
  const isFirst = IsFirstRender()
  const el = useRef<HTMLDivElement>(null)
  const style = css`
    &>:last-child {
      height: 0;
      overflow: hidden;
      transition: height ease 0.2s;
      a, button {
        visibility: hidden;   /* removes from tab order */
        transition: visibility 0s 0.2s;
      }
    }
    &.is-expanded > *:last-child {
      height: ${height.replace('-', '')};
      a, button {
        visibility: visible;
        transition: visibility 0s;
      }
    }
  `

  useEffect(() => {
    // Overrite local state
    setPreState(expanded)
  }, [expanded])

  useEffect(() => {
    // Calulcate height first before opening and closing
    if (!isFirst) {
      setHeight((_o) => el.current?.children[1].scrollHeight + 'px' + (preState ? '-' : ''))
    }
  }, [preState])

  useEffect(() => {
    // Open and close
    if (height == 'auto') return
    if (preState) var timeout = setTimeout(() => setHeight('auto'), 200)
    // Wait for dom reflow after 2 frames
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (preState) setState(true)
        else setState(false)
      })
    })
    return () => timeout && clearTimeout(timeout)
  }, [height])

  const onClick = function(e: React.MouseEvent<HTMLDivElement>|React.KeyboardEvent<HTMLDivElement>) {
    // Click came from inside the accordion header/summary
    if (e.currentTarget.children[0].contains(e.target as HTMLElement) || e.currentTarget.children[0] == e.target) {
      if (onChange) {
        onChange(e, getElementIndex(e.currentTarget))
      } else {
        setPreState(o => !o)
      }
    }
  }

  const getElementIndex = function(node: HTMLElement) {
    let index = 0
    while ((node = node.previousElementSibling as HTMLElement)) index++
    return index
  }

  const onKeyDown = function(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(e)
    }
  }

  return (
    <div
      ref={el}
      aria-controls={ariaControls}
      aria-expanded={ariaControls ? state : undefined}
      class={['accordion', className, state ? `is-expanded ${classNameWhenExpanded}` : '', 'nitro-accordion'].filter(o => o).join(' ')}
      onClick={onClick}
      onKeyDown={onKeyDown}
      css={style}
    >
      {children}
    </div>
  )
}
