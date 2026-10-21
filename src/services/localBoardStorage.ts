import type { List } from '../types.ts'

const BOARD_STORAGE_KEY = 'trello-clone.board.v1'

export interface StringStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface BoardInitialization {
  status: 'ready' | 'load-error'
  lists: List[]
  error?: unknown
}

export const browserStorage: StringStorage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isListArray = (value: unknown): value is List[] =>
  Array.isArray(value) && value.every((list) =>
    isRecord(list) &&
    typeof list.id === 'number' &&
    typeof list.title === 'string' &&
    Array.isArray(list.cards) &&
    list.cards.every((card) =>
      isRecord(card) &&
      typeof card.id === 'number' &&
      typeof card.title === 'string' &&
      typeof card.description === 'string'
    )
  )

export function initializeBoardState(
  storage: StringStorage,
  initialLists: List[],
): BoardInitialization {
  let serialized: string | null

  try {
    serialized = storage.getItem(BOARD_STORAGE_KEY)
  } catch (error) {
    return { status: 'load-error', lists: initialLists, error }
  }

  if (serialized === null) {
    try {
      storage.setItem(BOARD_STORAGE_KEY, JSON.stringify(initialLists))
    } catch (error) {
      return { status: 'ready', lists: initialLists, error }
    }

    return { status: 'ready', lists: initialLists }
  }

  let storedState: unknown
  try {
    storedState = JSON.parse(serialized) as unknown
  } catch (error) {
    return { status: 'load-error', lists: initialLists, error }
  }

  if (!isListArray(storedState)) {
    return {
      status: 'load-error',
      lists: initialLists,
      error: new Error('Stored board state does not match the expected data structure.'),
    }
  }

  return { status: 'ready', lists: storedState }
}

export function saveBoardState(storage: StringStorage, lists: List[]): void {
  storage.setItem(BOARD_STORAGE_KEY, JSON.stringify(lists))
}
