export type Fold = {
  id: string
  text: string
  hint: string
  next: string
  variations: string[]
  mark?: '.' | '?'
}

function fold(
  id: string,
  text: string,
  hint: string,
  next = 'end',
  variations: string[] = [],
  mark?: '.' | '?',
): Fold {
  return { id, text, hint, next, variations: [text, ...variations], mark }
}

const plans = [
  fold('catch-up', 'catch up', 'Make a little time', 'where', ['reconnect', 'spend some time together']),
  fold('coffee-plan', 'grab a coffee', 'Something simple', 'when', ['get a coffee', 'meet for coffee']),
  fold('work-on', 'work on this', 'Move it forward', 'together', ['look at this', 'figure this out']),
  fold('talk', 'talk this through', 'Find some clarity', 'when', ['talk about it', 'have a proper conversation']),
  fold('try-new', 'try something new', 'A change of pace', 'when', ['do something different', 'give it a try']),
  fold('break', 'take a little break', 'Room to breathe', 'when', ['take a moment', 'step back for a bit']),
]

export const FOLDS: Record<string, Fold[]> = {
  start: [
    fold('love', 'I’d love to', 'Start with a feeling', 'plans', ['I’d like to', 'I’m hoping to', 'I want to', 'I really want to', 'I’d be happy to'], '.'),
    fold('can', 'Can we', 'Make a little plan', 'plans', ['Could we', 'Shall we', 'Do you want to', 'Would you like to', 'Would it help to'], '?'),
    fold('thinking', 'I’m thinking about', 'Let an idea out', 'ideas', ['I’ve been thinking about', 'I keep thinking about', 'I’m curious about', 'I’m excited about'], '.'),
    fold('update', 'Just a heads-up,', 'Keep them in the loop', 'updates', ['Just so you know,', 'Quick update:', 'By the way,', 'A little update:'], '.'),
    fold('thanks', 'Thank you for', 'A little appreciation', 'thanks', ['Thanks for', 'I really appreciate you', 'I’m grateful for', 'A big thank-you for'], '.'),
    fold('lets', 'Let’s', 'Get something going', 'plans', ['We could', 'We should', 'Maybe we could', 'I think we should', 'We can'], '.'),
    fold('need', 'I need to', 'Say what you need', 'plans', ['I’d prefer to', 'I’m going to', 'I’m planning to'], '.'),
    fold('feeling', 'I’m feeling', 'Find the right words', 'feelings', ['I feel', 'I’ve been feeling', 'I’m honestly feeling'], '.'),
    fold('could-you', 'Could you', 'Ask for a hand', 'requests', ['Can you', 'Would you', 'Would you be able to'], '?'),
    fold('sounds', 'That sounds', 'Give a little feedback', 'reactions', ['This sounds', 'It sounds', 'The idea sounds'], '.'),
    fold('honest', 'To be honest,', 'Say it your way', 'updates', ['Honestly,', 'The thing is,', 'To tell you the truth,'], '.'),
    fold('what-if', 'What if we', 'Explore a possibility', 'plans', ['Could we perhaps', 'Do you think we could', 'Would it be possible to'], '?'),
  ],
  plans,
  ideas: [
    fold('different', 'trying something different', 'A fresh direction', 'when'),
    fold('next-step', 'the next step', 'Look ahead'),
    fold('project', 'our next project', 'Make something good', 'when'),
    fold('slowing', 'slowing down a little', 'Take your time', 'when'),
    fold('said', 'what you said', 'Keep the thought going'),
    fold('time', 'making more time for us', 'What matters', 'when'),
  ],
  updates: [
    fold('late', 'I’m running a little late', 'A small delay', 'eta', ['I’ll be a little late', 'I’m a bit behind schedule']),
    fold('be-there', 'I’ll be there', 'Count me in', 'when', ['I can be there', 'I’m planning to be there']),
    fold('on-track', 'everything is on track', 'Looking good'),
    fold('more-time', 'I need a little more time', 'Make some room', 'end', ['I need a bit more time', 'this is taking a little longer']),
    fold('finished', 'I’ve finished my part', 'One thing done'),
    fold('changed', 'the plan has changed', 'A new direction'),
  ],
  thanks: [
    fold('being-there', 'always being there', 'The little things', 'for-who', ['being there', 'showing up']),
    fold('help', 'your help', 'It made a difference', 'thanks-tail'),
    fold('making-time', 'making time', 'Time is a gift', 'for-who'),
    fold('thinking-me', 'thinking of me', 'Feeling seen'),
    fold('patient', 'being so patient', 'A little understanding'),
    fold('message', 'the lovely message', 'It meant a lot'),
  ],
  where: [
    fold('coffee', 'over coffee', 'Keep it easy', 'when', ['over a coffee', 'at a café', 'over a cup of tea']),
    fold('in-person', 'in person', 'Face to face', 'when'),
    fold('lunch', 'over lunch', 'Make a meal of it', 'when', ['over dinner', 'over breakfast']),
    fold('walk', 'on a walk', 'A little fresh air', 'when'),
    fold('at-home', 'at my place', 'Somewhere familiar', 'when', ['at your place', 'at home']),
    fold('for-while', 'for a little while', 'No big plans', 'when'),
  ],
  together: [
    fold('together', 'together', 'Better as a team', 'when', ['with the team', 'with everyone', 'side by side']),
    fold('at-work', 'at work', 'A little focus', 'when'),
    fold('in-morning', 'in the morning', 'A fresh start'),
    fold('after-lunch', 'after lunch', 'A good moment'),
    fold('at-pace', 'at our own pace', 'No need to rush'),
    fold('one-step', 'one step at a time', 'Make it manageable'),
  ],
  when: [
    fold('tomorrow', 'tomorrow', 'A little time ahead', 'end', ['today', 'tonight', 'tomorrow morning', 'tomorrow evening', 'the day after tomorrow']),
    fold('afternoon', 'this afternoon', 'Later today', 'end', ['this evening', 'this morning', 'later today']),
    fold('next-week', 'next week', 'Something to look forward to', 'end', ['this week', 'next month', 'the week after next']),
    fold('weekend', 'this weekend', 'A little more room', 'end', ['next weekend', 'on Saturday', 'on Sunday']),
    fold('free', 'when you’re free', 'No rush', 'end', ['whenever works for you', 'when you have time']),
    fold('after-work', 'after work', 'Make an evening of it', 'end', ['after class', 'after the meeting']),
    fold('soon', 'sometime soon', 'Keep it open'),
    fold('tonight', 'tonight', 'Before the day ends'),
    fold('monday', 'on Monday', 'A new week', 'end', ['on Tuesday', 'on Wednesday', 'on Thursday', 'on Friday']),
    fold('later', 'a little later', 'Not quite yet'),
    fold('right-now', 'right now', 'No time like this'),
    fold('ready', 'when you’re ready', 'At your own pace'),
  ],
  eta: [
    fold('five', 'by about five minutes', 'Almost there'),
    fold('ten', 'by about ten minutes', 'A little longer'),
    fold('fifteen', 'by about fifteen minutes', 'A small delay'),
    fold('sorry', 'and I’m sorry', 'A little care'),
    fold('on-way', 'but I’m on my way', 'Getting there'),
    fold('keep-posted', 'and I’ll keep you posted', 'Stay in the loop'),
  ],
  'for-who': [
    fold('for-me', 'for me', 'Make it personal', 'end', ['for us', 'for everyone', 'when it matters']),
    fold('for-us', 'for us', 'Better together'),
    fold('for-this', 'for this', 'It matters'),
    fold('when-needed', 'when I needed you', 'The right moment'),
    fold('for-team', 'for the team', 'Everyone counts'),
    fold('lately', 'lately', 'It hasn’t gone unnoticed'),
  ],
  'thanks-tail': [
    fold('means-lot', '— it means a lot', 'Make it count'),
    fold('with-this', 'with this', 'A particular thing'),
    fold('today', 'today', 'A good moment'),
    fold('really', '— I really appreciate it', 'A little extra warmth'),
    fold('as-always', 'as always', 'Something you can count on'),
    fold('again', 'again', 'Worth saying twice'),
  ],
  feelings: [
    fold('excited', 'really excited about this', 'Looking forward'),
    fold('overwhelmed', 'a little overwhelmed', 'A lot going on'),
    fold('good', 'pretty good today', 'A good day'),
    fold('tired', 'a bit tired', 'Time for a pause'),
    fold('grateful', 'grateful for all of this', 'Take it in'),
    fold('unsure', 'a little unsure', 'Still figuring it out'),
  ],
  requests: [
    fold('take-look', 'take a look at this', 'A second pair of eyes', 'when'),
    fold('let-know', 'let me know what you think', 'Your thoughts matter'),
    fold('send-over', 'send that over', 'Pass it along', 'when'),
    fold('hand', 'give me a hand', 'A little support', 'when'),
    fold('check', 'check in with me', 'Stay connected', 'when'),
    fold('explain', 'explain that a little more', 'Help me understand'),
  ],
  reactions: [
    fold('great', 'really good to me', 'A little enthusiasm'),
    fold('interesting', 'interesting', 'Tell me more'),
    fold('perfect', 'like a perfect plan', 'Count me in'),
    fold('tricky', 'a little tricky', 'Think it through'),
    fold('reasonable', 'reasonable', 'That works'),
    fold('fun', 'like a lot of fun', 'Something to enjoy'),
  ],
  end: [
    fold('works', 'if that works for you', 'Leave room for them'),
    fold('moment', 'when you have a moment', 'Take your time'),
    fold('up-for', 'if you’re up for it', 'An open invitation'),
    fold('no-pressure', '— no pressure', 'Keep it easy'),
    fold('see-goes', 'and see how it goes', 'Stay open'),
    fold('good-you', 'if that sounds good to you', 'Find some agreement'),
  ],
}

