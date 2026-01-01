# Synchronisation Front/Back pour le Timer du Recap Annuel

## Problème Actuel
- Timer côté front (60 secondes par slide) qui n'est pas synchronisé avec le back-end
- Imprécision dans le décompte du temps restant
- Pas de réelle synchronisation temps réel

## Solutions Possibles

### 1. WebSocket / Server-Sent Events (SSE)
**Avantages :**
- Synchronisation temps réel
- Communication bidirectionnelle
- Précision parfaite

**Inconvénients :**
- Complexité d'implémentation
- Nécessite un serveur WebSocket
- Overhead réseau

**Implémentation :**
```javascript
// Côté serveur (Node.js avec socket.io)
io.on('connection', (socket) => {
  socket.emit('recap-timer', { slide: 0, timeLeft: 60, totalTime: 60 })

  const timer = setInterval(() => {
    // Logique de timer synchronisée
  }, 1000)
})

// Côté client
socket.on('recap-timer', (data) => {
  progressPercent.value = ((data.totalTime - data.timeLeft) / data.totalTime) * 100
})
```

### 2. Polling HTTP avec Timestamp
**Avantages :**
- Simple à implémenter
- Pas besoin de WebSocket
- Utilise l'API REST existante

**Inconvénients :**
- Pas temps réel (délai de polling)
- Charge réseau inutile

**Implémentation :**
```javascript
// Côté serveur : endpoint qui retourne l'état du timer
app.get('/api/recap/timer', (req, res) => {
  const currentState = {
    slide: currentSlide,
    startTime: slideStartTime,
    duration: slideDuration,
    serverTime: Date.now()
  }
  res.json(currentState)
})

// Côté client : polling toutes les 2 secondes
const pollTimer = () => {
  fetch('/api/recap/timer')
    .then(res => res.json())
    .then(data => {
      const elapsed = (Date.now() - data.startTime) / 1000
      const remaining = Math.max(0, data.duration - elapsed)
      progressPercent.value = ((data.duration - remaining) / data.duration) * 100
    })
}
```

### 3. Timer Local avec Synchronisation Périodique
**Avantages :**
- Simple à implémenter
- Pas de charge réseau continue
- Précision acceptable

**Inconvénients :**
- Décalage possible si l'horloge client dérive
- Pas de synchronisation parfaite

**Implémentation :**
```javascript
// Synchronisation toutes les 30 secondes
const syncTimer = async () => {
  try {
    const response = await fetch('/api/recap/sync')
    const serverTime = await response.json()
    const clientTime = Date.now()
    timeOffset = serverTime - clientTime
  } catch (error) {
    console.warn('Erreur de synchronisation:', error)
  }
}

// Timer local avec correction d'offset
const startLocalTimer = () => {
  const startTime = Date.now() + timeOffset
  progressInterval.value = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000
    progressPercent.value = Math.min((elapsed / slideDuration.value) * 100, 100)
  }, 100)
}
```

### 4. Timer Coté Serveur avec Callback
**Avantages :**
- Précision parfaite
- Contrôle total côté serveur
- Pas de timer côté client

**Inconvénients :**
- Nécessite une connexion persistante
- Plus complexe

**Implémentation :**
```javascript
// Côté serveur : timer qui déclenche les changements
const recapTimers = new Map()

function startRecapTimer(sessionId, slideIndex) {
  const timer = setTimeout(() => {
    // Changer de slide
    io.to(sessionId).emit('next-slide', { slide: slideIndex + 1 })
    // Redémarrer le timer pour la slide suivante
    startRecapTimer(sessionId, slideIndex + 1)
  }, 60000) // 60 secondes

  recapTimers.set(sessionId, timer)
}

// Côté client : écoute les événements
socket.on('next-slide', (data) => {
  nextSlide()
})
```

### 5. Hybrid Solution (Recommandée)
**Timer local + synchronisation légère**
- Timer local pour fluidité
- Synchronisation périodique (toutes les 10-15 secondes)
- Correction automatique des dérives

**Avantages :**
- Performance optimale
- Précision acceptable
- Robuste aux coupures réseau

## Recommandation

Je recommande la **solution hybride** car elle offre le meilleur compromis :

1. **Timer local** pour la fluidité de l'animation
2. **Synchronisation périodique** pour corriger les dérives
3. **Fallback** en cas de perte de connexion
4. **Affichage du temps restant** avec précision relative

Cette approche est utilisée par de nombreuses applications de présentation et offre une excellente expérience utilisateur tout en étant maintenable.

## Questions à Réfléchir

1. Quelle précision est réellement nécessaire pour l'utilisateur ?
2. Le réseau est-il fiable dans l'environnement d'utilisation ?
3. Quel est le coût de développement vs bénéfice utilisateur ?
4. Peut-on accepter une imprécision de ±2-3 secondes ?

## Implémentation Proposée

```javascript
// Timer hybride avec synchronisation
let timeOffset = 0
let lastSyncTime = 0

const SYNC_INTERVAL = 15000 // 15 secondes

const syncWithServer = async () => {
  try {
    const start = Date.now()
    const response = await fetch('/api/time')
    const serverTime = await response.json()
    const end = Date.now()

    // Compensation de la latence réseau
    const latency = (end - start) / 2
    timeOffset = serverTime + latency - end
    lastSyncTime = end
  } catch (error) {
    console.warn('Sync failed:', error)
  }
}

const startHybridTimer = () => {
  // Synchronisation initiale
  syncWithServer()

  // Timer local précis
  const slideStart = Date.now() + timeOffset
  progressInterval.value = setInterval(() => {
    const now = Date.now()
    const elapsed = (now - slideStart) / 1000
    progressPercent.value = Math.min((elapsed / slideDuration.value) * 100, 100)

    // Resynchronisation périodique
    if (now - lastSyncTime > SYNC_INTERVAL) {
      syncWithServer()
    }
  }, 100)
}
```