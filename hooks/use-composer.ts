'use client'

import { useReducer } from 'react'
import { characterCount, editorReducer, initialEditorState, type Selection } from '@/lib/pivot-engine'

export type InputTiming = { startedAt: number; endedAt: number; stroke: boolean }

export function useComposer() {
  const [state, dispatch] = useReducer(editorReducer, undefined, initialEditorState)

  return {
    state,
    text: state.text,
    characters: characterCount(state.text),
    insert: (text: string, timing?: InputTiming) => {
      const now = performance.now()
      dispatch({ type: 'insert', text, at: timing?.startedAt ?? now, endedAt: timing?.endedAt ?? now, stroke: timing?.stroke })
    },
    edit: (text: string, selection: Selection) => dispatch({ type: 'edit', text, selection, at: performance.now() }),
    select: (selection: Selection) => dispatch({ type: 'select', selection }),
    backspace: () => dispatch({ type: 'backspace', at: performance.now() }),
    undo: () => dispatch({ type: 'undo', at: performance.now() }),
    redo: () => dispatch({ type: 'redo', at: performance.now() }),
    clear: () => dispatch({ type: 'clear', at: performance.now() }),
    reset: () => dispatch({ type: 'reset' }),
  }
}

export type ComposerController = ReturnType<typeof useComposer>
