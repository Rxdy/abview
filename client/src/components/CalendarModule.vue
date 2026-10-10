<template>
  <div class="calendar">
    <!-- Loading State -->
    <div v-if="calendarStore.loading" class="loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Chargement...</div>
    </div>

    <!-- Error State -->
    <ErrorDisplay
      v-else-if="calendarStore.error"
      type="network"
    />

    <!-- Calendar Content -->
    <div class="calendar-grid">
      <div v-for="(day, index) in weekDays" :key="day.date.toISOString()"
           :class="['day-column', { today: index === 0 }]" :ref="el => setDayColumnRef(index, el)">
        <div class="day-header">
          <span class="day-name">{{ index === 0 ? 'Aujourd’hui' : day.name }}</span>
          <span class="day-num num">{{ day.date.getDate() }}</span>
        </div>
        <div class="events" :data-day="day.date.toDateString()" :data-index="index">
          <div v-for="event in getEventsForDay(day.date)" :key="event.id || event.summary"
               :class="['event', `cat-${event.categorie}`, event.type, { 'avec-image': event.image }]"
               :style="event.image ? { '--image': `url(${event.image})` } : undefined">
            <div v-if="event.etiquette" class="event-tag">{{ event.etiquette }}</div>
            <div class="event-header">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-shift" v-if="event.shift && !(event.type === 'jaune' || event.type === 'noire')">{{ event.shift }}</div>
            </div>
            <div class="event-time num" v-if="event.startTime && event.type !== 'birthday'">{{ event.startTime }}<span v-if="event.endTime"> – {{ event.endTime }}</span></div>
            <div class="event-date-range" v-if="event.dateRange && event.type !== 'birthday'">{{ event.dateRange }}</div>
            <div v-if="event.location && event.type !== 'sport'" class="event-location">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {{ event.location.split(',')[0] }}
            </div>
            <div class="color-badge" v-if="event.type === 'jaune' || event.type === 'noire'" :class="event.type">
              {{ event.type === "jaune" ? "Jaune" : "Noire" }}
            </div>
          </div>
          <div v-if="getEventsForDay(day.date).length === 0" class="day-empty">Journée libre</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useCalendarStore } from '../stores/calendarStore';
import { useThemeStore } from '../stores/themeStore';
import { useDashboardStore } from '../stores/dashboardStore';
import ErrorDisplay from './ErrorDisplay.vue';
import { useAutoScroll } from '../composables/useAutoScroll';
import { getAllSpecialEvents } from '../utils/holidays';
import { categorieEvenement, imageEvenement, titreAffiche, ETIQUETTES } from '../utils/categories';

const calendarStore = useCalendarStore();
const themeStore = useThemeStore();
const dashboardStore = useDashboardStore();
const dayColumns = ref<(HTMLElement | null)[]>([]);
const currentDate = ref(new Date());
let dateUpdateTimer: number | null = null;

const setDayColumnRef = (index: number, el: any) => {
  dayColumns.value[index] = el;
};

const { initAutoScroll, equalizeEventHeights } = useAutoScroll(dayColumns);

// Function to trigger birthday animation for testing
const triggerBirthdayAnimation = () => {
  // Cette fonction est maintenant supprimée - on utilise seulement l'effet global
  // console.log('🎂 Effets sur cartes supprimés - seul l\'effet global est actif');
};

// Expose function to window for console testing
if (typeof window !== 'undefined') {
  (window as any).triggerBirthdayAnimation = triggerBirthdayAnimation;
}

// Function to schedule next date update at midnight
const scheduleDateUpdate = () => {
  if (dateUpdateTimer) {
    clearTimeout(dateUpdateTimer);
  }
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight
  const timeUntilMidnight = midnight.getTime() - now.getTime();
  
  dateUpdateTimer = window.setTimeout(() => {
    currentDate.value = new Date();
    // console.log('Date updated to:', currentDate.value.toDateString());
    scheduleDateUpdate(); // Schedule next update
  }, timeUntilMidnight);
};

