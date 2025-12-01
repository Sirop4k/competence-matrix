<template>
  <div class="page">
    <div class="page-layout">
      <!-- Левый блок: дерево организации -->
      <el-card class="tree-card">
        <div class="tree-card__title">Структура организации</div>
        <el-tree
          :data="treeData"
          node-key="id"
          :props="treeProps"
          highlight-current
          @node-click="handleNodeClick"
        />
      </el-card>

      <!-- Правый блок: содержимое выбранного узла -->
      <div class="content">
        <el-card v-if="selectedNode" class="content-card">
          <div class="content-header">
            <div>
              <div class="content-title">
                {{ selectedNode.name }}
              </div>
              <div class="content-subtitle">
                {{ nodeTypeLabel(selectedNode.type) }}
              </div>
            </div>

            <div class="content-actions">
              <el-button
                type="primary"
                size="small"
                @click="openAddUnitDialog"
                :disabled="!isEditMode"
              >
                Добавить узел
              </el-button>

              <el-button
                type="success"
                size="small"
                @click="openAddPositionDialog"
                :disabled="!isEditMode"
              >
                Добавить должность
              </el-button>

              <el-divider />

              <el-button
                size="small"
                @click="openEditNodeDialog"
                :disabled="!isEditMode"
              >
                Переименовать
              </el-button>

              <el-button
                type="danger"
                size="small"
                @click="openDeleteNodeDialog"
                :disabled="!isEditMode || selectedNode.type === 'company'"
              >
                Удалить узел
              </el-button>
            </div>
          </div>

          <!-- Вложенные подразделения -->
          <div class="section" v-if="selectedNode.children?.length">
            <div class="section-title"></div>
            <div class="cards-row">
              <el-card
                v-for="child in selectedNode.children"
                :key="child.id"
                class="unit-card"
                @click="selectNode(child)"
              >
                <div class="unit-name">{{ child.name }}</div>
                <div class="unit-type">{{ nodeTypeLabel(child.type) }}</div>
                <div class="unit-meta">
                  <span>{{ child.children?.length || 0 }} подчинённых узлов</span>
                  <span>·</span>
                  <span>{{ child.positions?.length || 0 }} должностей</span>
                </div>
              </el-card>
            </div>
          </div>

          <!-- Должности в этом узле -->
          <div class="section" v-if="selectedNode.positions?.length">
            <div class="section-title"></div>

            <el-table
              :data="selectedNode.positions"
              style="width: 100%"
              size="small"
            >
              <el-table-column
                prop="name"
                label="Должность"
                min-width="220"
              />
              <el-table-column
                prop="grades"
                label="Грейды"
                width="200"
              >
                <template #default="{ row }">
                  <el-tag
                    v-for="grade in row.grades"
                    :key="grade"
                    class="mr-4"
                  >
                    {{ grade }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column
                label=""
                width="260"
                align="right"
              >
                <template #default="scope">
                  <el-button
                    type="primary"
                    size="small"
                    @click="openPosition(scope.row.id)"
                  >
                    Матрица
                  </el-button>

                  <el-button
                    type="text"
                    size="small"
                    @click="openEditPosition(scope.row)"
                    :disabled="!isEditMode"
                  >
                    Редактировать
                  </el-button>

                  <el-button
                    type="text"
                    size="small"
                    @click="openDeletePosition(scope.row)"
                    :disabled="!isEditMode"
                  >
                    Удалить
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div
            v-if="!selectedNode.children?.length && !selectedNode.positions?.length"
            class="empty-text"
          >
            В этом подразделении пока нет ни вложенных отделов, ни должностей.
          </div>
        </el-card>

        <el-empty
          v-else
          description="Выберите подразделение слева"
        />
      </div>
    </div>

    <!-- Диалог: новое подразделение -->
    <el-dialog
      v-model="isUnitDialogVisible"
      title="Новое подразделение"
      width="480px"
    >
      <el-form label-width="140px">
        <el-form-item label="Название">
          <el-input v-model="newUnit.name" />
        </el-form-item>

        <el-form-item label="Тип">
          <el-select v-model="newUnit.type" style="width: 100%">
            <el-option label="Департамент" value="department" />
            <el-option label="Отдел / Подразделение" value="team" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="isUnitDialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="createUnit">Создать</el-button>
      </template>
    </el-dialog>

    <!-- Диалог: новая должность -->
    <el-dialog
      v-model="isPositionDialogVisible"
      title="Новая должность"
      width="480px"
    >
      <el-form label-width="140px">
        <el-form-item label="Название">
          <el-input v-model="newPosition.name" />
        </el-form-item>

        <el-form-item label="Грейды">
          <el-select
            v-model="newPosition.grades"
            multiple
            placeholder="Выберите грейды"
            style="width: 100%"
          >
            <el-option
              v-for="g in gradeOptions"
              :key="g"
              :label="g"
              :value="g"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="isPositionDialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="createPosition">Создать</el-button>
      </template>
    </el-dialog>

    <!-- Диалог: редактировать узел -->
    <el-dialog
      v-model="isEditNodeDialogVisible"
      title="Редактировать подразделение"
      width="480px"
    >
      <el-form label-width="140px">
        <el-form-item label="Название">
          <el-input v-model="editNodeName" />
        </el-form-item>

        <el-form-item
          label="Тип"
          v-if="selectedNode && selectedNode.type !== 'company'"
        >
          <el-select v-model="editNodeType" style="width: 100%">
            <el-option label="Департамент" value="department" />
            <el-option label="Отдел / Подразделение" value="team" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="isEditNodeDialogVisible = false">
          Отмена
        </el-button>
        <el-button type="primary" @click="saveNodeEdit">
          Сохранить
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог: удалить узел -->
    <el-dialog
      v-model="isDeleteNodeDialogVisible"
      title="Удалить подразделение?"
      width="420px"
    >
      <span>
        Вы уверены, что хотите удалить
        <b>{{ selectedNode?.name }}</b>
        и все вложенные подразделения и должности?
      </span>

      <template #footer>
        <el-button @click="isDeleteNodeDialogVisible = false">
          Отмена
        </el-button>
        <el-button type="danger" @click="confirmDeleteNode">
          Удалить
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог: редактировать должность -->
    <el-dialog
      v-model="isPositionEditDialogVisible"
      title="Редактировать должность"
      width="480px"
    >
      <el-form label-width="140px">
        <el-form-item label="Название">
          <el-input v-model="editPositionName" />
        </el-form-item>

        <el-form-item label="Грейды">
          <el-select
            v-model="editPositionGrades"
            multiple
            placeholder="Выберите грейды"
            style="width: 100%"
          >
            <el-option
              v-for="g in gradeOptions"
              :key="g"
              :label="g"
              :value="g"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="isPositionEditDialogVisible = false">
          Отмена
        </el-button>
        <el-button type="primary" @click="savePositionEdit">
          Сохранить
        </el-button>
      </template>
    </el-dialog>

    <!-- Диалог: удалить должность -->
    <el-dialog
      v-model="isDeletePositionDialogVisible"
      title="Удалить должность?"
      width="420px"
    >
      <span>
        Вы уверены, что хотите удалить выбранную должность из этого
        подразделения?
      </span>

      <template #footer>
        <el-button @click="isDeletePositionDialogVisible = false">
          Отмена
        </el-button>
        <el-button type="danger" @click="confirmDeletePosition">
          Удалить
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/uiStore'

type OrgNodeType = 'company' | 'department' | 'team'

/** Переименовал, чтобы не конфликтовало с другими Position в проекте */
interface TreePosition {
  id: string
  name: string
  grades: string[]
}

interface OrgNode {
  id: string
  name: string
  type: OrgNodeType
  children?: OrgNode[]
  positions?: TreePosition[]
}

const ORG_STORAGE_KEY = 'competence-matrix-org-tree'

function defaultTree(): OrgNode[] {
  return [
    {
      id: 'company',
      name: 'Тестовая компания',
      type: 'company',
      children: [
        {
          id: 'dep-ba',
          name: 'Департамент бизнес-аналитики',
          type: 'department',
          children: [
            {
              id: 'team-ba-game',
              name: 'Отдел Бизнес-аналитики игровой разработки',
              type: 'team',
              positions: [
                {
                  id: 'ba-game',
                  name: 'Бизнес-аналитик игровой разработки',
                  grades: ['JUN', 'MID', 'SEN', 'EXP'],
                },
              ],
            },
            {
              id: 'team-ba-op',
              name: 'Отдел Бизнес-аналитики операционных процессов',
              type: 'team',
              positions: [
                {
                  id: 'ba-ops',
                  name: 'Бизнес-аналитик по операционным процессам',
                  grades: ['MID', 'SEN'],
                },
              ],
            },
          ],
          positions: [
            {
              id: 'head-ba',
              name: 'Руководитель отдела Бизнес-аналитики',
              grades: ['SEN', 'EXP'],
            },
          ],
        },
      ],
    },
  ]
}

function loadTree(): OrgNode[] {
  if (typeof window === 'undefined') return defaultTree()

  const raw = localStorage.getItem(ORG_STORAGE_KEY)
  if (!raw) return defaultTree()

  try {
    const parsed = JSON.parse(raw) as OrgNode[]
    if (!Array.isArray(parsed)) return defaultTree()
    return parsed
  } catch {
    return defaultTree()
  }
}

function saveTree(tree: OrgNode[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(tree))
}

function findParentNode(
  nodes: OrgNode[],
  id: string,
  parent: OrgNode | null = null
): OrgNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return parent
    }
    if (node.children) {
      const found = findParentNode(node.children, id, node)
      if (found) return found
    }
  }
  return null
}

