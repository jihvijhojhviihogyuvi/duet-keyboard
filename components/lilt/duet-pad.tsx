'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, MousePointer2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThumbPad } from '@/components/lilt/thumb-pad'
import { DirectionGlyph } from '@/components/lilt/direction-glyph'
import { BACKSPACE, DIRECTIONS, KEYSETS, applyCase, chordIsPending, chordText, chordToken, describeToken, displayToken, initialChordState, transitionChord, type CaseMode, type ChordAction, type ChordCommit, type Direction, type Hand, type Keyset } from '@/lib/duet-engine'
import type { InputTiming } from '@/hooks/use-composer'

export type ChordPreview = { text: string; active: boolean }
type DuetPadProps = {
  caseMode: CaseMode
  keyset: Keyset
  preceding: string
  demoRequest: number
  disabled: boolean
  onCommit: (text: string, timing: InputTiming) => void
  onBackspace: () => void
  onPreview: (preview: ChordPreview) => void
}
type PlayedChord = ChordCommit & { token: string; text: string }
type DemoFrame = { left: Direction | null; right: Direction | null; text: string; message: string }

const KEY_BINDINGS: Record<string, { hand: Hand; direction: Direction }> = {
  q: { hand: 'left', direction: 0 }, w: { hand: 'left', direction: 1 }, e: { hand: 'left', direction: 2 },
  d: { hand: 'left', direction: 3 }, s: { hand: 'left', direction: 4 }, a: { hand: 'left', direction: 5 },
  u: { hand: 'right', direction: 0 }, i: { hand: 'right', direction: 1 }, o: { hand: 'right', direction: 2 },
  l: { hand: 'right', direction: 3 }, k: { hand: 'right', direction: 4 }, j: { hand: 'right', direction: 5 },
}

function groupLabels(keyset: Keyset, caseMode: CaseMode): string[] {
  if (keyset === 'letters') return ['a–f', 'g–l', 'm–r', 's–x', 'y · z', 'tools'].map((text) => applyCase(text, caseMode === 'lower' ? 'lower' : 'upper'))
  return Array.from({ length: 6 }, (_, row) => `${displayToken(KEYSETS[keyset][row * 6])} · ${displayToken(KEYSETS[keyset][row * 6 + 5])}`)
}

