<template>
  <div class="editeur">
    <header class="barre">
      <h1>Disposition de l’écran</h1>

      <div class="choix">
        <select :value="idEdite ?? ''" aria-label="Configuration" @change="choisir">
          <option value="">{{ idEdite === null ? 'Nouvelle (pas encore enregistrée)' : 'Nouvelle configuration' }}</option>
          <option v-for="c in liste" :key="c.id" :value="c.id">{{ c.nom }}{{ c.id === actif ? ' — active' : '' }}</option>
        </select>
        <input v-model="brouillon.nom" type="text" maxlength="80" aria-label="Nom de la configuration" />
        <button type="button" :disabled="!idEdite" @click="dupliquer">Dupliquer</button>
        <button type="button" :disabled="!idEdite || idEdite === actif" class="danger" @click="supprimer">Supprimer</button>
      </div>

      <div class="envoi">
        <button type="button" :disabled="!!erreurs.length" @click="apercu">Voir le rendu</button>
        <button type="button" :disabled="!peutEnregistrer" @click="enregistrer">Enregistrer</button>
        <button type="button" class="principal" :disabled="!peutEnregistrer" @click="activer(idEdite)">
          Enregistrer et activer
        </button>
        <button type="button" class="icone-bouton" aria-label="Réglage du jeton" title="Jeton d’administration" @click="reglageJeton = !reglageJeton">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 7a4 4 0 1 1-3.5 5.9L4 20.5V23h2.5v-2H9v-2.5h2L12.6 17A4 4 0 0 1 15 7z" /></svg>
        </button>
      </div>
    </header>

    <div v-if="reglageJeton" class="jeton">
      <label>
        Jeton d’administration (demandé pour enregistrer, activer ou supprimer)
        <input v-model="jeton" type="password" autocomplete="off" aria-label="Jeton d’administration" @change="garderJeton" />
      </label>
    </div>

    <p v-if="erreurs.length" class="erreurs" role="alert">
      <span v-for="e in erreurs" :key="e">{{ e }}</span>
    </p>
    <p v-if="message" class="message" role="status">{{ message }}</p>

    <div class="plan">
      <div class="zone">
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
            <svg viewBox="0 0 24 24" class="pictogramme" aria-hidden="true"><path :d="m.icone" /></svg>
            <strong>{{ m.titre }}</strong>
            <span>{{ m.largeur }} × {{ m.hauteur }}</span>
          </div>
          <div v-if="cible" class="fantome" :class="cible.valide ? 'ok' : 'non'" :style="cible.style" aria-hidden="true" />
        </div>

        <div v-if="placement" class="reglage" role="group" aria-label="Réglages du module">
          <strong>{{ REGISTRE[placement.module]?.titre }}</strong>
          <label>
            Taille
            <select :value="placement.variante ?? premiereVariante" aria-label="Taille du module" @change="changerTaille">
              <option v-for="v in REGISTRE[placement.module]?.variantes" :key="v.id" :value="v.id">
                {{ v.id }} ({{ v.largeur }} × {{ v.hauteur }})
              </option>
            </select>
          </label>
          <label v-for="r in REGISTRE[placement.module]?.reglages" :key="r.cle" class="champ">
            {{ r.libelle }}
            <input
              type="text"
              :value="(placement.reglages?.[r.cle] as string[] | undefined)?.join(', ') ?? ''"
              :placeholder="r.aide"
              :aria-label="r.libelle"
              @change="regler(r.cle, $event)"
            />
          </label>
          <span class="fleches" role="group" aria-label="Déplacer">
            <button type="button" aria-label="Monter" @click="bouger(0, -1)">↑</button>
            <button type="button" aria-label="Aller à gauche" @click="bouger(-1, 0)">←</button>
            <button type="button" aria-label="Descendre" @click="bouger(0, 1)">↓</button>
            <button type="button" aria-label="Aller à droite" @click="bouger(1, 0)">→</button>
          </span>
          <button type="button" class="danger" @click="retirerModule">Retirer</button>
        </div>
        <p v-else class="calme">Cliquez sur un module pour le régler, ou glissez-le pour le déplacer.</p>
      </div>

      <aside class="palette" aria-label="Modules disponibles">
        <button
          v-for="def in modulesDisponibles"
          :key="def.id"
          type="button"
          class="outil"
          :aria-label="`Ajouter : ${def.titre}`"
          :title="`${def.titre} — cliquez pour ajouter, ou glissez sur la grille`"
          @pointerdown="debutGlissePalette($event, def.id)"
          @click="cliquerPalette(def.id)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="def.icone" /></svg>
        </button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CLE_APERCU } from '../modules/apercu'
