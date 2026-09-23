import assert from 'node:assert/strict'
import test from 'node:test'
import {
  KEYSETS, REPEAT, BACKSPACE, DIRECTIONS, FLICK_THRESHOLD, applyCase,
  directionFromVector, chordToken, chordText, findChord, displayToken,
  initialChordState, transitionChord, chordIsPending,
  initialEditorState, editorReducer, measuredWpm, characterCount, MAX_TEXT_LENGTH,
} from '../lib/duet-engine.ts'

const insert = (state, text, at = 100, endedAt = 200, extra = {}) => editorReducer(state, { type: 'insert', text, at, endedAt, ...extra })
const vector = (degrees) => ({ x: Math.sin(degrees * Math.PI / 180) * 40, y: -Math.cos(degrees * Math.PI / 180) * 40 })

function controller() {
  let state = initialChordState()
  const commits = []
  return {
    get state() { return state },
    commits,
    send(action) { const result = transitionChord(state, action); state = result.state; if (result.commit) commits.push(result.commit); return result },
    begin(hand, pointer, at = 100) { return this.send({ type: 'begin', hand, pointer, at }) },
    move(hand, pointer, direction) { return this.send({ type: 'move', hand, pointer, direction }) },
    end(hand, pointer, at = 1000) { return this.send({ type: 'end', hand, pointer, at }) },
  }
}

test('all five layers have 36 unique chords; every Latin letter is available', () => {
  for (const keys of Object.values(KEYSETS)) {
    assert.equal(keys.length, 36)
    assert.equal(new Set(keys).size, keys.length)
  }
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') assert.ok(KEYSETS.letters.includes(letter))
  for (const pair of KEYSETS.pairs) assert.equal(pair.length, 2)
})

test('six directions decode from motion, independent of a fixed screen origin', () => {
  DIRECTIONS.forEach((direction, index) => {
    for (const length of [20, 44, 120]) assert.equal(directionFromVector({ x: direction.x * length, y: direction.y * length }), index)
    for (const origin of [{ x: 1, y: 1 }, { x: 250, y: 890 }, { x: -12, y: 34 }]) {
      const end = { x: origin.x + direction.x * 32, y: origin.y + direction.y * 32 }
      assert.equal(directionFromVector({ x: end.x - origin.x, y: end.y - origin.y }), index)
    }
  })
})

test('jitter and invalid vectors do not choose a direction; hysteresis prevents edge chatter', () => {
  assert.equal(directionFromVector({ x: 2, y: 8 }), null)
  assert.equal(directionFromVector({ x: 0, y: FLICK_THRESHOLD - 1 }), null)
  assert.equal(directionFromVector({ x: Infinity, y: 0 }), null)
  assert.equal(directionFromVector({ x: NaN, y: 0 }), null)
  assert.equal(directionFromVector(vector(37)), 2)
  assert.equal(directionFromVector(vector(37), 1), 1)
  assert.equal(directionFromVector(vector(39), 1), 2)
  assert.equal(directionFromVector({ x: 0, y: 0 }, 1), null)
})

test('all characters, accents, pairs and symbols can be found and round-tripped', () => {
  for (const [layer, keys] of Object.entries(KEYSETS)) {
    keys.forEach((token, index) => assert.equal(chordToken(Math.floor(index / 6), index % 6, layer), token))
    for (const token of keys) {
      const location = findChord(token)
      assert.ok(location)
      assert.equal(chordToken(location.left, location.right, location.keyset), token)
    }
  }
  assert.equal(findChord('some word'), null)
  assert.equal(chordToken(null, 1, 'letters'), null)
  assert.equal(chordToken(1, null, 'letters'), null)
})

test('two simultaneous thumb directions commit once when either thumb lifts', () => {
  for (const first of ['left', 'right']) {
    const c = controller()
    c.begin('left', 10, 100)
    c.begin('right', 20, 120)
    c.move('left', 10, 1)
    c.move('right', 20, 1)
    assert.equal(c.commits.length, 0)
    c.end(first, first === 'left' ? 10 : 20, 800)
    assert.equal(c.commits.length, 1)
    assert.equal(chordToken(c.commits[0].left, c.commits[0].right, 'letters'), 'h')
    assert.equal(c.commits[0].startedAt, 100)
    assert.equal(c.commits[0].endedAt, 800)
    assert.equal(c.state.waitingForRelease, true)
    c.end(first === 'left' ? 'right' : 'left', first === 'left' ? 20 : 10)
    assert.equal(c.commits.length, 1)
    assert.deepEqual(c.state, initialChordState())
  }
})

test('one pointer can latch the first direction and complete the second later', () => {
  const c = controller()
  c.begin('left', 1)
  c.move('left', 1, 4)
  c.end('left', 1, 250)
  assert.equal(c.commits.length, 0)
  assert.equal(c.state.directions.left, 4)
  c.begin('right', 1, 1100)
  c.move('right', 1, 1)
  c.end('right', 1, 1500)
  assert.equal(chordToken(c.commits[0].left, c.commits[0].right, 'letters'), 'z')
  assert.equal(c.commits[0].startedAt, 100)
  assert.equal(c.commits[0].endedAt, 1500)
})

