<template>
  <div class="editeur">
    <header class="entete">
      <h1>Disposition de l’écran</h1>
      <a class="retour" href="/">Retour à l’écran</a>
    </header>

    <section class="bloc">
      <h2>Jeton d’administration</h2>
      <input
        v-model="jeton"
        type="password"
        autocomplete="off"
        placeholder="Nécessaire pour enregistrer, activer ou supprimer"
        aria-label="Jeton d’administration"
        @change="garderJeton"
      />
    </section>

    <div class="colonnes">
      <section class="bloc favoris">
        <h2>Configurations</h2>
        <ul>
          <li v-for="c in liste" :key="c.id">
            <button type="button" class="ligne" :class="{ choisie: c.id === idEdite }" @click="ouvrir(c.id)">
              {{ c.nom }}
            </button>
            <span v-if="c.id === actif" class="badge">Active</span>
          </li>
          <li v-if="!liste.length" class="calme">Aucune enregistrée : l’écran utilise la disposition standard.</li>
        </ul>
        <div class="actions">
          <button type="button" @click="nouvelle">Nouvelle</button>
          <button type="button" :disabled="!idEdite" @click="dupliquer">Dupliquer</button>
          <button type="button" :disabled="!idEdite || idEdite === actif" @click="supprimer">Supprimer</button>
          <button type="button" :disabled="actif === null" @click="activer(null)">Revenir au standard</button>
        </div>
      </section>

      <section class="bloc apercu-bloc">
        <label class="nom">
          Nom
          <input v-model="brouillon.nom" type="text" maxlength="80" aria-label="Nom de la configuration" />
        </label>

        <div ref="grilleEl" class="grille" :style="{ '--colonnes': GRILLE.colonnes, '--lignes': GRILLE.lignes }">
          <div v-for="n in GRILLE.colonnes * GRILLE.lignes" :key="n" class="case" :style="styleCase(n)" aria-hidden="true" />
          <div
            v-for="m in modulesAffiches"
            :key="m.id"
            class="module"
            :class="{ selectionne: m.id === selection, glisse: glisse?.id === m.id }"
            :style="m.style"
            role="button"
            tabindex="0"
            :aria-label="`${m.titre}, colonne ${m.x}, ligne ${m.y}`"
            @pointerdown="debutGlisse($event, m)"
            @click="selection = m.id"
            @keydown.enter="selection = m.id"
          >
            <strong>{{ m.titre }}</strong>
            <span>{{ m.largeur }} × {{ m.hauteur }}</span>
          </div>
        </div>

        <p v-if="erreurs.length" class="erreurs" role="alert">
          <span v-for="e in erreurs" :key="e">{{ e }}</span>
        </p>
        <p v-if="message" class="message" role="status">{{ message }}</p>

        <div class="actions">
          <button type="button" class="principal" :disabled="!peutEnregistrer" @click="enregistrer">Enregistrer</button>
          <button type="button" :disabled="!peutActiver" @click="activer(idEdite)">Enregistrer et activer</button>
        </div>
      </section>

      <section class="bloc reglages">
        <h2>Modules</h2>
        <div class="actions">
          <button v-for="def in modulesDisponibles" :key="def.id" type="button" @click="ajouterModule(def.id)">
            Ajouter : {{ def.titre }}
          </button>
        </div>

        <div v-if="placement" class="selection">
          <h3>{{ REGISTRE[placement.module]?.titre }}</h3>
          <label>
            Taille
            <select :value="placement.variante ?? premiereVariante" aria-label="Taille du module" @change="changerTaille">
              <option v-for="v in REGISTRE[placement.module]?.variantes" :key="v.id" :value="v.id">
                {{ v.id }} ({{ v.largeur }} × {{ v.hauteur }} cases)
              </option>
            </select>
          </label>
          <div class="fleches" role="group" aria-label="Déplacer">
            <button type="button" aria-label="Monter" @click="bouger(0, -1)">↑</button>
            <button type="button" aria-label="Aller à gauche" @click="bouger(-1, 0)">←</button>
            <button type="button" aria-label="Descendre" @click="bouger(0, 1)">↓</button>
            <button type="button" aria-label="Aller à droite" @click="bouger(1, 0)">→</button>
          </div>
          <button type="button" class="danger" @click="retirerModule">Retirer de l’écran</button>
        </div>
        <p v-else class="calme">Cliquez sur un module de la grille pour le régler, ou glissez-le pour le déplacer.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { GRILLE } from '../modules/grille'
import { REGISTRE } from '../modules/registre'
import { CONFIGURATION_PAR_DEFAUT, rectangle, valider, type Configuration } from '../modules/configuration'
import { ajouter, changerVariante, deplacer, identifiantDepuisNom, retirer } from '../modules/edition'
import { configurationsService, messageErreur, type ResumeConfiguration } from '../services/configurationsService'

