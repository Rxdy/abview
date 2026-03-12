import { nextTick } from "vue";

export function useAutoScroll(dayColumns: any) {
    const scrollIntervals: number[] = [];

    const equalizeEventHeights = () => {
        nextTick(() => {
            // Check if DOM is ready
            if (typeof document === 'undefined') {
                return;
            }
            const eventsContainers = document.querySelectorAll(".events");
            eventsContainers.forEach((container) => {
                (container as HTMLElement).style.height = ""; // Supprime tout style height en ligne
            });
        });
    };

    const initAutoScroll = () => {
        nextTick(() => {
            // Check if dayColumns is available
            if (!dayColumns || !dayColumns.value || dayColumns.value.length === 0) {
                // console.log('dayColumns not ready, skipping auto-scroll init');
                return;
            }
            // Try to find header, footer, and modules
            const header = document.querySelector('header') || document.querySelector('[class*="header"]') || document.querySelector('nav');
            const footer = document.querySelector('footer') || document.querySelector('[class*="footer"]');
            const modules = document.querySelectorAll('[class*="module"], [class*="Module"]');
            
            if (modules.length > 0) {
                modules.forEach((module, index) => {
                    const rect = module.getBoundingClientRect();
                });
            }
            
            // Calculate available space for events
            const calendarModule = document.querySelector('[class*="calendar"]');
            if (calendarModule) {
                const calendarRect = calendarModule.getBoundingClientRect();
            }
            // console.log('dayColumns length:', dayColumns.value.length);
            scrollIntervals.forEach(clearInterval);
            scrollIntervals.length = 0;
            if (dayColumns.value && dayColumns.value.length > 0) {
                dayColumns.value.forEach((col: any, index: number) => {
                // console.log(`Column ${index}:`, col);
                if (!col) {
                    // console.log(`Column ${index}: NULL`);
                    return;
                }
                
                const container = col.querySelector?.(".events") || col.$el?.querySelector?.(".events");
                // console.log(`Column ${index} container:`, container);
                
                if (container) {
                    // const rect = container.getBoundingClientRect();
                    // console.log(`Column ${index} dimensions:`, {
                    //     scrollHeight: container.scrollHeight,
                    //     clientHeight: container.clientHeight,
                    //     offsetHeight: container.offsetHeight
                    // });
                    
                    if (container.scrollHeight > container.clientHeight) {
                        let direction = 1;
                        let scrollPos = 0;
                        const step = 1;
                        const delay = 30;
                        let pause = false;
                        const intervalId = setInterval(() => {
                            if (!pause) {
                                scrollPos += step * direction;
                                container.scrollTop = scrollPos;
                                
                                if (scrollPos >= container.scrollHeight - container.clientHeight) {
                                    // console.log(`Column ${index}: REACHED BOTTOM, reversing`);
                                    direction = -1;
                                    pause = true;
                                    setTimeout(() => { 
                                        // console.log(`Column ${index}: RESUMING after bottom pause`);
                                        pause = false; 
                                    }, 2000);
                                }
                                if (scrollPos <= 0) {
                                    // console.log(`Column ${index}: REACHED TOP, reversing`);
                                    direction = 1;
                                    pause = true;
                                    setTimeout(() => { 
                                        // console.log(`Column ${index}: RESUMING after top pause`);
                                        pause = false; 
                                    }, 2000);
                                }
                            }
                        }, delay);
                        scrollIntervals.push(intervalId);
                    } else {
                        // console.log(`NO SCROLL NEEDED for column ${index} (${container.scrollHeight} <= ${container.clientHeight})`);
                    }
                } else {
                    // console.log(`NO CONTAINER found for column ${index}`);
                }
            });
            }
        });
    };

    const stopAutoScroll = () => {
        scrollIntervals.forEach(clearInterval);
        scrollIntervals.length = 0;
    };

    return {
        initAutoScroll,
        stopAutoScroll,
        equalizeEventHeights,
    };
}