<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'

const emit = defineEmits<{
  (e: 'photos-confirmed'): void
}>()

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : '')

const isOpen = ref(false)
const loading = ref(false)
const error = ref('')
const pickerUri = ref('')
const sessionId = ref('')
const qrDataUrl = ref('')
const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)

async function createSession() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/photos/session`, { method: 'POST' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    sessionId.value = data.sessionId
    pickerUri.value = data.pickerUri

    qrDataUrl.value = await QRCode.toDataURL(pickerUri.value, {
      width: 140,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })

    loading.value = false
    startPolling()
  } catch (e: any) {
    error.value = e.message
    loading.value = false
  }
}

function startPolling() {
  pollInterval.value = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/photos/session/${sessionId.value}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.mediaItemsSet) {
        stopPolling()
        await confirmSession()
      }
    } catch {}
  }, 2000)
}

function stopPolling() {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

async function confirmSession() {
  try {
    await fetch(`${API_BASE}/photos/session/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId.value }),
    })
    isOpen.value = false
    setTimeout(() => emit('photos-confirmed'), 800)
  } catch (e: any) {
    error.value = 'Erreur: ' + e.message
  }
}

function openWidget() {
  isOpen.value = true
  createSession()
}

function closeWidget() {
  stopPolling()
  isOpen.value = false
}

onUnmounted(stopPolling)
</script>

<template>
  <div v-if="!isOpen" class="photo-widget-trigger">
    <button @click="openWidget" title="Ajouter des photos (Cliquer pour ouvrir)">
      📸
    </button>
  </div>

  <div v-else class="photo-widget-container">
    <button class="close-btn" @click="closeWidget">✕</button>

    <div v-if="loading" class="widget-content">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="widget-content error">
      <p>❌ {{ error }}</p>
    </div>

    <div v-else class="widget-content">
      <img :src="qrDataUrl" alt="QR" class="qr-code" />
      <div class="status">⏳</div>
    </div>
  </div>
</template>

<style scoped>
.photo-widget-trigger {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 500;
}

.photo-widget-trigger button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-widget-trigger button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.photo-widget-container {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  background: #12122a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 1rem;
  z-index: 500;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.widget-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 160px;
}

.widget-content.error {
  color: #ff6b6b;
  font-size: 0.75rem;
  text-align: center;
}

.qr-code {
  width: 140px;
  height: 140px;
  border-radius: 8px;
}

.status {
  font-size: 0.9rem;
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
  width: 30px;
  height: 30px;
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
