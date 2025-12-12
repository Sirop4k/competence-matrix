<template>
  <div class="page">
    <div class="breadcrumb-row">
      <el-button
        link
        size="small"
        class="back-button"
        @click="goBack"
      >
        ← Назад
      </el-button>

    
  </div>

    <el-card class="header-card">
        <div class="header-main">
            <div>
            <div class="title">
                {{ position?.name || 'Должность' }}
            </div>
            <div class="subtitle">
                Матрица компетенций по грейдам JUN / MID / SEN / EXP
            </div>
            </div>
            <div class="grades">
            <el-tag v-for="grade in position?.grades" :key="grade">
                {{ grade }}
            </el-tag>

            <el-button
                type="primary"
                size="small"
                class="ml-4"
                @click="openAddDialog"
            >
                Добавить компетенцию
            </el-button>
            </div>
        </div>
    </el-card>

    <el-card class="matrix-card">
      <el-table :data="competencies" style="width: 100%">
        <el-table-column
            prop="name"
            label="Компетенция"
            min-width="220"
            >
            <template #default="scope">
                <div class="comp-name">
                {{ scope.row.name }}
                <el-tag
                    size="small"
                    :type="scope.row.type === 'CORE' ? 'danger' : 'info'"
                    class="ml-4 comp-type-tag"
                    @click="toggleType(scope.$index)"
                >
                    {{ scope.row.type }}
                </el-tag>
                </div>
            </template>
        </el-table-column>


        <el-table-column
            v-for="grade in activeGrades"
            :key="grade"
            :label="grade"
            width="150"
            align="center"
            >
            <template #default="scope">
                <div class="stars">
                <span
                    v-for="n in 5"
                    :key="n"
                    class="star"
                    :class="{ 'star--filled': n <= scope.row.levels[grade] }"
                    @click.stop="setLevel(scope.$index, grade, n)"
                >
                    ★
                </span>
                </div>
            </template>
        </el-table-column>

        <el-table-column
            label=""
            width="120"
            align="right"
        >
            <template #default="scope">
            <el-button
                type="text"
                size="small"
                @click="removeCompetency(scope.$index)"
                :disabled="!isEditMode"
            >
                Удалить
            </el-button>
            </template>
        </el-table-column>
      </el-table>

      <div class="matrix-summary">
        <span class="summary-item">CORE: {{ coreCount }}</span>
        <span class="summary-dot">•</span>
        <span class="summary-item">ADDITIONAL: {{ additionalCount }}</span>
    </div>

    </el-card>

    <el-dialog
        v-model="isAddDialogVisible"
        title="Добавить компетенцию из пула"
        width="500px"
        >
        <el-form label-width="140px">
            <el-form-item label="Компетенция">
            <el-select
                v-model="selectedCompId"
                placeholder="Выберите компетенцию"
                filterable
                style="width: 100%"
            >
                <el-option
                v-for="comp in availableCompetencies"
                :key="comp.id"
                :label="comp.name"
                :value="comp.id"
                />
            </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="isAddDialogVisible = false">Отмена</el-button>
            <el-button type="primary" @click="addSelectedCompetency">
            Добавить
            </el-button>
        </template>
    </el-dialog>


    <el-alert
      title="CORE-компетенции обязательны для грейда, ADDITIONAL учитываются в оценке с меньшим весом."
      type="info"
      :closable="false"
      class="info-alert"
      show-icon
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompetencyStore } from '../stores/competencyStore'
import { storeToRefs } from 'pinia'
import { useUiStore } from '../stores/uiStore'


const route = useRoute()
const router = useRouter()

const goBack = () => {
  router.back()
}
const competencyStore = useCompetencyStore()
const { all } = storeToRefs(competencyStore)

const uiStore = useUiStore()
const isEditMode = computed(() => uiStore.isEditMode)


type Grade = 'JUN' | 'MID' | 'SEN' | 'EXP'

