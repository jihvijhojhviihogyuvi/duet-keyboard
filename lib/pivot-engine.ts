export const REPEAT = '↻'
export const COLUMN_COUNT = 5
export const ROW_COUNT = 6
export const MAX_TEXT_LENGTH = 20000

export const KEYSETS = {
  letters: [...'abcdefghijklmnopqrstuvwxyz', "'", '-', '.', REPEAT],
  numbers: [...'1234567890!?@#&()[]/:;,.+-=_', "'", REPEAT],
  accents: [...'áàâäãåæéèêëíìîïóòôöõøœúùûüýÿñç'],
  symbols: ['%', '$', '€', '£', '¥', '*', '+', '=', '_', '~', '\\', '|', '<', '>', '^', '{', '}', '[', ']', '`', '"', ':', ';', '!', '?', '&', '#', '@', '/', REPEAT],
} as const

export type Keyset = keyof typeof KEYSETS
export type CaseMode = 'lower' | 'once' | 'upper'
export type Point = { x: number; y: number }
export type PadGeometry = { width: number; height: number }
export type StrokeToken = { key: string; index: number; point: Point }

export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function keyAt(point: Point, geometry: PadGeometry, keys: readonly string[]): number | null {
  if (geometry.width <= 0 || geometry.height <= 0 || point.x < 0 || point.y < 0 || point.x >= geometry.width || point.y >= geometry.height) return null
  const column = Math.floor(point.x / (geometry.width / COLUMN_COUNT))
  const row = Math.floor(point.y / (geometry.height / ROW_COUNT))
  const index = row * COLUMN_COUNT + column
  return keys[index] === undefined ? null : index
}

export function keyCenter(index: number, geometry: PadGeometry): Point {
  return {
    x: ((index % COLUMN_COUNT) + 0.5) * geometry.width / COLUMN_COUNT,
    y: (Math.floor(index / COLUMN_COUNT) + 0.5) * geometry.height / ROW_COUNT,
  }
}

function segmentDistance(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (dx === 0 && dy === 0) return distance(point, start)
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)))
  return distance(point, { x: start.x + dx * ratio, y: start.y + dy * ratio })
}

export function simplifyPath(points: readonly Point[], tolerance: number): Point[] {
  if (points.length <= 2) return [...points]
  const keep = new Set([0, points.length - 1])
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length) {
    const [start, end] = stack.pop()!
    let largest = tolerance
    let candidate = -1
    for (let index = start + 1; index < end; index++) {
      const separation = segmentDistance(points[index], points[start], points[end])
      if (separation > largest) { largest = separation; candidate = index }
    }
    if (candidate !== -1) {
      keep.add(candidate)
      if (candidate - start > 1) stack.push([start, candidate])
      if (end - candidate > 1) stack.push([candidate, end])
    }
  }
  return [...keep].sort((a, b) => a - b).map((index) => points[index])
}

function turnAngle(previous: Point, pivot: Point, next: Point) {
  const incoming = { x: pivot.x - previous.x, y: pivot.y - previous.y }
  const outgoing = { x: next.x - pivot.x, y: next.y - pivot.y }
  const magnitude = Math.hypot(incoming.x, incoming.y) * Math.hypot(outgoing.x, outgoing.y)
  if (!magnitude) return 0
  const cosine = (incoming.x * outgoing.x + incoming.y * outgoing.y) / magnitude
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI
}

export function decodeStroke(points: readonly Point[], geometry: PadGeometry, keys: readonly string[]): StrokeToken[] {
  if (!points.length || geometry.width <= 0 || geometry.height <= 0) return []
  const cellSize = Math.min(geometry.width / COLUMN_COUNT, geometry.height / ROW_COUNT)
  const path = simplifyPath(points, cellSize * 0.15)
  const tokens: StrokeToken[] = []
  path.forEach((point, position) => {
    const endpoint = position === 0 || position === path.length - 1
    if (!endpoint && turnAngle(path[position - 1], point, path[position + 1]) < 48) return
    const index = keyAt(point, geometry, keys)
    if (index === null || tokens.at(-1)?.index === index) return
    tokens.push({ key: keys[index], index, point })
  })
  return tokens
}

export function spellTokens(tokens: readonly Pick<StrokeToken, 'key'>[], caseMode: CaseMode, preceding = ''): string {
  let text = ''
  let capitalizeNext = caseMode === 'once'
  for (const { key } of tokens) {
    if (key === REPEAT) {
      text += [...segmenter.segment(text || preceding)].at(-1)?.segment ?? ''
      continue
    }
    const isLetter = key.toLocaleLowerCase() !== key.toLocaleUpperCase()
    text += caseMode === 'upper' || (capitalizeNext && isLetter) ? key.toLocaleUpperCase() : key
    if (isLetter) capitalizeNext = false
  }
  return text
}

export const NAME_TESTS = [
  { title: 'An unfamiliar name', text: 'Zara', hint: 'Touch Z. Turn on a, then r. Lift on a.' },
  { title: 'Repeated letters', text: 'Bennett', hint: 'Use the repeat key for double letters. Tapping works, too.' },
  { title: 'Accents belong here', text: "Siobhán O'Neill", hint: 'àé opens accents. Shift capitalizes one letter; tap it twice for caps lock.' },
  { title: 'Not in a dictionary', text: 'qzivon-27', hint: 'An invented word is just as valid. Use 123 for numbers.' },
  { title: 'A very specific name', text: 'X Æ A-12', hint: 'Æ is on the accents layer with Shift. There is no autocorrect.' },
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
