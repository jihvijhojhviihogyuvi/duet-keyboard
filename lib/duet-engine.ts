export const REPEAT = '↻'
export const BACKSPACE = '⌫'
export const MAX_TEXT_LENGTH = 20000
export const FLICK_THRESHOLD = 14

export const KEYSETS = {
  letters: [...'abcdefghijklmnopqrstuvwxyz', "'", '-', ',', '.', ' ', REPEAT, '?', '!', '\n', BACKSPACE],
  pairs: ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar', 'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 'io', 'le', 've', 'co', 'ch', 'sh', 'qu', 'll'],
  numbers: [...'1234567890:;!?@#&%()[]{}+-=_/\\.,', "'", '"', '$', '€'],
  accents: [...'áàâäãåæéèêëíìîïóòôöõøœúùûüýÿñçğşčšžß'],
  symbols: ['£', '¥', '¢', '€', '$', '%', '*', '+', '−', '÷', '×', '=', '<', '>', '≤', '≥', '≠', '≈', '_', '~', '`', '^', '|', '\\', '@', '#', '&', '§', '©', '®', '°', '•', '…', '"', "'", ':'],
} as const

export const LAYER_LABELS = { letters: 'abc', pairs: 'pairs', numbers: '123', accents: 'àé', symbols: '#+' } as const
export type Keyset = keyof typeof KEYSETS
export type CaseMode = 'lower' | 'once' | 'upper'
export type Point = { x: number; y: number }
export type Direction = 0 | 1 | 2 | 3 | 4 | 5
export type Hand = 'left' | 'right'

export const DIRECTIONS = [
  { name: 'up-left', glyph: '\u2196\uFE0E', x: -0.866, y: -0.5 },
  { name: 'up', glyph: '\u2191\uFE0E', x: 0, y: -1 },
  { name: 'up-right', glyph: '\u2197\uFE0E', x: 0.866, y: -0.5 },
  { name: 'down-right', glyph: '\u2198\uFE0E', x: 0.866, y: 0.5 },
  { name: 'down', glyph: '\u2193\uFE0E', x: 0, y: 1 },
  { name: 'down-left', glyph: '\u2199\uFE0E', x: -0.866, y: 0.5 },
] as const

export function directionFromVector(vector: Point, previous: Direction | null = null): Direction | null {
  if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y) || Math.hypot(vector.x, vector.y) < FLICK_THRESHOLD) return null
  const angle = Math.atan2(vector.x, -vector.y) * 180 / Math.PI
  if (previous !== null) {
    const difference = ((angle - (previous * 60 - 60) + 540) % 360) - 180
    if (Math.abs(difference) <= 38) return previous
  }
  return (Math.round(((angle + 420) % 360) / 60) % 6) as Direction
}

export function displayToken(token: string): string {
  return token === ' ' ? '␣' : token === '\n' ? '↵' : token
}

export function describeToken(token: string): string {
  return token === ' ' ? 'space' : token === '\n' ? 'new line' : token === REPEAT ? 'repeat last character' : token === BACKSPACE ? 'delete previous character' : token
}

export function applyCase(text: string, mode: CaseMode): string {
  if (mode === 'upper') return text.toLocaleUpperCase()
  if (mode === 'once') return text.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase())
  return text
}

export function findChord(token: string): { left: Direction; right: Direction; keyset: Keyset } | null {
  for (const [keyset, keys] of Object.entries(KEYSETS)) {
    const index = (keys as readonly string[]).indexOf(token.toLocaleLowerCase().normalize('NFC'))
    if (index >= 0) return { left: Math.floor(index / 6) as Direction, right: (index % 6) as Direction, keyset: keyset as Keyset }
  }
  return null
}

export function chordToken(left: Direction | null, right: Direction | null, keyset: Keyset): string | null {
  if (left === null || right === null || left < 0 || left > 5 || right < 0 || right > 5) return null
  return KEYSETS[keyset][left * 6 + right] ?? null
}