export type Chunk = {
  id: number
  text: string
  kind: 'phrase' | 'exact' | 'punctuation'
  foldId?: string
  variations: string[]
}

type Snapshot = {
  chunks: Chunk[]
  node: string
  page: number
  mark: '.' | '?'
}

export type ComposerState = Snapshot & {
  touches: number
  startedAt: number | null
  lastInputAt: number | null
  serial: number
  history: Snapshot[]
}

export function initialComposerState(): ComposerState {
  return {
    chunks: [], node: 'start', page: 0, mark: '.', touches: 0,
    startedAt: null, lastInputAt: null, serial: 0, history: [],
  }
}

export type ComposerAction =
  | { type: 'choose'; option: Fold; at: number }
  | { type: 'replace'; index: number; text: string; at: number }
  | { type: 'exact'; text: string; index?: number; at: number }
  | { type: 'finish'; at: number }
  | { type: 'undo'; at: number }
  | { type: 'more'; at: number }
  | { type: 'clear'; at: number }
  | { type: 'touch'; at: number }
  | { type: 'reset' }

function snapshot(state: ComposerState): Snapshot {
  return { chunks: state.chunks, node: state.node, page: state.page, mark: state.mark }
}

function record(state: ComposerState, at: number): ComposerState {
  return {
    ...state,
    touches: state.touches + 1,
    startedAt: state.startedAt ?? at,
    lastInputAt: at,
  }
}

