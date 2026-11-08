<template>
  <div class="photos">
    <!-- Le mur : des panneaux à moulures, qui suivent le thème jour / nuit. Les panneaux en trop passent à la
         ligne suivante, hors de la zone visible : il y en a toujours assez pour la largeur du module. -->
    <div class="mur" aria-hidden="true">
      <div v-for="n in 14" :key="n" class="panneau" />
    </div>
    <div class="plan">
      <div
        v-for="(em, i) in disposition.emplacements"
        :key="i"
        class="emplacement"
        :data-orientation="em.orientation"
        :style="{
          left: `${em.x}%`,
          top: `${em.y}%`,
          width: `${em.largeur}%`,
          height: `${em.hauteur}%`,
          transform: em.inclinaison ? `rotate(${em.inclinaison}deg)` : undefined,
        }"
      >
        <!-- Cadre autour de la photo ; la photo suivante arrive en fondu -->
        <figure class="cadre" :class="em.cadre">
          <Transition name="photo-fondu" mode="out-in">
            <img v-if="photos[i]" :key="photos[i]!.id" :src="photos[i]!.url" alt="" draggable="false" />
          </Transition>
        </figure>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { DISPOSITIONS, DISPOSITION_PAR_DEFAUT, DUREE_MAX, DUREE_MIN } from '../modules/dispositionsPhotos'
import { photosService } from '../services/photosService'
import type { PhotoAffichee } from '../utils/photosDemo'

/**
 * Cadre photo numérique : plusieurs emplacements entourés d'un cadre en bois, sur un décor. Chaque emplacement
 * change de photo à son rythme, en fondu, avec une photo tirée au hasard dans toute la bibliothèque abflow dans
 * SON orientation (jamais un paysage dans un emplacement en portrait).
 *
 * variante : la disposition (un, portrait, deux, trois, quatre, galerie).
 * Le mur à moulures et les cadres suivent le thème jour / nuit.
 */
const props = defineProps<{ variante?: string }>()

const disposition = computed(() => DISPOSITIONS[props.variante ?? DISPOSITION_PAR_DEFAUT] ?? DISPOSITIONS[DISPOSITION_PAR_DEFAUT]!)
const photos = ref<(PhotoAffichee | undefined)[]>([])

const identifiantsAffiches = (sauf?: number) =>
  photos.value.flatMap((p, i) => (p && i !== sauf ? [p.id] : []))

/** Attend que l'image soit prête pour que le fondu ne montre pas un cadre vide (3 s au plus). */
function precharger(url: string): Promise<void> {
  if (url.startsWith('data:') || typeof Image === 'undefined') return Promise.resolve()
  return new Promise((fin) => {
    const image = new Image()
    const delai = setTimeout(fin, 3000)
    image.onload = image.onerror = () => {
      clearTimeout(delai)
      fin()
    }
    image.src = url
  })
}

const minuteurs: ReturnType<typeof setTimeout>[] = []
let actif = true

function planifier(i: number) {
  if (!actif) return
  const attente = DUREE_MIN + Math.random() * (DUREE_MAX - DUREE_MIN)
  minuteurs[i] = setTimeout(async () => {
    const orientation = disposition.value.emplacements[i]?.orientation
    if (orientation) {
      const [nouvelle] = await photosService.aleatoires([orientation], identifiantsAffiches())
      if (nouvelle && actif) {
        await precharger(nouvelle.url)
        if (actif) photos.value[i] = nouvelle
      }
    }
    planifier(i)
  }, attente)
}

function arreter() {
  minuteurs.forEach(clearTimeout)
  minuteurs.length = 0
}

async function demarrer() {
  arreter()
  const orientations = disposition.value.emplacements.map((e) => e.orientation)
  photos.value = await photosService.aleatoires(orientations)
  orientations.forEach((_, i) => planifier(i))
}

onMounted(demarrer)
// Un autre agencement (changé dans l'éditeur) repart de zéro
watch(disposition, () => void demarrer())
onUnmounted(() => {
  actif = false
  arreter()
})
</script>

<style scoped>
/*
 * Couleurs : nuit par défaut, jour sous .light-theme (posé par App.vue, comme le reste de l'écran).
 * --mur : le fond ; --mol-clair / --mol-ombre : le haut et le creux d'une moulure, qui donnent le relief.
 */
