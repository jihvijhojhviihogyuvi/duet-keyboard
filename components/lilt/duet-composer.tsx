'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, CaseUpper, Check, Copy, CornerDownLeft, Delete, LockKeyhole, Maximize2, Pencil, Redo2, Space, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GuidePanel } from '@/components/lilt/guide-panel'
import { DirectionGlyph } from '@/components/lilt/direction-glyph'
import { DuetPad, type ChordPreview } from '@/components/lilt/duet-pad'
import { PracticePanel } from '@/components/lilt/practice-panel'
import { DIRECTIONS, LAYER_LABELS, MAX_TEXT_LENGTH, NAME_TESTS, displayToken, findChord, type CaseMode, type Keyset } from '@/lib/duet-engine'
import type { ComposerController, InputTiming } from '@/hooks/use-composer'
import { cn } from '@/lib/utils'

type DuetComposerProps = {
  composer: ComposerController
  compact: boolean
  onExpand: () => void
  challengeIndex?: number
  onNext?: () => void
  onRestart?: () => void
}

export function DuetComposer({ composer, compact, onExpand, challengeIndex, onNext, onRestart }: DuetComposerProps) {
  const initialCharacter = challengeIndex === undefined ? '' : NAME_TESTS[challengeIndex].text[0]
  const [caseMode, setCaseMode] = useState<CaseMode>(composer.text || (initialCharacter && initialCharacter === initialCharacter.toLocaleLowerCase()) ? 'lower' : 'once')
  const [keyset, setKeyset] = useState<Keyset>('letters')
  const [preview, setPreview] = useState<ChordPreview>({ text: '', active: false })
  const [demoRequest, setDemoRequest] = useState(0)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFallback, setCopyFallback] = useState(false)
  const [notice, setNotice] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)
  const lastShiftTap = useRef(-1000)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const challenge = challengeIndex === undefined ? null : NAME_TESTS[challengeIndex]
  const complete = !!challenge && composer.text === challenge.text
  const selection = composer.state.selection
  const displayText = preview.active && preview.text
    ? composer.text.slice(0, selection.start) + preview.text + composer.text.slice(selection.end)
    : composer.text
  const nextCharacter = challenge && challenge.text.startsWith(composer.text) ? [...challenge.text.slice(composer.text.length)][0] : undefined
  const nextChord = nextCharacter ? findChord(nextCharacter) : null

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current) }, [])

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || composingRef.current || preview.active) return
    textarea.setSelectionRange(selection.start, selection.end)
    if (selection.start === composer.text.length) textarea.scrollTop = textarea.scrollHeight
  }, [selection.start, selection.end, composer.text, preview.active])

  function commit(text: string, timing?: InputTiming) {
    if (complete) return
    if (composer.text.length - (selection.end - selection.start) + text.length > MAX_TEXT_LENGTH) {
      setNotice('The canvas holds 20,000 characters. Copy it and start another draft.')
      return
    }
    composer.insert(text, timing)
    if (/\p{L}/u.test(text) && caseMode === 'once') setCaseMode('lower')
    setNotice('')
  }

  function toggleEditing() {
    const next = !editing
    setEditing(next)
    if (next) requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(selection.start, selection.end)
    })
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(composer.text)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2200)
    } catch { setCopyFallback(true) }
  }

  function watchDemo() {
    setKeyset('letters')
    setDemoRequest((value) => value + 1)
  }

  return (
    <section className={cn('duet-workbench', compact && 'is-compact')} aria-label={challenge ? 'Exact name typing test' : 'Exact text workspace'}>
      {compact && <div className="compact-indicator font-mono"><span>280 PX · TWO THUMBS</span><Button variant="quiet" size="icon" onClick={onExpand} aria-label="Expand workspace"><Maximize2 /></Button></div>}
      <div className="writing-panel">
        <div className="writing-header">
          <h2 className="panel-label font-mono">{challenge ? 'NAME TEST' : 'YOUR WORDS'}</h2>
          <span className="literal-label"><span aria-hidden="true" />No autocorrect</span>
        </div>
        <div className="text-canvas" data-tracing={preview.active}>
          <label htmlFor={challenge ? 'name-test-text' : 'draft-text'} className="sr-only">Your text</label>
          <textarea
            ref={textareaRef}
            id={challenge ? 'name-test-text' : 'draft-text'}
            data-testid="draft-text"
            className="draft-editor"
            value={displayText}
            readOnly={!editing || preview.active || complete}
            inputMode={editing ? 'text' : 'none'}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            maxLength={MAX_TEXT_LENGTH}
            placeholder={challenge ? 'Spell the name below.' : 'A blank page.\nA different way in.'}
            onChange={(event) => composer.edit(event.target.value, { start: event.target.selectionStart, end: event.target.selectionEnd })}
            onSelect={(event) => {
              if (preview.active || composingRef.current) return
              const element = event.currentTarget
              if (element.selectionStart !== selection.start || element.selectionEnd !== selection.end) composer.select({ start: element.selectionStart, end: element.selectionEnd })
            }}
            onCompositionStart={() => { composingRef.current = true }}
            onCompositionEnd={(event) => {
              composingRef.current = false
              const element = event.currentTarget
              composer.edit(element.value, { start: element.selectionStart, end: element.selectionEnd })
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || event.keyCode === 229) return
              if (event.key === 'Escape') { setEditing(false); event.currentTarget.blur() }
              if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault()
                if (event.shiftKey) composer.redo()
                else composer.undo()
              }
            }}
          />
          {!composer.text && !preview.active && !challenge && <p className="canvas-helper">Your fingers make the moves. You choose the words.</p>}
          <div className="canvas-status" aria-live="polite"><span>{preview.active ? 'Chord pending · add both directions' : complete ? 'Exact match' : editing ? 'Editing · other scripts and paste supported' : `${composer.characters} ${composer.characters === 1 ? 'character' : 'characters'}`}</span><span className="font-mono">{preview.active ? '↗' : 'Aa'}</span></div>
        </div>
        <div className="editor-toolbar">
          <div className="editor-actions">
            <Button variant="quiet" size="icon" disabled={!composer.state.history.length || preview.active || complete} onClick={composer.undo} aria-label="Undo last input" title="Undo last input"><Undo2 /></Button>
            <Button variant="quiet" size="icon" disabled={!composer.state.future.length || preview.active || complete} onClick={composer.redo} aria-label="Redo input" title="Redo input"><Redo2 /></Button>
            <Button variant="quiet" size="icon" disabled={!composer.text || preview.active || complete} onClick={() => { composer.clear(); setCaseMode('once') }} aria-label="Clear text (can be undone)" title="Clear text (can be undone)"><Trash2 /></Button>
            <span className="toolbar-divider" aria-hidden="true" />
            <Button variant="quiet" size="touch" disabled={preview.active || complete} onClick={toggleEditing} aria-pressed={editing} aria-label={editing ? 'Finish editing text' : 'Edit text directly'}><Pencil data-icon="inline-start" /><span className="edit-label">{editing ? 'Done' : 'Edit'}</span></Button>
          </div>
          <Button variant="outline" size="touch" disabled={!composer.text || preview.active} onClick={copyText} aria-label={copied ? 'Text copied' : 'Copy text'}>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? 'Copied' : 'Copy'}</Button>
        </div>
        {challenge && onNext && onRestart ? <PracticePanel composer={composer} challenge={challenge} completed={complete} onNext={onNext} onRestart={onRestart} /> : <GuidePanel onWatch={watchDemo} disabled={preview.active} />}
        <div className="document-privacy"><LockKeyhole className="size-3.5" aria-hidden="true" /><span>Only in this tab. Copy before you leave.</span></div>
      </div>

      <div className="input-panel">
        <div className="input-heading"><h2>The duet deck</h2><span className="input-state"><span aria-hidden="true" />{complete ? 'Complete' : preview.active ? 'Listening to touch' : 'Ready to play'}</span></div>
        <ol className="duet-steps" aria-label="How to write a chord">
          <li><span className="step-number">01</span><span><strong>Start</strong><small>anywhere</small></span></li>
          <li><span className="step-number">02</span><span><strong>Flick</strong><small>both thumbs</small></span></li>
          <li><span className="step-number">03</span><span><strong>Lift</strong><small>to write</small></span></li>
        </ol>
        <div className="input-controls">
          <ToggleGroup variant="segmented" size="lg" spacing={0} multiple={false} value={[keyset]} onValueChange={(values) => {
            const next = values[0]
            if (next === 'letters' || next === 'pairs' || next === 'numbers' || next === 'accents' || next === 'symbols') setKeyset(next)
          }} disabled={preview.active || complete} aria-label="Character layer">
            <ToggleGroupItem value="letters" aria-label="Alphabet">abc</ToggleGroupItem>
            <ToggleGroupItem value="pairs" aria-label="Literal letter pairs">pairs</ToggleGroupItem>
            <ToggleGroupItem value="numbers" aria-label="Numbers and punctuation">123</ToggleGroupItem>
            <ToggleGroupItem value="accents" aria-label="Accented letters">àé</ToggleGroupItem>
            <ToggleGroupItem value="symbols" aria-label="More symbols">#+</ToggleGroupItem>
          </ToggleGroup>
          <span className="deck-instruction">Small moves. Exact words.</span>
        </div>
        {nextCharacter && nextChord && <div className="practice-next" aria-live="polite"><span>Next: <strong>{displayToken(nextCharacter)}</strong></span><span className="font-mono" aria-label={`Left ${DIRECTIONS[nextChord.left].name}, right ${DIRECTIONS[nextChord.right].name}`}><DirectionGlyph direction={nextChord.left} className="size-5" /><span>+</span><DirectionGlyph direction={nextChord.right} className="size-5" /></span><span>{keyset !== nextChord.keyset ? `Switch to ${LAYER_LABELS[nextChord.keyset]}` : 'left + right'}</span></div>}
        <DuetPad caseMode={caseMode} keyset={keyset} preceding={composer.text.slice(0, selection.start)} demoRequest={demoRequest} disabled={complete} onCommit={commit} onBackspace={composer.backspace} onPreview={setPreview} />
        <div className="pad-command-bar">
          <Button className="shift-control" variant={caseMode === 'lower' ? 'outline' : 'secondary'} size="touch" disabled={preview.active || complete} aria-pressed={caseMode !== 'lower'} aria-label={caseMode === 'upper' ? 'Caps lock on; use lowercase' : caseMode === 'once' ? 'Use lowercase letters' : 'Use uppercase for next letter'} title="Shift · double-tap for caps lock" onClick={() => {
            const now = performance.now()
            const doubleTap = now - lastShiftTap.current < 320
            lastShiftTap.current = now
            setCaseMode((mode) => doubleTap ? 'upper' : mode === 'lower' ? 'once' : 'lower')
          }}>{caseMode === 'upper' ? <CaseUpper data-icon="inline-start" /> : <ArrowUp data-icon="inline-start" />}<span className="shift-label">{caseMode === 'upper' ? 'Caps' : 'Shift'}</span></Button>
          <Button variant="outline" size="touch" disabled={preview.active || complete} onClick={() => commit(' ')} aria-label="Insert space" className="space-command"><Space data-icon="inline-start" />space</Button>
          <Button variant="outline" size="icon" disabled={preview.active || complete} onClick={() => commit('\n')} aria-label="Insert new line"><CornerDownLeft /></Button>
          <Button variant="outline" size="icon" disabled={preview.active || complete || (!composer.text && !selection.end)} onClick={composer.backspace} aria-label="Delete previous character"><Delete /></Button>
        </div>
        <div className="pad-bottom-note"><span>{keyset === 'pairs' ? 'Letter pairs are literal. No word prediction.' : 'No fixed starting points. No letter tracing.'}</span><button className="demo-link" onClick={watchDemo} disabled={preview.active || complete}>Watch a chord<CornerDownLeft className="size-3.5 rotate-180" aria-hidden="true" /></button></div>
        {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}
      </div>

      <Dialog open={copyFallback} onOpenChange={setCopyFallback}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copy your words</DialogTitle><DialogDescription>Your browser blocked clipboard access. Select and copy the text below.</DialogDescription></DialogHeader>
          <textarea aria-label="Text to copy" className="copy-fallback" readOnly value={composer.text} onFocus={(event) => event.currentTarget.select()} />
          <Button size="touch" onClick={() => setCopyFallback(false)}>Back to writing</Button>
        </DialogContent>
      </Dialog>
    </section>
  )
}
