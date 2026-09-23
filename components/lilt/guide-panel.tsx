'use client'

import { useId, useState } from 'react'
import { ArrowRight, BookOpen, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DirectionGlyph } from '@/components/lilt/direction-glyph'
import { Input } from '@/components/ui/input'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DIRECTIONS, LAYER_LABELS, findChord } from '@/lib/duet-engine'

function ChordFinder({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId()
  const chord = value ? findChord(value) : null
  const uppercase = value !== value.toLocaleLowerCase()

  return (
    <div className="chord-finder">
      <div className="finder-controls">
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent><FieldLabel htmlFor={id}>Find a chord</FieldLabel><FieldDescription>One letter or pair</FieldDescription></FieldContent>
            <Input id={id} className="h-11 w-16 shrink-0" value={value} onChange={(event) => onChange(event.target.value)} onFocus={(event) => event.currentTarget.select()} maxLength={2} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" aria-describedby={`${id}-result`} />
          </Field>
        </FieldGroup>
        <div className="finder-result" aria-hidden="true"><span className="finder-direction"><span className="font-mono">{chord ? <DirectionGlyph direction={chord.left} className="size-6" /> : '—'}</span><span>left</span></span><span className="text-muted-foreground">+</span><span className="finder-direction"><span className="font-mono">{chord ? <DirectionGlyph direction={chord.right} className="size-6" /> : '—'}</span><span>right</span></span></div>
      </div>
      <p className="finder-hint" id={`${id}-result`} role="status">{chord ? <><strong className="text-foreground">{LAYER_LABELS[chord.keyset]}</strong>{uppercase ? ' + Shift' : ''}<span className="sr-only"> · Left {DIRECTIONS[chord.left].name}, right {DIRECTIONS[chord.right].name}.</span>{' · '}{chord.keyset === 'pairs' ? 'Two literal letters. One chord.' : 'Flick in those directions, then lift.'}</> : value ? 'No single chord for that. Try one letter, an accent, or “th”.' : 'Enter a letter to see its two directions.'}</p>
    </div>
  )
}

export function GuidePanel({ onWatch, disabled }: { onWatch: () => void; disabled: boolean }) {
  const [lookup, setLookup] = useState('h')
  const [lookupOpen, setLookupOpen] = useState(false)

  return (
    <>
      <aside className="duet-guide" aria-label="Learn to write with Duet">
        <div className="guide-title-row"><h3>Think of a letter. Play a chord.</h3></div>
        <p className="guide-description">Both thumbs up makes “h”. Where they land doesn&apos;t matter. Start anywhere, flick a direction, then lift to commit.</p>
        <ChordFinder value={lookup} onChange={setLookup} />
        <div className="guide-example"><span className="guide-pair-note">Try <strong>pairs</strong> for two letters at once.</span><Button variant="default" size="touch" onClick={onWatch} disabled={disabled}><Play data-icon="inline-start" />Watch it</Button></div>
      </aside>
      <Button variant="quiet" size="touch" className="compact-lookup-trigger" onClick={() => setLookupOpen(true)}><BookOpen data-icon="inline-start" />Find a chord<ArrowRight data-icon="inline-end" /></Button>
      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent><DialogHeader><DialogTitle>Find your next chord</DialogTitle><DialogDescription>Each letter has two directions. The left chooses a group; the right chooses a character.</DialogDescription></DialogHeader><ChordFinder value={lookup} onChange={setLookup} /><Button size="touch" onClick={() => setLookupOpen(false)}>Back to the instrument<ArrowRight data-icon="inline-end" /></Button></DialogContent>
      </Dialog>
    </>
  )
}
