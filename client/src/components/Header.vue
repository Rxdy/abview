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
      <!-- QR Code Button -->
      <div class="qr-button-container">
        <button @click="toggleQRWidget" class="qr-button" title="Ajouter/Changer photos">
          📸
        </button>
        
        <!-- QR Code Popup Widget -->
        <div v-if="showQRWidget" class="qr-popup">
          <button class="qr-close" @click="toggleQRWidget">✕</button>
          
          <div v-if="loading" class="qr-content">
            <div class="spinner"></div>
          </div>
          <div v-else-if="error" class="qr-content error">
            <p>❌ {{ error }}</p>
          </div>
          <div v-else class="qr-content">
            <img :src="qrDataUrl" alt="QR" class="qr-image" />
            <div class="status">⏳</div>
          </div>
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

const showQRWidget = ref(false);
const loading = ref(false);
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
      width: 120,
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
    showQRWidget.value = false;
  } catch (e: any) {
    error.value = 'Erreur: ' + e.message;
  }
}

function toggleQRWidget() {
  if (showQRWidget.value) {
    stopPolling();
    showQRWidget.value = false;
  } else {
    showQRWidget.value = true;
    createSession();
  }
}

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
  min-width: 200px;
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

/* QR Button */
.qr-button-container {
  position: relative;
}

.qr-button {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 1rem;
  cursor: pointer;
  color: inherit;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-button:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
}

/* QR Popup */
.qr-popup {
  position: absolute;
  top: 50px;
  right: 0;
  background: #12122a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 1rem;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
}

.qr-close {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  line-height: 1;
  transition: color 0.2s;
}

.qr-close:hover {
  color: #fff;
}

.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  min-width: 140px;
}

.qr-content.error {
  color: #ff6b6b;
  font-size: 0.75rem;
  text-align: center;
}

.qr-image {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status {
  font-size: 0.8rem;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
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