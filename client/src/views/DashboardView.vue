<template>
  <div class="dashboard">
    <div class="calendar-row">
      <CalendarModule key="calendar" class="fade-in-1" />
    </div>
    <div class="bottom-row">
      <div class="weather-container">
        <Transition name="module-fade" mode="out-in">
          <WeatherModule v-if="activeModule === 'weather'" key="weather" :progress="progress" />
        </Transition>
      </div>
      <div class="tasks-container">
        <TasksModule key="tasks" class="fade-in-3" />
      </div>
    </div>
    <NotificationModal
      :event="notificationsStore.currentNotification?.event"
      :type="notificationsStore.currentNotification?.type || ''"
      :isVisible="notificationsStore.isModalVisible"
      @close="notificationsStore.closeNotification"
    />
  </div>
</template>

<script setup lang="ts">
import WeatherModule from '../components/WeatherModule.vue';
import CalendarModule from '../components/CalendarModule.vue';
import TasksModule from '../components/TasksModule.vue';
import NotificationModal from '../components/NotificationModal.vue';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useModuleRotation } from '../composables/useModuleRotation';

const notificationsStore = useNotificationsStore();

const { activeKey: activeModule, progress } = useModuleRotation([
  { key: 'weather', duration: 25_000 },
]);
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--page-gap);
}

/* Agenda : prend toute la hauteur restante ; chaque jour est sa propre carte. */
.calendar-row {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Bande du bas : météo à gauche (carte), tâches à droite (cartes par liste). */
.bottom-row {
  flex: 0 0 var(--bottom-h);
  display: flex;
  gap: calc(10 * var(--px));
  overflow: hidden;
}

.weather-container {
  flex: 0 0 var(--weather-w);
  overflow: hidden;
  background: var(--c-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.tasks-container {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.calendar-row > *,
.weather-container > *,
.tasks-container > * {
  height: 100%;
  width: 100%;
}

/* Module rotation transition */
.module-fade-enter-active,
.module-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.module-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.module-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>