import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import BirthdayEffect from '../BirthdayEffect.vue'

// Note: BirthdayEffect uses Object.defineProperty on window without configurable: true
// This creates a non-configurable property that cannot be redefined, so we must mount it only once
let wrapperInstance: any = null

async function getWrapper() {
  if (!wrapperInstance) {
    wrapperInstance = mount(BirthdayEffect)
    await flushPromises()
  }
  return wrapperInstance
}

const show = (...args: any[]) => (window as any).showBirthdayEffect(...args)
const stop = () => (window as any).stopBirthdayEffect()

describe('BirthdayEffect', () => {
  afterEach(() => {
    stop()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should mount component successfully and expose global functions', async () => {
    const wrapper = await getWrapper()

    expect(wrapper.exists()).toBe(true)
    expect(typeof (window as any).showBirthdayEffect).toBe('function')
    expect(typeof (window as any).stopBirthdayEffect).toBe('function')
    expect(wrapper.vm).toBeDefined()
  })

  it("affiche l'overlay et nettoie le nom (partie avant le |)", async () => {
    const wrapper = await getWrapper()

    show('Julie|2026-07-08', true)
    await nextTick()

    expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
    expect((window as any).currentBirthdayPerson).toBe('Julie')
    expect((window as any).currentBirthdayDate).not.toBe('')
  })

  it('utilise « Quelqu\'un » comme nom par défaut', async () => {
    await getWrapper()

    show(undefined, true)
    await nextTick()

    expect((window as any).currentBirthdayPerson).toBe("Quelqu'un")
  })

  it("mode test : l'effet s'arrête tout seul après 15 secondes", async () => {
    vi.useFakeTimers()
    const wrapper = await getWrapper()

    show('Julie', true)
    await nextTick()
    expect(wrapper.find('.birthday-overlay').exists()).toBe(true)

    vi.advanceTimersByTime(15000)
    await nextTick()

    expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    expect((window as any).currentBirthdayPerson).toBe('')
  })

  it('mode réel : masque après 1 minute puis répète après 10 minutes', async () => {
    vi.useFakeTimers()
    const wrapper = await getWrapper()

    show('Julie', false)
    await nextTick()
    expect(wrapper.find('.birthday-overlay').exists()).toBe(true)

    vi.advanceTimersByTime(60000) // masquage après 1 min
    await nextTick()
    expect(wrapper.find('.birthday-overlay').exists()).toBe(false)

    vi.advanceTimersByTime(600000) // répétition 10 min plus tard (même jour)
    await nextTick()
    expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
    expect((window as any).currentBirthdayPerson).toBe('Julie')
  })

  it("mode réel : s'arrête à la répétition si le jour a changé", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 8, 23, 58)) // 2 min avant minuit
    const wrapper = await getWrapper()

    show('Julie', false)
    await nextTick()

    // 1 min (masquage) + 10 min (répétition) → on est le 9 juillet
    vi.advanceTimersByTime(60000 + 600000)
    await nextTick()

    expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
    expect((window as any).currentBirthdayPerson).toBe('')
  })

  it("un clic sur l'overlay le masque", async () => {
    const wrapper = await getWrapper()

    show('Julie', true)
    await nextTick()

    await wrapper.find('.birthday-overlay').trigger('click')

    expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
  })

  it("réagit à l'événement birthday-detected du document", async () => {
    const wrapper = await getWrapper()

    document.dispatchEvent(
      new CustomEvent('birthday-detected', { detail: { person: 'Noah', testMode: true } })
    )
    await nextTick()

    expect(wrapper.find('.birthday-overlay').exists()).toBe(true)
    expect((window as any).currentBirthdayPerson).toBe('Noah')
  })

  it("ignore l'événement birthday-detected sans personne", async () => {
    const wrapper = await getWrapper()

    document.dispatchEvent(new CustomEvent('birthday-detected', { detail: {} }))
    await nextTick()

    expect(wrapper.find('.birthday-overlay').exists()).toBe(false)
  })
})
