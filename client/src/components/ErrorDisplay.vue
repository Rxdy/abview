<template>
  <div class="error-display">
    <div class="error-visual">
      <div class="error-icon-container">
        <component :is="icon" class="icon" />
      </div>
      <div class="error-patterns">
        <div class="pattern pattern-1"></div>
        <div class="pattern pattern-2"></div>
        <div class="pattern pattern-3"></div>
      </div>
    </div>
    <div class="error-details">
      <div class="error-indicators">
        <div class="indicator indicator-1" :class="{ 'active': type === 'network' }"></div>
        <div class="indicator indicator-2" :class="{ 'active': type === 'no-data' }"></div>
        <div class="indicator indicator-3" :class="{ 'active': type === 'service-unavailable' }"></div>
      </div>
      <div class="error-waves">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
      </div>
      <div class="error-text">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AlertTriangleIcon from './icons/AlertTriangleIcon.vue';
import WifiOffIcon from './icons/WifiOffIcon.vue';
import DatabaseIcon from './icons/DatabaseIcon.vue';
import { useLanguageStore } from '../stores/languageStore';

interface Props {
  type: 'network' | 'no-data' | 'service-unavailable' | 'generic';
}

const props = withDefaults(defineProps<Props>(), {});

const languageStore = useLanguageStore();

const icon = computed(() => {
  switch (props.type) {
    case 'network':
      return WifiOffIcon;
    case 'no-data':
      return DatabaseIcon;
    default:
      return AlertTriangleIcon;
  }
});

const title = computed(() => {
  switch (props.type) {
    case 'network':
      return languageStore.t('networkError');
    case 'no-data':
      return languageStore.t('noData');
    case 'service-unavailable':
      return languageStore.t('serviceUnavailable');
    default:
      return languageStore.t('error');
  }
});

const message = computed(() => {
  switch (props.type) {
    case 'network':
      return languageStore.t('networkErrorMessage');
    case 'no-data':
      return languageStore.t('noDataMessage');
    case 'service-unavailable':
      return languageStore.t('serviceUnavailableMessage');
    default:
      return languageStore.t('genericErrorMessage');
  }
});
</script>

<style scoped>
.error-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
  position: relative;
  overflow: hidden;
}

.error-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.error-icon-container {
  position: relative;
  z-index: 2;
}

.icon {
  width: 4rem;
  height: 4rem;
  color: var(--error-generic);
  opacity: 0.8;
  filter: drop-shadow(0 0 10px rgba(255, 107, 107, 0.3));
}

.error-patterns {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.pattern {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 107, 107, 0.1) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
}

.pattern-1 {
  width: 120px;
  height: 120px;
  top: -20px;
  left: -20px;
  animation-delay: 0s;
}

.pattern-2 {
  width: 80px;
  height: 80px;
  top: 30px;
  right: -10px;
  animation-delay: 0.5s;
}

.pattern-3 {
  width: 60px;
  height: 60px;
  bottom: -10px;
  left: 20px;
  animation-delay: 1s;
}

.error-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.error-indicators {
  display: flex;
  gap: 0.5rem;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-surface);
  transition: all 0.3s ease;
}

.indicator.active {
  background: var(--error-generic);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
  transform: scale(1.2);
}

.error-waves {
  display: flex;
  gap: 0.3rem;
}

.wave {
  width: 4px;
  height: 20px;
  background: #ff6b6b;
  border-radius: 2px;
  animation: wave 1.5s ease-in-out infinite;
}

.wave-1 {
  animation-delay: 0s;
}

.wave-2 {
  animation-delay: 0.2s;
}

.wave-3 {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
}

@keyframes wave {
  0%, 100% {
    height: 20px;
    opacity: 0.3;
  }
  50% {
    height: 35px;
    opacity: 0.8;
  }
}

.error-text {
  text-align: center;
  margin-top: 10px;
}

.error-text h3 {
  font-size: 1.2rem;
  color: var(--color-text);
  margin-bottom: 5px;
}

.error-text p {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* Type-specific colors */
.error-display[data-type="network"] .icon {
  color: var(--error-network);
}

.error-display[data-type="network"] .indicator.active {
  background: var(--error-network);
  box-shadow: 0 0 10px rgba(255, 149, 0, 0.5);
}

.error-display[data-type="network"] .pattern {
  background: radial-gradient(circle, rgba(255, 149, 0, 0.1) 0%, transparent 70%);
}

.error-display[data-type="no-data"] .icon {
  color: var(--error-no-data);
}

.error-display[data-type="no-data"] .indicator.active {
  background: var(--error-no-data);
  box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
}

.error-display[data-type="no-data"] .pattern {
  background: radial-gradient(circle, rgba(0, 122, 255, 0.1) 0%, transparent 70%);
}
</style>