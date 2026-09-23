import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHALLENGES,
  FOLDS,
  CHARACTER_GROUPS,
  SYMBOL_GROUPS,
  composeText,
  composerReducer,
  countWords,
  effectiveWpm,
  initialComposerState,
  normalizedText,
} from '../lib/phrase-folds.ts'

function select(state, id, at = 1000) {
  const option = FOLDS[state.node].find((fold) => fold.id === id)
  assert.ok(option, `Missing ${id} in ${state.node}`)
  return composerReducer(state, { type: 'choose', option, at })
}

test('every fold points to an existing continuation and has valid variations', () => {
  for (const [node, options] of Object.entries(FOLDS)) {
    assert.ok(options.length >= 6, `${node} needs at least six choices`)
    assert.equal(new Set(options.map((option) => option.id)).size, options.length)
    for (const option of options) {
      assert.ok(FOLDS[option.next], `Missing continuation ${option.next}`)
      assert.equal(option.variations[0], option.text)
    }
  }
})

for (const challenge of CHALLENGES) {
  test(`guided path produces exactly: ${challenge.text}`, () => {
    let state = initialComposerState()
    challenge.path.forEach((id, index) => { state = select(state, id, index * 1000) })
    state = composerReducer(state, { type: 'finish', at: 5000 })
    assert.equal(composeText(state.chunks), challenge.text)
    assert.equal(state.touches, challenge.path.length + 1)
    assert.equal(state.startedAt, 0)
    assert.equal(state.lastInputAt, 5000)
    assert.equal(state.node, 'start')
  })
}

test('reshaping changes one phrase and keeps the rest of the sentence', () => {
  let state = initialComposerState()
  for (const id of CHALLENGES[0].path) state = select(state, id)
  const previous = composeText(state.chunks)
  state = composerReducer(state, { type: 'replace', index: 3, text: 'tonight', at: 2000 })
  assert.equal(composeText(state.chunks), 'I’d love to catch up over coffee tonight')
  state = composerReducer(state, { type: 'undo', at: 3000 })
  assert.equal(composeText(state.chunks), previous)
  assert.equal(state.touches, 6)
})

test('clear can be undone with the original continuation restored', () => {
  let state = select(initialComposerState(), 'can')
  state = select(state, 'work-on')
  const previous = state
  state = composerReducer(state, { type: 'clear', at: 2000 })
  assert.equal(composeText(state.chunks), '')
  state = composerReducer(state, { type: 'undo', at: 3000 })
  assert.equal(composeText(state.chunks), composeText(previous.chunks))
  assert.equal(state.node, 'together')
  assert.equal(state.mark, '?')
})

test('exact spelling preserves case and includes all printable ASCII characters', () => {
  const available = CHARACTER_GROUPS.map((group) => group.chars).join('') + SYMBOL_GROUPS.map((group) => group.chars).join('') + ' '
  for (let code = 32; code <= 126; code++) {
    const character = String.fromCharCode(code)
    assert.ok(available.includes(character.toLowerCase()), `Unavailable character ${character}`)
  }
  let state = composerReducer(initialComposerState(), { type: 'exact', text: 'Zoe @ 4:30', at: 10 })
  state = composerReducer(state, { type: 'exact', text: '!', at: 20 })
  assert.equal(composeText(state.chunks), 'Zoe @ 4:30!')
})

test('empty and invalid mutations do not affect the draft', () => {
  const state = initialComposerState()
  assert.equal(composerReducer(state, { type: 'finish', at: 1 }), state)
  assert.equal(composerReducer(state, { type: 'undo', at: 1 }), state)
  assert.equal(composerReducer(state, { type: 'replace', index: 4, text: 'text', at: 1 }), state)
  assert.equal(composerReducer(state, { type: 'exact', text: '   ', at: 1 }), state)
})

test('finishing is idempotent and a new sentence has separate punctuation', () => {
  let state = select(initialComposerState(), 'can')
  state = select(state, 'coffee-plan')
  state = composerReducer(state, { type: 'finish', at: 2000 })
  const finished = state
  assert.equal(composerReducer(state, { type: 'finish', at: 3000 }), finished)
  state = select(state, 'lets')
  state = select(state, 'break')
  state = composerReducer(state, { type: 'finish', at: 4000 })
  assert.equal(composeText(state.chunks), 'Can we grab a coffee? Let’s take a little break.')
})

test('paging is reversible and touches include non-writing input actions', () => {
  let state = composerReducer(initialComposerState(), { type: 'touch', at: 10 })
  state = composerReducer(state, { type: 'more', at: 20 })
  assert.equal(state.page, 1)
  state = composerReducer(state, { type: 'undo', at: 30 })
  assert.equal(state.page, 0)
  assert.equal(state.touches, 3)
  assert.equal(state.startedAt, 10)
})

test('measurements count real output and normalized text consistently', () => {
  assert.equal(countWords('I’d love to catch up over coffee tomorrow.'), 8)
  assert.equal(countWords('...'), 0)
  assert.equal(effectiveWpm('hello', 60000), 1)
  assert.equal(effectiveWpm('', 0), 0)
  assert.equal(normalizedText('  I’d   LOVE to '), "i'd love to")
})