const CLE_JETON = 'abview-jeton-admin'
const lireJeton = () => {
  try {
    return sessionStorage.getItem(CLE_JETON) ?? ''
  } catch {
    return ''
  }
}

const jeton = ref(lireJeton())
const garderJeton = () => {
  try {
    sessionStorage.setItem(CLE_JETON, jeton.value)
  } catch {
    /* navigation privée : le jeton reste en mémoire pour la session */
  }
}

const liste = ref<ResumeConfiguration[]>([])
const actif = ref<string | null>(null)
const idEdite = ref<string | null>(null) // null : configuration pas encore enregistrée
const brouillon = reactive<Configuration>(structuredClone(CONFIGURATION_PAR_DEFAUT))
const selection = ref<string | null>(null)
const message = ref('')
const grilleEl = ref<HTMLElement | null>(null)

const erreurs = computed(() => valider(brouillon))
const premiereVariante = computed(() => (placement.value ? REGISTRE[placement.value.module]?.variantes[0]?.id : ''))
const placement = computed(() => brouillon.placements.find((p) => p.id === selection.value))
const modulesDisponibles = computed(() => Object.values(REGISTRE))
const nomValide = computed(() => brouillon.nom.trim().length > 0)
const peutEnregistrer = computed(() => !erreurs.value.length && nomValide.value && !!jeton.value)
const peutActiver = computed(() => peutEnregistrer.value)

// Chaque case est posée explicitement : sinon la grille décale les cases libres autour des modules.
const styleCase = (n: number) => ({
  gridColumn: String(((n - 1) % GRILLE.colonnes) + 1),
  gridRow: String(Math.floor((n - 1) / GRILLE.colonnes) + 1),
})

const remplacer = (config: Configuration) => {
  brouillon.nom = config.nom
  brouillon.placements = config.placements
}

// Une configuration invalide (placement en dehors de la grille…) ne s'affiche que ses placements reconnus
const modulesAffiches = computed(() =>
  brouillon.placements.flatMap((p) => {
    const r = rectangle(p)
    if (!r) return []
    return [
      {
        id: p.id,
        titre: REGISTRE[p.module]?.titre ?? p.module,
        x: r.x,
        y: r.y,
        largeur: r.largeur,
        hauteur: r.hauteur,
        style: {
          gridColumn: `${r.x} / span ${r.largeur}`,
          gridRow: `${r.y} / span ${r.hauteur}`,
          ...(glisse.value?.id === p.id
            ? { transform: `translate(${glisse.value.dx}px, ${glisse.value.dy}px)`, zIndex: 5 }
            : {}),
        },
      },
    ]
  })
)

async function charger() {
  try {
    const r = await configurationsService.liste()
    liste.value = r.configurations
    actif.value = r.actif
  } catch (e) {
    message.value = messageErreur(e)
  }
}

async function ouvrir(id: string) {
  try {
    remplacer(await configurationsService.obtenir(id))
    idEdite.value = id
    selection.value = null
    message.value = ''
  } catch (e) {
    message.value = messageErreur(e)
  }
}

function nouvelle() {
  remplacer(structuredClone(CONFIGURATION_PAR_DEFAUT))
  brouillon.nom = 'Nouvelle configuration'
  idEdite.value = null
  selection.value = null
  message.value = ''
}

function dupliquer() {
  brouillon.nom = `${brouillon.nom} (copie)`
  idEdite.value = null // une copie : enregistrée sous son nouveau nom
  message.value = 'Copie prête : changez le nom si vous voulez, puis enregistrez.'
}

function ajouterModule(module: string) {
  const suivante = ajouter(brouillon, module)
  if (!suivante) {
    message.value = 'Pas assez de place pour ce module : retirez-en un ou déplacez-en un autre.'
    return
  }
  message.value = ''
  remplacer(suivante)
  selection.value = suivante.placements[suivante.placements.length - 1]!.id
}

function retirerModule() {
  if (!selection.value) return
  remplacer(retirer(brouillon, selection.value))
  selection.value = null
}

function bouger(dx: number, dy: number) {
  const p = placement.value
  if (!p) return
  const suivante = deplacer(brouillon, p.id, p.x + dx, p.y + dy)
  if (!suivante) {
    message.value = 'Déplacement impossible : bord de la grille ou autre module.'
    return
  }
  message.value = ''
  remplacer(suivante)
}

function changerTaille(e: Event) {
  const p = placement.value
  if (!p) return
  const suivante = changerVariante(brouillon, p.id, (e.target as HTMLSelectElement).value)
  if (!suivante) {
    message.value = 'Cette taille ne tient pas à cet endroit.'
    return
  }
  message.value = ''
  remplacer(suivante)
}

// Glisser-déposer : le module suit le pointeur, et se pose sur la case la plus proche au relâchement.
const glisse = ref<{ id: string; dx: number; dy: number } | null>(null)

