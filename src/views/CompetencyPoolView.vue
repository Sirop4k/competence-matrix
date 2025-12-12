<template>
  <div class="page">
    <!-- Верхняя панель -->
    <div class="page-toolbar">
      <el-input
        v-model="search"
        placeholder="Найти компетенцию..."
        clearable
        class="page-toolbar__search"
      />

      <el-select
        v-model="typeFilter"
        placeholder="Тип"
        clearable
        class="page-toolbar__filter"
      >
        <el-option label="HARD" value="HARD" />
        <el-option label="SOFT" value="SOFT" />
      </el-select>

        <el-button
          v-if="isEditMode"
          type="primary"
          @click="openCreateModal"
        >
          Добавить компетенцию
        </el-button>


      <el-dialog
  title="Новая компетенция"
  v-model="isModalVisible"
  width="500px"
>
  <el-form :model="newComp" label-width="120px">
    <el-form-item label="Название">
      <el-input v-model="newComp.name" :disabled="!isEditMode"/>
    </el-form-item>

    <el-form-item label="Тип">
      <el-select v-model="newComp.type" :disabled="!isEditMode" placeholder="Выберите тип">
        <el-option label="HARD" value="HARD" />
        <el-option label="SOFT" value="SOFT" />
      </el-select>
    </el-form-item>

    <el-form-item label="Группа">
      <el-input v-model="newComp.group" :disabled="!isEditMode"/>
    </el-form-item>

    <el-form-item label="Описание">
      <el-input
        type="textarea"
        :rows="3"
        v-model="newComp.description"
        :disabled="!isEditMode"
      />
    </el-form-item>
  </el-form>

  <template #footer>
    <el-button @click="isModalVisible = false">Отмена</el-button>
    <el-button
      v-if="isEditMode"
      type="primary"
      @click="createCompetency"
    >
      Создать
    </el-button>
  </template>
</el-dialog>

    </div>

    <!-- Таблица -->
    <el-card class="page-card">
      <el-table
        :data="filteredCompetencies"
        style="width: 100%"
        highlight-current-row
      >
        <el-table-column
          prop="name"
          label="Название"
          min-width="220"
        />

        <el-table-column
          prop="type"
          label="Тип"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="row.type === 'HARD' ? 'info' : 'success'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="group"
          label="Группа"
          width="180"
        >
          <template #default="{ row }">
            <el-tag effect="plain">
              {{ row.group }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="description"
          label="Описание"
          min-width="280"
          show-overflow-tooltip
        />

        <el-table-column
            label=""
            width="100"
            align="center"
            >
            <template #default="scope">
                <el-button
                type="text"
                size="small"
                @click="openDetails(scope.row)"
                >
                Редактировать
                </el-button>
            </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer
        v-model="isDrawerVisible"
        title="Карточка компетенции"
        size="480px"
        :destroy-on-close="true"
        >
        <template v-if="editingComp">
            <el-form
            label-width="120px"
            :model="editingComp"
            >
            <el-form-item label="ID">
                <el-input v-model="editingComp.id" disabled />
            </el-form-item>

            <el-form-item label="Название">
                <el-input v-model="editingComp.name" :disabled="!isEditMode"/>
            </el-form-item>

            <el-form-item label="Тип">
                <el-select v-model="editingComp.type" :disabled="!isEditMode">
                <el-option label="HARD" value="HARD" />
                <el-option label="SOFT" value="SOFT" />
                </el-select>
            </el-form-item>

            <el-form-item label="Группа">
                <el-input v-model="editingComp.group" :disabled="!isEditMode"/>
            </el-form-item>

            <el-form-item label="Описание">
                <el-input
                type="textarea"
                :rows="4"
                v-model="editingComp.description"
                :disabled="!isEditMode"
                />
            </el-form-item>
            </el-form>

            <div class="drawer-footer">
            <el-button @click="isDrawerVisible = false">
                Закрыть
            </el-button>
            <el-button
              v-if="isEditMode"
              type="primary"
              @click="saveEdited"
            >
              Сохранить изменения
            </el-button>
            </div>
        </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCompetencyStore } from '../stores/competencyStore'
import type { Competency, CompetencyType } from '../stores/competencyStore'
import { useUiStore } from '../stores/uiStore'


const competencyStore = useCompetencyStore()
const { all } = storeToRefs(competencyStore)

const uiStore = useUiStore()
const isEditMode = computed(() => uiStore.isEditMode)

const search = ref('')
const typeFilter = ref<'HARD' | 'SOFT' | ''>('')

const filteredCompetencies = computed(() => {
  return all.value.filter((c) => {
    const byType = typeFilter.value ? c.type === typeFilter.value : true
    const bySearch = search.value
      ? c.name.toLowerCase().includes(search.value.toLowerCase()) ||
        c.description.toLowerCase().includes(search.value.toLowerCase())
      : true
    return byType && bySearch
  })
})

const isDrawerVisible = ref(false)
const editingComp = ref<Competency | null>(null)

const openDetails = (row: Competency) => {
  // создаём копию, чтобы не портить данные пока не нажали "Сохранить"
  editingComp.value = { ...row }
  isDrawerVisible.value = true
}

const saveEdited = () => {
    if (!isEditMode.value) return
    if (!editingComp.value) return

    competencyStore.updateCompetency(editingComp.value)
    isDrawerVisible.value = false
}

const isModalVisible = ref(false)

const newComp = ref<{
  name: string
  type: CompetencyType
  group: string
  description: string
}>({
  name: '',
  type: 'HARD',
  group: '',
  description: '',
})


const openCreateModal = () => {
  if (!isEditMode.value) return
  isModalVisible.value = true
}

const createCompetency = () => {
  if (!isEditMode.value) return

  competencyStore.addCompetency({ ...newComp.value })

  isModalVisible.value = false

  newComp.value = {
    name: '',
    type: 'HARD',
    group: '',
    description: '',
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-toolbar__search {
  max-width: 340px;
}

.page-toolbar__filter {
  width: 140px;
}

.page-card {
  border-radius: 16px;
}

.drawer-footer {
  margin-top: 16px;
  text-align: right;
}
</style>
