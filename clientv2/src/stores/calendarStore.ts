import { defineStore } from 'pinia';
import { calendarService } from '../services/calendarService';
import { useProgressStore } from './progressStore';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    horaires: [] as any[],
    calendarEvents: [] as any[],
    loading: false,
    error: null as string | null,
    lastHash: '' as string,
    lastRefresh: null as Date | null,
  }),
  getters: {
    allEvents: (state) => {
      // Transform raw horaires data into individual events for each day
      const planningEvents = transformHorairesToEvents(state.horaires);
      const calendarEvents = transformCalendarEvents(state.calendarEvents);
      
      // Combine and sort by date/time
      const all = [...planningEvents, ...calendarEvents];
      return all.sort((a, b) => new Date(a.start || a.date).getTime() - new Date(b.start || b.date).getTime());
    },
  },
  actions: {
    async fetchHoraires() {
      try {
        const data = await calendarService.getHoraires();
        this.horaires = data.horaires;
        // Ne pas mettre à jour lastRefresh pour horaires (pas lié aux APIs externes)
      } catch (error) {
        console.error('Failed to fetch horaires:', error);
        this.horaires = [];
      }
    },
    async fetchCalendarEvents() {
      try {
        const data = await calendarService.getCalendarEvents();
        this.calendarEvents = data.events;
        // Mettre à jour lastRefresh seulement avec le datetime du serveur (APIs Google)
        if (data.lastRefresh) {
          this.lastRefresh = new Date(data.lastRefresh);
        }
      } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        this.calendarEvents = [];
      }
    },
    async fetchAll(isRefresh = false) {
      if (!isRefresh) this.loading = true;
      this.error = null;
      try {
        await Promise.all([this.fetchHoraires(), this.fetchCalendarEvents()]);
        const newData = { horaires: this.horaires, calendarEvents: this.calendarEvents };
        const newHash = JSON.stringify(newData);
        if (newHash !== this.lastHash) {
          this.lastHash = newHash;
          console.log('Calendar updated');
          // Reset progress bar
          const progressStore = useProgressStore();
          progressStore.resetProgress();
        } else {
          console.log('Calendar unchanged');
        }
      } catch (error) {
        console.error('Error in fetchAll:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    startPolling() {
      // Poll every minute instead of 5 minutes
      setInterval(() => {
        this.fetchAll(true);
      }, 60 * 1000);
    },
  },
});

