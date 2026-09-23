'use client'

import { ArrowRight, CameraOff, MicOff, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const steps = [
  { title: 'Land anywhere. Make two small moves.', description: 'Each thumb gets a pad. Its landing point becomes its origin. Flick in one of six directions, about 14 pixels or more. The letters around the edges are a reference, not targets you have to reach.' },
  { title: 'Combine the directions, not a trail of letters.', description: 'The left direction selects a group of six characters. The right direction selects one character from that group. For H, both thumbs point up. Experienced users can make both moves at the same time.' },
  { title: 'Lift either thumb to write the chord.', description: 'When both directions are selected, the preview is exact. Lifting either commits once. Release the other thumb before the next chord. Return a thumb to its starting point before release to clear its direction, or use Cancel to discard the whole chord.' },
]

export function HowItWorks({ open, onOpenChange, onPractice }: { open: boolean; onOpenChange: (open: boolean) => void; onPractice: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Meet Duet. Play, don&apos;t trace.</DialogTitle><DialogDescription>Two relative directions. One exact character. No guesses.</DialogDescription></DialogHeader>
        <div className="flex flex-col gap-5">{steps.map((step, index) => <div className="help-step" key={step.title}><span className="help-step-number font-mono">{index + 1}</span><div><h3 className="text-sm font-semibold leading-relaxed">{step.title}</h3><p className="pt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p></div></div>)}</div>
        <Separator />
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">A mouse or one finger works, too.</strong> Choose a direction on the left, then on the right. Your first choice waits for the second. Click the direction labels or drag from anywhere; both work.</p>
          <p><strong className="text-foreground">Two letters in one chord.</strong> The pairs layer outputs literal chunks like “th”, “in”, and “ll”. It never completes or changes a word. Switch to abc to spell any Latin name; àé, 123, and #+ add accents, numbers, and symbols.</p>
          <p><strong className="text-foreground">A keyboard can simulate two thumbs.</strong> Focus the instrument. Q/W/E/D/S/A control the left pad; U/I/O/L/K/J control the right, clockwise from up-left. Hold W and I, then release, for H. Escape cancels a chord.</p>
          <p><strong className="text-foreground">Your text stays editable.</strong> Shift changes the next letter; double-tap for caps lock. Select text on the page to replace it. Undo reverses one chord, including a whole pair. Edit supports paste and other scripts; it disables the chord-only practice score.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><MicOff className="size-4" aria-hidden="true" />No microphone</span><span className="flex items-center gap-1.5"><CameraOff className="size-4" aria-hidden="true" />No camera</span><span className="flex items-center gap-1.5"><Smartphone className="size-4" aria-hidden="true" />280px mode</span></div>
        <section className="rounded-xl bg-muted p-4 text-foreground"><h3 className="text-sm font-semibold">Different from swipe typing. Not a world-first claim.</h3><p className="pt-2 text-sm leading-relaxed text-muted-foreground">Chorded keyboards and directional input have prior art. This prototype explores their combination with floating touch origins and literal letter-pair chords. It has a learning curve; speech-level speed and global originality are unproven. It is a web experiment, not a system keyboard. Nothing is sent or saved: copy your draft before leaving.</p></section>
        <Button size="touch" onClick={() => { onOpenChange(false); onPractice() }}>Try an exact name<ArrowRight data-icon="inline-end" /></Button>
      </DialogContent>
    </Dialog>
  )
}
