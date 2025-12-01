import { defineStore } from 'pinia'

export type CompetencyType = 'HARD' | 'SOFT'

export interface Competency {
  id: number
  name: string
  type: CompetencyType
  group: string
  description: string
}

interface State {
  list: Competency[]
}

const STORAGE_KEY = 'competence-matrix-competencies'

// Базовый набор, если в localStorage ещё ничего нет
const defaultList: Competency[] = [
  {
    id: 1,
    name: 'Администрирование инструмента EnDocs',
    type: 'HARD',
    group: 'Документооборот',
    description: 'Пак работ по обеспечению использования функциональности EnDocs.',
  },
  {
    id: 2,
    name: 'Администрирование Jira',
    type: 'HARD',
    group: 'Инструменты',
    description: 'Настройка проектов, досок, прав доступа и workflow.',
  },
  {
    id: 3,
    name: 'Анализ предметной области',
    type: 'HARD',
    group: 'Аналитика',
    description: 'Разбор предметной области, ключевые сущности, их связи.',
  },
  {
    id: 4,
    name: 'Коммуникация с заказчиком',
    type: 'SOFT',
    group: 'Коммуникации',
    description: 'Умение выстраивать диалог, уточнять ожидания.',
  },
]

// Читаем данные из localStorage (если есть)
function loadInitialList(): Competency[] {
  if (typeof window === 'undefined') {
    return defaultList
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return defaultList
  }

  try {
    const parsed = JSON.parse(raw) as Competency[]
    if (!Array.isArray(parsed)) {
      return defaultList
    }
    return parsed
  } catch {
    return defaultList
  }
}

// Сохраняем список в localStorage
function saveList(list: Competency[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export const useCompetencyStore = defineStore('competency', {
  state: (): State => ({
    list: loadInitialList(),
  }),

  getters: {
    all: (state) => state.list,
  },

  actions: {
    addCompetency(payload: Omit<Competency, 'id'>) {
      const newId =
        this.list.length > 0
          ? Math.max(...this.list.map((i) => i.id)) + 1
          : 1

      this.list.push({ id: newId, ...payload })
      saveList(this.list)
    },

    updateCompetency(payload: Competency) {
      const index = this.list.findIndex((c) => c.id === payload.id)
      if (index !== -1) {
        this.list[index] = { ...payload }
        saveList(this.list)
      }
    },
  },
})
