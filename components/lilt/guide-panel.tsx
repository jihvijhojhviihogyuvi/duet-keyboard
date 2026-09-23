'use client'

import { ArrowDownRight, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ComposerController } from '@/hooks/use-composer'

export function SessionStats({ composer }: { composer: ComposerController }) {
  const ratio = composer.state.touches ? (composer.words / composer.state.touches).toFixed(1) : '—'
  return (
    <section className="session-panel" aria-label="Current session statistics">
      <div className="flex items-center justify-between"><h3 className="eyebrow text-muted-foreground">YOUR SESSION</h3><span className="flex items-center gap-1.5 text-sm text-muted-foreground"><span className="size-1.5 rounded-full bg-foreground/50" />Live</span></div>
      <div className="pt-5 pb-5">
        <dl className="grid grid-cols-2 gap-6">
          <div><dd className="stat-value font-mono">{composer.words}</dd><dt className="pt-2 text-sm text-muted-foreground">Words written</dt></div>
          <div><dd className="stat-value font-mono">{composer.state.touches}</dd><dt className="pt-2 text-sm text-muted-foreground">Touches</dt></div>
        </dl>
      </div>
      <Separator />
      <div className="flex items-center justify-between py-4"><span className="text-sm text-muted-foreground">Words per touch</span><span className="font-mono text-sm">{ratio}</span></div>
      <div className="pt-1"><p className="privacy-note"><ShieldCheck className="mt-1 size-4 shrink-0" /><span>Your thoughts stay in this tab.<br />Nothing sent. Nothing saved.</span></p></div>
    </section>
  )
}

export function GuidePanel({ composer, onTry }: { composer: ComposerController; onTry: () => void }) {
  return (
    <aside className="workspace-sidebar">
      <section className="guide-card">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><span className="eyebrow">MEET THE FOLD</span><ArrowDownRight className="size-5" aria-hidden="true" /></div>
          <h2 className="guide-heading text-balance">A whole thought.<br />A handful of taps.</h2>
          <p className="text-sm leading-relaxed text-foreground/80">Start with a phrase. The next possibilities unfold around it.</p>
          <div className="example-path" aria-label="Example: I’d love to, catch up, over coffee, tomorrow">
            <span className="example-fold">I’d love to</span><ArrowRight className="size-3.5" aria-hidden="true" /><span className="example-fold">catch up</span><span className="example-fold">over coffee</span><ArrowRight className="size-3.5" aria-hidden="true" /><span className="example-fold">tomorrow.</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">Changed your mind? Tap a written phrase to reshape just that part.</p>
          <Button variant="default" size="touch" onClick={onTry} className="w-full">Try this thought<ArrowRight data-icon="inline-end" /></Button>
        </div>
      </section>
      <SessionStats composer={composer} />
    </aside>
  )
}
