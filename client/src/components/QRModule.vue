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

const loading = ref(true);
const error = ref('');
const qrDataUrl = ref('');

async function loadQR() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/photos/session`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    qrDataUrl.value = await QRCode.toDataURL(data.pickerUri, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadQR);
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
