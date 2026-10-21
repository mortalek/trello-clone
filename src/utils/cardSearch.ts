import type { List } from '../types.ts'

export function filterListsByCardTitle(lists: readonly List[], query: string): List[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()

  if (!normalizedQuery) {
    return lists.map((list) => ({ ...list, cards: [...list.cards] }))
  }

  return lists
    .map((list) => ({
      ...list,
      cards: list.cards.filter((card) =>
        card.title.toLocaleLowerCase().includes(normalizedQuery),
      ),
    }))
    .filter((list) => list.cards.length > 0)
}