export function composerReducer(state: ComposerState, action: ComposerAction): ComposerState {
  if (action.type === 'reset') return initialComposerState()
  if (action.type === 'touch') return record(state, action.at)
  if (action.type === 'undo') {
    const previous = state.history.at(-1)
    if (!previous) return state
    return { ...record(state, action.at), ...previous, history: state.history.slice(0, -1) }
  }
  if (action.type === 'finish' && (!state.chunks.length || state.chunks.at(-1)?.kind === 'punctuation')) return state
  if (action.type === 'clear' && !state.chunks.length) return state
  if ((action.type === 'exact' || action.type === 'replace') && !action.text.trim()) return state
  if (action.type === 'replace' && !state.chunks[action.index]) return state
  if (action.type === 'exact' && action.index !== undefined && !state.chunks[action.index]) return state

  const next = {
    ...record(state, action.at),
    history: [...state.history.slice(-199), snapshot(state)],
    serial: state.serial + 1,
  }

  switch (action.type) {
    case 'choose':
      return {
        ...next,
        chunks: [...state.chunks, {
          id: next.serial, text: action.option.text, kind: 'phrase',
          foldId: action.option.id, variations: action.option.variations,
        }],
        node: action.option.next,
        mark: action.option.mark ?? state.mark,
        page: 0,
      }
    case 'replace':
      return {
        ...next,
        chunks: state.chunks.map((chunk, index) => index === action.index ? { ...chunk, text: action.text } : chunk),
      }
    case 'exact': {
      const text = action.text.trim()
      const chunk: Chunk = {
        id: next.serial, text,
        kind: /^[.,!?;:]+$/.test(text) ? 'punctuation' : 'exact',
        variations: [],
      }
      return {
        ...next,
        chunks: action.index === undefined
          ? [...state.chunks, chunk]
          : state.chunks.map((original, index) => index === action.index ? chunk : original),
      }
    }
    case 'finish':
      return {
        ...next,
        chunks: [...state.chunks, { id: next.serial, text: state.mark, kind: 'punctuation', variations: [] }],
        node: 'start', page: 0, mark: '.',
      }
    case 'more':
      return { ...next, page: (state.page + 1) % Math.ceil((FOLDS[state.node]?.length ?? 6) / 6) }
    case 'clear':
      return { ...next, chunks: [], node: 'start', page: 0, mark: '.' }
  }
}

