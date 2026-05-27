<template>
  <div class="qr-module">
    <div class="qr-header">
      <h3>Ajouter vos photos</h3>
    </div>

    <div class="qr-body">
      <div v-if="loading" class="qr-loading">
        <div class="spinner"></div>
        <p>Génération du QR code...</p>
      </div>
      <div v-else-if="error" class="qr-error">
        <p>⚠️ {{ error }}</p>
      </div>
      <div v-else class="qr-image-wrapper">
        <img :src="qrDataUrl" alt="QR Code" class="qr-image" />
      </div>
    </div>

    <div class="qr-footer">
      <p>Scannez avec votre téléphone pour sélectionner vos photos Google Photos. Le screensaver se mettra à jour dès la sélection.</p>
      <p v-if="success" class="qr-success">✅ Sélection reçue — photos enregistrées.</p>
    </div>
    <div class="module-progress-bar">
      <div class="module-progress-fill" :style="{ width: (props.progress ?? 100) + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';

const props = defineProps<{ progress?: number }>();

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : '');

// --- État module-level : survit aux rotations du composant ---
let _sessionId = '';
let _qrDataUrl = '';
let _pollInterval: ReturnType<typeof setInterval> | null = null;
let _onSuccessCallback: (() => void) | null = null;

async function _doConfirm(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/photos/session/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      window.dispatchEvent(new CustomEvent('abview-photos-confirmed'));
      return true;
    }
  } catch {}
  return false;
}

function _startGlobalPolling(sessionId: string, onSuccess: () => void) {
  _sessionId = sessionId;
  _onSuccessCallback = onSuccess;
  if (_pollInterval) clearInterval(_pollInterval);
  _pollInterval = setInterval(async () => {
    if (!_sessionId) return;
    try {
      const res = await fetch(`${API_BASE}/photos/session/${_sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.mediaItemsSet) {
        clearInterval(_pollInterval!);
        _pollInterval = null;
        const ok = await _doConfirm(_sessionId);
        _sessionId = '';
        if (ok && _onSuccessCallback) _onSuccessCallback();
      }
    } catch {}
  }, 2000);
}

function _stopGlobalPolling() {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
  _sessionId = '';
  _qrDataUrl = '';
}
// --- Fin état module-level ---

const loading = ref(true);
const error = ref('');
const qrDataUrl = ref('');
const success = ref(false);
const successTimer = ref<ReturnType<typeof setTimeout> | null>(null);

async function loadQR() {
  loading.value = true;
  error.value = '';
  success.value = false;
  _stopGlobalPolling();
  try {
    const res = await fetch(`${API_BASE}/photos/session`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _qrDataUrl = await QRCode.toDataURL(data.pickerUri, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' },
    });
    qrDataUrl.value = _qrDataUrl;
    _startGlobalPolling(data.sessionId, () => {
      success.value = true;
      if (successTimer.value) clearTimeout(successTimer.value);
      successTimer.value = setTimeout(() => {
        success.value = false;
        loadQR();
      }, 6000);
    });
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (_sessionId && _qrDataUrl) {
    // Session en cours : restaurer le QR sans recréer une nouvelle session
    qrDataUrl.value = _qrDataUrl;
    loading.value = false;
    // Ré-enregistrer le callback pour ce montage
    _onSuccessCallback = () => {
      success.value = true;
      if (successTimer.value) clearTimeout(successTimer.value);
      successTimer.value = setTimeout(() => {
        success.value = false;
        loadQR();
      }, 6000);
    };
  } else {
    loadQR();
  }
});

onUnmounted(() => {
  // Ne PAS arrêter le polling — il doit survivre à la rotation
  if (successTimer.value) { clearTimeout(successTimer.value); successTimer.value = null; }
});
</script>

<style scoped>
.qr-module {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 0.5rem 0.75rem;
  box-sizing: border-box;
  gap: 0.25rem;
  align-items: center;
  justify-content: space-between;
}

.qr-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  text-align: center;
}

.qr-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.qr-error {
  color: #ff6b6b;
  font-size: 0.85rem;
  text-align: center;
}

.qr-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 220px;
  height: 220px;
  border: 4px solid #fff;
  border-radius: 8px;
  background: #fff;
  padding: 2px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.qr-footer p {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.65);
  text-align: center;
  line-height: 1.4;
}

.qr-success {
  color: #4ade80 !important;
  font-size: 0.85rem !important;
  margin-top: 0.5rem !important;
}


.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.module-progress-bar {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.module-progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 2px;
  transition: width 0.1s linear;
}
</style>