import { GRILLE } from '../modules/grille'
import { REGISTRE, variante } from '../modules/registre'
import { CONFIGURATION_PAR_DEFAUT, rectangle, valider, type Configuration } from '../modules/configuration'
import {
  ajouter,
  ajouterEnPoussant,
  changerVariante,
  definirReglage,
  deplacerEnPoussant,
  identifiantDepuisNom,
  obstacle,
  retirer,
  type Deplacement,
} from '../modules/edition'
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
const reglageJeton = ref(false)
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
const placement = computed(() => brouillon.placements.find((p) => p.id === selection.value))
const premiereVariante = computed(() => (placement.value ? REGISTRE[placement.value.module]?.variantes[0]?.id : ''))
const modulesDisponibles = computed(() => Object.values(REGISTRE))
const peutEnregistrer = computed(() => !erreurs.value.length && brouillon.nom.trim().length > 0)

// Chaque case est posée explicitement : sinon la grille décale les cases libres autour des modules.
const styleCase = (n: number) => ({
  gridColumn: String(((n - 1) % GRILLE.colonnes) + 1),
  gridRow: String(Math.floor((n - 1) / GRILLE.colonnes) + 1),
})
const styleRect = (x: number, y: number, largeur: number, hauteur: number) => ({
  gridColumn: `${x} / span ${largeur}`,
  gridRow: `${y} / span ${hauteur}`,
})

const remplacer = (config: Configuration) => {
  brouillon.nom = config.nom
  brouillon.placements = config.placements
}

const glisse = ref<{ id: string; dx: number; dy: number } | null>(null)
const cible = ref<{ valide: boolean; style: Record<string, string> } | null>(null)

