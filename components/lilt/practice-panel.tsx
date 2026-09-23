'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, RotateCcw, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { measuredWpm, type NAME_TESTS } from '@/lib/pivot-engine'
import type { ComposerController } from '@/hooks/use-composer'

type PracticeProps = {
  composer: ComposerController
  challenge: (typeof NAME_TESTS)[number]
  completed: boolean
  onNext: () => void
  onRestart: () => void
}

export function PracticePanel({ composer, challenge, completed, onNext, onRestart }: PracticeProps) {
  const [now, setNow] = useState(0)
  const startedAt = composer.state.startedAt
  useEffect(() => {
    if (startedAt === null || completed) return
    setNow(performance.now())
    const timer = setInterval(() => setNow(performance.now()), 250)
    return () => clearInterval(timer)
  }, [startedAt, completed])

  const elapsed = startedAt === null ? 0 : Math.max(0, (completed ? composer.state.lastInputAt ?? startedAt : now) - startedAt)
  const score = completed && composer.state.padOnly && elapsed >= 1000 ? measuredWpm(composer.text, elapsed) : null
  let matched = 0
  while (matched < composer.text.length && matched < challenge.text.length && composer.text[matched] === challenge.text[matched]) matched++
  const percent = Math.round(matched / challenge.text.length * 100)
  const hasMistake = !challenge.text.startsWith(composer.text)

  return (
    <section className="name-test" aria-label="Exact spelling benchmark">
      <div className="test-heading"><h3>{completed ? 'Your spelling. Exactly.' : challenge.title}</h3><span className="test-clock font-mono"><Timer className="size-4" aria-hidden="true" />{(elapsed / 1000).toFixed(1)}s</span></div>
      <p className="test-target" aria-label={`Spell exactly: ${challenge.text}`}><span className="text-primary">{challenge.text.slice(0, matched)}</span>{challenge.text.slice(matched)}</p>
      <div className="test-progress" role="progressbar" aria-label="Exact name completion" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${percent}%` }} /></div>
      <p className="test-hint" role="status">{completed ? <><Check className="size-4" aria-hidden="true" />{score === null ? 'Exact match. No pad-speed score for mixed input or sub-second tests.' : `${score} net WPM · ${composer.state.actions} input actions`}</> : hasMistake ? 'Not quite the same spelling. Delete or undo, then keep going.' : challenge.hint}</p>
      <div className="test-actions"><span>{startedAt === null ? 'Time starts on first input.' : 'Case and accents count.'}</span><div><Button variant="quiet" size="icon" onClick={onRestart} aria-label="Restart name test"><RotateCcw /></Button><Button variant={completed ? 'default' : 'outline'} size="touch" onClick={onNext}>Next name<ArrowRight data-icon="inline-end" /></Button></div></div>
      {completed && score !== null && <p className="test-method">5 characters = 1 word. Corrections and pauses included. A short practice result, not a speech-speed benchmark.</p>}
    </section>
  )
}
