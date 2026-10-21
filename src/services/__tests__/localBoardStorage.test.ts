import assert from 'node:assert/strict';
import test from 'node:test';
import type { List } from '../../types.ts';
import {
  initializeBoardState,
  saveBoardState,
  type StringStorage,
} from '../localBoardStorage.ts';

const storageKey = 'trello-clone.board.v1'
const sampleLists: List[] = [
  {
    id: 2,
    title: 'In Progress',
    cards: [
      { id: 9, title: 'First', description: 'Description one' },
      { id: 4, title: 'Second', description: 'Description two' },
    ],
  },
  { id: 1, title: 'Done', cards: [{ id: 7, title: 'Third', description: 'Description three' }] },
]

function memoryStorage(initialValue: string | null = null): StringStorage & {
  value: string | null
  writes: number
} {
  return {
    value: initialValue,
    writes: 0,
    getItem(key) {
      assert.equal(key, storageKey)
      return this.value
    },
    setItem(key, value) {
      assert.equal(key, storageKey)
      this.writes += 1
      this.value = value
    },
  }
}

test('seeds localStorage with initial data when no saved value exists', () => {
  const storage = memoryStorage()
  const initialLists = structuredClone(sampleLists)

  const result = initializeBoardState(storage, initialLists)

  assert.deepEqual(result, { status: 'ready', lists: initialLists })
  assert.deepEqual(JSON.parse(storage.value ?? 'null'), initialLists)
  assert.equal(storage.writes, 1)
});

test('loads saved lists, cards, and their order without rewriting the value', () => {
  const storage = memoryStorage(JSON.stringify(sampleLists))

  const result = initializeBoardState(storage, [])

  assert.deepEqual(result, { status: 'ready', lists: sampleLists })
  assert.equal(storage.writes, 0)
});

test('keeps a deliberately empty board instead of replacing it with initial data', () => {
  const storage = memoryStorage('[]')

  const result = initializeBoardState(storage, sampleLists)

  assert.deepEqual(result, { status: 'ready', lists: [] })
  assert.equal(storage.value, '[]')
  assert.equal(storage.writes, 0)
});

test('does not overwrite malformed JSON', () => {
  const storage = memoryStorage('{not valid JSON')
  const malformedValue = storage.value

  const result = initializeBoardState(storage, sampleLists)

  assert.equal(result.status, 'load-error')
  assert.equal(storage.value, malformedValue)
  assert.equal(storage.writes, 0)
});

test('does not overwrite JSON that does not match the board structure', () => {
  const storage = memoryStorage('{"cards":[]}')
  const invalidValue = storage.value

  const result = initializeBoardState(storage, sampleLists)

  assert.equal(result.status, 'load-error')
  assert.equal(storage.value, invalidValue)
  assert.equal(storage.writes, 0)
});

test('saves additions, edits, removals, and reordered lists and cards', () => {
  const storage = memoryStorage()
  const changedLists = structuredClone(sampleLists)
  changedLists.reverse()
  changedLists[1]!.cards.reverse()
  changedLists[1]!.cards[0]!.title = 'Edited'
  changedLists[1]!.cards.push({ id: 10, title: 'Added', description: 'New card' })
  changedLists[1]!.cards.splice(1, 1)

  saveBoardState(storage, changedLists)

  assert.deepEqual(JSON.parse(storage.value ?? 'null'), changedLists)
  assert.equal(storage.writes, 1)
});

test('propagates localStorage write errors so the app can report them', () => {
  const writeError = new Error('Storage quota exceeded')
  const storage: StringStorage = {
    getItem: () => null,
    setItem: () => { throw writeError },
  }

  assert.throws(() => saveBoardState(storage, sampleLists), writeError)
});
