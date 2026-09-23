'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Copy, CornerDownLeft, Layers2, MoreHorizontal, RotateCcw, SquarePen, Trash2, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExactPad } from '@/components/lilt/exact-pad'
import type { ComposerController } from '@/hooks/use-composer'
import type { Fold } from '@/lib/phrase-folds'
import { cn } from '@/lib/utils'

type FoldComposerProps = {
  composer: ComposerController
  compact: boolean
  active: boolean
  locked?: boolean
  expectedId?: string
}

export function FoldComposer({ composer, compact, active, locked = false, expectedId }: FoldComposerProps) {
  const [inputMode, setInputMode] = useState<'folds' | 'exact'>('folds')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [copyFallback, setCopyFallback] = useState(false)
  const [ready, setReady] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editedChunk = editingIndex !== null ? composer.state.chunks[editingIndex] : undefined

  useEffect(() => { setReady(true); return () => { if (copyTimer.current) clearTimeout(copyTimer.current) } }, [])
  useEffect(() => {
    if (canvasRef.current) canvasRef.current.scrollTop = canvasRef.current.scrollHeight
  }, [composer.text])
  useEffect(() => {
    if (!editedChunk && editingIndex !== null) setEditingIndex(null)
  }, [editedChunk, editingIndex])

  const options: Fold[] = editedChunk && inputMode === 'folds'
    ? editedChunk.variations.map((text, index) => ({ id: `variation-${index}`, text, hint: index === 0 ? 'Original phrase' : 'Same thought, a different feel', next: '', variations: [] }))
    : composer.options

  function choose(option: Fold) {
    if (locked) return
    if (editingIndex !== null && editedChunk) {
      composer.replace(editingIndex, option.text)
      setEditingIndex(null)
    } else composer.choose(option)
  }

  function undo() {
    if (locked) return
    composer.undo()
    setEditingIndex(null)
    setInputMode('folds')
  }

  function finish() {
    if (locked) return
    composer.finish()
    setEditingIndex(null)
  }

  useEffect(() => {
    if (!active || locked || inputMode !== 'folds') return
    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return
      if (event.altKey || event.metaKey || event.ctrlKey || document.querySelector('[data-slot="dialog-content"]')) return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (/^[1-6]$/.test(event.key)) {
        const option = options[Number(event.key) - 1]
        if (option) { event.preventDefault(); choose(option) }
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        undo()
      } else if (event.key === 'Enter' && !target.closest('button, a')) {
        event.preventDefault()
        finish()
      } else if (event.key === 'Escape' && editingIndex !== null) {
        setEditingIndex(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  async function copy() {
    try {
      await navigator.clipboard.writeText(composer.text)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopyFallback(true)
    }
  }

  function editChunk(index: number) {
    if (locked) return
    composer.touch()
    if (editingIndex === index) { setEditingIndex(null); setInputMode('folds'); return }
    const chunk = composer.state.chunks[index]
    setEditingIndex(index)
    setInputMode(chunk.variations.length > 1 ? 'folds' : 'exact')
  }

  return (
    <div className="composer-stage">
      {compact && <p className="compact-caption font-mono">280px. Same big ideas.</p>}
      <section className={cn('composer-shell', compact && 'is-compact')} aria-label="Phrase-fold composer" data-ready={ready}>
        <div className="canvas-header">
          <div className="canvas-heading">
            <SquarePen className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="canvas-title">Your canvas</h2>
            <span className="canvas-word-count text-sm text-muted-foreground">/ {composer.words} {composer.words === 1 ? 'word' : 'words'}</span>
          </div>
          <div className="canvas-actions">
            <Button variant="quiet" size="touch" disabled={!composer.text} onClick={copy} aria-label={copied ? 'Text copied' : 'Copy text'}>
              {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="quiet" size="icon" disabled={!composer.text || locked} aria-label="Clear canvas (can be undone)" onClick={() => { composer.clear(); setEditingIndex(null); setInputMode('folds') }}><Trash2 /></Button>
          </div>
        </div>
        <div className="draft-surface" ref={canvasRef} tabIndex={0} role="region" aria-label="Composed text">
          {composer.text ? (
            <p className="draft-text">
              {composer.state.chunks.map((chunk, index) => (
                <Fragment key={chunk.id}>
                  {index > 0 && chunk.kind !== 'punctuation' && ' '}
                  {chunk.kind === 'punctuation' ? <span>{chunk.text}</span> : (
                    <button className="draft-chunk" aria-pressed={index === editingIndex} aria-label={`Reshape ${chunk.text}`} disabled={locked} onClick={() => editChunk(index)}>{chunk.text}</button>
                  )}
                </Fragment>
              ))}
              {!locked && <span className="typing-caret" aria-hidden="true" />}
            </p>
          ) : (
            <div className="draft-placeholder">
              <p className="draft-placeholder-heading">A little space for<br />your next big thought.<span className="typing-caret" aria-hidden="true" /></p>
              <p className="draft-placeholder-description mt-3 text-sm text-muted-foreground">Start with a fold below. Make it yours as you go.</p>
            </div>
          )}
        </div>
        <p className="sr-only" role="status" aria-live="polite">{composer.text || 'Canvas is empty.'}</p>
        <div className="pad">
          <div className="pad-header">
            <div className="flex items-center gap-2">
              <h3 className="pad-heading">{editedChunk ? 'RESHAPE A FOLD' : inputMode === 'exact' ? 'YOUR EXACT WORDS' : 'CHOOSE A FOLD'}</h3>
              {editedChunk && <Button variant="quiet" size="icon" aria-label="Cancel reshaping" onClick={() => { composer.touch(); setEditingIndex(null); setInputMode('folds') }}><X /></Button>}
            </div>
            <ToggleGroup variant="segmented" size="lg" spacing={0} multiple={false} value={[inputMode]} aria-label="Input mode" onValueChange={(values) => {
              const value = values[0]
              if (value === 'folds' || value === 'exact') { composer.touch(); setInputMode(value) }
            }} disabled={locked}>
              <ToggleGroupItem value="folds" aria-label="Phrase folds"><Layers2 /><span className="desktop-label">Folds</span></ToggleGroupItem>
              <ToggleGroupItem value="exact" aria-label="Exact spelling"><span className="font-mono">Aa</span></ToggleGroupItem>
            </ToggleGroup>
          </div>
          {inputMode === 'folds' ? (
            <>
              <div className="fold-grid" aria-label={editedChunk ? 'Phrase variations' : 'Next phrase choices'}>
                {options.map((option, index) => (
                  <button key={option.id} className="fold-tile" data-leading={!expectedId && index === 0} data-recommended={expectedId === option.id} disabled={locked} onClick={() => choose(option)} aria-label={`${editedChunk ? 'Change to' : 'Add'} ${option.text}`}>
                    <span className="tile-top"><span className="tile-number font-mono">{String(index + 1).padStart(2, '0')}</span>{editedChunk ? <RotateCcw className="size-4" /> : <ArrowUpRight className="size-4" />}</span>
                    <span className="tile-copy"><span className="tile-label">{option.text}</span><span className="tile-hint">{option.hint}</span></span>
                  </button>
                ))}
              </div>
              <div className="pad-toolbar">
                <div className="pad-tools">
                  <Button size="touch" variant="quiet" disabled={!composer.state.history.length || locked} onClick={undo} aria-label="Undo last action"><Undo2 data-icon="inline-start" /><span className="desktop-label">Undo</span></Button>
                  <Button size="touch" variant="quiet" disabled={locked || !composer.hasMore || editingIndex !== null} onClick={composer.more} aria-label="More phrase choices"><MoreHorizontal data-icon="inline-start" /><span>More</span></Button>
                </div>
                <Button size="touch" disabled={!composer.text || composer.state.chunks.at(-1)?.kind === 'punctuation' || locked} onClick={finish} aria-label="Finish thought">
                  <span className="finish-label">Finish thought</span><span className="hidden @max-[300px]:inline">Finish</span><CornerDownLeft data-icon="inline-end" />
                </Button>
              </div>
              <div className="pad-caption">
                {locked ? <><Check className="size-4 shrink-0" /> A whole thought, in a few touches.</> : editedChunk ? 'Change this phrase. Keep the rest of your thought.' : <><span>Tap a phrase.</span><span className="shortcut-hint">Or use <kbd className="font-mono">1–6</kbd> on your keyboard.</span><span className="hidden @max-[480px]:inline">Keep your thought going.</span></>}
              </div>
            </>
          ) : (
            <ExactPad key={editedChunk?.id ?? 'new'} initialText={editedChunk?.text} isReplacing={editingIndex !== null} disabled={locked} onTouch={composer.touch} onCommit={(text) => {
              composer.exact(text, editingIndex ?? undefined)
              setEditingIndex(null)
              setInputMode('folds')
            }} />
          )}
        </div>
      </section>
      <Dialog open={copyFallback} onOpenChange={setCopyFallback}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copy your thought</DialogTitle><DialogDescription>Clipboard access is blocked by this browser. Select and copy your text below.</DialogDescription></DialogHeader>
          <textarea aria-label="Text to copy" readOnly value={composer.text} rows={5} onFocus={(event) => event.currentTarget.select()} className="w-full rounded-lg border border-input bg-background p-3 text-base leading-relaxed text-foreground" />
          <Button variant="outline" size="touch" onClick={() => setCopyFallback(false)}>Back to your canvas<ArrowRight data-icon="inline-end" /></Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
