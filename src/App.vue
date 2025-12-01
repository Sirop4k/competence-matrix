<template>
  <el-container class="app-layout">
    <!-- Левое меню -->
    <el-aside width="220px" class="app-aside">
      <div class="app-aside__title">
        Матрица<br />компетенций
      </div>

      <div class="app-aside__mode">
        <el-switch
          v-model="isEditMode"
          active-text="Редактирование"
          inactive-text="Только просмотр"
        />
      </div>

      <el-menu
        :default-active="activeMenu"
        class="app-menu"
        router
      >
        <el-menu-item index="/competencies">
          Пул компетенций
        </el-menu-item>
        <el-menu-item index="/org">
          Департаменты и отделы
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Правая часть -->
    <el-container>
      <el-header class="app-header">
        <div class="app-header__title">
          {{ pageTitle }}
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from './stores/uiStore'

const route = useRoute()
const uiStore = useUiStore()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  if (route.path.startsWith('/competencies')) return 'Пул компетенций'
  if (route.path.startsWith('/org')) return 'Структура организации'
  if (route.path.startsWith('/positions')) return 'Матрица должности'
  return 'Матрица компетенций'
})

// двусторонняя связь для el-switch
const isEditMode = computed({
  get: () => uiStore.isEditMode,
  set: (val: boolean) => uiStore.setEditMode(val),
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
}

.app-aside {
  background: #111827;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
}

.app-aside__title {
  font-weight: 700;
  font-size: 18px;
  line-height: 1.2;
  margin-bottom: 24px;
}

.app-menu {
  border-right: none;
  background: transparent;
}

.app-menu :deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 8px;
}

.app-menu :deep(.el-menu-item.is-active) {
  background: #2563eb;
  color: #ffffff;
}

.app-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.app-header__title {
  font-size: 20px;
  font-weight: 600;
}

.app-main {
  background: #f3f4f6;
  padding: 20px 24px;
}

.app-aside__mode {
  margin-bottom: 16px;
}
</style>
