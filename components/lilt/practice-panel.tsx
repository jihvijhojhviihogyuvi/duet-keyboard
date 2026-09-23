'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, RotateCcw, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { effectiveWpm, normalizedText, type CHALLENGES } from '@/lib/phrase-folds'
import type { ComposerController } from '@/hooks/use-composer'

type Challenge = (typeof CHALLENGES)[number]

type PracticeProps = {
  composer: ComposerController
  challenge: Challenge
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
    const timer = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(timer)
  }, [startedAt, completed])

  const elapsed = startedAt === null ? 0 : Math.max(0, (completed ? composer.state.lastInputAt ?? startedAt : now) - startedAt)
  const wpm = completed ? effectiveWpm(composer.text, elapsed) : null
  const target = normalizedText(challenge.text)
  const text = normalizedText(composer.text)
  let matching = 0
  while (matching < text.length && matching < target.length && text[matching] === target[matching]) matching++
  const percent = Math.round(matching / target.length * 100)

  return (
    <section className="practice-banner" aria-label="Guided speed practice">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Timer className="size-4" /><h2 className="eyebrow">{completed ? 'THOUGHT COMPLETE' : 'A LITTLE PRACTICE'}</h2></div>
        <span className="font-mono text-sm tabular-nums" aria-label="Elapsed time">{(elapsed / 1000).toFixed(1)}s{wpm !== null ? ` · ${wpm} effective WPM` : ''}</span>
      </div>
      <div className="pt-3 pb-4">
        <p className="practice-target text-pretty">{challenge.text}</p>
      </div>
      <div className="practice-progress" role="progressbar" aria-label="Target thought completion" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${percent}%` }} /></div>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
        <p className="text-sm text-muted-foreground">{completed ? <span className="flex items-center gap-2"><Check className="size-4" />{composer.state.touches} touches. All your own.</span> : composer.state.startedAt === null ? 'Follow the green folds. Time starts on your first touch.' : percent === 100 ? 'Finish your thought below.' : 'Follow the green folds, then finish your thought.'}</p>
        <div className="flex items-center gap-1">
          <Button variant="quiet" size="touch" onClick={onRestart} aria-label="Restart practice"><RotateCcw /></Button>
          <Button variant={completed ? 'mint' : 'quiet'} size="touch" onClick={onNext}>{completed ? 'Next thought' : 'Change thought'}<ArrowRight data-icon="inline-end" /></Button>
        </div>
      </div>
      {completed && <p className="pt-2 text-sm leading-relaxed text-muted-foreground" role="status">This is guided, phrase-expanded output—not a standard typing score. Five output characters count as one word; thinking and corrections are included.</p>}
    </section>
  )
}
