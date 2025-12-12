<template>
  <el-container class="app-layout">
    <!-- Левое меню -->
    <el-aside width="220px" class="app-aside">
      <div class="app-aside__title">
        Матрица<br />компетенций
      </div>

      <div class="app-aside__mode">
        <div class="vertical-toggle">
          <div class="vertical-toggle__labels">
            <span
              class="vertical-toggle__label"
              :class="{ 'vertical-toggle__label--active': !isEditMode }"
            >
              Только просмотр
            </span>
            <span
              class="vertical-toggle__label"
              :class="{ 'vertical-toggle__label--active': isEditMode }"
            >
              Редактирование
            </span>
          </div>

          <button
            type="button"
            class="vertical-toggle__track"
            :class="{ 'vertical-toggle__track--on': !isEditMode }"
            @click="toggleMode"
          >
            <span class="vertical-toggle__thumb" />
          </button>
        </div>
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
  if (route.path.startsWith('/org')) return 'TEST COMPANY'
  if (route.path.startsWith('/positions')) return 'Матрица должности'
  return 'Матрица компетенций'
})

// двусторонняя связь для el-switch
const isEditMode = computed({
  get: () => uiStore.isEditMode,
  set: (val: boolean) => uiStore.setEditMode(val),
})

const toggleMode = () => {
  isEditMode.value = !isEditMode.value
}
</script>

<style scoped>
/* 1. ГЛОБАЛЬНО: один шрифт для всего приложения */
:global(html),
:global(body),
:global(#app),
:global(.el-container),
:global(.el-header),
:global(.el-aside),
:global(.el-main),
:global(.el-footer),
:global(.el-card),
:global(.el-table),
:global(.el-dialog),
:global(.el-button),
:global(.el-input),
:global(.el-select),
:global(.el-switch),
:global(.el-menu),
:global(.el-menu-item) {
  font-family: 'Manrope', system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', sans-serif !important;
}

/* 2. Далее — только раскладка/отступы, без font-family */

.app-layout {
  height: 100vh;
  background: transparent;
}

/* Левый сайдбар */

.app-aside {
  background: #ffffff;
  border-right: 1px solid rgba(209, 213, 219, 0.9);
  display: flex;
  flex-direction: column;
  padding: 14px 14px 14px 10px;
  gap: 14px;
}

.app-aside__title {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* блок с переключателем режима */

.app-aside__mode {
  padding: 8px 0px;
  border-radius: 10px;
  background: #dee0e2;
  border: 1px solid rgba(174, 189, 211, 0.9);
}

/* switch */

.app-aside__mode :deep(.el-switch__label) {
  font-size: 10px;
}


/* меню слева */

.app-menu {
  margin-top: 4px;
  border-right: none;
  background: transparent;
}

.app-menu :deep(.el-menu) {
  border-right: none;
  background: transparent;
}

.app-menu :deep(.el-menu-item) {
  margin-bottom: 4px;
  border-radius: 999px;
  padding-inline: 12px;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
}

.app-menu :deep(.el-menu-item.is-active) {
  background: var(--app-primary-soft);
}

/* Правая часть */

.app-header {
  display: flex;
  align-items: center;
  padding: 12px 22px 6px;
  border-bottom: none;
  background: transparent;
}

.app-header__title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.app-main {
  padding: 8px 22px 20px;
  background: transparent;
}

.vertical-toggle {
  display: flex;
  align-items: center;
  gap: 30px;
}

/* колонка с двумя подписями */
.vertical-toggle__labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 44px; /* такая же высота, как у трека */
  font-size: 13px;
  padding: 0px 10px;
}

.vertical-toggle__label {
  white-space: nowrap;
  color: #242222;
}

.vertical-toggle__label--active {
  color: #2563eb;
  font-weight: 500;
}

/* сам вертикальный трек с кружочком */

.vertical-toggle__track {
  position: relative;
  width: 22px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: rgb(241, 129, 25);
  padding: 3px;
  cursor: pointer;
  outline: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* по умолчанию кружок внизу (редактирование) */
  transition: background 0.15s ease, border-color 0.15s ease;
}

.vertical-toggle__track--on {
  background: #bfdbfe;
  border-color: #3b82f6;
}

.vertical-toggle__thumb {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  transition: transform 0.15s ease;
}

/* когда режим "Только просмотр" (isEditMode = false) — кружок наверху */
.vertical-toggle__track--on .vertical-toggle__thumb {
  transform: translateY(-22px);
}

</style>



