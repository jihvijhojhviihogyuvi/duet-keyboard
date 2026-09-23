'use client'

import { useState } from 'react'
import { ArrowUpRight, CameraOff, CircleHelp, Maximize2, MicOff, Smartphone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FoldComposer } from '@/components/lilt/fold-composer'
import { GuidePanel, SessionStats } from '@/components/lilt/guide-panel'
import { HowItWorks } from '@/components/lilt/how-it-works'
import { PracticePanel } from '@/components/lilt/practice-panel'
import { useComposer } from '@/hooks/use-composer'
import { CHALLENGES, normalizedText } from '@/lib/phrase-folds'

export function LiltStudio() {
  const [tab, setTab] = useState('playground')
  const [compact, setCompact] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [practiceKey, setPracticeKey] = useState(0)
  const playground = useComposer()
  const practice = useComposer()
  const challenge = CHALLENGES[challengeIndex]
  const completed = normalizedText(practice.text) === normalizedText(challenge.text)
  const chosenFolds = practice.state.chunks.filter((chunk) => chunk.kind === 'phrase')
  const onTrack = chosenFolds.every((chunk, index) => chunk.foldId === challenge.path[index])
  const expectedId = onTrack ? challenge.path[chosenFolds.length] : undefined

  function startPractice() {
    setTab('practice')
  }

  function restartPractice() {
    practice.reset()
    setPracticeKey((key) => key + 1)
  }

  function nextPractice() {
    setChallengeIndex((index) => (index + 1) % CHALLENGES.length)
    restartPractice()
  }

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="min-h-svh gap-0">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="flex items-center gap-5">
            <button className="brand min-h-11" aria-label="lilt playground" onClick={() => setTab('playground')}>
              <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span className="brand-name">lilt</span>
            </button>
            <Badge variant="outline" className="header-experiment">an input experiment</Badge>
          </div>
          <TabsList variant="line" className="site-navigation" aria-label="Workspace">
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
          </TabsList>
          <div className="header-actions flex items-center gap-3">
            <Button variant="quiet" size="touch" onClick={() => setHelpOpen(true)}>How it works</Button>
            <Button variant="outline" size="touch" onClick={() => setCompact((value) => !value)} aria-pressed={compact} aria-label={compact ? 'Use full canvas' : 'Try a 280 pixel screen'}>
              {compact ? <Maximize2 data-icon="inline-start" /> : <Smartphone data-icon="inline-start" />}{compact ? 'Full canvas' : 'Small screen'}
            </Button>
          </div>
        </div>
      </header>

      <main className="studio-main">
        <section className="studio-intro" aria-labelledby="studio-heading">
          <div className="flex flex-col gap-4">
            <p className="intro-eyebrow eyebrow flex items-center gap-2.5 text-muted-foreground"><span className="size-2 rounded-full bg-foreground" />LESS KEYBOARD. MORE YOU.</p>
            <h1 id="studio-heading" className="hero-heading text-balance">Big thoughts.<br /><span className="text-muted-foreground">Small movements.</span></h1>
          </div>
          <div className="intro-description">
            <p className="text-base leading-relaxed text-muted-foreground">A quieter way to get your thoughts out.<br />Build in phrases. Reshape as you go.<br />All with a little touch.</p>
            <div className="flex items-center gap-4 pt-5 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><MicOff className="size-4" />No mic</span><span className="flex items-center gap-1.5"><CameraOff className="size-4" />No camera</span></div>
          </div>
        </section>

        <TabsContent value="playground" keepMounted>
          <div className="workspace">
            <FoldComposer composer={playground} compact={compact} active={tab === 'playground' && !helpOpen} />
            <GuidePanel composer={playground} onTry={startPractice} />
          </div>
        </TabsContent>
        <TabsContent value="practice" keepMounted>
          <div className="workspace">
            <div className="flex min-w-0 flex-col gap-4">
              <PracticePanel composer={practice} challenge={challenge} completed={completed} onNext={nextPractice} onRestart={restartPractice} />
              <FoldComposer key={practiceKey} composer={practice} compact={compact} active={tab === 'practice' && !helpOpen} locked={completed} expectedId={expectedId} />
            </div>
            <aside className="workspace-sidebar">
              <section className="guide-card">
                <div className="flex flex-col gap-4">
                  <span className="eyebrow">FIND YOUR FLOW</span>
                  <h2 className="guide-heading text-balance">Your thoughts.<br />At your own pace.</h2>
                  <p className="text-sm leading-relaxed text-foreground/80">Follow the highlighted folds to recreate the thought. The clock starts with your first input, not when you open the page.</p>
                  <p className="text-sm leading-relaxed text-foreground/80">A wrong turn is okay. Undo it, or tap a written phrase to reshape it.</p>
                  <div className="rounded-lg border border-foreground/10 p-3 text-sm leading-relaxed">A small experiment, not a race. This measures phrase-expanded output—not standard typing speed.</div>
                </div>
              </section>
              <SessionStats composer={practice} />
            </aside>
          </div>
        </TabsContent>

        <footer className="studio-footer">
          <p className="footer-note flex items-center gap-2"><span className="size-1.5 rounded-full bg-muted-foreground/70" />A little less effort. A little more flow.</p>
          <p className="footer-version flex items-center gap-3"><span>English prototype</span><span aria-hidden="true">·</span><button className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground" onClick={() => setHelpOpen(true)}>A work in progress<ArrowUpRight className="size-3.5" /></button></p>
          <Button variant="quiet" size="touch" className="mobile-help" onClick={() => setHelpOpen(true)}><CircleHelp data-icon="inline-start" />How it works</Button>
        </footer>
      </main>
      <HowItWorks open={helpOpen} onOpenChange={setHelpOpen} onPractice={startPractice} />
    </Tabs>
  )
}