function debutGlisse(e: PointerEvent, m: { id: string; x: number; y: number }) {
  const grille = grilleEl.value
  if (!grille) return
  const zone = grille.getBoundingClientRect()
  const caseL = zone.width / GRILLE.colonnes
  const caseH = zone.height / GRILLE.lignes
  const departX = e.clientX
  const departY = e.clientY
  selection.value = m.id
  glisse.value = { id: m.id, dx: 0, dy: 0 }

  const bouge = (ev: PointerEvent) => {
    glisse.value = { id: m.id, dx: ev.clientX - departX, dy: ev.clientY - departY }
  }
  const fin = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', bouge)
    window.removeEventListener('pointerup', fin)
    glisse.value = null
    const cx = Math.round((ev.clientX - departX) / caseL)
    const cy = Math.round((ev.clientY - departY) / caseH)
    if (!cx && !cy) return
    const suivante = deplacer(brouillon, m.id, m.x + cx, m.y + cy)
    if (suivante) {
      message.value = ''
      remplacer(suivante)
    } else {
      message.value = 'Emplacement impossible : bord de la grille ou autre module.'
    }
  }
  window.addEventListener('pointermove', bouge)
  window.addEventListener('pointerup', fin)
}

async function enregistrer(): Promise<string | null> {
  const id = idEdite.value ?? identifiantDepuisNom(brouillon.nom)
  try {
    await configurationsService.enregistrer(id, { nom: brouillon.nom.trim(), placements: brouillon.placements }, jeton.value)
    garderJeton()
    idEdite.value = id
    message.value = 'Enregistrée.'
    await charger()
    return id
  } catch (e) {
    message.value = messageErreur(e)
    return null
  }
}

async function activer(id: string | null) {
  if (id !== null) {
    const enregistree = await enregistrer()
    if (!enregistree) return
    id = enregistree
  }
  try {
    await configurationsService.activer(id, jeton.value)
    message.value = id === null ? 'Retour à la disposition standard.' : 'Activée : l’écran la prend dans la minute.'
    await charger()
  } catch (e) {
    message.value = messageErreur(e)
  }
}

async function supprimer() {
  if (!idEdite.value) return
  try {
    await configurationsService.supprimer(idEdite.value, jeton.value)
    message.value = 'Supprimée.'
    nouvelle()
    await charger()
  } catch (e) {
    message.value = messageErreur(e)
  }
}

onMounted(charger)
</script>

<style scoped>
/* Page d'administration : par-dessus l'écran d'affichage (qui masque le curseur et ne défile pas). */
.editeur {
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow: auto;
  cursor: auto;
  background: var(--c-bg);
  color: var(--c-text);
  padding: 24px 20px 48px;
  font-size: 15px;
}
.editeur * {
  cursor: auto;
}
.entete {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto 16px;
}
h1 { font-size: 24px; margin: 0; }
h2 { font-size: 15px; margin: 0 0 10px; }
h3 { font-size: 15px; margin: 0 0 8px; }
.retour { color: var(--c-accent-text); }
.bloc {
  background: var(--c-surface);
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
}
.editeur > .bloc { max-width: 1400px; margin: 0 auto 16px; }
.colonnes {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 260px;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}
@media (max-width: 1000px) {
  .colonnes { grid-template-columns: 1fr; }
}
input, select {
  font: inherit;
  color: inherit;
  background: var(--c-chip);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px;
  width: 100%;
  box-sizing: border-box;
}
.nom { display: block; margin-bottom: 12px; }
.nom input { margin-top: 4px; }
button {
  font: inherit;
  color: inherit;
  background: var(--c-chip);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 12px;
}
button:hover:not(:disabled) { filter: brightness(1.1); }
button:disabled { opacity: 0.45; }
button:focus-visible, input:focus-visible, select:focus-visible, .module:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: 2px;
}
.principal { background: var(--c-accent); color: #fff; }
.danger { color: #c0392b; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
li { display: flex; align-items: center; gap: 8px; }
.ligne { flex: 1; text-align: left; }
.ligne.choisie { background: var(--c-accent); color: #fff; }
.badge { font-size: 12px; color: var(--c-accent-text); font-weight: 700; }
.calme { color: var(--c-muted); font-size: 13px; }
.grille {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--colonnes), minmax(0, 1fr));
  grid-template-rows: repeat(var(--lignes), minmax(0, 1fr));
  gap: 4px;
  aspect-ratio: 16 / 9;
  padding: 6px;
  background: var(--c-bg);
  border-radius: 10px;
  touch-action: none;
}
.case { background: var(--c-chip); border-radius: 4px; opacity: 0.5; }
.module {
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--c-accent);
  color: #fff;
  border-radius: 8px;
  user-select: none;
  cursor: grab;
}
.module span { font-size: 12px; opacity: 0.85; }
.module.selectionne { outline: 3px solid var(--c-text); outline-offset: -3px; }
.module.glisse { opacity: 0.8; cursor: grabbing; }
.erreurs { color: #c0392b; display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.message { color: var(--c-accent-text); font-size: 13px; }
.selection { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.fleches { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
</style>
