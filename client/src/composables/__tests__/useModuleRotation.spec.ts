import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useModuleRotation, type ModuleSlot } from '../useModuleRotation'

// Monte le composable dans un composant hôte pour activer onMounted/onUnmounted
function mountRotation(slots: ModuleSlot[]) {
  const host = defineComponent({
    setup() {
      return useModuleRotation(slots)
    },
    template: '<div />',
  })
  return mount(host)
}

describe('useModuleRotation', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('lève une erreur si la liste des slots est vide', () => {
    expect(() => useModuleRotation([])).toThrow('slots cannot be empty')
  })

  it('démarre sur le premier slot', () => {
    vi.useFakeTimers()
    const wrapper = mountRotation([
      { key: 'weather', duration: 10_000 },
      { key: 'qr', duration: 5_000 },
    ])

    expect(wrapper.vm.activeKey).toBe('weather')
    expect(wrapper.vm.progress).toBe(100)
    wrapper.unmount()
  })

  it('passe au slot suivant après sa durée puis reboucle', async () => {
    vi.useFakeTimers()
    const wrapper = mountRotation([
      { key: 'weather', duration: 10_000 },
      { key: 'qr', duration: 5_000 },
    ])

    await vi.advanceTimersByTimeAsync(10_000)
    expect(wrapper.vm.activeKey).toBe('qr')

    await vi.advanceTimersByTimeAsync(5_000)
    expect(wrapper.vm.activeKey).toBe('weather') // reboucle au début

    wrapper.unmount()
  })

  it('progress décroît de 100 vers 0 pendant le slot', async () => {
    vi.useFakeTimers()
    const wrapper = mountRotation([{ key: 'solo', duration: 10_000 }])

    await vi.advanceTimersByTimeAsync(5_000)
    expect(wrapper.vm.progress).toBeLessThan(60)
    expect(wrapper.vm.progress).toBeGreaterThan(40)

    wrapper.unmount()
  })

  it('progress repart à 100 au changement de slot', async () => {
    vi.useFakeTimers()
    const wrapper = mountRotation([
      { key: 'a', duration: 1_000 },
      { key: 'b', duration: 60_000 },
    ])

    await vi.advanceTimersByTimeAsync(1_000 + 100)
    expect(wrapper.vm.activeKey).toBe('b')
    expect(wrapper.vm.progress).toBeGreaterThan(95)

    wrapper.unmount()
  })

  it('unmount arrête la rotation', async () => {
    vi.useFakeTimers()
    const wrapper = mountRotation([
      { key: 'a', duration: 1_000 },
      { key: 'b', duration: 1_000 },
    ])

    wrapper.unmount()
    // Plus aucun timer ne doit être actif après le démontage
    expect(vi.getTimerCount()).toBe(0)
  })
})
