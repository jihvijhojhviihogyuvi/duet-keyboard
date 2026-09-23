'use client'

import { ArrowRight, CameraOff, MicOff, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const steps = [
  { title: 'Start with the shape of a thought.', description: 'Choose one of six phrase folds. Each touch writes the words you see and opens a new set of continuations.' },
  { title: 'Keep going. Then make it yours.', description: 'Tap any written phrase to reshape it without losing the rest of the sentence. “Tomorrow” can become “tonight” in two touches.' },
  { title: 'Finish it, or get very specific.', description: 'Finish adds punctuation. For names or missing words, Aa opens a touch-only character lens with case, numbers, and punctuation. Undo takes you back.' },
]

export function HowItWorks({ open, onOpenChange, onPractice }: { open: boolean; onOpenChange: (open: boolean) => void; onPractice: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>A little less typing. A little more flow.</DialogTitle><DialogDescription>Meet phrase folds: an experimental, touch-only input concept built for small spaces.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-5">
          {steps.map((step, index) => <div className="help-step" key={step.title}><span className="help-step-number font-mono">{index + 1}</span><div><h3 className="text-sm font-semibold leading-relaxed">{step.title}</h3><p className="pt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p></div></div>)}
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><MicOff className="size-4" />No microphone</span><span className="flex items-center gap-1.5"><CameraOff className="size-4" />No camera</span><span className="flex items-center gap-1.5"><Smartphone className="size-4" />Tiny-screen friendly</span></div>
        <section className="rounded-xl bg-muted p-4 text-foreground"><h3 className="text-sm font-semibold">An honest experiment</h3><p className="pt-2 text-sm leading-relaxed text-muted-foreground">This prototype uses a limited, hand-authored English phrase vocabulary—not AI. Exact spelling is slower. Speech-level speed and worldwide novelty are unproven; related ideas may exist. Practice measures guided, expanded output, not general typing ability.</p><p className="pt-2 text-sm leading-relaxed text-muted-foreground">Your draft stays in this tab. It is not saved or sent to a server. Copy it before leaving. This web playground does not replace your system keyboard.</p></section>
        <Button size="touch" onClick={() => { onOpenChange(false); onPractice() }}>Try a guided thought<ArrowRight data-icon="inline-end" /></Button>
      </DialogContent>
    </Dialog>
  )
}