onMounted(() => {
  calendarStore.fetchAll();
  calendarStore.startPolling();
  scheduleDateUpdate(); // Start the date update timer
  
  // Initialize auto-scroll after data is loaded
  setTimeout(() => {
    equalizeEventHeights();
    initAutoScroll();
  }, 500);
});

onUnmounted(() => {
  if (dateUpdateTimer) {
    clearTimeout(dateUpdateTimer);
  }
});

// Re-initialize auto-scroll when events change
watch(() => calendarStore.allEvents, (newEvents) => {
  // // console.log('Events changed, new count:', newEvents.length);
  setTimeout(() => {
    // // console.log('Re-initializing auto-scroll after events change');
    equalizeEventHeights();
    initAutoScroll();
  }, 300);
}, { deep: true });

const weekDays = computed(() => {
  const days = [];
  const today = currentDate.value;
  for (let i = 0; i < 8; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date,
      name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
    });
  }
  return days;
});

const getEventsForDay = (date: Date) => {
  // Create day boundaries in local time, then convert to UTC for comparison
  const localDayStart = new Date(date);
  localDayStart.setHours(0, 0, 0, 0);
  const localDayEnd = new Date(date);
  localDayEnd.setHours(23, 59, 59, 999);
  
  // Convert to ISO string and extract just the date part
  const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');

  // Get all events for this day + daily events (no date)
  const dayEvents = calendarStore.allEvents.filter(event => {
    const getDateFrom = (value: any) => {
      if (!value) return null;
      if (typeof value === 'object' && value.dateTime) return new Date(value.dateTime);
      if (typeof value === 'string' && !value.includes('T')) {
        const partsStr = value.split('-');
        const year = partsStr[0] ? Number(partsStr[0]) : NaN;
        const month = partsStr[1] ? Number(partsStr[1]) : NaN;
        const day = partsStr[2] ? Number(partsStr[2]) : NaN;
        if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
      return new Date(value);
    };

    // Handle events with datetime range (calendar events OR planning events with time like "21:00-05:00")
    if (event.start && typeof event.start === 'string' && event.start.includes('T')) {
      const eventStart = getDateFrom(event.start);
      let eventEnd = event.end ? getDateFrom(event.end) : null;

      if (!eventStart || Number.isNaN(eventStart.getTime())) {
        return false;
      }

      if (!eventEnd || Number.isNaN(eventEnd.getTime())) {
        eventEnd = new Date(eventStart);
      }

      // Planning events with time should only show on their start date
      // (shifts like 21:00-05:00 only show on day of start, not next day)
      if (event.date && event.isPlanning) {
        return event.date === dateStr;
      }

      // Postes de nuit venus de l'agenda (ex. 22:45-07:00) : moins de 24 h et fin le
      // lendemain. Comme les plannings, ils ne s'affichent que le jour de leur début.
      const finLeLendemain = eventEnd.toDateString() !== eventStart.toDateString();
      if (finLeLendemain && eventEnd.getTime() - eventStart.getTime() < 24 * 60 * 60 * 1000) {
        return eventStart >= localDayStart && eventStart < localDayEnd;
      }

      // Calendar events span from eventStart to eventEnd - check if it overlaps with this day
      return eventStart < localDayEnd && eventEnd > localDayStart;
    }

    // Handle calendar events (may span multiple days, without time)
    if (event.start && !event.date) {
      const eventStart = getDateFrom(event.start);
      let eventEnd = event.end ? getDateFrom(event.end) : null;

      if (!eventStart || Number.isNaN(eventStart.getTime())) {
        return false;
      }

      if (!eventEnd || Number.isNaN(eventEnd.getTime())) {
        eventEnd = new Date(eventStart);
      }

      if (typeof event.start === 'string' && !event.start.includes('T') && (!event.end || eventEnd.getTime() === eventStart.getTime())) {
        eventEnd = new Date(eventStart);
        eventEnd.setDate(eventEnd.getDate() + 1);
      }

      return eventStart < localDayEnd && eventEnd > localDayStart;
    }

    // Handle planning events (without datetime, only have date field)
    if (event.date && (!event.start || !event.start.includes('T'))) {
      // Check if the date matches
      if (event.date !== dateStr) {
        return false;
      }
      
      // For same-day events with end time, check if event has already ended
      // Only filter out if it's TODAY (not future days)
      if (event.endTime && event.date === dateStr) {
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        if (event.date === todayStr) {
          // Check if current time is past the event's end time
          const [endHour, endMinute] = event.endTime.split(':').map(Number);
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const endMinutes = (endHour * 60) + endMinute;
          
          // Hide event if current time is past the end time
          if (currentMinutes > endMinutes) {
            return false;
          }
        }
      }
      
      return true;
    }
    
    // No date = daily event, show on all days
    return true;
  });

  // Transform events to consistent format
  const transformedEvents = dayEvents.map(event => {
    let title = event.title || event.summary || 'Événement';
    let eventType = event.type || 'unknown';

    const getDateFrom = (value: any) => {
      if (!value) return null;
      if (typeof value === 'object' && value.dateTime) return new Date(value.dateTime);
      return new Date(value);
    };

    const eventStart = event.start ? getDateFrom(event.start) : null;
    const eventEnd = event.end ? getDateFrom(event.end) : null;
    const formatLocalDate = (d: Date) => {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    const isMultiDayTimedEvent = eventStart && eventEnd && eventStart.getTime() < eventEnd.getTime() &&
      !!event.startTime && !!event.endTime &&
      formatLocalDate(eventStart) !== formatLocalDate(eventEnd);

    const eventStartDate = eventStart ? formatLocalDate(eventStart) : null;
    const startTime = event.startTime || '';
    const endTime = event.endTime || '';
    const displayStartTime = (isMultiDayTimedEvent && eventStartDate && eventStartDate !== dateStr) ? '' : startTime;
    const displayEndTime = (isMultiDayTimedEvent && eventStartDate && eventStartDate !== dateStr) ? '' : endTime;
    
    // Clean up birthday titles - extract only the name
    if ((event.title || event.summary || '').toLowerCase().includes('anniversaire') || 
        (event.title || event.summary || '').toLowerCase().includes('birthday')) {
      const fullTitle = event.title || event.summary || '';
      // Extract name after "anniversaire de" or similar patterns
      const nameMatch = fullTitle.match(/(?:anniversaire de|birthday of)\s+(.+)/i) || 
                       fullTitle.match(/anniversaire\s+(.+)/i) ||
                       fullTitle.match(/(.+)'s birthday/i);
      if (nameMatch) {
        title = nameMatch[1].trim();
      }
    }
    
    // Determine event type based on content
    if ((event.summary || event.title)?.toLowerCase().includes('anniversaire') || 
        (event.summary || event.title)?.toLowerCase().includes('birthday')) {
      eventType = 'birthday';
    } else {
      eventType = event.type || 'default';
    }
    
    // Return transformed event with calculated properties
    return {
      ...event,
      title,
      startTime: displayStartTime,
      endTime: displayEndTime,
      type: eventType,
      location: event.location
    };
  });

  // Sort: daily events first, then by time
  const sorted = transformedEvents.sort((a, b) => {
    const aHasTime = !!a.startTime;
    const bHasTime = !!b.startTime;
    
    // Daily events (no time) come first
    if (!aHasTime && bHasTime) return -1;
    if (aHasTime && !bHasTime) return 1;
    
    // Then sort by time
    if (aHasTime && bHasTime) {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      const aMinutes = aTime[0] * 60 + aTime[1];
      const bMinutes = bTime[0] * 60 + bTime[1];
      return aMinutes - bMinutes;
    }
    
    return 0;
  });

  // Add special holiday events for THIS SPECIFIC DAY
  const daySpecialEvents = getAllSpecialEvents(new Date().getFullYear())
    .filter(holiday => {
      // Only include holidays that fall on this specific day
      const holidayDate = new Date(holiday.date).getFullYear() + '-' + String(new Date(holiday.date).getMonth() + 1).padStart(2, '0') + '-' + String(new Date(holiday.date).getDate()).padStart(2, '0');
      return holidayDate === dateStr;
    })
    .map(holiday => ({
      id: `holiday-${holiday.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: holiday.name,
      summary: holiday.name,
      type: holiday.category,
      startTime: '',
      endTime: '',
      dateRange: '',
      start: holiday.date,
      end: holiday.date,
      date: holiday.date.toISOString().split('T')[0]
    }));

  // Catégorie (étiquette, couleurs) et image de fond de chaque carte
  return [...sorted, ...daySpecialEvents].map(event => {
    const categorie = categorieEvenement(
      { type: event.type, titre: event.summary || event.title, categorie: event.categorie, couleur: event.couleur },
      dashboardStore.categories,
    );
    const title = titreAffiche(event.title, categorie, dashboardStore.categories);
    return {
      ...event,
      title,
      categorie,
      // Pas d'étiquette qui répète le titre (« Poubelle » / POUBELLE)
      etiquette: ETIQUETTES[categorie].toLowerCase() === String(title || '').trim().toLowerCase() ? '' : ETIQUETTES[categorie],
      image: imageEvenement(event.type, themeStore.isDark),
    };
  });
};

// Function to check for birthdays today and trigger global effect
const checkForTodaysBirthdays = () => {
  console.log('🎂 CHECKING FOR TODAY\'S BIRTHDAYS...');
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  console.log('🎂 Today\'s date string:', todayStr);
  
  // Get all events for today
  const todaysEvents = getEventsForDay(today);
  console.log('🎂 Total events for today:', todaysEvents.length);
  
  // Find birthday events that are today
  const todaysBirthdays = todaysEvents.filter(event => 
    event.type === 'birthday'
  );
  console.log('🎂 Birthday events found:', todaysBirthdays.length, todaysBirthdays);
  
  if (todaysBirthdays.length > 0) {
    // Il y a des anniversaires aujourd'hui
    todaysBirthdays.forEach(birthday => {
      console.log('🎉 REAL BIRTHDAY détecté aujourd\'hui:', birthday.title);
      
      // Vérifier si l'effet est déjà actif pour cette personne aujourd'hui
      const currentEffectActive = (window as any).currentBirthdayPerson === birthday.title && 
                                 (window as any).currentBirthdayDate === todayStr;
      
      if (!currentEffectActive) {
        console.log('🎂 Triggering birthday effect for:', birthday.title);
        // Dispatch custom event to trigger global birthday effect
        const birthdayEvent = new CustomEvent('birthday-detected', {
          detail: { person: birthday.title, testMode: false }
        });
        document.dispatchEvent(birthdayEvent);
      } else {
        console.log('🎂 Birthday effect already active for:', birthday.title, 'today');
      }
    });
  } else {
    // Plus d'anniversaires aujourd'hui, arrêter l'effet
    console.log('🎂 No birthdays found for today, stopping effect');
    if ((window as any).stopBirthdayEffect) {
      (window as any).stopBirthdayEffect();
    }
  }
};

// Check for birthdays when component mounts and when events change
onMounted(() => {
  // Wait for events to be loaded
  const waitForEvents = () => {
    if (!calendarStore.loading && calendarStore.allEvents.length > 0) {
      checkForTodaysBirthdays();
    } else {
      setTimeout(waitForEvents, 500);
    }
  };
  waitForEvents();
});

// Watch for events changes to re-check birthdays
watch(() => calendarStore.allEvents, () => {
  // Wait a bit for the update to settle
  setTimeout(() => {
    if (!calendarStore.loading) {
      checkForTodaysBirthdays();
    }
  }, 500);
}, { deep: true });

// Watch for date changes to re-check birthdays (important for day transitions)
watch(() => currentDate.value, () => {
  setTimeout(checkForTodaysBirthdays, 500);
});

// Vérification périodique toutes les heures pour arrêter l'effet si nécessaire
setInterval(() => {
  if (!calendarStore.loading) {
    checkForTodaysBirthdays();
  }
}, 60 * 60 * 1000); // Toutes les heures
</script>

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  color: var(--c-text);
  height: 100%;
  overflow: hidden;
}

/* 8 jours, chacun dans sa carte ; aujourd'hui en bleu léger, sans ombre. */
.calendar-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: var(--space-2);
}

.day-column {
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--px));
  min-height: 0;
  height: 100%;
  padding: calc(6 * var(--px));
  border-radius: var(--radius-card);
  background: var(--c-surface);
  box-shadow: var(--shadow-card);
}

.day-column.today {
  background: var(--c-today);
  box-shadow: none;
}

.day-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(6 * var(--px));
  padding: calc(4 * var(--px)) 0;
  border-radius: var(--radius-item);
  background: var(--c-chip);
  color: var(--c-text);
}

.today .day-header {
  background: var(--c-accent);
  color: var(--c-on-accent);
}

.day-name {
  font-size: calc(13 * var(--px));
  font-weight: 700;
  text-transform: capitalize;
}

.day-num {
  font-size: calc(16 * var(--px));
  font-weight: 800;
}

.events {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(5 * var(--px));
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.events::-webkit-scrollbar {
  display: none;
}

.day-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(13 * var(--px));
  color: var(--c-muted);
}

/* Carte d'événement : pastel de sa catégorie, étiquette en couleur. */
.event {
  --cat-bg: var(--cat-autre-bg);
  --cat-fg: var(--cat-autre-fg);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: calc(1 * var(--px));
  padding: calc(5 * var(--px)) calc(8 * var(--px));
  border-radius: calc(10 * var(--px));
  background: var(--cat-bg);
  word-wrap: break-word;
}

.cat-travail { --cat-bg: var(--cat-travail-bg); --cat-fg: var(--cat-travail-fg); }
.cat-garde { --cat-bg: var(--cat-garde-bg); --cat-fg: var(--cat-garde-fg); }
.cat-sport { --cat-bg: var(--cat-sport-bg); --cat-fg: var(--cat-sport-fg); }
.cat-sante { --cat-bg: var(--cat-sante-bg); --cat-fg: var(--cat-sante-fg); }
.cat-rdv { --cat-bg: var(--cat-rdv-bg); --cat-fg: var(--cat-rdv-fg); }
.cat-poubelle { --cat-bg: var(--cat-poubelle-bg); --cat-fg: var(--cat-poubelle-fg); }
.cat-anniversaire { --cat-bg: var(--cat-anniversaire-bg); --cat-fg: var(--cat-anniversaire-fg); }
.cat-national { --cat-bg: var(--cat-national-bg); --cat-fg: var(--cat-national-fg); }
.cat-religieux { --cat-bg: var(--cat-religieux-bg); --cat-fg: var(--cat-religieux-fg); }

/* Anniversaires et fêtes : image de fond sous un voile, titre centré. */
.event.avec-image {
  background:
    linear-gradient(var(--voile), var(--voile)),
    var(--image) center / cover no-repeat,
    var(--cat-bg);
  text-align: center;
}

.cat-anniversaire .event-title,
.cat-national .event-title,
.cat-religieux .event-title {
  text-align: center;
}

.event-tag {
  font-size: calc(9.5 * var(--px));
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cat-fg);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.event-title {
  flex: 1;
  font-size: calc(12.5 * var(--px));
  font-weight: 700;
  line-height: 1.2;
  word-break: break-word;
}

.event-time,
.event-date-range {
  font-size: calc(11 * var(--px));
  font-weight: 600;
  color: var(--c-muted);
}

.event-shift {
  font-size: var(--fs-xs);
  font-weight: 800;
  padding: calc(1 * var(--px)) calc(9 * var(--px));
  border-radius: var(--radius-pill);
  background: var(--c-surface);
  color: var(--cat-fg);
  white-space: nowrap;
}

.event-location {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: calc(11 * var(--px));
  color: var(--c-muted);
}

.event-location svg {
  width: calc(12 * var(--px));
  height: calc(12 * var(--px));
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Badge de la poubelle à sortir */
.color-badge {
  align-self: flex-start;
  margin-top: calc(2 * var(--px));
  font-size: var(--fs-xs);
  font-weight: 800;
  padding: calc(1 * var(--px)) calc(9 * var(--px));
  border-radius: var(--radius-pill);
}

.color-badge.jaune {
  background: #f2c94c;
  color: #3a2e00;
}

.color-badge.noire {
  background: #2a2a2a;
  color: #ffffff;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--c-muted);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>