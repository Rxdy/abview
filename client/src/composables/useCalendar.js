import { ref, computed } from "vue";
import { getEventDate, getTime, getApiUrl } from "../utils/dateUtils";
import logger from "../utils/logger.js";

export function useCalendar() {
    const events = ref([]);
    const planningData = ref([]);
    const fetchError = ref(false);
    const lastUpdate = ref(null);
    const notificationModal = ref({ show: false, currentEvent: {}, type: "" });
    const notificationQueue = ref([]);
    const isProcessingQueue = ref(false);
    const notifiedEventsOneHour = ref(new Set());
    const notifiedEventsThirtyMin = ref(new Set());
    const allDayNotifications = ref(new Map()); // Track last notification time for all-day events
    const notificationAudio = ref(null);
    const audioContext = ref(null);
    const audioBuffer = ref(null);
    const audioEnabled = ref(false);

    const initAudio = async () => {
        try {
            logger.log('audio', 'Initializing audio system');
            // Méthode 1: Audio HTML5 classique
            notificationAudio.value = new Audio("/song/notif.wav");
            notificationAudio.value.volume = 1.0;
            notificationAudio.value.preload = "auto";
            notificationAudio.value.load();
            
            // Méthode 2: Web Audio API (plus fiable sur certains navigateurs)
            try {
                audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
                const response = await fetch("/song/notif.wav");
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer.value = await audioContext.value.decodeAudioData(arrayBuffer);
                logger.log('audio', 'Web Audio API initialized successfully');
            } catch (e) {
                logger.log('error', `Web Audio API initialization failed: ${e.message}`);
            }
            
            notificationAudio.value.addEventListener("canplaythrough", () => {
                audioEnabled.value = true;
                logger.log('audio', 'HTML5 Audio ready');
                
                // Tenter de débloquer l'audio
                notificationAudio.value.play().then(() => {
                    notificationAudio.value.pause();
                    notificationAudio.value.currentTime = 0;
                    logger.log('audio', 'Audio auto-unlocked at startup');
                }).catch((e) => {
                    logger.log('error', `Audio auto-unlock failed: ${e.message}`);
                });
            });
            
            notificationAudio.value.addEventListener("error", (e) => {
                logger.log('error', `Audio loading error: ${e.message}`);
            });
            
        } catch (err) {
            logger.log('error', `Audio initialization error: ${err.message}`);
        }
    };

    const playNotificationSound = () => {
        logger.log('audio', 'Attempting to play notification sound');
        
        // Essayer Web Audio API d'abord (plus fiable)
        if (audioContext.value && audioBuffer.value) {
            try {
                // Reprendre le contexte si suspendu
                if (audioContext.value.state === 'suspended') {
                    audioContext.value.resume();
                }
                
                const source = audioContext.value.createBufferSource();
                source.buffer = audioBuffer.value;
                
                // Ajouter du gain pour le volume max
                const gainNode = audioContext.value.createGain();
                gainNode.gain.value = 1.0;
                
                source.connect(gainNode);
                gainNode.connect(audioContext.value.destination);
                source.start(0);
                
                logger.log('audio', 'Notification sound played via Web Audio API');
                return;
            } catch (e) {
                logger.log('error', `Web Audio API play failed: ${e.message}`);
            }
        }
        
        // Fallback: HTML5 Audio
        if (notificationAudio.value) {
            notificationAudio.value.currentTime = 0;
            notificationAudio.value.volume = 1.0;
            
            notificationAudio.value.play()
                .then(() => {
                    logger.log('audio', 'Notification sound played via HTML5 Audio');
                })
                .catch((err) => {
                    logger.log('error', `HTML5 Audio play failed: ${err.message}`);
                });
        } else {
            logger.log('error', 'No audio method available for notification');
        }
    };

    const fetchData = async () => {
        try {
            let calendarData = { events: [] };
            let horairesData = { horaires: [] };
            fetchError.value = false;

            logger.log('api', 'Fetching calendar data from API');
            try {
                const calendarRes = await fetch(
                    getApiUrl("/calendar"),
                    { headers: { Accept: "application/json" } }
                );
                if (calendarRes.ok) {
                    const text = await calendarRes.text();
                    if (text.trim()) {
                        calendarData = JSON.parse(text);
                        logger.log('api', `Calendar API success: ${calendarData.events?.length || 0} events loaded`);
                    } else {
                        fetchError.value = true;
                        logger.log('error', 'Calendar API returned empty response');
                    }
                } else {
                    fetchError.value = true;
                    logger.log('error', `Calendar API failed: HTTP ${calendarRes.status}`);
                }
            } catch (err) {
                fetchError.value = true;
                logger.log('error', `Calendar API error: ${err.message}`);
            }

            logger.log('api', 'Fetching horaires data from API');
            try {
                const planningRes = await fetch(
                    getApiUrl("/horaires"),
                    { headers: { Accept: "application/json" } }
                );
                if (planningRes.ok) {
                    const text = await planningRes.text();
                    if (text.trim()) {
                        horairesData = JSON.parse(text);
                        logger.log('api', `Horaires API success: ${horairesData.horaires?.length || 0} horaires loaded`);
                    } else {
                        fetchError.value = true;
                        logger.log('error', 'Horaires API returned empty response');
                    }
                } else {
                    fetchError.value = true;
                    logger.log('error', `Horaires API failed: HTTP ${planningRes.status}`);
                }
            } catch (err) {
                fetchError.value = true;
                logger.log('error', `Horaires API error: ${err.message}`);
            }

            events.value.splice(
                0,
                events.value.length,
                ...(Array.isArray(calendarData.events)
                    ? calendarData.events
                    : [])
            );
            planningData.value.splice(
                0,
                planningData.value.length,
                ...(Array.isArray(horairesData.horaires)
                    ? horairesData.horaires
                    : [])
            );
            lastUpdate.value = calendarData.lastUpdate || null;

            const eventIds = new Set(events.value.map((e) => e.id));
            notifiedEventsOneHour.value = new Set(
                [...notifiedEventsOneHour.value].filter((id) =>
                    eventIds.has(id)
                )
            );
            notifiedEventsThirtyMin.value = new Set(
                [...notifiedEventsThirtyMin.value].filter((id) =>
                    eventIds.has(id)
                )
            );

            console.log("planningData:", planningData.value);
            console.log("calendar events:", events.value);
        } catch {
            fetchError.value = true;
        }
    };

    const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Obtenir l'offset du fuseau horaire actuel (ex: "+01:00" en hiver, "+02:00" en été)
    const getTimezoneOffset = () => {
        const offset = -new Date().getTimezoneOffset();
        const sign = offset >= 0 ? "+" : "-";
        const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0");
        const minutes = String(Math.abs(offset) % 60).padStart(2, "0");
        return `${sign}${hours}:${minutes}`;
    };

    const next9Days = computed(() => {
        const days = [];
        const today = new Date();
        const localToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const getWeekNumber = (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            const yearStart = new Date(d.getFullYear(), 0, 1);
            return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        };

        for (let i = 0; i < 8; i++) {
            const date = new Date(localToday);
            date.setDate(localToday.getDate() + i);
            const dateStr = formatDateLocal(date);
            const dayOfWeek = date.getDay();
            const dayName = [
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
            ][dayOfWeek];
            const weekNumber = getWeekNumber(date);

            // Localisation enfants
            let childrenLocation = "";
            planningData.value.forEach((person) => {
                if (
                    person.type === "garde_alternee" &&
                    person.name === "Lyam & Noah"
                ) {
                    const isOddWeek = weekNumber % 2 === 1;
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const override = (person.overrides || []).find((o) => {
                        const start = new Date(
                            date.getFullYear(),
                            o.month_start - 1,
                            o.day_start
                        );
                        const end = new Date(
                            date.getFullYear(),
                            o.month_end - 1,
                            o.day_end
                        );
                        return date >= start && date <= end;
                    });
                    if (override) childrenLocation = override.location;
                    else
                        childrenLocation = isOddWeek
                            ? person.weeks.odd
                            : person.weeks.even;
                }
            });

            console.log(
                `Date: ${dateStr}, childrenLocation: ${childrenLocation}`
            );

            // Événements calendriers
            const dayEvents = (events.value || [])
                .filter((e) => getEventDate(e.start) === dateStr)
                .filter((e) => {
                    const isChildEvent =
                        e.summary?.includes("Lyam") ||
                        e.summary?.includes("Noah") ||
                        e.summary?.includes("Enfant");
                    if (isChildEvent && childrenLocation !== "Chez Papa")
                        return false;
                    if (
                        e.end &&
                        new Date(e.end).getTime() + 60 * 60 * 1000 < Date.now()
                    )
                        return false;
                    return true;
                })
                .map((e) => ({
                    ...e,
                    title: e.summary || "Événement sans titre",
                    startTime: getTime(e.start),
                    endTime: getTime(e.end),
                    isPlanning: false,
                    colorType: e.summary?.toLowerCase().includes("anniversaire")
                        ? "birthday"
                        : "event",
                }));

            console.log(`Date: ${dateStr}, dayEvents:`, dayEvents);

            // Événements planning
            let planningEvents = [];
            planningData.value.forEach((person) => {
                if (!person) return;
                const isLinkedToGarde = person.linkedTo === "Lyam & Noah";
                const isRugbyEvent = person.name.includes("Rugby");
                const isWithYou = childrenLocation === "Chez Papa";
                if ((isLinkedToGarde || isRugbyEvent) && !isWithYou) return;

                // Événement pour garde alternée (journalier, sans horaire, sans notification)
                if (
                    person.type === "garde_alternee" &&
                    person.name === "Lyam & Noah"
                ) {
                    // Afficher seulement quand les enfants sont chez Papa
                    if (childrenLocation === "Chez Papa") {
                        planningEvents.push({
                            id: `garde-${dateStr}`,
                            title: "Lyam & Noah",
                            start: `${dateStr}T00:00:00${getTimezoneOffset()}`,
                            end: `${dateStr}T23:59:59${getTimezoneOffset()}`,
                            startTime: null,
                            endTime: null,
                            location: "Chez Papa",
                            isPlanning: true,
                            isAllDay: true,
                            noNotification: true,
                            colorType: "garde-alternee",
                        });
                    }
                    // Ne rien afficher quand chez Maman
                }

                // Fixed
                if (person.type === "fixed") {
                    const hours = person.schedule?.[dayName];
                    hours?.forEach((hour) => {
                        const [start, end] = hour.split("-");
                        let eventTitle = person.name;
                        let colorType = isRugbyEvent ? "rugby" : "planning";

                        // Skip "Echange enfants" if children are not with you
                        if (person.name === "Echange enfants" && childrenLocation !== "Chez Papa") {
                            return;
                        }

                        // Special color for "Echange enfants"
                        if (person.name === "Echange enfants") {
                            colorType = "garde-alternee";
                        }

                        // Gestion spéciale pour Poubelle
                        if (
                            person.name === "Poubelle" &&
                            person.rotationType === "alternate" &&
                            person.alternating
                        ) {
                            const weekMod2 = weekNumber % 2;
                            const alternatingEntry = person.alternating.find(
                                (a) => a.weekMod2 === weekMod2
                            );
                            const poubelleType = alternatingEntry
                                ? alternatingEntry.type
                                : "Inconnue";
                            eventTitle = "Poubelle";
                            colorType = poubelleType.toLowerCase();
                        }

                        planningEvents.push({
                            id: `planning-${person.name}-${dateStr}-${hour}`,
                            title: eventTitle,
                            start: `${dateStr}T${start}:00${getTimezoneOffset()}`,
                            end: `${dateStr}T${end}:00${getTimezoneOffset()}`,
                            startTime: start,
                            endTime: end,
                            location: person.location || "",
                            isPlanning: true,
                            colorType: colorType,
                        });
                    });
                }

                // All-day events (no schedule, recurring reminders every 3h)
                if (person.type === "allday") {
                    const shouldShow = person.days?.includes(dayName);
                    if (shouldShow) {
                        let eventTitle = person.name;
                        let colorType = person.colorType || "planning";

                        // Handle alternating types (like Poubelle Jaune/Noire)
                        if (person.rotationType === "alternate" && person.alternating) {
                            const weekMod2 = weekNumber % 2;
                            const alternatingEntry = person.alternating.find(
                                (a) => a.weekMod2 === weekMod2
                            );
                            if (alternatingEntry) {
                                eventTitle = person.name; // Just "Poubelle" (minuscules)
                                colorType = alternatingEntry.type.toLowerCase();
                            }
                        }

                        planningEvents.push({
                            id: `allday-${person.name}-${dateStr}`,
                            title: eventTitle,
                            start: `${dateStr}T00:00:00${getTimezoneOffset()}`,
                            end: `${dateStr}T23:59:59${getTimezoneOffset()}`,
                            startTime: null,
                            endTime: null,
                            location: person.location || "",
                            isPlanning: true,
                            isAllDay: true,
                            colorType: colorType,
                            description: person.description || "",
                        });
                    }
                }
                // Shift
                else if (person.type === "shift") {
                    const year = new Date(dateStr).getFullYear();
                    const overrideKey = `${year}-${weekNumber}`;
                    
                    // Vérifier d'abord les overrides par semaine
                    if (person.weekOverrides && person.weekOverrides[overrideKey]) {
                        const override = person.weekOverrides[overrideKey];
                        const hours = override.exceptions?.[dayName] || override.hours || [];
                        
                        // Si c'est un CP ou pas d'heures, on affiche juste le shift sans horaires
                        if (override.shift === "CP" || hours.length === 0) {
                            if (dayName !== "saturday" && dayName !== "sunday") {
                                planningEvents.push({
                                    id: `planning-${person.name}-${dateStr}-cp`,
                                    title: person.name,
                                    shift: override.shift,
                                    start: dateStr,
                                    end: dateStr,
                                    startTime: null,
                                    endTime: null,
                                    location: "",
                                    isPlanning: true,
                                    isAllDay: true,
                                    colorType: "planning",
                                });
                            }
                        } else {
                            hours.forEach((hour) => {
                                let [start, end] = hour.split("-");
                                planningEvents.push({
                                    id: `planning-${person.name}-${dateStr}-${hour}`,
                                    title: person.name,
                                    shift: override.shift,
                                    start: `${dateStr}T${start}:00${getTimezoneOffset()}`,
                                    end: `${dateStr}T${end}:00${getTimezoneOffset()}`,
                                    startTime: start,
                                    endTime: end,
                                    location: "",
                                    isPlanning: true,
                                    colorType: "planning",
                                });
                            });
                        }
                        return; // Skip le cycle normal si override trouvé
                    }
                    
                    // Sinon utiliser le cycle normal
                    const cycleLength =
                        person.cycleLength || person.rotation?.length || 0;
                    if (cycleLength === 0) return;
                    let weekInCycle = ((weekNumber - 1) % cycleLength) + 1;
                    if (person.offset)
                        weekInCycle =
                            ((weekNumber - 1 - person.offset + cycleLength) %
                                cycleLength) +
                            1;
                    const rotation = person.rotation?.find(
                        (r) => r.week === weekInCycle
                    );
                    if (!rotation) return;
                    let hours =
                        rotation.exceptions?.[dayName] || rotation.hours;
                    hours?.forEach((hour) => {
                        let [start, end] = hour.split("-");
                        planningEvents.push({
                            id: `planning-${person.name}-${dateStr}-${hour}`,
                            title: person.name,
                            shift: rotation.shift,
                            start: `${dateStr}T${start}:00${getTimezoneOffset()}`,
                            end: `${dateStr}T${end}:00${getTimezoneOffset()}`,
                            startTime: start,
                            endTime: end,
                            location: "",
                            isPlanning: true,
                            colorType: "planning",
                        });
                    });
                }
            });

            // Filtre planning dépassés
            const now = new Date();
            planningEvents = planningEvents.filter(
                (e) =>
                    !e.end ||
                    new Date(e.end).getTime() + 60 * 60 * 1000 > now.getTime()
            );

            console.log(`Date: ${dateStr}, planningEvents:`, planningEvents);

            const combinedEvents = [...dayEvents, ...planningEvents].sort(
                (a, b) => {
                    if (!a.startTime && !b.startTime) return 0;
                    if (!a.startTime) return -1;
                    if (!b.startTime) return 1;
                    const timeToMinutes = (t) =>
                        t
                            .split(":")
                            .map(Number)
                            .reduce((h, m) => h * 60 + m, 0);
                    return (
                        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                    );
                }
            );

            days.push({ date: dateStr, events: combinedEvents });
        }

        return days;
    });

    const checkUpcomingEvents = () => {
        const now = new Date();
        const fiveMin = 5 * 60 * 1000;
        const threeHours = 3 * 60 * 60 * 1000;
        const todayStr = formatDateLocal(now);

        next9Days.value.forEach((day) => {
            day.events.forEach((event) => {
                // Skip events that should not trigger notifications
                if (event.noNotification) return;

                // Handle all-day events with recurring notifications every 3 hours
                if (event.isAllDay && day.date === todayStr) {
                    const eventKey = event.id;
                    const lastNotified = allDayNotifications.value.get(eventKey);
                    const shouldNotify = !lastNotified || (now.getTime() - lastNotified >= threeHours);
                    
                    if (shouldNotify) {
                        notificationQueue.value.push({ event, type: "Rappel" });
                        allDayNotifications.value.set(eventKey, now.getTime());
                        processNotificationQueue();
                    }
                    return;
                }

                if (!event.start || !event.startTime) return;
                const eventStart = new Date(event.start);
                if (isNaN(eventStart.getTime())) return;
                const timeDiff = eventStart - now;

                if (
                    timeDiff >= 60 * 60 * 1000 - fiveMin &&
                    timeDiff <= 60 * 60 * 1000 + fiveMin &&
                    !notifiedEventsOneHour.value.has(event.id)
                ) {
                    notificationQueue.value.push({ event, type: "1 heure" });
                    notifiedEventsOneHour.value.add(event.id);
                    processNotificationQueue();
                } else if (
                    timeDiff >= 30 * 60 * 1000 - fiveMin &&
                    timeDiff <= 30 * 60 * 1000 + fiveMin &&
                    !notifiedEventsThirtyMin.value.has(event.id)
                ) {
                    notificationQueue.value.push({ event, type: "30 minutes" });
                    notifiedEventsThirtyMin.value.add(event.id);
                    processNotificationQueue();
                }
            });
        });
    };

    const processNotificationQueue = () => {
        if (isProcessingQueue.value || notificationQueue.value.length === 0)
            return;
        isProcessingQueue.value = true;
        const { event, type } = notificationQueue.value.shift();
        notificationModal.value.currentEvent = event;
        notificationModal.value.show = true;
        notificationModal.value.type = type;
        playNotificationSound();
        setTimeout(() => {
            notificationModal.value.show = false;
            isProcessingQueue.value = false;
            setTimeout(processNotificationQueue, 2000);
        }, 15000);
    };

    // Function to test notifications with sound
    const testNotification = (title = "Test Notification", type = "Test") => {
        const testEvent = {
            id: `test-${Date.now()}`,
            title: title,
            startTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            endTime: null,
            description: "Ceci est une notification de test",
            location: "",
            isPlanning: true,
            colorType: "planning",
        };
        notificationQueue.value.push({ event: testEvent, type: type });
        processNotificationQueue();
    };

    // Expose testNotification globally for console testing
    if (typeof window !== 'undefined') {
        window.testNotification = testNotification;
    }

    setTimeout(() => initAudio(), 1000);

    return {
        events,
        planningData,
        fetchError,
        lastUpdate,
        notificationModal,
        notificationQueue,
        isProcessingQueue,
        notifiedEventsOneHour,
        notifiedEventsThirtyMin,
        allDayNotifications,
        next9Days,
        fetchData,
        checkUpcomingEvents,
        processNotificationQueue,
        playNotificationSound,
        testNotification,
    };
}
