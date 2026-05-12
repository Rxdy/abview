<template>
  <div class="weather-with-qr">
    <!-- QR Code Display (5 sec every 30 sec cycle) -->
    <div v-if="showQRCode" class="qr-display">
      <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="qr-large" />
    </div>
    <!-- Weather Display -->
    <WeatherModule v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import WeatherModule from './WeatherModule.vue';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : '');

const showQRCode = ref(false);
const qrDataUrl = ref('');
const cycleInterval = ref<ReturnType<typeof setInterval> | null>(null);
const displayTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

async function fetchQRCode() {
  try {
    const res = await fetch(`${API_BASE}/photos/session`, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    
    const QRCode = (await import('qrcode')).default;
    qrDataUrl.value = await QRCode.toDataURL(data.pickerUri, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (e) {
    console.error('Failed to fetch QR code:', e);
  }
}

function startCycle() {
  cycleInterval.value = setInterval(() => {
    showQRCode.value = true;
    fetchQRCode();
    
    // Hide QR after 5 seconds
    displayTimeout.value = setTimeout(() => {
      showQRCode.value = false;
    }, 5000);
  }, 30000); // Every 30 seconds
}

onMounted(() => {
  startCycle();
});

onUnmounted(() => {
  if (cycleInterval.value) clearInterval(cycleInterval.value);
  if (displayTimeout.value) clearTimeout(displayTimeout.value);
});
</script>

<style scoped>
.weather-with-qr {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 18, 42, 0.5);
  border-radius: 8px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.qr-large {
  width: 200px;
  height: 200px;
  border: 4px solid #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
