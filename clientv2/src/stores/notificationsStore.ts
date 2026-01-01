import { defineStore } from 'pinia';
import { useCalendarStore } from './calendarStore';

interface Notification {
  event: any;
  type: '1h' | '30min';
  shown: boolean;
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    currentNotification: null as Notification | null,
    isModalVisible: false,
  }),
  actions: {
    checkUpcomingEvents() {
      const calendarStore = useCalendarStore();
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);

      // Get events from calendar store
      const events = calendarStore.allEvents.filter(event => {
        const eventTime = new Date(event.start || event.date);
        return eventTime > now && eventTime <= oneHourFromNow;
      });

      events.forEach(event => {
        const eventTime = new Date(event.start || event.date);
        const timeToEvent = eventTime.getTime() - now.getTime();

        // Schedule 1h reminder
        if (timeToEvent <= 60 * 60 * 1000 && timeToEvent > 30 * 60 * 1000) {
          const existing = this.notifications.find(n => n.event.id === event.id && n.type === '1h');
          if (!existing) {
            this.notifications.push({ event, type: '1h', shown: false });
            setTimeout(() => this.showNotification(event, '1h'), timeToEvent - 60 * 60 * 1000);
          }
        }

        // Schedule 30min reminder
        if (timeToEvent <= 30 * 60 * 1000) {
          const existing = this.notifications.find(n => n.event.id === event.id && n.type === '30min');
          if (!existing) {
            this.notifications.push({ event, type: '30min', shown: false });
            setTimeout(() => this.showNotification(event, '30min'), timeToEvent - 30 * 60 * 1000);
          }
        }
      });
    },
    showNotification(event: any, type: '1h' | '30min') {
      this.currentNotification = { event, type, shown: true };
      this.isModalVisible = true;
    },
    closeNotification() {
      this.isModalVisible = false;
      this.currentNotification = null;
    },
  },
});