interface Position {
  id: string
  name: string
  grades: Grade[]
}

interface CompetencyRow {
  name: string
  type: 'CORE' | 'ADDITIONAL'
  levels: Record<Grade, number> // уровень 0–5 для каждого грейда
}


// --- сохранение матрицы в localStorage ---

const STORAGE_PREFIX = 'competence-matrix-position-'

const grades: Grade[] = ['JUN', 'MID', 'SEN', 'EXP']
const positionId = route.params.id as string

// те же структуры, что в OrgTreeView
type OrgNodeType = 'company' | 'department' | 'team'

interface OrgPosition {
  id: string
  name: string
  grades: string[]
}

interface OrgNode {
  id: string
  name: string
  type: OrgNodeType
  children?: OrgNode[]
  positions?: OrgPosition[]
}

const ORG_STORAGE_KEY = 'competence-matrix-org-tree'

// рекурсивный поиск должности по id в дереве
function findPositionById(nodes: OrgNode[], id: string): OrgPosition | null {
  for (const node of nodes) {
    if (node.positions) {
      const found = node.positions.find((p) => p.id === id)
      if (found) return found
    }
    if (node.children) {
      const fromChild = findPositionById(node.children, id)
      if (fromChild) return fromChild
    }
  }
  return null
}

function loadPosition(id: string): Position {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(ORG_STORAGE_KEY)
    if (raw) {
      try {
        const tree = JSON.parse(raw) as OrgNode[]
        const p = findPositionById(tree, id)
        if (p) {
          // фильтруем грейды так, чтобы они точно подходили под тип Grade
          const normalizedGrades = p.grades.filter((g): g is Grade =>
            grades.includes(g as Grade)
          )
          return {
            id: p.id,
            name: p.name,
            grades:
              normalizedGrades.length > 0 ? normalizedGrades : (['JUN'] as Grade[]),
          }
        }
      } catch {
        // если что-то пошло не так, просто упадём в дефолт
      }
    }
  }

  // дефолт на случай, если должность не найдена
  return {
    id,
    name: 'Должность',
    grades: ['JUN', 'MID', 'SEN', 'EXP'],
  }
}

const position = computed<Position>(() => loadPosition(positionId))

// активные грейды именно для этой должности
const activeGrades = computed<Grade[]>(() => {
  return position.value.grades.length > 0 ? position.value.grades : grades
})


function loadMatrix(positionId: string): CompetencyRow[] {
  if (typeof window === 'undefined') return defaultMatrix()

  const raw = localStorage.getItem(STORAGE_PREFIX + positionId)
  if (!raw) return defaultMatrix()

  try {
    const parsed = JSON.parse(raw) as CompetencyRow[]
    if (!Array.isArray(parsed)) return defaultMatrix()
    return parsed
  } catch {
    return defaultMatrix()
  }
}

function saveMatrix(list: CompetencyRow[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_PREFIX + positionId, JSON.stringify(list))
}

// базовая матрица по умолчанию (если ещё ничего не сохраняли)
function defaultMatrix(): CompetencyRow[] {
  return [
    {
      name: 'Моделирование бизнес-процессов',
      type: 'CORE',
      levels: { JUN: 2, MID: 3, SEN: 4, EXP: 5 },
    },
    {
      name: 'Анализ предметной области',
      type: 'CORE',
      levels: { JUN: 2, MID: 3, SEN: 4, EXP: 5 },
    },
    {
      name: 'Формирование требований',
      type: 'CORE',
      levels: { JUN: 1, MID: 3, SEN: 4, EXP: 5 },
    },
    {
      name: 'Коммуникация с заказчиком',
      type: 'ADDITIONAL',
      levels: { JUN: 2, MID: 3, SEN: 4, EXP: 4 },
    },
    {
      name: 'Администрирование Jira',
      type: 'ADDITIONAL',
      levels: { JUN: 0, MID: 2, SEN: 3, EXP: 4 },
    },
  ]
}