export function chordText(token: string, mode: CaseMode, preceding = ''): string {
  if (token === BACKSPACE) return ''
  if (token === REPEAT) return [...segmenter.segment(preceding)].at(-1)?.segment ?? ''
  return applyCase(token, mode)
}

export type ChordState = {
  directions: Record<Hand, Direction | null>
  pointers: Record<Hand, number | null>
  startedAt: number | null
  waitingForRelease: boolean
}
export type ChordCommit = { left: Direction; right: Direction; startedAt: number; endedAt: number }
export type ChordAction =
  | { type: 'begin'; hand: Hand; pointer: number; at: number }
  | { type: 'move'; hand: Hand; pointer: number; direction: Direction | null }
  | { type: 'end'; hand: Hand; pointer: number; at: number }
  | { type: 'choose'; hand: Hand; direction: Direction; at: number }
  | { type: 'cancel' }

export function initialChordState(): ChordState {
  return { directions: { left: null, right: null }, pointers: { left: null, right: null }, startedAt: null, waitingForRelease: false }
}

export function chordIsPending(state: ChordState): boolean {
  return state.directions.left !== null || state.directions.right !== null || state.pointers.left !== null || state.pointers.right !== null
}

export function transitionChord(state: ChordState, action: ChordAction): { state: ChordState; commit: ChordCommit | null } {
  const unchanged = { state, commit: null }
  if (action.type === 'cancel') return { state: initialChordState(), commit: null }
  const other: Hand = action.hand === 'left' ? 'right' : 'left'
  if (action.type === 'begin') {
    if (state.waitingForRelease || state.pointers[action.hand] !== null || state.pointers[other] === action.pointer) return unchanged
    return { state: { ...state, directions: { ...state.directions, [action.hand]: null }, pointers: { ...state.pointers, [action.hand]: action.pointer }, startedAt: state.startedAt ?? action.at }, commit: null }
  }
  if (action.type === 'move') {
    if (state.waitingForRelease || state.pointers[action.hand] !== action.pointer) return unchanged
    return { state: { ...state, directions: { ...state.directions, [action.hand]: action.direction } }, commit: null }
  }
  if (action.type === 'choose' && (state.waitingForRelease || state.pointers.left !== null || state.pointers.right !== null)) return unchanged
  if (action.type === 'end' && state.pointers[action.hand] !== action.pointer) return unchanged
  const pointers = action.type === 'end' ? { ...state.pointers, [action.hand]: null } : state.pointers
  if (state.waitingForRelease) {
    return { state: pointers[other] === null ? initialChordState() : { ...state, pointers }, commit: null }
  }
  const directions = action.type === 'choose' ? { ...state.directions, [action.hand]: action.direction } : state.directions
  const startedAt = state.startedAt ?? action.at
  if (directions.left !== null && directions.right !== null) {
    const commit = { left: directions.left, right: directions.right, startedAt, endedAt: action.at }
    const held = pointers.left !== null || pointers.right !== null
    return { state: held ? { ...initialChordState(), pointers, waitingForRelease: true } : initialChordState(), commit }
  }
  const next = { ...state, directions, pointers, startedAt }
  return { state: chordIsPending(next) ? next : initialChordState(), commit: null }
}

export const NAME_TESTS = [
  { title: 'An unfamiliar name', text: 'Zara', hint: 'The next chord is shown below. Shift is already on for Z.' },
  { title: 'Repeated letters', text: 'Bennett', hint: 'Play a chord twice for a double letter. No special timing required.' },
  { title: 'Accents belong here', text: "Siobhán O'Neill", hint: 'Switch to àé for á. Use Shift for the capital O and N.' },
  { title: 'Not in a dictionary', text: 'qzivon-27', hint: 'Invented words work exactly the same. Use 123 for digits.' },
  { title: 'A very specific name', text: 'X Æ A-12', hint: 'Æ lives on àé with Shift. Spaces and hyphens are literal.' },
] as const