const modulesAffiches = computed(() =>
  brouillon.placements.flatMap((p) => {
    const r = rectangle(p)
    if (!r) return []
    return [
      {
        id: p.id,
        titre: REGISTRE[p.module]?.titre ?? p.module,
        icone: REGISTRE[p.module]?.icone ?? '',
        x: r.x,
        y: r.y,
        largeur: r.largeur,
        hauteur: r.hauteur,
        style: {
          ...styleRect(r.x, r.y, r.largeur, r.hauteur),
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

function choisir(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  if (id) void ouvrir(id)
  else nouvelle()
}

function dupliquer() {
  brouillon.nom = `${brouillon.nom} (copie)`
  idEdite.value = null // une copie : enregistrée sous son nouveau nom
  message.value = 'Copie prête : changez le nom si vous voulez, puis enregistrez.'
}

const AUCUNE_PLACE = 'Pas de place pour déplacer les modules voisins : rien n’a bougé. Retirez-en un ou réduisez une taille.'
const PLEIN = 'Pas assez de place pour ce module : retirez-en un ou déplacez-en un autre.'

function appliquer(suivante: Configuration | null, refus: string, selectionner = false) {
  if (!suivante) {
    message.value = refus
    return false
  }
  message.value = ''
  remplacer(suivante)
  if (selectionner) selection.value = suivante.placements[suivante.placements.length - 1]!.id
  return true
}

/** Applique un déplacement qui a poussé d'autres modules, et dit où ils sont allés. */
function appliquerPousse(resultat: { config: Configuration; deplaces: Deplacement[] } | null, selectionner = false) {
  if (!resultat) {
    message.value = AUCUNE_PLACE
    return false
  }
  remplacer(resultat.config)
  message.value = resultat.deplaces
    .map((d) => `« ${REGISTRE[d.module]?.titre ?? d.module} » a été déplacé${d.reduitEn ? ` et réduit (${d.reduitEn})` : ''}.`)
    .join(' ')
  if (selectionner) selection.value = resultat.config.placements.find((p) => !brouillonAvant.has(p.id))?.id ?? selection.value
  return true
}

function retirerModule() {
  if (!selection.value) return
  remplacer(retirer(brouillon, selection.value))
  selection.value = null
}

function bouger(dx: number, dy: number) {
  const p = placement.value
  if (p) appliquerPousse(deplacerEnPoussant(brouillon, p.id, p.x + dx, p.y + dy))
}

function regler(cle: string, e: Event) {
  const p = placement.value
  if (!p) return
  const noms = (e.target as HTMLInputElement).value.split(',').map((n) => n.trim()).filter(Boolean)
  remplacer(definirReglage(brouillon, p.id, cle, noms))
}

function changerTaille(e: Event) {
  const p = placement.value
  if (p) appliquer(changerVariante(brouillon, p.id, (e.target as HTMLSelectElement).value), 'Cette taille ne tient pas à cet endroit.')
}

// --- Glisser-déposer ---------------------------------------------------------------------------

/** Taille d'une case et origine de la grille à l'écran (le cadre a une marge de 6 px). */
function mesureGrille() {
  const grille = grilleEl.value
  if (!grille) return null
  const zone = grille.getBoundingClientRect()
  const marge = 6
  return {
    zone,
    gauche: zone.left + marge,
    haut: zone.top + marge,
    caseL: (zone.width - 2 * marge) / GRILLE.colonnes,
    caseH: (zone.height - 2 * marge) / GRILLE.lignes,
  }
}

// Un module déjà posé : il suit le pointeur et se pose sur la case la plus proche au relâchement.
function debutGlisse(e: PointerEvent, m: { id: string; x: number; y: number }) {
  const mesure = mesureGrille()
  if (!mesure) return
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
    const cx = Math.round((ev.clientX - departX) / mesure.caseL)
    const cy = Math.round((ev.clientY - departY) / mesure.caseH)
    if (cx || cy) appliquerPousse(deplacerEnPoussant(brouillon, m.id, m.x + cx, m.y + cy))
  }
  window.addEventListener('pointermove', bouge)
  window.addEventListener('pointerup', fin)
}

// Depuis la palette : un fantôme montre où le module se poserait (vert : possible, rouge : impossible).
let aGlisse = false
let brouillonAvant = new Set<string>() // les identifiants présents avant un ajout, pour retrouver le module ajouté

function debutGlissePalette(e: PointerEvent, module: string) {
  const v = variante(REGISTRE, module)
  if (!v) return
  const departX = e.clientX
  const departY = e.clientY
  aGlisse = false

  const visee = (ev: PointerEvent) => {
    const mesure = mesureGrille()
    if (!mesure) return null
    const colonne = Math.floor((ev.clientX - mesure.gauche) / mesure.caseL) + 1
    const ligne = Math.floor((ev.clientY - mesure.haut) / mesure.caseH) + 1
    if (colonne < 1 || ligne < 1 || colonne > GRILLE.colonnes || ligne > GRILLE.lignes) return null
    // le pointeur tient le centre du module
    const x = colonne - Math.floor(v.largeur / 2)
    const y = ligne - Math.floor(v.hauteur / 2)
    return { x, y }
  }
  const bouge = (ev: PointerEvent) => {
    if (Math.hypot(ev.clientX - departX, ev.clientY - departY) > 6) aGlisse = true
    const p = visee(ev)
    cible.value = p
      ? { valide: ajouterEnPoussant(brouillon, module, p.x, p.y) !== null, style: styleRect(Math.max(1, p.x), Math.max(1, p.y), v.largeur, v.hauteur) }
      : null
  }
  const fin = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', bouge)
    window.removeEventListener('pointerup', fin)
    cible.value = null
    if (!aGlisse) return // un simple clic : géré par cliquerPalette
    const p = visee(ev)
    if (p) {
      brouillonAvant = new Set(brouillon.placements.map((q) => q.id))
      appliquerPousse(ajouterEnPoussant(brouillon, module, p.x, p.y), true)
    }
  }
  window.addEventListener('pointermove', bouge)
  window.addEventListener('pointerup', fin)
}

/** Un clic (ou la touche Entrée) sur l'icône pose le module à la première place libre. */
function cliquerPalette(module: string) {
  if (aGlisse) {
    aGlisse = false
    return
  }
  const raison = obstacle(brouillon, module)
  const def = REGISTRE[module]
  appliquer(ajouter(brouillon, module), raison === 'max' ? `« ${def?.titre} » : ${def?.max} au plus.` : PLEIN, true)
}

// --- Enregistrement ----------------------------------------------------------------------------

function exigerJeton(): boolean {
  if (jeton.value) return true
  reglageJeton.value = true
  message.value = 'Saisissez le jeton d’administration pour enregistrer.'
  return false
}

async function enregistrer(): Promise<string | null> {
  if (!exigerJeton()) return null
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
  } else if (!exigerJeton()) return
  try {
    await configurationsService.activer(id, jeton.value)
    message.value = id === null ? 'Retour à la disposition standard.' : 'Activée : l’écran la prend dans la minute.'
    await charger()
  } catch (e) {
    message.value = messageErreur(e)
  }
}

async function supprimer() {
  if (!idEdite.value || !exigerJeton()) return
  try {
    await configurationsService.supprimer(idEdite.value, jeton.value)
    message.value = 'Supprimée.'
    nouvelle()
    await charger()
  } catch (e) {
    message.value = messageErreur(e)
  }
}

/** Ouvre le vrai rendu de cette disposition (même enregistrée ou non) dans un autre onglet. */
function apercu() {
  try {
    localStorage.setItem(CLE_APERCU, JSON.stringify({ nom: brouillon.nom, placements: brouillon.placements }))
  } catch {
    message.value = 'Impossible de préparer l’aperçu (stockage du navigateur indisponible).'
    return
  }
  window.open('/apercu', '_blank')
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
  padding: 16px 20px 32px;
  font-size: 15px;
}
.editeur * { cursor: auto; }
.barre {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  max-width: 1500px;
  margin: 0 auto 12px;
}
h1 { font-size: 20px; margin: 0; }
.choix, .envoi { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.envoi { margin-left: auto; }
.choix select { width: 230px; }
.choix input { width: 220px; }
input, select {
  font: inherit;
  color: inherit;
  background: var(--c-chip);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px;
  box-sizing: border-box;
}
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
.icone-bouton { padding: 8px; line-height: 0; }
.icone-bouton svg { width: 20px; height: 20px; }
svg { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.jeton { max-width: 1500px; margin: 0 auto 12px; }
.jeton label { display: flex; flex-direction: column; gap: 4px; max-width: 460px; font-size: 13px; color: var(--c-muted); }
.erreurs { max-width: 1500px; margin: 0 auto 8px; color: #c0392b; display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.message { max-width: 1500px; margin: 0 auto 8px; color: var(--c-accent-text); font-size: 13px; }
.plan {
  max-width: 1500px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
  gap: 16px;
  align-items: start;
}
.zone { min-width: 0; }
.grille {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--colonnes), minmax(0, 1fr));
  grid-template-rows: repeat(var(--lignes), minmax(0, 1fr));
  gap: 4px;
  aspect-ratio: 16 / 9;
  padding: 6px;
  background: var(--c-surface);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  touch-action: none;
}
.case { background: var(--c-chip); border-radius: 4px; opacity: 0.55; }
.module {
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: var(--c-accent);
  color: #fff;
  border-radius: 8px;
  user-select: none;
  cursor: grab;
}
.module .pictogramme { width: 28px; height: 28px; opacity: 0.9; }
.module span { font-size: 12px; opacity: 0.85; }
.module.selectionne { outline: 3px solid var(--c-text); outline-offset: -3px; }
.module.glisse { opacity: 0.8; cursor: grabbing; }
.fantome { z-index: 4; border-radius: 8px; border: 3px dashed; pointer-events: none; }
.fantome.ok { border-color: #2e9e5b; background: rgba(46, 158, 91, 0.25); }
.fantome.non { border-color: #c0392b; background: rgba(192, 57, 43, 0.25); }
.reglage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--c-surface);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
.reglage label { display: flex; align-items: center; gap: 8px; }
.reglage .champ input { width: 260px; }
.fleches { display: inline-flex; gap: 6px; }
.calme { color: var(--c-muted); font-size: 13px; margin: 12px 0 0; }
.palette {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: var(--c-surface);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}
.outil {
  width: 52px;
  height: 52px;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: 12px;
  touch-action: none;
  cursor: grab;
}
.outil svg { width: 28px; height: 28px; }
@media (max-width: 800px) {
  .plan { grid-template-columns: 1fr; }
  .palette { flex-direction: row; }
}
</style>
