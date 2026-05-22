import { ref, onMounted, onUnmounted } from 'vue';

export interface ModuleSlot {
  key: string;
  /** Duration in ms this module stays visible */
  duration: number;
}

/**
 * Rotates through a list of module slots on a fixed cycle.
 * Returns `activeKey` — a ref containing the key of the currently visible module.
 *
 * Example:
 *   const { activeKey } = useModuleRotation([
 *     { key: 'weather', duration: 25_000 },
 *     { key: 'qr',      duration: 5_000 },
 *   ]);
 */
export function useModuleRotation(slots: ModuleSlot[]) {
  if (slots.length === 0) throw new Error('useModuleRotation: slots cannot be empty');

  const firstSlot = slots[0]!;
  const activeKey = ref<string>(firstSlot.key);
  /** Percentage of time remaining for the current module, from 100 (just started) to 0 (switching). */
  const progress = ref(100);

  let currentIndex = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let slotStartTime = 0;

  function startProgress() {
    slotStartTime = Date.now();
    progress.value = 100;
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - slotStartTime;
      const current = slots[currentIndex]!;
      progress.value = Math.max(0, 100 - (elapsed / current.duration) * 100);
    }, 50);
  }

  function scheduleNext() {
    const current = slots[currentIndex]!;
    startProgress();
    timer = setTimeout(() => {
      currentIndex = (currentIndex + 1) % slots.length;
      activeKey.value = slots[currentIndex]!.key;
      scheduleNext();
    }, current.duration);
  }

  onMounted(() => {
    scheduleNext();
  });

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
    if (progressInterval) clearInterval(progressInterval);
  });

  return { activeKey, progress };
}
