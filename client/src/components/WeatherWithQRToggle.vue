<template>
  <div class="qr-module">
    <div class="qr-header">
      <h3>📱 Ajouter vos photos</h3>
    </div>
    
    <div class="qr-content">
      <div v-if="loading" class="qr-loading">
        <div class="spinner"></div>
        <p>Génération du QR code...</p>
      </div>
      <div v-else-if="error" class="qr-error">
        <p>⚠️ Erreur: {{ error }}</p>
      </div>
      <div v-else class="qr-display-area">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="qr-code-image" />
      </div>
    </div>

    <div class="qr-instructions">
      <p class="instruction-text">
        Scannez ce code QR avec votre téléphone pour sélectionner vos photos Google Photos.
        Les photos apparaîtront automatiquement en screensaver.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : '');

const loading = ref(true);
const error = ref('');
const qrDataUrl = ref('');

async function fetchQRCode() {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/photos/session`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    qrDataUrl.value = await QRCode.toDataURL(data.pickerUri, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#000000', light: '#ffffff' },
    });
    loading.value = false;
  } catch (e: any) {
    error.value = e.message;
    loading.value = false;
  }
}

onMounted(() => {
  fetchQRCode();
});
</script>

<style scoped>
.qr-module {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 8px;
  padding: 1.5rem;
  box-sizing: border-box;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.qr-header {
  text-align: center;
}

.qr-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #fff;
  font-weight: 600;
}

.qr-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 200px;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.qr-error {
  color: #ff6b6b;
  text-align: center;
  padding: 1rem;
}

.qr-display-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  border: 4px solid #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  background: #fff;
  padding: 4px;
}

.qr-instructions {
  text-align: center;
  width: 100%;
}

.instruction-text {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}
</style>