export type Selection = { start: number; end: number }
export type EditorSnapshot = { text: string; selection: Selection }
export type EditorState = EditorSnapshot & {
  history: EditorSnapshot[]
  future: EditorSnapshot[]
  startedAt: number | null
  lastInputAt: number | null
  actions: number
  strokes: number
  padOnly: boolean
}

export type EditorAction =
  | { type: 'insert'; text: string; at: number; endedAt: number; stroke?: boolean; source?: 'pad' | 'external' }
  | { type: 'edit'; text: string; selection: Selection; at: number }
  | { type: 'select'; selection: Selection }
  | { type: 'backspace' | 'undo' | 'redo' | 'clear'; at: number }
  | { type: 'reset' }

export function initialEditorState(): EditorState {
  return { text: '', selection: { start: 0, end: 0 }, history: [], future: [], startedAt: null, lastInputAt: null, actions: 0, strokes: 0, padOnly: true }
}

export function clampSelection(selection: Selection, text: string): Selection {
  const start = Math.max(0, Math.min(text.length, selection.start))
  return { start, end: Math.max(start, Math.min(text.length, selection.end)) }
}

function snapshot(state: EditorState): EditorSnapshot {
  return { text: state.text, selection: state.selection }
}

function mutate(state: EditorState, next: EditorSnapshot, at: number): EditorState {
  return { ...state, ...next, history: [...state.history.slice(-99), snapshot(state)], future: [], startedAt: state.startedAt ?? at, lastInputAt: at, actions: state.actions + 1 }
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function characterCount(text: string) {
  return [...segmenter.segment(text)].length
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'reset') return initialEditorState()
  if (action.type === 'select') return { ...state, selection: clampSelection(action.selection, state.text) }
  if (action.type === 'undo' || action.type === 'redo') {
    const source = action.type === 'undo' ? state.history : state.future
    const previous = source.at(-1)
    if (!previous) return state
    return {
      ...state, ...previous,
      history: action.type === 'undo' ? state.history.slice(0, -1) : [...state.history.slice(-99), snapshot(state)],
      future: action.type === 'redo' ? state.future.slice(0, -1) : [...state.future.slice(-99), snapshot(state)],
      lastInputAt: action.at, actions: state.actions + 1,
    }
  }
  if (action.type === 'clear') {
    if (!state.text) return state
    return mutate(state, { text: '', selection: { start: 0, end: 0 } }, action.at)
  }
  if (action.type === 'edit') {
    if (action.text === state.text || action.text.length > MAX_TEXT_LENGTH) return state
    return { ...mutate(state, { text: action.text, selection: clampSelection(action.selection, action.text) }, action.at), padOnly: false }
  }
  const selection = clampSelection(state.selection, state.text)
  if (action.type === 'backspace') {
    if (selection.start === selection.end && !selection.start) return state
    let start = selection.start
    if (selection.start === selection.end) {
      const preceding = [...segmenter.segment(state.text.slice(0, selection.start))]
      start = preceding.at(-1)?.index ?? 0
    }
    return mutate(state, { text: state.text.slice(0, start) + state.text.slice(selection.end), selection: { start, end: start } }, action.at)
  }
  if (action.type !== 'insert' || !action.text) return state
  const nextText = state.text.slice(0, selection.start) + action.text + state.text.slice(selection.end)
  if (nextText.length > MAX_TEXT_LENGTH) return state
  const cursor = selection.start + action.text.length
  return {
    ...mutate(state, { text: nextText, selection: { start: cursor, end: cursor } }, action.at),
    lastInputAt: action.endedAt,
    strokes: state.strokes + (action.stroke ? 1 : 0),
    padOnly: state.padOnly && action.source !== 'external',
  }
}

export function measuredWpm(text: string, elapsedMs: number) {
  if (elapsedMs < 1000 || !text) return 0
  return Math.round(characterCount(text) / 5 / (elapsedMs / 60000))
}
