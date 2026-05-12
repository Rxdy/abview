<template>
  <header class="header">
    <div class="logo">
      <img alt="Logo" src="/abview-logo.png" width="40" height="40" />
      <h1>AbView</h1>
    </div>
    <div class="center">
      <DateTimeModule />
    </div>
    <div class="right">
      <!-- QR Code Always Visible -->
      <div class="qr-container">
        <div v-if="loading" class="qr-box">
          <div class="spinner"></div>
        </div>
        <div v-else-if="error" class="qr-box error">
          <p>⚠️</p>
        </div>
        <div v-else class="qr-box">
          <img :src="qrDataUrl" alt="QR" class="qr-image" />
          <div class="status">📱</div>
        </div>
      </div>
      
      <h2>{{ dashboardStore.name }}</h2>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import DateTimeModule from './DateTimeModule.vue';
import { useDashboardStore } from '../stores/dashboardStore';

const dashboardStore = useDashboardStore();

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : '');

const loading = ref(true);
const error = ref('');
const pickerUri = ref('');
const sessionId = ref('');
const qrDataUrl = ref('');
const pollInterval = ref<ReturnType<typeof setInterval> | null>(null);

async function createSession() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/photos/session`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    sessionId.value = data.sessionId;
    pickerUri.value = data.pickerUri;

    qrDataUrl.value = await QRCode.toDataURL(pickerUri.value, {
      width: 100,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });

    loading.value = false;
    startPolling();
  } catch (e: any) {
    error.value = e.message;
    loading.value = false;
  }
}

function startPolling() {
  pollInterval.value = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/photos/session/${sessionId.value}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.mediaItemsSet) {
        stopPolling();
        await confirmSession();
      }
    } catch {}
  }, 2000);
}

function stopPolling() {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
    pollInterval.value = null;
  }
}

async function confirmSession() {
  try {
    await fetch(`${API_BASE}/photos/session/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId.value }),
    });
    // Refresh QR code for next photos
    await createSession();
  } catch (e: any) {
    error.value = 'Erreur: ' + e.message;
  }
}

onMounted(() => {
  createSession();
});

onUnmounted(stopPolling);
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-surface);
  color: var(--color-primary);
  height: 47px;
  flex-shrink: 0;
  position: relative;
}

.light-theme .header {
  color: var(--color-primary);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  min-width: 220px;
}

.right h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.logo h1 {
  font-size: 1.2rem;
  margin: 0;
}

/* QR Code Container - Always Visible */
.qr-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-box {
  width: 100px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.qr-box.error {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  font-size: 2rem;
}

.qr-image {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.status {
  position: absolute;
  bottom: -8px;
  font-size: 1.2rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>