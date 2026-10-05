import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useTheme } from '../useTheme'
import { useWeatherStore } from '../../stores/weatherStore'
import { useThemeStore } from '../../stores/themeStore'

// Monte le composable dans un composant hôte pour activer onMounted/onUnmounted
function mountUseTheme() {
  const host = defineComponent({
    setup() {
      return useTheme()
    },
    template: '<div />',
  })
  return mount(host)
}

describe('useTheme', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns theme object', () => {
    const theme = useTheme()
    expect(theme).toBeDefined()
    expect(typeof theme.isDark.value).toBe('boolean')
  })

  it('retombe sur le themeStore sans données de soleil', () => {
    const themeStore = useThemeStore()
    themeStore.setTheme(true)

    const wrapper = mountUseTheme()
    expect(wrapper.vm.isDark).toBe(true)

    themeStore.setTheme(false)
    wrapper.unmount()
  })

  it('est clair entre le lever et le coucher du soleil', () => {
    const weatherStore = useWeatherStore()
    const now = Date.now()
    weatherStore.sunrise = new Date(now - 60 * 60 * 1000).toISOString()
    weatherStore.sunset = new Date(now + 60 * 60 * 1000).toISOString()

    const wrapper = mountUseTheme()
    expect(wrapper.vm.isDark).toBe(false)
    wrapper.unmount()
  })

  it('est sombre après le coucher du soleil', () => {
    const weatherStore = useWeatherStore()
    const now = Date.now()
    weatherStore.sunrise = new Date(now - 10 * 60 * 60 * 1000).toISOString()
    weatherStore.sunset = new Date(now - 60 * 60 * 1000).toISOString()

    const wrapper = mountUseTheme()
    expect(wrapper.vm.isDark).toBe(true)
    wrapper.unmount()
  })

  it('est sombre avant le lever du soleil', () => {
    const weatherStore = useWeatherStore()
    const now = Date.now()
    weatherStore.sunrise = new Date(now + 60 * 60 * 1000).toISOString()
    weatherStore.sunset = new Date(now + 10 * 60 * 60 * 1000).toISOString()

    const wrapper = mountUseTheme()
    expect(wrapper.vm.isDark).toBe(true)
    wrapper.unmount()
  })

  it('réévalue le thème chaque minute (bascule au coucher du soleil)', async () => {
    vi.useFakeTimers()
    const weatherStore = useWeatherStore()
    const now = Date.now()
    weatherStore.sunrise = new Date(now - 60 * 60 * 1000).toISOString()
    weatherStore.sunset = new Date(now + 30 * 1000).toISOString() // coucher dans 30 s

    const wrapper = mountUseTheme()
    expect(wrapper.vm.isDark).toBe(false)

    await vi.advanceTimersByTimeAsync(61 * 1000)
    expect(wrapper.vm.isDark).toBe(true)

    wrapper.unmount() // couvre le clearInterval du onUnmounted
  })
})
