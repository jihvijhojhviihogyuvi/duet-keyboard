import assert from 'node:assert/strict'
import test from 'node:test'
import {
  KEYSETS, REPEAT, keyAt, keyCenter, decodeStroke, spellTokens, simplifyPath,
  initialEditorState, editorReducer, measuredWpm, characterCount, MAX_TEXT_LENGTH,
} from '../lib/pivot-engine.ts'

const geometry = { width: 300, height: 300 }
const center = (key, keys = KEYSETS.letters) => keyCenter(keys.indexOf(key), geometry)
const decode = (keys) => decodeStroke(keys.map((key) => center(key)), geometry, KEYSETS.letters)
const insert = (state, text, at = 100, endedAt = 200, extra = {}) => editorReducer(state, { type: 'insert', text, at, endedAt, ...extra })

function sampledPath(vertices) {
  return vertices.flatMap((end, index) => {
    if (index === 0) return [end]
    const start = vertices[index - 1]
    return Array.from({ length: 30 }, (_, step) => ({ x: start.x + (end.x - start.x) * (step + 1) / 30, y: start.y + (end.y - start.y) * (step + 1) / 30 }))
  })
}

test('all layers fit 30 positions and letters cover the entire alphabet', () => {
  for (const keys of Object.values(KEYSETS)) {
    assert.equal(keys.length, 30)
    assert.equal(new Set(keys).size, keys.length)
  }
  for (const key of 'abcdefghijklmnopqrstuvwxyz') assert.ok(KEYSETS.letters.includes(key))
})

test('every key can be entered with one direct touch, including at 240px width', () => {
  for (const width of [240, 280, 340]) {
    const pad = { width, height: 288 }
    for (const keys of Object.values(KEYSETS)) {
      keys.forEach((key, index) => {
        assert.equal(keyAt(keyCenter(index, pad), pad, keys), index)
        assert.deepEqual(decodeStroke([keyCenter(index, pad)], pad, keys).map((token) => token.key), [key])
      })
    }
  }
})

test('a Zara stroke spells a name, with no vocabulary lookup', () => {
  const points = sampledPath(['z', 'a', 'r', 'a'].map((key) => center(key)))
  const tokens = decodeStroke(points, geometry, KEYSETS.letters)
  assert.equal(spellTokens(tokens, 'once'), 'Zara')
  assert.equal(spellTokens(tokens, 'upper'), 'ZARA')
})

test('straight crossings do not insert unwanted intermediate letters', () => {
  const points = sampledPath([center('a'), center('e')])
  assert.equal(spellTokens(decodeStroke(points, geometry, KEYSETS.letters), 'lower'), 'ae')
  assert.equal(spellTokens(decode(['z', 'a']), 'lower'), 'za')
})

test('repeat doubles a character without a dictionary or timing requirement', () => {
  assert.equal(spellTokens([{ key: 'h' }, { key: 'e' }, { key: 'l' }, { key: REPEAT }, { key: 'o' }], 'once'), 'Hello')
  assert.equal(spellTokens([{ key: REPEAT }], 'lower', 'Bennet'), 't')
  assert.equal(spellTokens([{ key: REPEAT }], 'lower', ''), '')
  assert.equal(spellTokens([{ key: REPEAT }], 'lower', 'Jose\u0301'), 'e\u0301')
})

test('small finger jitter within a letter does not duplicate it', () => {
  const point = center('n')
  const jitter = [point, { x: point.x + 3, y: point.y + 4 }, { x: point.x - 3, y: point.y + 2 }, point]
  assert.equal(spellTokens(decodeStroke(jitter, geometry, KEYSETS.letters), 'lower'), 'n')
})

test('outside hits are not letters and empty strokes do nothing', () => {
  assert.equal(keyAt({ x: -1, y: 20 }, geometry, KEYSETS.letters), null)
  assert.equal(keyAt({ x: 300, y: 20 }, geometry, KEYSETS.letters), null)
  assert.equal(keyAt({ x: 20, y: 300 }, geometry, KEYSETS.letters), null)
  assert.deepEqual(decodeStroke([], geometry, KEYSETS.letters), [])
  assert.deepEqual(decodeStroke([{ x: 10, y: 10 }], { width: 0, height: 0 }, KEYSETS.letters), [])
})