// Живой список компетенций для этой должности
const allCompetencies = ref<CompetencyRow[]>(loadMatrix(positionId))

const competencies = computed(() => allCompetencies.value)

// --- редактирование уровней в ячейке ---

const setLevel = (rowIndex: number, grade: Grade, newLevel: number) => {
  if (!isEditMode.value) return
  const row = allCompetencies.value[rowIndex]
  if (!row) return

  const current = row.levels[grade] ?? 0

  // Логика:
  // - клик по звезде ставит соответствующий уровень
  // - если кликнули по уже выбранному уровню ещё раз — сбрасываем в 0 (нет требования)
  row.levels[grade] = current === newLevel ? 0 : newLevel

  saveMatrix(allCompetencies.value)
}


// --- переключение CORE / ADDITIONAL ---

const toggleType = (rowIndex: number) => {
  if (!isEditMode.value) return
    const row = allCompetencies.value[rowIndex]
    if (!row) return

    row.type = row.type === 'CORE' ? 'ADDITIONAL' : 'CORE'
    saveMatrix(allCompetencies.value)
}

// --- summary по количеству компетенций ---

const coreCount = computed(
  () => allCompetencies.value.filter((c) => c.type === 'CORE').length
)

const additionalCount = computed(
  () => allCompetencies.value.filter((c) => c.type === 'ADDITIONAL').length
)

// --- добавление компетенции из пула ---

const isAddDialogVisible = ref(false)
const selectedCompId = ref<number | null>(null)

// компетенции из пула, которых ещё нет в матрице (по имени)
const availableCompetencies = computed(() => {
  const usedNames = new Set(allCompetencies.value.map((c) => c.name))
  return all.value.filter((c) => !usedNames.has(c.name))
})

const openAddDialog = () => {
  if (!isEditMode.value) return
  selectedCompId.value = null
  isAddDialogVisible.value = true
}

const addSelectedCompetency = () => {
  if (!isEditMode.value) return
  if (selectedCompId.value == null) return
  const comp = all.value.find((c) => c.id === selectedCompId.value)
  if (!comp) return

  // добавляем новую строку в матрицу
  allCompetencies.value.push({
    name: comp.name,
    type: 'CORE', // по умолчанию считаем новой CORE
    levels: {
      JUN: 0,
      MID: 0,
      SEN: 0,
      EXP: 0,
    },
  })

  saveMatrix(allCompetencies.value)
  isAddDialogVisible.value = false
}

const removeCompetency = (rowIndex: number) => {
  if (!isEditMode.value) return

  if (rowIndex < 0 || rowIndex >= allCompetencies.value.length) return

  allCompetencies.value.splice(rowIndex, 1)
  saveMatrix(allCompetencies.value)
}

</script>


<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-card {
  border-radius: 16px;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: 600;
}

.subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.grades :deep(.el-tag) {
  margin-left: 4px;
}

.matrix-card {
  border-radius: 16px;
}

.comp-name {
  display: flex;
  align-items: center;
}

.ml-4 {
  margin-left: 6px;
}

.stars {
  font-size: 16px;
  cursor: pointer;
}

.star {
  opacity: 0.2;
  margin: 0 1px;
  transition: opacity 0.15s ease;
}

.star--filled {
  opacity: 1;
  color: #2563eb;
}

.info-alert {
  border-radius: 12px;
}

.comp-type-tag {
  cursor: pointer;
}

.matrix-summary {
  margin-top: 12px;
  font-size: 13px;
  color: #4b5563;
}

.summary-item {
  font-weight: 500;
}

.summary-dot {
  margin: 0 6px;
}

.grades {
  display: flex;
  align-items: center;
}

.grades :deep(.el-tag) {
  margin-left: 4px;
}

.ml-4 {
  margin-left: 8px;
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button {
  padding: 0;
  font-size: 13px;
}

</style>
