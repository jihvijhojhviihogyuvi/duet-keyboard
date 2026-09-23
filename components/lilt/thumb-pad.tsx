'use client'

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { DirectionGlyph } from '@/components/lilt/direction-glyph'
import { DIRECTIONS, FLICK_THRESHOLD, directionFromVector, type Direction, type Hand, type Point } from '@/lib/duet-engine'

export type ThumbPadProps = {
  hand: Hand
  labels: readonly string[]
  selected: Direction | null
  demo: boolean
  disabled: boolean
  blocked: boolean
  onBegin: (hand: Hand, pointer: number) => void
  onMove: (hand: Hand, pointer: number, direction: Direction | null) => void
  onEnd: (hand: Hand, pointer: number) => void
  onChoose: (hand: Hand, direction: Direction) => void
  onCancel: () => void
}

type Touch = { pointer: number; origin: Point; rect: DOMRect; moved: boolean; direction: Direction | null; tap: Direction | null }
type TouchVisual = { origin: Point; offset: Point } | null

export function ThumbPad({ hand, labels, selected, demo, disabled, blocked, onBegin, onMove, onEnd, onChoose, onCancel }: ThumbPadProps) {
  const touchRef = useRef<Touch | null>(null)
  const [visual, setVisual] = useState<TouchVisual>(null)

  function updateTouch(event: PointerEvent<HTMLDivElement>, touch: Touch) {
    const vector = { x: event.clientX - touch.rect.left - touch.origin.x, y: event.clientY - touch.rect.top - touch.origin.y }
    if (Math.hypot(vector.x, vector.y) >= FLICK_THRESHOLD) touch.moved = true
    touch.direction = directionFromVector(vector, touch.direction)
    const snapDistance = Math.min(touch.rect.width, touch.rect.height) * 0.27
    const snappedOffset = touch.direction === null
      ? vector
      : { x: DIRECTIONS[touch.direction].x * snapDistance, y: DIRECTIONS[touch.direction].y * snapDistance }
    setVisual({ origin: touch.origin, offset: snappedOffset })
    onMove(hand, touch.pointer, touch.direction)
  }

  function cancel(pointer?: number) {
    if (!touchRef.current || (pointer !== undefined && touchRef.current.pointer !== pointer)) return
    touchRef.current = null
    setVisual(null)
    onCancel()
  }

  return (
    <div className="thumb-instrument">
      <div className="thumb-caption"><span>{hand === 'left' ? 'Left thumb' : 'Right thumb'}</span><span className="font-mono">{hand === 'left' ? 'THE GROUP' : 'THE CHARACTER'}</span></div>
      <div
        className="thumb-surface"
        data-testid={`${hand}-pad`}
        data-selected={selected !== null}
        data-contact={visual !== null}
        data-demo={demo}
        role="group"
        aria-label={`${hand === 'left' ? 'Left' : 'Right'} thumb pad`}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (disabled || blocked || touchRef.current || event.button !== 0) return
          event.preventDefault()
          const rect = event.currentTarget.getBoundingClientRect()
          const origin = { x: event.clientX - rect.left, y: event.clientY - rect.top }
          const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-direction]')
          const tap = button ? Number(button.dataset.direction) as Direction : null
          touchRef.current = { pointer: event.pointerId, origin, rect, moved: false, direction: null, tap }
          event.currentTarget.setPointerCapture(event.pointerId)
          setVisual({ origin, offset: { x: 0, y: 0 } })
          onBegin(hand, event.pointerId)
        }}
        onPointerMove={(event) => {
          const touch = touchRef.current
          if (!touch || touch.pointer !== event.pointerId) return
          event.preventDefault()
          updateTouch(event, touch)
        }}
        onPointerUp={(event) => {
          const touch = touchRef.current
          if (!touch || touch.pointer !== event.pointerId) return
          event.preventDefault()
          updateTouch(event, touch)
          if (!touch.moved && touch.tap !== null) onMove(hand, touch.pointer, touch.tap)
          touchRef.current = null
          setVisual(null)
          onEnd(hand, event.pointerId)
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={(event) => cancel(event.pointerId)}
        onLostPointerCapture={(event) => cancel(event.pointerId)}
      >
        <div className="thumb-track" aria-hidden="true" />
        <div className="thumb-home" aria-hidden="true"><span className="font-mono">{hand === 'left' ? 'L' : 'R'}</span><span>start anywhere</span></div>
        {DIRECTIONS.map((direction, index) => (
          <button
            key={direction.name}
            type="button"
            className="direction-target"
            data-direction={index}
            data-selected={selected === index}
            disabled={disabled || blocked}
            aria-label={`${hand === 'left' ? 'Left' : 'Right'} thumb ${direction.name}${labels[index] ? `: ${labels[index]}` : ''}`}
            aria-pressed={selected === index}
            style={{ '--direction-x': `${50 + direction.x * 35}%`, '--direction-y': `${50 + direction.y * 37}%` } as CSSProperties}
            onClick={(event) => {
              if (event.detail === 0) onChoose(hand, index as Direction)
            }}
          ><span className="direction-arrow"><DirectionGlyph direction={index as Direction} className="size-5" /></span><span className="direction-token font-mono">{labels[index] || '·'}</span></button>
        ))}
        {visual && <div className="touch-vector" aria-hidden="true" style={{ left: visual.origin.x, top: visual.origin.y }}><span className="touch-origin" /><span className="touch-connection" style={{ width: Math.hypot(visual.offset.x, visual.offset.y), transform: `rotate(${Math.atan2(visual.offset.y, visual.offset.x)}rad)` }} /><span className="touch-end" style={{ transform: `translate(${visual.offset.x}px, ${visual.offset.y}px)` }} /></div>}
      </div>
    </div>
  )
}