test('simplification handles closed strokes without recursive overflow', () => {
  const a = center('a')
  const r = center('r')
  const path = sampledPath([a, r, a])
  assert.deepEqual(simplifyPath(path, 8), [a, r, a])
  assert.equal(spellTokens(decodeStroke(path, geometry, KEYSETS.letters), 'lower'), 'ara')
})

test('names, accents, capitalization, spaces and punctuation are literal', () => {
  let state = initialEditorState()
  for (const key of "Siobhán O'Neill / X Æ A-12 / qzivon") state = insert(state, key)
  assert.equal(state.text, "Siobhán O'Neill / X Æ A-12 / qzivon")
  assert.equal(spellTokens([{ key: 'æ' }], 'once'), 'Æ')
  assert.equal(spellTokens([{ key: '-' }, { key: 'é' }, { key: 'l' }], 'once'), '-Él')
})

test('insert replaces selections and supports editing in the middle', () => {
  let state = insert(initialEditorState(), 'Zora')
  state = editorReducer(state, { type: 'select', selection: { start: 1, end: 2 } })
  state = insert(state, 'a')
  assert.equal(state.text, 'Zara')
  assert.deepEqual(state.selection, { start: 2, end: 2 })
  state = editorReducer(state, { type: 'select', selection: { start: 0, end: 0 } })
  state = insert(state, 'Hi ')
  assert.equal(state.text, 'Hi Zara')
})

test('undo and redo operate on a whole stroke and clear is reversible', () => {
  let state = insert(initialEditorState(), 'Zara', 100, 1300, { stroke: true })
  state = editorReducer(state, { type: 'undo', at: 1400 })
  assert.equal(state.text, '')
  state = editorReducer(state, { type: 'redo', at: 1500 })
  assert.equal(state.text, 'Zara')
  state = editorReducer(state, { type: 'clear', at: 1600 })
  state = editorReducer(state, { type: 'undo', at: 1700 })
  assert.equal(state.text, 'Zara')
  assert.equal(state.startedAt, 100)
  assert.equal(state.strokes, 1)
})

test('deletion respects combining characters and emoji graphemes', () => {
  let state = insert(initialEditorState(), 'Jose\u0301')
  state = editorReducer(state, { type: 'backspace', at: 300 })
  assert.equal(state.text, 'Jos')
  state = insert(state, '\u{1f469}\u200d\u{1f4bb}')
  state = editorReducer(state, { type: 'backspace', at: 400 })
  assert.equal(state.text, 'Jos')
})

test('metrics include stroke time and mark edited/pasted input as mixed', () => {
  let state = insert(initialEditorState(), 'Zara', 10, 5010, { stroke: true })
  assert.equal(state.startedAt, 10)
  assert.equal(state.lastInputAt, 5010)
  assert.equal(state.padOnly, true)
  state = editorReducer(state, { type: 'edit', text: 'Zara!', selection: { start: 5, end: 5 }, at: 6000 })
  assert.equal(state.padOnly, false)
  assert.equal(measuredWpm('hello', 60000), 1)
  assert.equal(measuredWpm('hello', 0), 0)
  assert.equal(characterCount('Jose\u0301'), 4)
})

test('empty operations and oversized insertions cannot corrupt text', () => {
  const state = initialEditorState()
  assert.equal(editorReducer(state, { type: 'undo', at: 0 }), state)
  assert.equal(editorReducer(state, { type: 'backspace', at: 0 }), state)
  assert.equal(editorReducer(state, { type: 'clear', at: 0 }), state)
  assert.equal(insert(state, ''), state)
  assert.equal(insert(state, 'a'.repeat(MAX_TEXT_LENGTH + 1)), state)
})