export function composeText(chunks: Chunk[]): string {
  return chunks.reduce((text, chunk) => {
    const needsSpace = text.length > 0 && chunk.kind !== 'punctuation'
    return `${text}${needsSpace ? ' ' : ''}${chunk.text}`
  }, '')
}

export function countWords(text: string): number {
  return text.match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g)?.length ?? 0
}

export function normalizedText(text: string): string {
  return text.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase()
}

export function effectiveWpm(text: string, elapsedMs: number): number {
  if (elapsedMs <= 0 || !text) return 0
  return Math.round((text.length / 5) / (elapsedMs / 60_000))
}

export const CHALLENGES = [
  {
    title: 'A little catch-up',
    text: 'I’d love to catch up over coffee tomorrow.',
    path: ['love', 'catch-up', 'coffee', 'tomorrow'],
  },
  {
    title: 'Better together',
    text: 'Can we work on this together next week?',
    path: ['can', 'work-on', 'together', 'next-week'],
  },
  {
    title: 'A little appreciation',
    text: 'Thank you for always being there for me.',
    path: ['thanks', 'being-there', 'for-me'],
  },
]

export const CHARACTER_GROUPS = [
  { label: 'a b c d e', chars: 'abcde' },
  { label: 'f g h i j', chars: 'fghij' },
  { label: 'k l m n o', chars: 'klmno' },
  { label: 'p q r s t', chars: 'pqrst' },
  { label: 'u v w x y z', chars: 'uvwxyz' },
]

export const SYMBOL_GROUPS = [
  { label: '0 1 2 3 4', chars: '01234' },
  { label: '5 6 7 8 9', chars: '56789' },
  { label: '. , ? ! : ;', chars: '.,?!:;' },
  { label: "' / @ & - _", chars: "'/@&-_" },
  { label: '( ) [ ] { }', chars: '()[]{}' },
  { label: '+ = # % $ *', chars: '+=#%$*' },
  { label: '< > \\ | ~ ^', chars: '<>\\|~^' },
  { label: '" `', chars: '"`' },
]
