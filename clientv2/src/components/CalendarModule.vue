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
      <div v-for="(day, index) in weekDays" :key="day.date.toISOString()" class="day-column" :ref="el => setDayColumnRef(index, el)">
        <div class="day-header">{{ day.name }} {{ day.date.getDate() }}</div>
        <div class="events" :data-day="day.date.toDateString()" :data-index="index">
          <div v-for="event in getEventsForDay(day.date)" :key="event.id || event.summary" 
               :class="['event', event.type, { 'theme-dark': themeStore.isDark, 'theme-light': !themeStore.isDark }]">
            <div class="event-header">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-shift" v-if="event.shift && !(event.type === 'jaune' || event.type === 'noire')">{{ event.shift }}</div>
              <div class="color-badge" v-if="event.type === 'jaune' || event.type === 'noire'" :class="event.type">
                {{ event.type === "jaune" ? "Jaune" : "Noire" }}
              </div>
            </div>
            <div class="event-time" v-if="event.startTime && event.type !== 'birthday'">{{ event.startTime }}<span v-if="event.endTime"> - {{ event.endTime }}</span></div>
            <div class="event-date-range" v-if="event.dateRange && event.type !== 'birthday'">{{ event.dateRange }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useCalendarStore } from '../stores/calendarStore';
import { useThemeStore } from '../stores/themeStore';
import ErrorDisplay from './ErrorDisplay.vue';
import { useAutoScroll } from '../composables/useAutoScroll';
import { getAllSpecialEvents, isHoliday } from '../utils/holidays';

const calendarStore = useCalendarStore();
const themeStore = useThemeStore();
const dayColumns = ref([]);
const currentDate = ref(new Date());
let dateUpdateTimer: number | null = null;

const setDayColumnRef = (index: number, el: any) => {
  dayColumns.value[index] = el;
};

const { initAutoScroll, equalizeEventHeights } = useAutoScroll(dayColumns);

// Function to trigger birthday animation for testing
const triggerBirthdayAnimation = () => {
  // Cette fonction est maintenant supprimée - on utilise seulement l'effet global
  console.log('🎂 Effets sur cartes supprimés - seul l\'effet global est actif');
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
    console.log('Date updated to:', currentDate.value.toDateString());
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
  }, 1000);
});

onUnmounted(() => {
  if (dateUpdateTimer) {
    clearTimeout(dateUpdateTimer);
  }
});

