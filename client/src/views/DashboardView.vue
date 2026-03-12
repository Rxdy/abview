<template>
  <div class="dashboard">
    <div class="calendar-row">
      <CalendarModule key="calendar" class="fade-in-1" />
    </div>
    <div class="bottom-row">
      <div class="weather-container">
        <WeatherModule key="weather" class="fade-in-2" />
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
import { onMounted } from 'vue';
import WeatherModule from '../components/WeatherModule.vue';
import CalendarModule from '../components/CalendarModule.vue';
import TasksModule from '../components/TasksModule.vue';
import NotificationModal from '../components/NotificationModal.vue';
import { useNotificationsStore } from '../stores/notificationsStore';

const notificationsStore = useNotificationsStore();

onMounted(() => {
  // Initialization if needed
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.5rem;
  padding: 0.5rem;
  box-sizing: border-box;
}

.calendar-row {
  flex: 0 0 60%;
  overflow: hidden;
  background: var(--color-surface);
  border-radius: 6px;
}

.bottom-row {
  flex: 0 0 40%;
  display: flex;
  gap: 0.5rem;
  overflow: hidden;
}

.weather-container {
  flex: 0 0 30%;
  overflow: hidden;
  background: var(--color-surface);
  border-radius: 6px;
}

.tasks-container {
  flex: 0 0 69.5%;
  overflow: hidden;
  background: var(--color-surface);
  border-radius: 6px;
}

.calendar-row > *,
.weather-container > *,
.tasks-container > * {
  height: 100%;
  width: 100%;
}
</style>