const router = useRouter()
const uiStore = useUiStore()

const isEditMode = computed(() => uiStore.isEditMode)

const treeData = ref<OrgNode[]>(loadTree())
const selectedNode = ref<OrgNode | null>(treeData.value[0] ?? null)

const treeProps = {
  label: 'name',
  children: 'children',
}

const gradeOptions = ['JUN', 'MID', 'SEN', 'EXP']

// создание подразделения
const isUnitDialogVisible = ref(false)
const newUnit = ref<{
  name: string
  type: OrgNodeType
}>({
  name: '',
  type: 'team',
})

// создание должности
const isPositionDialogVisible = ref(false)
const newPosition = ref<{
  name: string
  grades: string[]
}>({
  name: '',
  grades: [],
})

// редактирование узла
const isEditNodeDialogVisible = ref(false)
const editNodeName = ref('')
const editNodeType = ref<OrgNodeType>('department')

// удаление узла
const isDeleteNodeDialogVisible = ref(false)
const deleteNodeId = ref<string | null>(null)

// редактирование должности
const isPositionEditDialogVisible = ref(false)
const editPositionId = ref<string | null>(null)
const editPositionName = ref('')
const editPositionGrades = ref<string[]>([])

// удаление должности
const isDeletePositionDialogVisible = ref(false)
const deletePositionId = ref<string | null>(null)