export function DuetPad({ caseMode, keyset, preceding, demoRequest, disabled, onCommit, onBackspace, onPreview }: DuetPadProps) {
  const chordRef = useRef(initialChordState())
  const handlers = useRef({ onCommit, onBackspace, onPreview, caseMode, keyset, preceding })
  const pressedKeys = useRef<Partial<Record<Hand, string>>>({})
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const shownDemo = useRef(0)
  const [state, setState] = useState(chordRef.current)
  const [last, setLast] = useState<PlayedChord | null>(null)
  const [demo, setDemo] = useState<DemoFrame | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => { handlers.current = { onCommit, onBackspace, onPreview, caseMode, keyset, preceding } }, [onCommit, onBackspace, onPreview, caseMode, keyset, preceding])

  function stopDemo() {
    demoTimers.current.forEach(clearTimeout)
    demoTimers.current = []
    setDemo(null)
  }

  function send(action: ChordAction) {
    const result = transitionChord(chordRef.current, action)
    chordRef.current = result.state
    setState(result.state)
    const current = handlers.current
    if (result.commit) {
      const token = chordToken(result.commit.left, result.commit.right, current.keyset)!
      const text = chordText(token, current.caseMode, current.preceding)
      setLast({ ...result.commit, token, text })
      if (token === BACKSPACE) current.onBackspace()
      else current.onCommit(text, { startedAt: result.commit.startedAt, endedAt: result.commit.endedAt, stroke: true })
    }
    const pendingToken = chordToken(result.state.directions.left, result.state.directions.right, current.keyset)
    current.onPreview({ active: chordIsPending(result.state), text: pendingToken ? chordText(pendingToken, current.caseMode, current.preceding) : '' })
  }

  function cancel() {
    stopDemo()
    pressedKeys.current = {}
    send({ type: 'cancel' })
    setLast(null)
  }

  useEffect(() => {
    setReady(true)
    const cancelOnBlur = () => {
      chordRef.current = initialChordState()
      pressedKeys.current = {}
      setState(chordRef.current)
      handlers.current.onPreview({ text: '', active: false })
    }
    window.addEventListener('blur', cancelOnBlur)
    return () => {
      window.removeEventListener('blur', cancelOnBlur)
      demoTimers.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    chordRef.current = initialChordState()
    setState(chordRef.current)
    setLast(null)
    setDemo(null)
    demoTimers.current.forEach(clearTimeout)
  }, [keyset])

  useEffect(() => {
    if (!demoRequest || keyset !== 'letters' || shownDemo.current === demoRequest) return
    shownDemo.current = demoRequest
    demoTimers.current.forEach(clearTimeout)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frames: [number, DemoFrame | null][] = reducedMotion ? [
      [0, { left: 1, right: 1, text: 'H', message: 'Both thumbs up → H. Your draft is unchanged.' }],
    ] : [
      [0, { left: 1, right: null, text: '', message: 'Left thumb up selects the g–l group.' }],
      [750, { left: 1, right: 1, text: 'H', message: 'Right thumb up selects h. Lift either thumb.' }],
      [1900, { left: 1, right: 2, text: 'i', message: 'Up + up-right makes i. The result: Hi.' }],
      [3400, null],
    ]
    demoTimers.current = frames.map(([delay, frame]) => setTimeout(() => setDemo(frame), delay))
    return () => demoTimers.current.forEach(clearTimeout)
  }, [demoRequest, keyset])

  function keyboardDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || event.keyCode === 229 || event.altKey || event.metaKey || event.ctrlKey) return
    if (event.key === 'Escape') { event.preventDefault(); cancel(); return }
    const key = event.key.toLowerCase()
    const binding = KEY_BINDINGS[key]
    if (!binding || event.repeat || disabled || state.waitingForRelease || pressedKeys.current[binding.hand]) return
    event.preventDefault()
    stopDemo()
    if (chordRef.current.pointers[binding.hand] !== null) return
    pressedKeys.current[binding.hand] = key
    const pointer = binding.hand === 'left' ? -1 : -2
    send({ type: 'begin', hand: binding.hand, pointer, at: performance.now() })
    send({ type: 'move', hand: binding.hand, pointer, direction: binding.direction })
  }

  function keyboardUp(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.key.toLowerCase()
    const binding = KEY_BINDINGS[key]
    if (!binding || pressedKeys.current[binding.hand] !== key) return
    event.preventDefault()
    delete pressedKeys.current[binding.hand]
    send({ type: 'end', hand: binding.hand, pointer: binding.hand === 'left' ? -1 : -2, at: performance.now() })
  }

  const pending = chordIsPending(state)
  const left = demo ? demo.left : state.directions.left
  const right = demo ? demo.right : state.directions.right
  const readoutLeft = left ?? (!pending && last ? last.left : null)
  const readoutRight = right ?? (!pending && last ? last.right : null)
  const token = chordToken(left, right, keyset)
  const feedback = demo ? demo.text : token ? displayToken(applyCase(token, caseMode)) : !pending && last ? displayToken(last.token === BACKSPACE ? BACKSPACE : last.text) : ''
  const rightLabels = left === null ? Array.from({ length: 6 }, () => '') : KEYSETS[keyset].slice(left * 6, left * 6 + 6).map((value) => displayToken(applyCase(value, caseMode)))
  const message = demo ? 'REHEARSAL · NOT WRITING' : state.waitingForRelease ? 'RELEASE YOUR OTHER THUMB' : left !== null && right !== null ? 'LIFT EITHER THUMB TO WRITE' : left !== null ? 'NOW ADD YOUR RIGHT THUMB' : right !== null ? 'NOW ADD YOUR LEFT THUMB' : last ? 'CHORD WRITTEN' : 'YOUR NEXT CHORD'

  return (
    <div className="duet-input" data-ready={ready} data-layer={keyset} onKeyDown={keyboardDown} onKeyUp={keyboardUp} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && Object.keys(pressedKeys.current).length) cancel() }}>
      <div className="chord-monitor" data-active={pending || !!demo}>
        <div className="monitor-heading"><span className="font-mono">{message}</span>{pending ? <Button variant="quiet" size="icon" onClick={cancel} aria-label="Cancel current chord"><X /></Button> : <span className="monitor-layer">{keyset === 'pairs' ? 'Two letters at once' : 'Literal, not predicted'}</span>}</div>
        <div className="chord-equation" aria-live="polite" aria-atomic="true">
          <span className="chord-part font-mono" data-set={left !== null}>{readoutLeft !== null ? <><DirectionGlyph direction={readoutLeft} className="size-8" /><span className="sr-only">Left {DIRECTIONS[readoutLeft].name}</span></> : '·'}</span>
          <span className="chord-operator">+</span>
          <span className="chord-part font-mono" data-set={right !== null}>{readoutRight !== null ? <><DirectionGlyph direction={readoutRight} className="size-8" /><span className="sr-only">Right {DIRECTIONS[readoutRight].name}</span></> : '·'}</span>
          <ArrowRight className="chord-result-arrow size-5" aria-hidden="true" />
          <span className="chord-result font-mono" data-testid="chord-result" aria-label={token ? describeToken(token) : feedback || 'No chord selected'}>{feedback || '—'}</span>
        </div>
      </div>
      <div className="thumb-pair" role="group" aria-label="Duet chord instrument" aria-describedby="duet-instructions" tabIndex={0}>
        {(['left', 'right'] as const).map((hand) => <ThumbPad
          key={hand}
          hand={hand}
          labels={hand === 'left' ? groupLabels(keyset, caseMode) : rightLabels}
          selected={hand === 'left' ? left : right}
          demo={!!demo}
          disabled={disabled}
          blocked={state.waitingForRelease}
          onBegin={(side, pointer) => { stopDemo(); send({ type: 'begin', hand: side, pointer, at: performance.now() }) }}
          onMove={(side, pointer, direction) => send({ type: 'move', hand: side, pointer, direction })}
          onEnd={(side, pointer) => send({ type: 'end', hand: side, pointer, at: performance.now() })}
          onChoose={(side, direction) => { stopDemo(); send({ type: 'choose', hand: side, direction, at: performance.now() }) }}
          onCancel={cancel}
        />)}
      </div>
      <p className="pad-instruction" id="duet-instructions">{demo ? demo.message : 'Flick both thumbs. Lift either to write.'}</p>
      <div className="mouse-alternative"><MousePointer2 className="size-3.5" aria-hidden="true" /><span>One pointer: left, then right.</span></div>
      <p className="sr-only">Start each flick anywhere inside its pad. A 14-pixel movement selects a direction. Returning to the starting point clears that thumb. You can also click the direction labels. With the instrument focused, use Q W E D S A for left directions and U I O L K J for right directions. Press Escape to cancel.</p>
    </div>
  )
}
