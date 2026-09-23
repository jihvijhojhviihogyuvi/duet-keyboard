'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { MoveUpRight, Repeat2 } from 'lucide-react'
import { decodeStroke, distance, KEYSETS, keyAt, keyCenter, REPEAT, simplifyPath, spellTokens, type CaseMode, type Keyset, type PadGeometry, type Point, type StrokeToken } from '@/lib/pivot-engine'
import type { InputTiming } from '@/hooks/use-composer'

export type StrokePreview = { text: string; active: boolean }

type PivotPadProps = {
  caseMode: CaseMode
  keyset: Keyset
  preceding: string
  demoRequest: number
  disabled?: boolean
  onCommit: (text: string, timing: InputTiming) => void
  onPreview: (preview: StrokePreview) => void
}

type ActiveStroke = {
  pointerId: number
  points: Point[]
  rect: DOMRect
  geometry: PadGeometry
  keys: readonly string[]
  caseMode: CaseMode
  preceding: string
  startedAt: number
}

type PadView = { indices: number[]; current: number | null; text: string; active: boolean; demo: boolean }
const EMPTY_VIEW: PadView = { indices: [], current: null, text: '', active: false, demo: false }

export function PivotPad({ caseMode, keyset, preceding, demoRequest, disabled = false, onCommit, onPreview }: PivotPadProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokeRef = useRef<ActiveStroke | null>(null)
  const frameRef = useRef(0)
  const demoFrameRef = useRef(0)
  const shownDemoRequest = useRef(0)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressClickUntil = useRef(0)
  const handlersRef = useRef({ onCommit, onPreview })
  const [ready, setReady] = useState(false)
  const [view, setView] = useState<PadView>(EMPTY_VIEW)
  const keys = KEYSETS[keyset]

  useEffect(() => { handlersRef.current = { onCommit, onPreview } }, [onCommit, onPreview])

  function paint(points: readonly Point[], tokens: readonly StrokeToken[] = []) {
    const canvas = canvasRef.current
    const surface = surfaceRef.current
    if (!canvas || !surface) return
    const width = surface.clientWidth
    const height = surface.clientHeight
    const scale = Math.min(window.devicePixelRatio || 1, 3)
    if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
    }
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.clearRect(0, 0, width, height)
    if (!points.length) return
    const styles = getComputedStyle(surface)
    context.strokeStyle = styles.getPropertyValue('--primary').trim()
    context.fillStyle = styles.getPropertyValue('--card').trim()
    context.lineWidth = 2.5
    context.lineJoin = 'round'
    context.lineCap = 'round'
    context.globalAlpha = 0.55
    context.beginPath()
    context.moveTo(points[0].x, points[0].y)
    for (const point of points.slice(1)) context.lineTo(point.x, point.y)
    context.stroke()
    context.globalAlpha = 1
    for (const token of tokens) {
      context.beginPath()
      context.arc(token.point.x, token.point.y, 4, 0, Math.PI * 2)
      context.fill()
      context.stroke()
    }
  }

  function stopVisuals() {
    cancelAnimationFrame(frameRef.current)
    cancelAnimationFrame(demoFrameRef.current)
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }

  function clearPreview() {
    stopVisuals()
    strokeRef.current = null
    paint([])
    setView(EMPTY_VIEW)
    handlersRef.current.onPreview({ text: '', active: false })
  }

  useEffect(() => {
    setReady(true)
    const surface = surfaceRef.current
    if (!surface) return
    const observer = new ResizeObserver(() => {
      if (strokeRef.current) clearPreview()
      else paint([])
    })
    observer.observe(surface)
    return () => { observer.disconnect(); stopVisuals() }
    // Pointer lifecycles use refs so pointer moves never recreate observers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!demoRequest || keyset !== 'letters' || shownDemoRequest.current === demoRequest) return
    shownDemoRequest.current = demoRequest
    stopVisuals()
    const surface = surfaceRef.current
    if (!surface) return
    const geometry = { width: surface.clientWidth, height: surface.clientHeight }
    const vertices = ['z', 'a', 'r', 'a'].map((letter) => keyCenter(KEYSETS.letters.indexOf(letter), geometry))
    const start = performance.now()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    function animate(now: number) {
      const progress = reducedMotion ? 3 : Math.min(3, Math.max(0, (now - start - 250) / 700))
      const segment = Math.min(2, Math.floor(progress))
      const amount = progress === 3 ? 1 : progress - segment
      const points: Point[] = [vertices[0]]
      for (let edge = 0; edge <= segment; edge++) {
        const portion = edge === segment ? amount : 1
        for (let step = 1; step <= Math.max(1, Math.ceil(portion * 20)); step++) {
          const ratio = Math.min(portion, step / 20)
          points.push({ x: vertices[edge].x + (vertices[edge + 1].x - vertices[edge].x) * ratio, y: vertices[edge].y + (vertices[edge + 1].y - vertices[edge].y) * ratio })
        }
      }
      const tokens = decodeStroke(points, geometry, KEYSETS.letters)
      paint(points, tokens)
      setView({ indices: tokens.map((token) => token.index), current: tokens.at(-1)?.index ?? null, text: spellTokens(tokens, 'once'), active: false, demo: true })
      if (progress < 3) demoFrameRef.current = requestAnimationFrame(animate)
    }
    demoFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(demoFrameRef.current)
    // A demo is an explicit, non-writing action; normal state updates must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoRequest, keyset])

  useEffect(() => {
    if (!strokeRef.current) { paint([]); setView(EMPTY_VIEW) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyset])

  function showStroke(stroke: ActiveStroke) {
    const tokens = decodeStroke(stroke.points, stroke.geometry, stroke.keys)
    const text = spellTokens(tokens, stroke.caseMode, stroke.preceding)
    const current = keyAt(stroke.points[stroke.points.length - 1], stroke.geometry, stroke.keys)
    paint(stroke.points, tokens)
    setView({ indices: tokens.map((token) => token.index), current, text, active: true, demo: false })
    handlersRef.current.onPreview({ text, active: true })
  }

  function begin(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || strokeRef.current || event.button !== 0) return
    event.preventDefault()
    stopVisuals()
    const rect = event.currentTarget.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const geometry = { width: rect.width, height: rect.height }
    if (keyAt(point, geometry, keys) === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const stroke: ActiveStroke = { pointerId: event.pointerId, points: [point], rect, geometry, keys, caseMode, preceding, startedAt: performance.now() }
    strokeRef.current = stroke
    showStroke(stroke)
  }

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    const stroke = strokeRef.current
    if (!stroke || event.pointerId !== stroke.pointerId) return
    event.preventDefault()
    const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? []
    const events = coalesced.length ? coalesced : [event.nativeEvent]
    for (const sample of events) {
      const point = { x: sample.clientX - stroke.rect.left, y: sample.clientY - stroke.rect.top }
      if (distance(stroke.points[stroke.points.length - 1], point) >= 1.5) stroke.points.push(point)
    }
    if (stroke.points.length > 2048) stroke.points = simplifyPath(stroke.points, Math.min(stroke.geometry.width / 5, stroke.geometry.height / 6) * 0.07)
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => { if (strokeRef.current === stroke) showStroke(stroke) })
  }

  function end(event: ReactPointerEvent<HTMLDivElement>) {
    const stroke = strokeRef.current
    if (!stroke || event.pointerId !== stroke.pointerId) return
    event.preventDefault()
    cancelAnimationFrame(frameRef.current)
    const endpoint = { x: event.clientX - stroke.rect.left, y: event.clientY - stroke.rect.top }
    if (keyAt(endpoint, stroke.geometry, stroke.keys) === null) { clearPreview(); return }
    stroke.points.push(endpoint)
    const tokens = decodeStroke(stroke.points, stroke.geometry, stroke.keys)
    const text = spellTokens(tokens, stroke.caseMode, stroke.preceding)
    const traveled = stroke.points.some((point) => distance(stroke.points[0], point) > 12)
    strokeRef.current = null
    suppressClickUntil.current = performance.now() + 500
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    handlersRef.current.onCommit(text, { startedAt: stroke.startedAt, endedAt: performance.now(), stroke: traveled })
    handlersRef.current.onPreview({ text: '', active: false })
    paint(stroke.points, tokens)
    setView({ indices: tokens.map((token) => token.index), current: null, text, active: false, demo: false })
    resetTimer.current = setTimeout(() => { paint([]); setView(EMPTY_VIEW) }, 1200)
  }

  return (
    <div className="pivot-input" data-ready={ready}>
      <div className="stroke-readout" aria-live="off">
        <span className="readout-label font-mono">{view.demo ? 'DEMO ONLY' : view.active ? 'LIVE STROKE' : view.text ? 'COMMITTED' : 'TOUCH · TURN · LIFT'}</span>
        <span className="readout-value font-mono">{view.text || <MoveUpRight className="size-4" aria-hidden="true" />}</span>
      </div>
      <div
        ref={surfaceRef}
        className="pivot-surface"
        role="group"
        aria-label="Exact letter gesture pad"
        aria-describedby="pivot-instructions"
        data-testid="pivot-surface"
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => clearPreview()}
        onLostPointerCapture={() => { if (strokeRef.current) clearPreview() }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <canvas ref={canvasRef} className="stroke-canvas" aria-hidden="true" />
        {keys.map((key, index) => (
          <button
            key={`${keyset}-${index}`}
            type="button"
            className="pivot-key"
            data-key={key}
            data-active={view.current === index}
            data-in-path={view.indices.includes(index)}
            disabled={disabled}
            aria-label={key === REPEAT ? 'Repeat last character' : `Type ${caseMode === 'lower' ? key : key.toLocaleUpperCase()}`}
            onClick={(event) => {
              if (event.detail !== 0 && performance.now() < suppressClickUntil.current) return
              if (strokeRef.current) return
              stopVisuals()
              paint([])
              setView(EMPTY_VIEW)
              const now = performance.now()
              const text = spellTokens([{ key }], caseMode, preceding)
              handlersRef.current.onCommit(text, { startedAt: now, endedAt: now, stroke: false })
            }}
          >
            <span className="key-glyph">{key === REPEAT ? <Repeat2 className="size-5" aria-hidden="true" /> : caseMode === 'lower' ? key : key.toLocaleUpperCase()}</span>
          </button>
        ))}
      </div>
      <p className="pad-instruction" id="pivot-instructions">Bend on a letter to select it. Or simply tap.</p>
    </div>
  )
}
