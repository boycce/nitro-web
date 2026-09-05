import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { twMerge } from 'nitro-web'
import { Info } from 'lucide-react'

type Side = 'top' | 'bottom' | 'left' | 'right'
type IconProps = { size?: number; className?: string; tabIndex?: number; onClick?: () => void }

// Position the bubble relative to the trigger (spacing adds the gap)
const pos = {
  top: 'bottom-full left-1/2 -translate-x-1/2',
  bottom: 'top-full left-1/2 -translate-x-1/2',
  left: 'right-full top-1/2 -translate-y-1/2',
  right: 'left-full top-1/2 -translate-y-1/2',
}

const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const perp: Record<Side, Side[]> = {
  top: ['right', 'left'], bottom: ['right', 'left'], left: ['bottom', 'top'], right: ['bottom', 'top'],
}

export type TooltipProps = {
  content: React.ReactNode
  /** let the mouse move onto the bubble without closing */
  contentHoverable?: boolean
  children?: React.ReactNode
  className?: string
  /** trigger used when no children, click pins it open */
  DefaultIcon?: React.ComponentType<IconProps>
  /** px the invisible trigger area extends past the icon/children */
  hitbox?: number
  /** class for the default icon, e.g. to change its colour */
  iconClassName?: string
  maxWidth?: number
  /** force open, ignoring hover/focus */
  open?: boolean
  side?: Side
  /** px gap between trigger and bubble */
  spacing?: number
  // Anything else lands on the wrapper, so a parent like Dropdown can attach its handlers to a wrapped trigger
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'content' | 'className' | 'children'>

// Hover/focus tooltip that flips to the side with room, and stays placed while scrolling
export function Tooltip({
  content, contentHoverable, hitbox = 5, DefaultIcon = Info, maxWidth = 245, open, side = 'top', spacing = 6, className, iconClassName,
  children,
  ...rest
}: TooltipProps) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false) // kept open by clicking the default icon
  const [actualSide, setActualSide] = useState(side)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isOpen = open ?? (pinned || hover)
  const gap = {
    top: { marginBottom: spacing },
    bottom: { marginTop: spacing },
    left: { marginRight: spacing },
    right: { marginLeft: spacing },
  }[actualSide]

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // Close the pinned tooltip when clicking outside the component
  useEffect(() => {
    if (!pinned) return
    const onDown = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setPinned(false) }
    addEventListener('mousedown', onDown)
    return () => removeEventListener('mousedown', onDown)
  }, [pinned])

  // Place on show, and keep placed while scrolling/resizing
  useLayoutEffect(() => {
    if (!isOpen) return
    const place = () => {
      const wrap = wrapRef.current, bubble = bubbleRef.current
      if (wrap && bubble) setActualSide(pick(side, spacing, wrap.getBoundingClientRect(), bubble.getBoundingClientRect(), getClip(wrap)))
    }
    place()
    // rAF throttle so each open tooltip only reflows once per frame while scrolling
    let raf = 0
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place) }
    addEventListener('scroll', onMove, true)
    addEventListener('resize', onMove)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onMove, true)
      removeEventListener('resize', onMove)
    }
  }, [isOpen, side, spacing])

  // Hover handlers; when contentHoverable, delay close so the mouse can cross the gap onto the bubble.
  // Hover is tracked even while `open` controls the bubble, so handing control back doesn't restore a stale hover
  const show = () => { clearTimeout(closeTimer.current); setHover(true) }
  const hide = () => {
    if (contentHoverable) closeTimer.current = setTimeout(() => setHover(false), 100)
    else setHover(false)
  }

  return (
    <span
      {...rest}
      ref={wrapRef}
      className="relative inline-flex nitro-tooltip"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* invisible hitbox so the trigger is easier to hover/click */}
      <span
        aria-hidden
        style={{ inset: -hitbox }}
        className={`absolute ${children ? '' : 'cursor-help'}`}
        onClick={children ? undefined : () => setPinned(p => !p)}
      />
      {children ?? (
        <DefaultIcon
          size={14}
          tabIndex={0}
          className={twMerge('cursor-help outline-none', pinned ? 'text-primary' : 'text-[#9A9A9A]', iconClassName)}
          onClick={() => setPinned(p => !p)}
        />
      )}
      {isOpen && (
        <span
          ref={bubbleRef}
          role="tooltip"
          style={{ maxWidth, ...gap }}
          className={twMerge(
            'absolute z-50 w-max px-4 py-3 rounded-lg bg-black text-white text-xs font-medium shadow-md',
            // interactive when pinned or hoverable so links/text/hover work, else click-through
            pinned || contentHoverable ? 'pointer-events-auto' : 'pointer-events-none',
            pos[actualSide],
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}

// Tightest clipping bounds: viewport intersected with scrollable/clipped ancestors
function getClip(el: HTMLElement) {
  const clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight }
  for (let p = el.parentElement; p; p = p.parentElement) {
    const s = getComputedStyle(p)
    if (!/auto|scroll|hidden|clip/.test(s.overflow + s.overflowX + s.overflowY)) continue
    const r = p.getBoundingClientRect()
    clip.left = Math.max(clip.left, r.left)
    clip.top = Math.max(clip.top, r.top)
    clip.right = Math.min(clip.right, r.right)
    clip.bottom = Math.min(clip.bottom, r.bottom)
  }
  return clip
}

// Pick the first side that fits within clip, else the one with the most spare space
function pick(side: Side, gap: number, t: DOMRect, b: DOMRect, clip: ReturnType<typeof getClip>): Side {
  const space = { top: t.top - clip.top, bottom: clip.bottom - t.bottom, left: t.left - clip.left, right: clip.right - t.right }
  const need = { top: b.height + gap, bottom: b.height + gap, left: b.width + gap, right: b.width + gap }
  const order: Side[] = [side, opposite[side], ...perp[side]]
  return order.find(s => space[s] >= need[s]) || order.sort((a, c) => (space[c] - need[c]) - (space[a] - need[a]))[0]
}
