<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirmed'): void
}>()

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : '')

const loading = ref(true)
const error = ref('')
const pickerUri = ref('')
const sessionId = ref('')
const qrDataUrl = ref('')
const confirmed = ref(false)
const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)

async function createSession() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/photos/session`, { method: 'POST' })
    if (!res.ok) throw new Error(`Erreur serveur: HTTP ${res.status}`)
    const data = await res.json()
    sessionId.value = data.sessionId
    pickerUri.value = data.pickerUri

    qrDataUrl.value = await QRCode.toDataURL(pickerUri.value, {
      width: 240,
      margin: 2,
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
    confirmed.value = true
    setTimeout(() => emit('confirmed'), 2000)
  } catch (e: any) {
    error.value = 'Erreur lors de la confirmation: ' + e.message
  }
}

onMounted(createSession)
onUnmounted(stopPolling)
</script>

<template>
  <div class="photo-setup-overlay" @click.self="emit('close')">
    <div class="photo-setup-modal">
      <button class="close-btn" @click="emit('close')">✕</button>

      <h2>📸 Choisir des photos</h2>

      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Création de la session...</p>
      </div>

      <div v-else-if="error" class="state-box">
        <p class="error-text">❌ {{ error }}</p>
        <button class="retry-btn" @click="createSession">Réessayer</button>
      </div>

      <div v-else-if="confirmed" class="state-box">
        <div class="checkmark">✅</div>
        <p class="success-text">Photos sélectionnées!</p>
        <p class="sub">Chargement du screensaver...</p>
      </div>

      <div v-else class="qr-section">
        <p class="instruction">
          Scannez avec votre téléphone<br />
          <span class="sub">(connecté au compte Google)</span>
        </p>
        <img :src="qrDataUrl" alt="QR Code" class="qr-image" />
        <div class="waiting">
          <div class="dot-pulse"></div>
          <span>En attente de sélection...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-setup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
}

.photo-setup-modal {
  background: #12122a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  text-align: center;
  color: #fff;
  min-width: 300px;
  position: relative;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

h2 {
  margin: 0 0 1.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  transition: all 0.2s;
  line-height: 1;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.state-box {
  padding: 0.5rem 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #5b9eff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.checkmark {
  font-size: 3rem;
}
.success-text {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}
.error-text {
  color: #ff6b6b;
  margin: 0;
}
.retry-btn {
  background: #5b9eff;
  color: #fff;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}
.retry-btn:hover {
  background: #3a7ee8;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}

.instruction {
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
}
.sub {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
}

.qr-image {
  border-radius: 14px;
  width: 220px;
  height: 220px;
  display: block;
}

.waiting {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.dot-pulse {
  width: 8px;
  height: 8px;
  background: #5b9eff;
  border-radius: 50%;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