// Helper functions to transform raw API data into events
function transformHorairesToEvents(horaires: any[]): any[] {
  const events: any[] = [];
  const today = new Date();
  
  // Generate events for the next 8 days
  for (let i = 0; i < 8; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    const dayOfWeek = date.getDay();
    const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][dayOfWeek];
    const weekNumber = getWeekNumber(date);
    
    // Skip Sundays - no work on Sundays
    // if (dayOfWeek === 0) continue;
    
    // Calculate children location
    let childrenLocation = "";
    horaires.forEach((person) => {
      if (person?.type === "garde_alternee" && person?.name === "Lyam & Noah") {
        const isOddWeek = weekNumber % 2 === 1;
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const override = (person.overrides || []).find((o: any) => {
          const start = new Date(date.getFullYear(), o.month_start - 1, o.day_start);
          const end = new Date(date.getFullYear(), o.month_end - 1, o.day_end);
          return date >= start && date <= end;
        });
        if (override) childrenLocation = override.location;
        else childrenLocation = isOddWeek ? person.weeks?.odd : person.weeks?.even;
      }
    });

    horaires.forEach((person) => {
      if (!person) return;
      const isLinkedToGarde = person.linkedTo === "Lyam & Noah";
      const isRugbyEvent = person.name?.includes("Rugby");
      const isWithYou = childrenLocation === "Chez Papa";
      if ((isLinkedToGarde || isRugbyEvent) && !isWithYou) return;

      // Skip work events on Sundays, but allow garde_alternee
      // if (dayOfWeek === 0 && person.type !== "garde_alternee") return;

      // Garde alternée
      if (person.type === "garde_alternee" && person.name === "Lyam & Noah") {
        if (childrenLocation === "Chez Papa") {
          events.push({
            id: `garde-${dateStr}`,
            title: "Lyam & Noah",
            date: dateStr,
            startTime: null,
            endTime: null,
            location: "Chez Papa",
            isPlanning: true,
            isAllDay: true,
            noNotification: true,
            type: "garde-alternee",
          });
        }
      }

      // Fixed schedule
      if (person.type === "fixed") {
        const hours = person.schedule?.[dayName];
        hours?.forEach((hour: string) => {
          const [start, end] = hour.split("-");
          let eventTitle = person.name;
          let eventType = isRugbyEvent ? "rugby" : "work";

          // Force Luis and Caroline to be work type (blue)
          if (person.name === "Luis" || person.name === "Caroline") {
            eventType = "work";
          }

          if (person.name === "Echange enfants" && childrenLocation !== "Chez Papa") {
            return;
          }

          if (person.name === "Echange enfants") {
            eventType = "garde-alternee";
          }

          // Special handling for Poubelle
          if (person.name === "Poubelle" && person.rotationType === "alternate" && person.alternating) {
            const weekMod2 = weekNumber % 2;
            const alternatingEntry = person.alternating.find((a: any) => a.weekMod2 === weekMod2);
            const poubelleType = alternatingEntry ? alternatingEntry.type : "Inconnue";
            eventTitle = "Poubelle";
            eventType = poubelleType.toLowerCase();
          }

          events.push({
            id: `planning-${person.name}-${dateStr}-${hour}`,
            title: eventTitle,
            date: dateStr,
            time: start,
            startTime: start,
            endTime: end,
            location: person.location || "",
            isPlanning: true,
            type: eventType,
          });
        });
      }

      // Shift schedule (Luis, Caroline)
      if (person.type === "shift") {
        // Calculate which week in the cycle
        const cycleLength = person.cycleLength || person.rotation?.length || 1;
        const offset = person.offset || 0;
        let weekInCycle = (weekNumber + offset) % cycleLength;
        
        // Check for week overrides
        let currentShift = null;
        if (person.weekOverrides && person.weekOverrides[weekNumber.toString()]) {
          currentShift = person.weekOverrides[weekNumber.toString()];
        } else if (person.rotation && person.rotation[weekInCycle]) {
          currentShift = person.rotation[weekInCycle];
        }
        
        if (currentShift) {
          // Check for day-specific exceptions
          const dayExceptions = currentShift.exceptions?.[dayName] || currentShift.hours;
          
          dayExceptions?.forEach((hour: string) => {
            const [start, end] = hour.split("-");
            let eventTitle = person.name;
            let eventType = "work"; // Force blue for Luis and Caroline
            
            events.push({
              id: `shift-${person.name}-${dateStr}-${hour}`,
              title: eventTitle,
              date: dateStr,
              time: start,
              startTime: start,
              endTime: end,
              location: person.location || "",
              isPlanning: true,
              type: eventType,
            });
          });
        }
      }

      // All-day events
      if (person.type === "allday") {
        const shouldShow = person.days?.includes(dayName);
        if (shouldShow) {
          let eventTitle = person.name;
          let eventType = person.colorType || "work";

          if (person.rotationType === "alternate" && person.alternating) {
            const weekMod2 = weekNumber % 2;
            const alternatingEntry = person.alternating.find((a: any) => a.weekMod2 === weekMod2);
            if (alternatingEntry) {
              eventTitle = person.name;
              eventType = alternatingEntry.type.toLowerCase();
            }
          }

          events.push({
            id: `allday-${person.name}-${dateStr}`,
            title: eventTitle,
            date: dateStr,
            startTime: null,
            endTime: null,
            location: person.location || "",
            isPlanning: true,
            isAllDay: true,
            type: eventType,
            description: person.description || "",
          });
        }
      }
    });
  }

  return events;
}

function transformCalendarEvents(calendarEvents: any[]): any[] {
  return calendarEvents.map(event => {
    const hasTime = event.start?.includes('T') || false;
    const startTime = hasTime ? new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
    const endTime = hasTime && event.end ? new Date(event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null;
    
    let eventType = 'default';
    if (event.summary?.toLowerCase().includes('anniversaire')) {
      eventType = 'birthday';
    }
    
    return {
      ...event,
      title: event.summary || 'Événement',
      startTime,
      endTime,
      type: eventType,
    };
  });
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}