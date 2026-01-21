/**
 * Utilitaires pour calculer les dates des fêtes religieuses et jours fériés
 */

export interface HolidayEvent {
  name: string
  date: Date
  type: 'religious' | 'national' | 'seasonal'
  category: string
}

/**
 * Calcule la date de Pâques pour une année donnée
 * Utilise l'algorithme de Gauss pour le calcul précis
 */
export function calculateEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

/**
 * Calcule les dates du Ramadan pour une année donnée
 * Retourne un objet avec début et fin
 */
export function calculateRamadanDates(year: number): { start: Date; end: Date } {
  // Le Ramadan commence environ 11 jours plus tôt chaque année
  // Ramadan 2024: 11 mars - 9 avril 2024
  // Ramadan 2025: 28 février - 29 mars 2025
  // Ramadan 2026: 17 février - 18 mars 2026

  const baseYear = 2024;
  const baseRamadanStart = new Date(2024, 2, 11); // 11 mars 2024

  const yearsDiff = year - baseYear;
  const daysToSubtract = yearsDiff * 11;

  const ramadanStart = new Date(baseRamadanStart);
  ramadanStart.setFullYear(year);
  ramadanStart.setDate(baseRamadanStart.getDate() - daysToSubtract);

  // Le Ramadan dure 30 jours
  const ramadanEnd = new Date(ramadanStart);
  ramadanEnd.setDate(ramadanStart.getDate() + 29); // 29 jours pour arriver au 30ème jour

  return {
    start: ramadanStart,
    end: ramadanEnd
  };
}

/**
 * Calcule le début du Ramadan pour une année donnée (rétrocompatibilité)
 */
export function calculateRamadanStart(year: number): Date {
  return calculateRamadanDates(year).start;
}

/**
 * Calcule le Carême (40 jours avant Pâques)
 */
export function calculateLentStart(year: number): Date {
  const easter = calculateEasterDate(year)
  const lentStart = new Date(easter)
  lentStart.setDate(easter.getDate() - 46) // 46 jours avant Pâques (40 jours + 6 dimanches)
  return lentStart
}

/**
 * Génère tous les jours fériés français pour une année
 */
export function getFrenchHolidays(year: number): HolidayEvent[] {
  const holidays: HolidayEvent[] = []

  // Jours fériés fixes
  holidays.push(
    { name: 'Jour de l\'An', date: new Date(year, 0, 1), type: 'national', category: 'newyear' },
    { name: 'Fête du Travail', date: new Date(year, 4, 1), type: 'national', category: 'labor' },
    { name: 'Victoire 1945', date: new Date(year, 4, 8), type: 'national', category: 'victory' },
    { name: 'Fête Nationale', date: new Date(year, 6, 14), type: 'national', category: 'bastille' },
    { name: 'Assomption', date: new Date(year, 7, 15), type: 'religious', category: 'catholic' },
    { name: 'Toussaint', date: new Date(year, 10, 1), type: 'religious', category: 'catholic' },
    { name: 'Armistice 1918', date: new Date(year, 10, 11), type: 'national', category: 'armistice' },
    { name: 'Noël', date: new Date(year, 11, 25), type: 'religious', category: 'christmas' }
  )

  // Pâques et jours associés
  const easter = calculateEasterDate(year)
  holidays.push(
    { name: 'Pâques', date: easter, type: 'religious', category: 'easter' }
  )

  // Lundi de Pâques (le lendemain)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)
  holidays.push(
    { name: 'Lundi de Pâques', date: easterMonday, type: 'religious', category: 'easter' }
  )

  // Ascension (39 jours après Pâques)
  const ascension = new Date(easter)
  ascension.setDate(easter.getDate() + 39)
  holidays.push(
    { name: 'Ascension', date: ascension, type: 'religious', category: 'catholic' }
  )

  // Pentecôte (50 jours après Pâques)
  const pentecost = new Date(easter)
  pentecost.setDate(easter.getDate() + 49) // 50ème jour = lundi de Pentecôte
  holidays.push(
    { name: 'Pentecôte', date: pentecost, type: 'religious', category: 'catholic' }
  )

  // Ramadan (approximation)
  const ramadanDates = calculateRamadanDates(year)
  holidays.push({
    name: 'Début du Ramadan',
    date: ramadanDates.start,
    type: 'religious',
    category: 'ramadan'
  })
  holidays.push({
    name: 'Fin du Ramadan',
    date: ramadanDates.end,
    type: 'religious',
    category: 'ramadan'
  })

  // Carême (40 jours avant Pâques)
  const lentStart = calculateLentStart(year)
  holidays.push({
    name: 'Début du Carême',
    date: lentStart,
    type: 'religious',
    category: 'lent'
  })

  return holidays
}

/**
 * Vérifie si une date est un jour férié
 */
export function isHoliday(date: Date, year: number = date.getFullYear()): HolidayEvent | null {
  const holidays = getFrenchHolidays(year)
  return holidays.find(holiday =>
    holiday.date.getDate() === date.getDate() &&
    holiday.date.getMonth() === date.getMonth()
  ) || null
}

/**
 * Obtient tous les événements spéciaux pour une année
 */
export function getAllSpecialEvents(year: number): HolidayEvent[] {
  return getFrenchHolidays(year)
}