.photos {
  --mur: #1d2431;
  --mur-haut: #232b3a;
  --mol-clair: rgba(255, 255, 255, 0.16);
  --mol-ombre: rgba(0, 0, 0, 0.7);
  --passe: #d9d4c8;
  --cadre-1: #2a2b30;
  --cadre-2: #0e0e10;
  --filet: #b79a52;
  --ombre-portee: rgba(0, 0, 0, 0.6);
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-card);
  box-sizing: border-box;
  background: linear-gradient(180deg, var(--mur-haut), var(--mur));
}

/* Le mur : une rangée de panneaux à moulures, avec une corniche en haut et une plinthe en bas */
.mur {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(210 * var(--px)), 1fr));
  grid-auto-rows: 100%;
  overflow: hidden;
  padding: calc(14 * var(--px)) calc(8 * var(--px));
  box-sizing: border-box;
}

.panneau {
  margin: 0 calc(8 * var(--px));
  border-radius: calc(2 * var(--px));
  /* moulure extérieure : un liseré en creux puis un filet en relief, puis un cadre intérieur plus fin */
  box-shadow:
    inset 0 0 0 calc(1.5 * var(--px)) var(--mol-ombre),
    inset 0 0 0 calc(3.5 * var(--px)) var(--mol-clair),
    inset 0 0 0 calc(12 * var(--px)) transparent,
    inset 0 0 0 calc(13.5 * var(--px)) var(--mol-ombre),
    inset 0 0 0 calc(15.5 * var(--px)) var(--mol-clair),
    0 calc(1.5 * var(--px)) 0 var(--mol-clair);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(0, 0, 0, 0.04));
}

/* Corniche et plinthe */
.mur::before,
.mur::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: calc(10 * var(--px));
  background: linear-gradient(180deg, var(--mol-clair), transparent 45%, var(--mol-ombre));
  pointer-events: none;
}
.mur::before {
  top: 0;
}
.mur::after {
  bottom: 0;
  transform: scaleY(-1);
}

