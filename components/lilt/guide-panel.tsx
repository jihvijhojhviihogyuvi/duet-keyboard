'use client'

import { ArrowRight, CornerDownRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GuidePanel({ onWatch }: { onWatch: () => void }) {
  return (
    <aside className="pivot-guide" aria-label="How to draw an exact word">
      <div className="guide-title-row"><span className="guide-symbol"><CornerDownRight className="size-5" aria-hidden="true" /></span><h3>A bend is a letter.</h3></div>
      <p className="guide-description">Slide past letters you don&apos;t want. Turn at the ones you do. Lift to write them. No guesses in between.</p>
      <div className="guide-example">
        <div className="letter-example" aria-label="Example stroke: Z, a, r, a"><span>Z</span><ArrowRight className="size-3.5" aria-hidden="true" /><span>a</span><ArrowRight className="size-3.5" aria-hidden="true" /><span>r</span><ArrowRight className="size-3.5" aria-hidden="true" /><span>a</span></div>
        <Button variant="default" size="touch" onClick={onWatch}><Play data-icon="inline-start" />Watch it</Button>
      </div>
      <p className="guide-alternative">Not ready to draw? Every letter is also a one-tap target.</p>
    </aside>
  )
}
