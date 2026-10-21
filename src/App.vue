<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import Draggable from 'vuedraggable';
import ModalDialog from './components/ModalDialog.vue';
import type { Card , List } from '@/types';
import { browserStorage, initializeBoardState, saveBoardState } from './services/localBoardStorage.ts';

const initialLists: List[] = [
  {
    id: 1,
    title: 'To Do',
    cards: [
      { id: 1, title: 'Task 1', description: 'Description for Task 1' },
      { id: 2, title: 'Task 2', description: 'Description for Task 2' }
    ]
  },
  {
    id: 2,
    title: 'In Progress',
    cards: [
      { id: 3, title: 'Task 3', description: 'Description for Task 3' },
      { id: 4, title: 'Task 4', description: 'Description for Task 4' }
    ]
  },
  {
    id: 3,
    title: 'Done',
    cards: [{ id: 5, title: 'Task 5', description: 'Description for Task 5' }]
  }
]
const initialization = initializeBoardState(browserStorage, initialLists)
const lists = reactive<List[]>(initialization.lists)
const persistenceReady = ref(initialization.status === 'ready')
const persistenceError = ref<string | null>(null)

if (initialization.status === 'load-error') {
  console.error('Unable to load the saved board state.', initialization.error)
  persistenceError.value = 'The saved board could not be loaded. Changes will not be saved to protect existing data.'
} else if (initialization.error !== undefined) {
  console.error('Unable to initialize the saved board state.', initialization.error)
  persistenceError.value = 'The board could not be saved. Your changes are still available in this session.'
}

watch(lists, () => {
  if (!persistenceReady.value) {
    return
  }

  try {
    saveBoardState(browserStorage, lists)
    persistenceError.value = null
  } catch (error) {
    console.error('Unable to save the board state.', error)
    persistenceError.value = 'The board could not be saved. Your changes are still available in this session.'
  }
}, { deep: true })

const isModalOpen = ref(false);
const editingCard = ref<Card | null>(null);
const editingListIndex = ref<number | null>(null);

const modalMode = computed(() => editingCard.value === null ? 'add' : 'edit');

const openModal = (listIndex: number, card?: Card) => {
  editingListIndex.value = listIndex;
  editingCard.value = card === undefined ? null : card;
  isModalOpen.value = true;
}

const saveCard = (card: Card) => {
  if (editingListIndex.value === null) {
    return;
  }

  const list = lists[editingListIndex.value];

  if (!list) {
    return;
  }

  if (modalMode.value === 'add') {
    //Adding
    const newId = Math.max(0, ...lists.flatMap(list => list.cards.map(c => c.id))) + 1;

    list.cards.push(
      {...card, id: newId}
    )
  } else {
    // Modify
    const cardIndex = list.cards.findIndex(
      (cardOnList) => cardOnList.id === card.id)
    if (cardIndex !== -1) {
      list.cards[cardIndex] = card
    }
  }

  closeModal();
}

const closeModal = () => {
  isModalOpen.value = false;
  editingListIndex.value = null;
  editingCard.value = null;
}


</script>

<template>
  <main class="p-5 font-sans">
    <p v-if="persistenceError" role="alert" class="mb-4 rounded bg-amber-100 p-3 text-amber-900">
      {{ persistenceError }}
    </p>
    <div class="flex gap-5 py-5 overflow-x-auto">
      <div class="bg-gray-100 p-3 rounded-lg min-w-[250px] flex flex-col" v-for="(list, listIndex) in lists" :key="list.id">
        <h2 class="font-medium mb-2">{{ list.title }}</h2>
        <Draggable :list="list.cards" group="cards" item-key="id">
          <template #item="{element}">
            <div @click="openModal(listIndex, element)" class="bg-white p-2 my-2 rounded shadow cursor-pointer">
              <span class="text-sm font-medium">{{ element.title }}</span>
              <p class="text-xs text-gray-400">{{ element.description }}</p>
            </div>
          </template>
        </Draggable>
        <button class="w-full bg-transparent rounded hover:bg-white text-gray-500 p-2 text-left mt-2 text-sm font-medium" @click="openModal(listIndex)">+ Add Card</button>
      </div>
    </div>

    <ModalDialog :is-open="isModalOpen" :mode="modalMode" :card="editingCard" @save="saveCard" @close="closeModal" />
  </main>
</template>
