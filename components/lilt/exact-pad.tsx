'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CaseSensitive, Delete, Space } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CHARACTER_GROUPS, SYMBOL_GROUPS } from '@/lib/phrase-folds'

type ExactPadProps = {
  initialText?: string
  isReplacing: boolean
  onCommit: (text: string) => void
  onTouch: () => void
  disabled?: boolean
}

export function ExactPad({ initialText = '', isReplacing, onCommit, onTouch, disabled }: ExactPadProps) {
  const [buffer, setBuffer] = useState(initialText)
  const [symbols, setSymbols] = useState(false)
  const [symbolPage, setSymbolPage] = useState(0)
  const [characters, setCharacters] = useState<string | null>(null)
  const [uppercase, setUppercase] = useState(false)

  function append(character: string) {
    onTouch()
    setBuffer((previous) => previous + (uppercase ? character.toUpperCase() : character))
    setCharacters(null)
  }

  const groups = symbols ? SYMBOL_GROUPS.slice(symbolPage * 6, symbolPage * 6 + 6) : CHARACTER_GROUPS

  return (
    <div aria-label="Touch-only exact spelling">
      <div className="exact-display font-mono" role="status" aria-label="Exact text preview" aria-live="polite">
        {buffer || <span className="text-muted-foreground">Your exact words…</span>}
        <span className="typing-caret" aria-hidden="true" />
      </div>
      <div className="fold-grid exact-grid" aria-label={characters ? 'Choose a character' : 'Choose a character family'}>
        {characters
          ? [...characters].map((character) => (
              <button
                className="fold-tile"
                key={character}
                disabled={disabled}
                onClick={() => append(character)}
                aria-label={`Type ${uppercase ? character.toUpperCase() : character}`}
              >
                <span className="tile-label font-mono">{uppercase ? character.toUpperCase() : character}</span>
              </button>
            ))
          : <>
              {groups.map((group) => (
                <button
                  className="fold-tile"
                  key={group.chars}
                  disabled={disabled}
                  onClick={() => { onTouch(); setCharacters(group.chars) }}
                  aria-label={`Letters ${uppercase ? group.label.toUpperCase() : group.label}`}
                >
                  <span className="tile-label font-mono">{uppercase ? group.label.toUpperCase() : group.label}</span>
                </button>
              ))}
              {!symbols && (
                <button className="fold-tile" disabled={disabled} onClick={() => { onTouch(); setSymbols(true) }}>
                  <span className="tile-label font-mono">123 &amp; more</span>
                </button>
              )}
            </>}
      </div>
      <div className="exact-toolbar">
        <div className="flex items-center gap-0.5">
          {characters || symbols ? (
            <Button variant="quiet" size="icon" disabled={disabled} aria-label="Back to character families" onClick={() => {
              onTouch()
              if (characters) setCharacters(null)
              else { setSymbols(false); setSymbolPage(0) }
            }}>
              <ArrowLeft />
            </Button>
          ) : (
            <Button variant={uppercase ? 'mint' : 'quiet'} size="icon" disabled={disabled} aria-label="Uppercase letters" aria-pressed={uppercase} onClick={() => { onTouch(); setUppercase(!uppercase) }}>
              <CaseSensitive />
            </Button>
          )}
          <Button variant="quiet" size="icon" aria-label="Add space" disabled={disabled || !buffer} onClick={() => { onTouch(); setBuffer((value) => value + ' ') }}><Space /></Button>
          <Button variant="quiet" size="icon" aria-label="Delete last character" disabled={disabled || !buffer} onClick={() => { onTouch(); setBuffer((value) => value.slice(0, -1)) }}><Delete /></Button>
        </div>
        <Button size="touch" variant="mint" disabled={disabled || !buffer.trim()} onClick={() => { onCommit(buffer); setBuffer(''); setCharacters(null) }}>
          {isReplacing ? 'Replace' : 'Add text'}<ArrowRight data-icon="inline-end" />
        </Button>
      </div>
      {symbols && !characters && (
        <div className="flex justify-center">
          <Button variant="quiet" size="touch" onClick={() => { onTouch(); setSymbolPage((value) => value === 0 ? 1 : 0) }} disabled={disabled}>
            More symbols<ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      )}
      <p className="pad-caption">{characters ? 'Choose a character. Then choose another family.' : 'A family, then a character. No keyboard needed.'}</p>
    </div>
  )
}