// Re-initialize auto-scroll when events change
watch(() => calendarStore.allEvents, (newEvents) => {
  // console.log('Events changed, new count:', newEvents.length);
  setTimeout(() => {
    // console.log('Re-initializing auto-scroll after events change');
    equalizeEventHeights();
    initAutoScroll();
  }, 500);
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
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Get all events for this day + daily events (no date)
  const dayEvents = calendarStore.allEvents.filter(event => {
    // Handle calendar events (may span multiple days)
    if (event.start && !event.date) {
      // This is a calendar event
      const eventStart = typeof event.start === 'object' && event.start?.dateTime 
        ? new Date(event.start.dateTime) 
        : new Date(event.start);
      const eventEnd = event.end 
        ? (typeof event.end === 'object' && event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end))
        : eventStart;
      
      // Event spans this day if it starts before day end and ends after day start
      const spansDay = eventStart <= dayEnd && eventEnd >= dayStart;
      
      // For birthdays, only show on the start date, not on all days of the range
      const isBirthday = (event.summary || event.title)?.toLowerCase().includes('anniversaire');
      if (isBirthday) {
        // Only show birthday on its start date
        const eventStartDate = new Date(eventStart);
        eventStartDate.setHours(0, 0, 0, 0);
        return eventStartDate.getTime() === dayStart.getTime();
      }
      
      // Don't show events that have already ended (with 1 hour grace period)
      const hasEnded = eventEnd && eventEnd.getTime() + 60 * 60 * 1000 < Date.now();
      
      return spansDay && !hasEnded;
    }
    
    // Handle planning events (already have date field)
    if (event.date) {
      const eventDate = new Date(event.date + ' ' + (event.time || '00:00'));
      const eventEndTime = event.endTime ? event.endTime : (event.time ? event.time.split('-')[1] : null);
      
      // If event has an end time, check if it has passed
      if (eventEndTime) {
        const [endHour, endMinute] = eventEndTime.split(':').map(Number);
        const eventEndDate = new Date(event.date);
        eventEndDate.setHours(endHour, endMinute, 0, 0);
        
        // Don't show events that have ended (with 1 hour grace period)
        if (eventEndDate.getTime() + 60 * 60 * 1000 < Date.now()) {
          return false;
        }
      }
      
      return eventDate >= dayStart && eventDate <= dayEnd;
    }
    
    // No date = daily event, show on all days
    return true;
  });

  // Transform events to consistent format
  const transformedEvents = dayEvents.map(event => {
    let startTime = '';
    let endTime = '';
    let dateRange = '';
    let title = event.title || event.summary || 'Événement';
    let eventType = event.type || 'unknown';
    let isBirthdayToday = false;
    
    // Clean up birthday titles - extract only the name
    if ((event.title || event.summary || '').toLowerCase().includes('anniversaire')) {
      const fullTitle = event.title || event.summary || '';
      // Extract name after "anniversaire de" or similar patterns
      const nameMatch = fullTitle.match(/(?:anniversaire de|birthday of)\s+(.+)/i) || 
                       fullTitle.match(/anniversaire\s+(.+)/i) ||
                       fullTitle.match(/(.+)'s birthday/i);
      if (nameMatch) {
        title = nameMatch[1].trim();
      }
    }
    
    if (event.start && !event.date) {
      // Calendar event
      const eventStart = typeof event.start === 'object' && event.start?.dateTime 
        ? new Date(event.start.dateTime) 
        : new Date(event.start);
      const eventEnd = event.end 
        ? (typeof event.end === 'object' && event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end))
        : eventStart;
      
      startTime = eventStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      
      // Determine event type based on content FIRST
      if ((event.summary || event.title)?.toLowerCase().includes('anniversaire')) {
        eventType = 'birthday';
      } else {
        eventType = 'default'; // Use 'default' like in client1
      }
      
      // Handle multi-day logic based on event type
      if (event.end) {
        endTime = eventEnd.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        // Check if this is a multi-day event
        const startDay = eventStart.toDateString();
        const endDay = eventEnd.toDateString();
        if (startDay !== endDay) {
          // For birthdays, don't show date range - only show start date/time
          if (eventType === 'birthday') {
            // Keep start time, don't set dateRange
            dateRange = '';
          } else {
            // Multi-day event - show date range instead of time
            const startDateStr = eventStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const endDateStr = eventEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            dateRange = `${startDateStr} - ${endDateStr}`;
            startTime = ''; // Don't show time for multi-day events
            endTime = '';
          }
        }
      }
    } else if (event.time) {
      // Horaire event - use startTime and endTime from the event data
      startTime = event.startTime || event.time;
      endTime = event.endTime;
      
      // Check if event spans midnight (end time is before start time)
      if (startTime && endTime) {
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        if (endHour < startHour) {
          // Event spans midnight - no need to show date range for night workers
          // Removed date range display as requested
        }
      }
      
      // Determine event type based on person and content
      if (event.title === 'Lyam & Noah') {
        eventType = 'garde-alternee';
      } else if (event.title?.includes('Poubelle')) {
        eventType = event.type; // Already set to 'jaune' or 'noire'
      } else if (event.title?.includes('Rugby')) {
        eventType = 'rugby';
      } else if (['Rudy', 'Caroline', 'Luis'].includes(event.title)) {
        eventType = 'work';
      } else {
        // Generic event type detection based on title keywords
        const title = (event.title || event.summary || '').toLowerCase();
        if (title.includes('anniversaire') || title.includes('birthday') || title.includes('fête') || title.includes('party')) {
          eventType = 'birthday';
          // Check if this birthday is today
          const today = new Date();
          const eventDate = event.date ? new Date(event.date + ' ' + (event.time || '00:00')) : today;
          const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
          const eventDateStr = eventDate.getFullYear() + '-' + String(eventDate.getMonth() + 1).padStart(2, '0') + '-' + String(eventDate.getDate()).padStart(2, '0');
          isBirthdayToday = eventDateStr === todayStr;
        } else if (title.includes('sport') || title.includes('rugby') || title.includes('foot') || title.includes('tennis') || title.includes('match')) {
          eventType = 'sport';
        } else if (title.includes('médecin') || title.includes('dentiste') || title.includes('docteur') || title.includes('rdv médical')) {
          eventType = 'medical';
        } else if (title.includes('famille') || title.includes('enfants') || title.includes('naissance')) {
          eventType = 'family';
        } else if (title.includes('réunion') || title.includes('meeting') || title.includes('travail')) {
          eventType = 'work';
        } else {
          eventType = 'planning';
        }
      }
    }
    
    return {
      ...event,
      title,
      startTime,
      endTime,
      dateRange,
      type: eventType,
      isBirthdayToday
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
      const holidayDate = new Date(holiday.date);
      holidayDate.setHours(0, 0, 0, 0);
      return holidayDate.getTime() === dayStart.getTime();
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

  return [...sorted, ...daySpecialEvents];
};

// Function to check for birthdays today and trigger global effect
const checkForTodaysBirthdays = () => {
  console.log('🎂 Checking for today\'s birthdays...');
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  console.log('🎂 Today\'s date string:', todayStr);
  
  // Get all events for today
  const todaysEvents = getEventsForDay(today);
  console.log('🎂 Total events for today:', todaysEvents.length);
  
  // Find birthday events that are today
  const todaysBirthdays = todaysEvents.filter(event => 
    event.type === 'birthday' && event.isBirthdayToday
  );
  console.log('🎂 Birthday events found:', todaysBirthdays.length);
  
  if (todaysBirthdays.length > 0) {
    // Il y a des anniversaires aujourd'hui
    todaysBirthdays.forEach(birthday => {
      console.log('🎉 REAL BIRTHDAY détecté aujourd\'hui:', birthday.title);
      
      // Dispatch custom event to trigger global birthday effect
      const birthdayEvent = new CustomEvent('birthday-detected', {
        detail: { person: birthday.title, testMode: false }
      });
      document.dispatchEvent(birthdayEvent);
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
  // Small delay to ensure events are loaded
  setTimeout(checkForTodaysBirthdays, 1000);
});

// Watch for events changes to re-check birthdays
watch(() => calendarStore.allEvents, () => {
  setTimeout(checkForTodaysBirthdays, 500);
}, { deep: true });
</script>

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  color: var(--color-primary);
  box-sizing: border-box;
  padding: 0.25rem;
  height: 100%;
  overflow: hidden;
}

.calendar-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.25rem;
  overflow: hidden;
}

.day-column {
  display: flex;
  flex-direction: column;
  background: var(--color-gray);
  border-radius: 6px;
  padding: 0.25rem;
  padding-bottom: 0.5rem;
}

.day-header {
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  padding: 0.25rem;
  background: var(--color-gray);
  border-radius: 4px;
}

.events {
  height: 100%;
  overflow: hidden;
}

.event {
  background: var(--color-surface);
  margin-bottom: 0.25rem;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.8rem;
  word-wrap: break-word;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.event.jaune {
  border-left: 4px solid #ffeb3b; /* Jaune */
}

.event.noire {
  border-left: 4px solid #424242; /* Noire */
}

.event.work {
  border-left: 4px solid #2196f3; /* Blue for work schedules */
}

.event.garde-alternee {
  border-left: 4px solid #9c27b0; /* Purple for garde alternée */
}

.event.planning {
  border-left: 4px solid #ff9800; /* Orange for general planning */
}

.event.rugby {
  border-left: 4px solid #f28c38; /* Rugby orange */
}

.event.birthday {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.event.birthday.theme-light {
  background-image: url('@/assets/card/light/anniversaire.png');
}

.event.birthday.theme-dark {
  background-image: url('@/assets/card/dark/anniversaire.png');
}

.event.birthday .event-title {
  text-align: center;
  font-weight: bold;
  width: 100%;
}

.event.birthday.theme-light .event-title {
  color: #000 !important;
}

.event.birthday.theme-dark .event-title {
  color: #fff !important;
}

/* Birthday today special animation - SUPPRIMÉ */
/* Les effets sur les cartes individuelles ont été supprimés */
/* Seul l'effet global BirthdayEffect.vue est maintenant utilisé */

.event.sport {
  border-left: 4px solid #4caf50; /* Green for sport */
}

.event.medical {
  border-left: 4px solid #f44336; /* Red for medical */
}

.event.family {
  border-left: 4px solid #9c27b0; /* Purple for family */
}

.event.work {
  border-left: 4px solid #2196f3; /* Blue for work */
}

.event.default {
  border-left: 4px solid #4caf50; /* Green for default calendar events */
}

/* Holiday backgrounds based on theme and event type */
.event.christmas.theme-dark {
  background-image: url('@/assets/card/dark/noel.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.christmas.theme-light {
  background-image: url('@/assets/card/light/noel.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.easter.theme-dark {
  background-image: url('@/assets/card/dark/paques.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.easter.theme-light {
  background-image: url('@/assets/card/light/paques.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.ramadan.theme-dark {
  background-image: url('@/assets/card/dark/ramadan.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.ramadan.theme-light {
  background-image: url('@/assets/card/light/ramadan.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.lent.theme-dark {
  background-image: url('@/assets/card/dark/caresme.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.lent.theme-light {
  background-image: url('@/assets/card/light/caresme.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.newyear.theme-dark,
.event.labor.theme-dark,
.event.victory.theme-dark,
.event.bastille.theme-dark,
.event.armistice.theme-dark,
.event.catholic.theme-dark {
  background-image: url('@/assets/card/dark/national.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event.newyear.theme-light,
.event.labor.theme-light,
.event.victory.theme-light,
.event.bastille.theme-light,
.event.armistice.theme-light,
.event.catholic.theme-light {
  background-image: url('@/assets/card/light/national.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-left: 4px solid #00bcd4; /* Cyan for all holidays */
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.event-title {
  font-weight: bold;
  font-size: 0.9rem;
  flex: 1;
  word-break: break-word;
}

.event-shift {
  font-size: 0.8rem;
  color: var(--color-accent);
  background-color: var(--color-surface);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
  white-space: nowrap;
}

.event-date-range {
  font-size: 0.8rem;
  color: var(--color-accent);
  font-weight: bold;
  margin-top: 0.15rem;
}

.color-badge {
  font-size: 0.8rem;
  color: var(--color-accent);
  background-color: var(--color-surface);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
  display: inline-block;
}

.color-badge.jaune {
  background-color: #ffeb3b;
  color: #000;
}

.color-badge.noire {
  background-color: #424242;
  color: #fff;
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
  color: var(--color-secondary);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>