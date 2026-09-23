'use client'

import { ArrowRight, CameraOff, MicOff, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const steps = [
  { title: 'Touch your first letter.', description: 'Every letter is visible. There are no phrase choices, predictions, or special modes for names. You can always tap letters individually.' },
  { title: 'Bend at the letters you want.', description: 'Keep your finger down and make a distinct corner at each next letter. Crossing a letter in a straight line skips it. If letters line up, add a small corner inside the middle letter, or lift and tap it.' },
  { title: 'Lift to write the stroke.', description: 'Your live preview shows the exact spelling. Lift inside the pad to commit; lift outside to cancel. Space is explicit. Undo removes a whole stroke; delete removes one character.' },
]

export function HowItWorks({ open, onOpenChange, onPractice }: { open: boolean; onOpenChange: (open: boolean) => void; onPractice: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Meet Pivot. Your spelling stays yours.</DialogTitle><DialogDescription>A touch, mouse, or pen experiment. No dictionary required.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-5">{steps.map((step, index) => <div className="help-step" key={step.title}><span className="help-step-number font-mono">{index + 1}</span><div><h3 className="text-sm font-semibold leading-relaxed">{step.title}</h3><p className="pt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p></div></div>)}</div>
        <Separator />
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground"><p><strong className="text-foreground">Doubles, accents, and numbers.</strong> The repeat key repeats the preceding character. Shift capitalizes the next letter; double-tap for caps lock. Tap again for lowercase. The àé layer has common accented Latin letters; 123 has numbers and punctuation.</p><p><strong className="text-foreground">Edit anywhere.</strong> Select text in the canvas to replace it using the pad. Edit opens the standard text editor, including other scripts, paste, and your hardware keyboard. Those inputs are excluded from pad-speed scores.</p></div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><MicOff className="size-4" />No microphone</span><span className="flex items-center gap-1.5"><CameraOff className="size-4" />No camera</span><span className="flex items-center gap-1.5"><Smartphone className="size-4" />280px mode</span></div>
        <section className="rounded-xl bg-muted p-4 text-foreground"><h3 className="text-sm font-semibold">A prototype, not a promise.</h3><p className="pt-2 text-sm leading-relaxed text-muted-foreground">The gesture rule is experimental. Speech-level speed and worldwide novelty have not been established. This web app is not a system keyboard. Drafts stay in memory in this tab; nothing is sent or saved. Copy before leaving.</p></section>
        <Button size="touch" onClick={() => { onOpenChange(false); onPractice() }}>Test an actual name<ArrowRight data-icon="inline-end" /></Button>
      </DialogContent>
    </Dialog>
  )
}
