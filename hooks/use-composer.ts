'use client'

import { useReducer } from 'react'
import {
  composeText,
  composerReducer,
  countWords,
  FOLDS,
  initialComposerState,
  type Fold,
} from '@/lib/phrase-folds'

export function useComposer() {
  const [state, dispatch] = useReducer(composerReducer, undefined, initialComposerState)
  const text = composeText(state.chunks)
  const allOptions = FOLDS[state.node] ?? FOLDS.start

  return {
    state,
    text,
    words: countWords(text),
    options: allOptions.slice(state.page * 6, state.page * 6 + 6),
    hasMore: allOptions.length > 6,
    choose: (option: Fold) => dispatch({ type: 'choose', option, at: performance.now() }),
    replace: (index: number, value: string) => dispatch({ type: 'replace', index, text: value, at: performance.now() }),
    exact: (value: string, index?: number) => dispatch({ type: 'exact', text: value, index, at: performance.now() }),
    finish: () => dispatch({ type: 'finish', at: performance.now() }),
    undo: () => dispatch({ type: 'undo', at: performance.now() }),
    more: () => dispatch({ type: 'more', at: performance.now() }),
    clear: () => dispatch({ type: 'clear', at: performance.now() }),
    touch: () => dispatch({ type: 'touch', at: performance.now() }),
    reset: () => dispatch({ type: 'reset' }),
  }
}

export type ComposerController = ReturnType<typeof useComposer>
