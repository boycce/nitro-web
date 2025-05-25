
import { css } from 'twin.macro'
import { IsFirstRender } from 'nitro-web'

type AccordionProps = {
  children: React.ReactNode
  className?: string
  expanded?: boolean
  onChange?: (event: React.MouseEvent<HTMLDivElement>, index: number) => void
}

export function Accordion({ children, className, expanded, onChange }: AccordionProps) {
  /**
   * @param {rxjs} children - first child is the header, second child is the contents
   *   <Accordion>
   *     <div>Header</div><div>Contents</div>
   *   </Accordion>
   * @param {boolean} <expanded> - initial value (or controlled value if onChange is passed)
   * @param {function} <onChange> - called when the header is clicked
   */
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
    }
    &.is-expanded > div:last-child {
      height: ${height.replace('-', '')};
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

  const onClick = function(e: React.MouseEvent<HTMLDivElement>) {
    // Click came from inside the accordion header/summary
    if (e.currentTarget.children[0].contains(e.target as Node) || e.currentTarget.children[0] == e.target) {
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

  return (
    <div
      ref={el}
      class={['accordion', className, state ? 'is-expanded' : ''].filter(o => o).join(' nitro-accordion')}
      onClick={onClick}
      css={style}
    >
      {children}
    </div>
  )
}
