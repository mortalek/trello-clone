import assert from 'node:assert/strict'
import test from 'node:test'
import type { List } from '../../types.ts'
import { filterListsByCardTitle } from '../cardSearch.ts'

const sampleLists: List[] = [
  {
    id: 1,
    title: 'To Do',
    cards: [
      { id: 1, title: 'Write Tests', description: 'Coverage' },
      { id: 2, title: 'Review code', description: 'Review' },
    ],
  },
  { id: 2, title: 'Done', cards: [{ id: 3, title: 'Ship feature', description: 'Release' }] },
]

test('an empty query returns all cards', () => {
  const result = filterListsByCardTitle(sampleLists, '')

  assert.deepEqual(result, sampleLists)
  assert.equal(result.flatMap((list) => list.cards).length, 3)
})

test('matches card titles without case sensitivity', () => {
  const result = filterListsByCardTitle(sampleLists, 'wRiTe')

  assert.deepEqual(result.map((list) => list.cards.map((card) => card.title)), [['Write Tests']])
})

test('trims leading and trailing whitespace from the query', () => {
  const result = filterListsByCardTitle(sampleLists, '  REVIEW  ')

  assert.deepEqual(result.map((list) => list.cards.map((card) => card.title)), [['Review code']])
})

test('returns no lists when no card title matches', () => {
  assert.deepEqual(filterListsByCardTitle(sampleLists, 'missing'), [])
})

test('does not modify the original lists or cards', () => {
  const originalSnapshot = structuredClone(sampleLists)

  const result = filterListsByCardTitle(sampleLists, 'ship')

  assert.deepEqual(sampleLists, originalSnapshot)
  assert.notEqual(result[0], sampleLists[1])
  assert.equal(result[0]?.cards[0], sampleLists[1]?.cards[0])
})
