import { defineStore } from 'pinia'

interface UiState {
  isEditMode: boolean
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    isEditMode: true, // по умолчанию редактирование включено
  }),

  actions: {
    setEditMode(value: boolean) {
      this.isEditMode = value
    },
    toggleEditMode() {
      this.isEditMode = !this.isEditMode
    },
  },
})
