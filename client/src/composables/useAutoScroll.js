import { nextTick } from "vue";

export function useAutoScroll(dayColumns) {
    const scrollIntervals = [];

    const equalizeEventHeights = () => {
        nextTick(() => {
            const eventsContainers = document.querySelectorAll(".events");
            eventsContainers.forEach((container) => {
                container.style.height = ""; // Supprime tout style height en ligne
            });
        });
    };

    const initAutoScroll = () => {
        nextTick(() => {
            scrollIntervals.forEach(clearInterval);
            scrollIntervals.length = 0;
            dayColumns.value.forEach((col) => {
                const container = col.$el.querySelector(".events");
                if (
                    container &&
                    container.scrollHeight > container.clientHeight
                ) {
                    let direction = 1;
                    let scrollPos = 0;
                    const step = 1;
                    const delay = 30;
                    let pause = false;
                    const intervalId = setInterval(() => {
                        if (!pause) {
                            scrollPos += step * direction;
                            container.scrollTop = scrollPos;
                            if (
                                scrollPos >=
                                container.scrollHeight - container.clientHeight
                            ) {
                                direction = -1;
                                pause = true;
                                setTimeout(() => (pause = false), 10000);
                            }
                            if (scrollPos <= 0) {
                                direction = 1;
                                pause = true;
                                setTimeout(() => (pause = false), 10000);
                            }
                        }
                    }, delay);
                    scrollIntervals.push(intervalId);
                }
            });
        });
    };

    return { initAutoScroll, equalizeEventHeights };
}