const handleNodeClick = (data: OrgNode) => {
  selectedNode.value = data
}

const selectNode = (node: OrgNode) => {
  selectedNode.value = node
}

const openPosition = (id: string) => {
  router.push(`/positions/${id}`)
}

const nodeTypeLabel = (type: OrgNodeType): string => {
  switch (type) {
    case 'company':
      return 'Компания'
    case 'department':
      return 'Департамент'
    case 'team':
      return 'Отдел / Подразделение'
    default:
      return ''
  }
}

const openAddUnitDialog = () => {
  if (!isEditMode.value || !selectedNode.value) return
  newUnit.value = {
    name: '',
    type: 'team',
  }
  isUnitDialogVisible.value = true
}

const createUnit = () => {
  if (!isEditMode.value || !selectedNode.value) return
  const name = newUnit.value.name.trim()
  if (!name) return

  const parent = selectedNode.value
  if (!parent.children) parent.children = []

  const newId = parent.id + '-unit-' + (parent.children.length + 1)

  parent.children.push({
    id: newId,
    name,
    type: newUnit.value.type,
    children: [],
    positions: [],
  })

  saveTree(treeData.value)
  isUnitDialogVisible.value = false
}

const openAddPositionDialog = () => {
  if (!isEditMode.value || !selectedNode.value) return
  newPosition.value = {
    name: '',
    grades: [],
  }
  isPositionDialogVisible.value = true
}

