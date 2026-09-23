'use client'

import { useState } from 'react'
import { ArrowUpRight, CameraOff, CircleHelp, Maximize2, MicOff, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HowItWorks } from '@/components/lilt/how-it-works'
import { DuetComposer } from '@/components/lilt/duet-composer'
import { useComposer } from '@/hooks/use-composer'
import { NAME_TESTS } from '@/lib/duet-engine'

export function LiltStudio() {
  const [tab, setTab] = useState('write')
  const [compact, setCompact] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [practiceKey, setPracticeKey] = useState(0)
  const draft = useComposer()
  const practice = useComposer()

  function restartPractice() {
    practice.reset()
    setPracticeKey((key) => key + 1)
  }

  function nextPractice() {
    setChallengeIndex((index) => (index + 1) % NAME_TESTS.length)
    restartPractice()
  }

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="min-h-svh gap-0">
      <header className="lab-header">
        <div className="lab-header-inner">
          <div className="lab-brand-group">
            <button className="lab-brand" aria-label="lilt writing studio" onClick={() => setTab('write')}><span className="lab-mark" aria-hidden="true"><span /><span /><span /></span><span>lilt</span></button>
            <span className="brand-divider" aria-hidden="true" />
            <span className="lab-descriptor">The input lab</span>
          </div>
          <TabsList variant="line" className="lab-navigation" aria-label="Workspace"><TabsTrigger value="write">Write</TabsTrigger><TabsTrigger value="test">Name test</TabsTrigger></TabsList>
          <div className="lab-header-actions">
            <Button variant="quiet" size="touch" onClick={() => setHelpOpen(true)} aria-label="How Duet works"><CircleHelp data-icon="inline-start" /><span className="help-label">How it works</span></Button>
            <Button variant="outline" size="touch" className="screen-toggle" onClick={() => setCompact((value) => !value)} aria-pressed={compact} aria-label={compact ? 'Use full canvas' : 'Try a 280 pixel screen'}>{compact ? <Maximize2 data-icon="inline-start" /> : <Smartphone data-icon="inline-start" />}{compact ? 'Full canvas' : 'Small screen'}</Button>
          </div>
        </div>
      </header>

      <main className="lab-main">
        <section className="lab-intro" aria-labelledby="lab-heading">
          <div className="intro-title-group"><p className="experiment-label font-mono"><span aria-hidden="true" />EXPERIMENT 03 — DUET</p><h1 id="lab-heading" className="lab-heading text-balance">Don&apos;t chase letters. <span>Play them.</span></h1></div>
          <p className="lab-intro-copy text-pretty">Two tiny movements, made together.<br className="desktop-break" /> A writing instrument. Not a swipe keyboard.</p>
        </section>

        <TabsContent value="write"><DuetComposer composer={draft} compact={compact} onExpand={() => setCompact(false)} /></TabsContent>
        <TabsContent value="test"><DuetComposer key={`${challengeIndex}-${practiceKey}`} composer={practice} compact={compact} onExpand={() => setCompact(false)} challengeIndex={challengeIndex} onRestart={restartPractice} onNext={nextPractice} /></TabsContent>

        <footer className="lab-footer">
          <div className="privacy-features"><span><MicOff className="size-4" aria-hidden="true" />No microphone</span><span><CameraOff className="size-4" aria-hidden="true" />No camera</span><span className="no-dictionary">No dictionary needed</span></div>
          <button className="experiment-note" onClick={() => setHelpOpen(true)}>An experiment, not a speed claim<ArrowUpRight className="size-4" aria-hidden="true" /></button>
        </footer>
      </main>
      <HowItWorks open={helpOpen} onOpenChange={setHelpOpen} onPractice={() => setTab('test')} />
    </Tabs>
  )
}
