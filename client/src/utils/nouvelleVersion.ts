/**
 * Détecte qu'une nouvelle version de l'app est en ligne.
 *
 * Le kiosque garde la même page ouverte pendant des jours : les données se
 * rafraîchissent seules, mais le code de la page ne change qu'au rechargement.
 * Chaque build produit un fichier `/assets/index-<empreinte>.js` : si l'index
 * servi par le serveur nomme un autre fichier que celui qui tourne, c'est qu'une
 * version plus récente a été déployée.
 */

const MOTIF_BUNDLE = /\/assets\/index-[\w-]+\.js/;

/** Fichier de code chargé par la page en cours, ou null (mode dev, tests). */
export function bundleCourant(doc: Document = document): string | null {
  for (const script of Array.from(doc.querySelectorAll('script[src]'))) {
    const src = script.getAttribute('src') ?? '';
    const m = src.match(MOTIF_BUNDLE);
    if (m) return m[0];
  }
  return null;
}

/** Vrai si le serveur sert un autre fichier de code que celui de la page. Faux en cas de doute. */
export async function nouvelleVersionDisponible(): Promise<boolean> {
  const courant = bundleCourant();
  if (!courant) return false; // pas de bundle hashé (serveur de dev) : rien à comparer
  try {
    const reponse = await fetch('/', { cache: 'no-store' });
    if (!reponse.ok) return false;
    const publie = (await reponse.text()).match(MOTIF_BUNDLE)?.[0];
    return Boolean(publie) && publie !== courant;
  } catch {
    return false; // réseau coupé : on garde la page actuelle
  }
}

const CLE = 'abview:rechargement-version';
const DELAI_MIN_MS = 5 * 60 * 1000;

/**
 * Recharge la page si une nouvelle version est en ligne. Une même version n'est
 * pas rechargée plus d'une fois toutes les 5 minutes, pour qu'un serveur qui
 * sert deux versions à la suite ne mette jamais le kiosque en boucle.
 * Renvoie vrai si un rechargement a été demandé.
 */
export async function rechargerSiNouvelleVersion(): Promise<boolean> {
  if (!(await nouvelleVersionDisponible())) return false;
  try {
    const dernier = Number(sessionStorage.getItem(CLE) ?? 0);
    if (Date.now() - dernier < DELAI_MIN_MS) return false;
    sessionStorage.setItem(CLE, String(Date.now()));
  } catch {
    // stockage indisponible : on recharge quand même, une fois par cycle au plus
  }
  window.location.reload();
  return true;
}