test('accessible direction buttons work in either order without timing limits', () => {
  const c = controller()
  c.send({ type: 'choose', hand: 'right', direction: 1, at: 20 })
  c.send({ type: 'choose', hand: 'left', direction: 4, at: 20000 })
  assert.equal(c.commits.length, 1)
  assert.equal(chordToken(c.commits[0].left, c.commits[0].right, 'letters'), 'z')
  assert.equal(chordIsPending(c.state), false)
})

test('a chord cannot repeat until both pointers release', () => {
  const c = controller()
  c.begin('left', 1)
  c.begin('right', 2)
  c.move('left', 1, 0)
  c.move('right', 2, 0)
  c.end('left', 1)
  c.begin('left', 3)
  c.move('right', 2, 4)
  c.send({ type: 'choose', hand: 'left', direction: 3, at: 2000 })
  assert.equal(c.commits.length, 1)
  assert.equal(c.state.pointers.left, null)
  c.end('right', 2)
  assert.deepEqual(c.state, initialChordState())
})

test('extra fingers and unrelated releases cannot steal an active thumb', () => {
  const c = controller()
  c.begin('left', 1)
  c.begin('left', 3)
  c.begin('right', 1)
  assert.equal(c.state.pointers.left, 1)
  assert.equal(c.state.pointers.right, null)
  c.move('left', 3, 2)
  c.end('left', 3)
  assert.equal(c.state.directions.left, null)
  assert.equal(c.state.pointers.left, 1)
})

test('returning to the origin removes a direction; cancellation discards a whole chord', () => {
  const c = controller()
  c.begin('left', 1)
  c.move('left', 1, 2)
  c.move('left', 1, null)
  c.end('left', 1)
  assert.equal(chordIsPending(c.state), false)
  c.begin('left', 10)
  c.begin('right', 20)
  c.move('left', 10, 0)
  c.move('right', 20, 1)
  c.send({ type: 'cancel' })
  c.end('left', 10)
  c.end('right', 20)
  assert.equal(c.commits.length, 0)
  assert.deepEqual(c.state, initialChordState())
})

test('literal pairs respect case and never insert an inferred space or word', () => {
  assert.equal(chordText('th', 'once'), 'Th')
  assert.equal(chordText('th', 'upper'), 'TH')
  assert.equal(chordText('th', 'lower', 'wi'), 'th')
  assert.equal(applyCase('-é', 'once'), '-É')
  assert.equal(applyCase('æ', 'once'), 'Æ')
  assert.equal(displayToken(' '), '␣')
  assert.equal(displayToken('\n'), '↵')
})

test('repeat uses the preceding grapheme without changing its case', () => {
  assert.equal(chordText(REPEAT, 'lower', 'Bennet'), 't')
  assert.equal(chordText(REPEAT, 'once', 'Jose\u0301'), 'e\u0301')
  assert.equal(chordText(REPEAT, 'lower', ''), '')
  assert.equal(chordText(BACKSPACE, 'lower', 'text'), '')
})

test('unfamiliar names and invented words round-trip through actual chords', () => {
  for (const name of ['Zara', 'Bennett', "Siobhán O'Neill", 'qzivon-27', 'X Æ A-12']) {
    let state = initialEditorState()
    for (const letter of name) {
      const chord = findChord(letter)
      assert.ok(chord)
      const token = chordToken(chord.left, chord.right, chord.keyset)
      state = insert(state, chordText(token, letter === letter.toLocaleUpperCase() ? 'upper' : 'lower', state.text))
    }
    assert.equal(state.text, name)
  }
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

test('undo and redo preserve a whole two-character chord; clear can be undone', () => {
  let state = insert(initialEditorState(), 'Th', 100, 1300, { stroke: true })
  state = editorReducer(state, { type: 'undo', at: 1400 })
  assert.equal(state.text, '')
  state = editorReducer(state, { type: 'redo', at: 1500 })
  assert.equal(state.text, 'Th')
  state = editorReducer(state, { type: 'clear', at: 1600 })
  state = editorReducer(state, { type: 'undo', at: 1700 })
  assert.equal(state.text, 'Th')
  assert.equal(state.startedAt, 100)
  assert.equal(state.strokes, 1)
})

test('deletion respects combining characters and multi-codepoint graphemes', () => {
  let state = insert(initialEditorState(), 'Jose\u0301')
  state = editorReducer(state, { type: 'backspace', at: 300 })
  assert.equal(state.text, 'Jos')
  state = insert(state, '\u{1f469}\u200d\u{1f4bb}')
  state = editorReducer(state, { type: 'backspace', at: 400 })
  assert.equal(state.text, 'Jos')
})

test('metrics include chord time; pasted and directly edited input cannot earn chord scores', () => {
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

test('empty operations, selection bounds and oversized input cannot corrupt text', () => {
  const state = initialEditorState()
  for (const type of ['undo', 'redo', 'backspace', 'clear']) assert.equal(editorReducer(state, { type, at: 0 }), state)
  assert.equal(insert(state, ''), state)
  assert.equal(insert(state, 'a'.repeat(MAX_TEXT_LENGTH + 1)), state)
  const selected = editorReducer(insert(state, 'hi'), { type: 'select', selection: { start: -3, end: 500 } })
  assert.deepEqual(selected.selection, { start: 0, end: 2 })
})