const createPosition = () => {
  if (!isEditMode.value || !selectedNode.value) return
  const name = newPosition.value.name.trim()
  if (!name) return

  const node = selectedNode.value
  if (!node.positions) node.positions = []

  const newId = 'pos-' + Date.now()

  node.positions.push({
    id: newId,
    name,
    grades: [...newPosition.value.grades],
  })

  saveTree(treeData.value)
  isPositionDialogVisible.value = false
}

const openEditNodeDialog = () => {
  if (!isEditMode.value || !selectedNode.value) return

  editNodeName.value = selectedNode.value.name
  editNodeType.value = selectedNode.value.type
  isEditNodeDialogVisible.value = true
}

const saveNodeEdit = () => {
  if (!isEditMode.value || !selectedNode.value) return

  const name = editNodeName.value.trim()
  if (name) {
    selectedNode.value.name = name
  }

  if (selectedNode.value.type !== 'company') {
    selectedNode.value.type = editNodeType.value
  }

  saveTree(treeData.value)
  isEditNodeDialogVisible.value = false
}

const openDeleteNodeDialog = () => {
  if (!isEditMode.value || !selectedNode.value) return

  if (selectedNode.value.type === 'company') return

  deleteNodeId.value = selectedNode.value.id
  isDeleteNodeDialogVisible.value = true
}

const confirmDeleteNode = () => {
  if (!isEditMode.value || !deleteNodeId.value) {
    isDeleteNodeDialogVisible.value = false
    return
  }

  const targetId = deleteNodeId.value

  const root = treeData.value[0]
  if (root && root.id === targetId) {
    isDeleteNodeDialogVisible.value = false
    return
  }

  const parent = findParentNode(treeData.value, targetId)
  if (parent && parent.children) {
    parent.children = parent.children.filter((c) => c.id !== targetId)
    selectedNode.value = parent
    saveTree(treeData.value)
  }

  isDeleteNodeDialogVisible.value = false
  deleteNodeId.value = null
}

const openEditPosition = (pos: TreePosition) => {
  if (!isEditMode.value || !selectedNode.value) return

  editPositionId.value = pos.id
  editPositionName.value = pos.name
  editPositionGrades.value = [...pos.grades]
  isPositionEditDialogVisible.value = true
}

const savePositionEdit = () => {
  if (
    !isEditMode.value ||
    !selectedNode.value ||
    !editPositionId.value ||
    !selectedNode.value.positions
  ) {
    isPositionEditDialogVisible.value = false
    return
  }

  const list = selectedNode.value.positions
  const index = list.findIndex((p) => p.id === editPositionId.value)
  if (index === -1) {
    isPositionEditDialogVisible.value = false
    return
  }

  const current = list[index]
  if (!current) {
    isPositionEditDialogVisible.value = false
    return
  }

  const name = editPositionName.value.trim()

  list[index] = {
    id: current.id,
    name: name || current.name,
    grades: [...editPositionGrades.value],
  }

  saveTree(treeData.value)
  isPositionEditDialogVisible.value = false
  editPositionId.value = null
}

const openDeletePosition = (pos: TreePosition) => {
  if (!isEditMode.value || !selectedNode.value) return

  deletePositionId.value = pos.id
  isDeletePositionDialogVisible.value = true
}

const confirmDeletePosition = () => {
  if (
    !isEditMode.value ||
    !selectedNode.value ||
    !deletePositionId.value ||
    !selectedNode.value.positions
  ) {
    isDeletePositionDialogVisible.value = false
    return
  }

  const list = selectedNode.value.positions
  selectedNode.value.positions = list.filter(
    (p) => p.id !== deletePositionId.value
  )

  saveTree(treeData.value)
  isDeletePositionDialogVisible.value = false
  deletePositionId.value = null
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  height: 100%;
}

.tree-card {
  height: 100%;
}

.tree-card__title {
  font-weight: 600;
  margin-bottom: 8px;
}

.content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-card {
  flex: 1;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
}

.content-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.content-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section {
  margin-top: 16px;
}

.section-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.unit-card {
  width: 260px;
  cursor: pointer;
}

.unit-name {
  font-weight: 600;
}

.unit-type {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.unit-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  gap: 4px;
}

.empty-text {
  margin-top: 12px;
  color: #6b7280;
  font-size: 14px;
}

.mr-4 {
  margin-right: 4px;
}
</style>