.plan {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* Les emplacements sont posés en % du module, à des hauteurs différentes, et penchent à peine */
.emplacement {
  position: absolute;
  min-width: 0;
  min-height: 0;
}

/*
 * Les cadres : une épaisseur de passe-partout (--ep), une ombre portée vers le bas sur le mur, et un style
 * qui change d'un cadre à l'autre pour que le mur ne soit pas uniforme.
 */
.cadre {
  --ep: calc(10 * var(--px));
  margin: 0;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  padding: var(--ep);
  background: var(--passe);
  box-shadow:
    0 calc(10 * var(--px)) calc(22 * var(--px)) var(--ombre-portee),
    0 calc(2 * var(--px)) calc(4 * var(--px)) var(--ombre-portee);
}

.cadre img {
  display: block;
  position: absolute;
  inset: var(--ep);
  width: calc(100% - 2 * var(--ep));
  height: calc(100% - 2 * var(--ep));
  object-fit: cover;
  /* ouverture du passe-partout : un petit biseau d'ombre autour de la photo */
  box-shadow: 0 0 0 calc(1 * var(--px)) rgba(0, 0, 0, 0.4), inset 0 0 calc(8 * var(--px)) rgba(0, 0, 0, 0.45);
}

/* Doré, mouluré : large cadre avec un profil en gradins et des reflets aux coins */
.cadre.or {
  --ep: calc(11 * var(--px));
  border: calc(15 * var(--px)) solid #b8892b;
  border-image: linear-gradient(135deg, #f6e3a1, #b8892b 22%, #fbeeb8 42%, #9a6f1c 62%, #e9cb6c 82%, #a67a22) 1;
  box-shadow:
    inset 0 0 0 calc(2 * var(--px)) #6d4c10,
    inset 0 0 0 calc(4.5 * var(--px)) #f0d37c,
    inset 0 0 0 calc(6.5 * var(--px)) #7d5714,
    inset 0 0 calc(10 * var(--px)) rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(60, 38, 5, 0.7),
    0 calc(10 * var(--px)) calc(22 * var(--px)) var(--ombre-portee),
    0 calc(2 * var(--px)) calc(4 * var(--px)) var(--ombre-portee);
}
.cadre.or::before {
  content: '';
  position: absolute;
  inset: calc(-15 * var(--px));
  pointer-events: none;
  /* reflets aux quatre coins, comme des ornements en relief */
  background:
    radial-gradient(circle at 0 0, rgba(255, 244, 200, 0.85), transparent calc(26 * var(--px))),
    radial-gradient(circle at 100% 0, rgba(255, 244, 200, 0.85), transparent calc(26 * var(--px))),
    radial-gradient(circle at 0 100%, rgba(255, 244, 200, 0.85), transparent calc(26 * var(--px))),
    radial-gradient(circle at 100% 100%, rgba(255, 244, 200, 0.85), transparent calc(26 * var(--px)));
}

/* Laque noire fine avec un filet doré */
.cadre.noir {
  --ep: calc(10 * var(--px));
  border: calc(7 * var(--px)) solid var(--cadre-1);
  border-image: linear-gradient(145deg, var(--cadre-1), var(--cadre-2) 55%, var(--cadre-1)) 1;
  box-shadow:
    inset 0 0 0 calc(2 * var(--px)) var(--filet),
    inset 0 calc(2 * var(--px)) calc(8 * var(--px)) rgba(0, 0, 0, 0.28),
    0 calc(10 * var(--px)) calc(22 * var(--px)) var(--ombre-portee),
    0 calc(2 * var(--px)) calc(4 * var(--px)) var(--ombre-portee);
}

/* Noyer, large, avec un liseré clair à l'intérieur */
.cadre.bois {
  --ep: calc(9 * var(--px));
  border: calc(13 * var(--px)) solid #6a4426;
  border-image: linear-gradient(160deg, #9b6a3d, #5d3a1e 40%, #86582f 65%, #4f301a) 1;
  box-shadow:
    inset 0 0 0 calc(2 * var(--px)) #c79a63,
    inset 0 0 calc(8 * var(--px)) rgba(0, 0, 0, 0.35),
    0 calc(10 * var(--px)) calc(22 * var(--px)) var(--ombre-portee),
    0 calc(2 * var(--px)) calc(4 * var(--px)) var(--ombre-portee);
}

/* Ovale doré, pour un portrait */
.cadre.ovale {
  --ep: calc(16 * var(--px));
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #f6e3a1, #b8892b 25%, #fbeeb8 45%, #9a6f1c 65%, #e9cb6c 85%);
  box-shadow:
    inset 0 0 0 calc(3 * var(--px)) #7d5714,
    inset 0 0 calc(10 * var(--px)) rgba(0, 0, 0, 0.35),
    0 calc(10 * var(--px)) calc(22 * var(--px)) var(--ombre-portee);
}
/* Arche : cintrée en haut, dorée, pour un portrait */
.cadre.arche {
  --ep: calc(14 * var(--px));
  border: none;
  border-radius: 50% 50% calc(5 * var(--px)) calc(5 * var(--px)) / 26% 26% calc(5 * var(--px)) calc(5 * var(--px));
  background: linear-gradient(160deg, #f6e3a1, #b8892b 25%, #fbeeb8 45%, #9a6f1c 65%, #e9cb6c 85%);
  box-shadow:
    inset 0 0 0 calc(3 * var(--px)) #7d5714,
    inset 0 0 calc(10 * var(--px)) rgba(0, 0, 0, 0.35),
    0 calc(10 * var(--px)) calc(22 * var(--px)) var(--ombre-portee);
}

.cadre.ovale img {
  border-radius: 50%;
}
.cadre.arche img {
  border-radius: 50% 50% calc(2 * var(--px)) calc(2 * var(--px)) / 24% 24% calc(2 * var(--px)) calc(2 * var(--px));
}

.photo-fondu-enter-active,
.photo-fondu-leave-active {
  transition: opacity 1.2s ease;
}
.photo-fondu-enter-from,
.photo-fondu-leave-to {
  opacity: 0;
}
</style>

<!-- Thème jour : hors du bloc « scoped », car la classe .light-theme est posée sur un élément parent (App.vue) -->
<style>
.light-theme .photos {
  --mur: #e7e2d8;
  --mur-haut: #f1ede4;
  --mol-clair: rgba(255, 255, 255, 0.95);
  --mol-ombre: rgba(90, 75, 50, 0.4);
  --passe: #fbf9f4;
  --cadre-1: #3a3b40;
  --cadre-2: #17171a;
  --filet: #b08d3c;
  --ombre-portee: rgba(60, 45, 20, 0.38);
}
</style>
