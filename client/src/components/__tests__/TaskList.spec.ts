import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskList from '../TaskList.vue'

// Mock the theme store
const mockThemeStore = {
  isDark: true
}

vi.mock('../../stores/themeStore', () => ({
  useThemeStore: () => mockThemeStore
}))

describe('TaskList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockThemeStore.isDark = true
  })

  it('renders list title', () => {
    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks: []
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.text()).toContain('Test List')
  })

  it('renders pending tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1', status: 'needsAction', level: 0, taskListTitle: 'Test', listColor: 'red' }
    ]

    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.findAllComponents({ name: 'TaskItem' })).toHaveLength(1) // Only pending
  })

  it('does not render completed tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1', status: 'completed', level: 0, taskListTitle: 'Test', listColor: 'red' }
    ]

    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.findAllComponents({ name: 'TaskItem' })).toHaveLength(0) // No completed tasks shown
  })

  it('applies light theme class when not dark', () => {
    mockThemeStore.isDark = false

    const wrapper = mount(TaskList, {
      props: {
        listTitle: 'Test List',
        listColor: 'red',
        tasks: []
      },
      stubs: ['TaskItem']
    })

    expect(wrapper.classes()).toContain('light-theme')
  })

  it('affiche les sous-tâches sous leur parent avec hasChildren', () => {
    const tasks = [
      { id: 'p', title: 'Parent', status: 'needsAction', level: 0, taskListTitle: 'T', listColor: 'red' },
      { id: 'c', title: 'Child', status: 'needsAction', level: 1, parent: 'p', taskListTitle: 'T', listColor: 'red' },
      { id: 's', title: 'Solo', status: 'needsAction', level: 0, taskListTitle: 'T', listColor: 'red' },
    ]

    const wrapper = mount(TaskList, {
      props: { listTitle: 'Test', listColor: 'red', tasks },
    })

    const items = wrapper.findAllComponents({ name: 'TaskItem' })
    expect(items).toHaveLength(3)
    // Les tâches sans enfants passent avant celles avec enfants
    expect(items[0].props('task').id).toBe('s')
    expect(items[1].props('task').id).toBe('p')
    expect(items[1].props('hasChildren')).toBe(true)
    expect(items[2].props('task').id).toBe('c')
  })

  it('éclaircit la couleur de Rudy (#1e293b) en thème clair', () => {
    mockThemeStore.isDark = false
    const wrapper = mount(TaskList, {
      props: { listTitle: 'Rudy', listColor: '#1e293b', tasks: [] },
    })

    expect(wrapper.attributes('style')).toContain('rgb(139, 155, 171)') // #8B9BAB
  })

  it('conserve les autres couleurs en thème clair', () => {
    mockThemeStore.isDark = false
    const wrapper = mount(TaskList, {
      props: { listTitle: 'Luis', listColor: '#004C99', tasks: [] },
    })

    expect(wrapper.attributes('style')).toContain('rgb(0, 76, 153)') // #004C99
  })

  it('conserve la couleur brute en thème sombre', () => {
    const wrapper = mount(TaskList, {
      props: { listTitle: 'Rudy', listColor: '#1e293b', tasks: [] },
    })

    expect(wrapper.attributes('style')).toContain('rgb(30, 41, 59)') // #1e293b
  })

  it('passe isDark=true aux TaskItem pour les listes bleues en thème sombre', () => {
    const tasks = [
      { id: '1', title: 'X', status: 'needsAction', level: 0, taskListTitle: 'T', listColor: '#004C99' },
    ]
    const wrapper = mount(TaskList, {
      props: { listTitle: 'Luis', listColor: '#004C99', tasks },
    })

    expect(wrapper.findComponent({ name: 'TaskItem' }).props('isDark')).toBe(true)
  })

  it('passe isDark=false aux TaskItem pour les autres couleurs', () => {
    const tasks = [
      { id: '1', title: 'X', status: 'needsAction', level: 0, taskListTitle: 'T', listColor: '#ffd1dc' },
    ]
    const wrapper = mount(TaskList, {
      props: { listTitle: 'Julie', listColor: '#ffd1dc', tasks },
    })

    expect(wrapper.findComponent({ name: 'TaskItem' }).props('isDark')).toBe(false)
  })

  it('expose les computeds vestigiaux (tri, stats, complétées)', () => {
    const tasks = [
      { id: 'p', title: 'B-Parent', status: 'needsAction', level: 0, taskListTitle: 'T', listColor: 'red' },
      { id: 'c', title: 'Child', status: 'needsAction', level: 1, parent: 'p', taskListTitle: 'T', listColor: 'red' },
      { id: 'orphan', title: 'A-Orphan', status: 'needsAction', level: 1, parent: 'zzz', taskListTitle: 'T', listColor: 'red' },
    ]
    const wrapper = mount(TaskList, {
      props: { listTitle: 'Test', listColor: 'red', tasks },
    })
    const vm = wrapper.vm as any

    expect(vm.sortedTasks.map((t: any) => t.id)).toEqual(['orphan', 'p', 'c'])
    expect(vm.taskStats.size).toBe(0)
    expect(vm.completedTasks).toEqual([])
    expect(vm.tasksMap.get('p').title).toBe('B-Parent')
  })

  describe('défilement vertical automatique', () => {
    function makeScrollable(wrapper: ReturnType<typeof mount>, total = 120, visible = 100) {
      const el = wrapper.find('.tasks-container').element as HTMLElement
      Object.defineProperty(el, 'scrollHeight', { value: total, configurable: true })
      Object.defineProperty(el, 'clientHeight', { value: visible, configurable: true })
      return el
    }

    it('descend, fait une pause en bas puis remonte', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TaskList, {
        props: {
          listTitle: 'Test',
          listColor: 'red',
          tasks: [] as any[],
        },
      })
      const el = makeScrollable(wrapper) // amplitude 20 px

      // Le watch tasks 0 → 1 déclenche le scroll après 100 ms
      await wrapper.setProps({
        tasks: [
          { id: '1', title: 'X', status: 'needsAction', level: 0, taskListTitle: 'T', listColor: 'red' },
        ],
      })
      // Le setTimeout du onMounted (1 s) relance startVerticalScroll : on
      // attend qu'il soit passé pour que la pause initiale parte de là
      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(5000) // pause initiale
      await vi.advanceTimersByTimeAsync(20 * 50) // descente complète (20 px)

      expect(el.scrollTop).toBe(20)

      await vi.advanceTimersByTimeAsync(5000) // pause en bas
      await vi.advanceTimersByTimeAsync(20 * 50) // remontée complète

      expect(el.scrollTop).toBe(0)

      // Pause en haut puis redescente
      await vi.advanceTimersByTimeAsync(5000)
      await vi.advanceTimersByTimeAsync(100)
      expect(el.scrollTop).toBeGreaterThan(0)

      wrapper.unmount() // couvre clearVerticalScroll
      vi.useRealTimers()
    })

    it('ne défile pas pour un dépassement minuscule (< 12 px)', async () => {
      vi.useFakeTimers()
      const wrapper = mount(TaskList, {
        props: { listTitle: 'Test', listColor: 'red', tasks: [] },
      })
      const el = makeScrollable(wrapper, 105, 100) // amplitude 5 px

      await vi.advanceTimersByTimeAsync(1000) // déclenchement onMounted
      await vi.advanceTimersByTimeAsync(10000)

      expect(el.scrollTop).toBe(0)
      wrapper.unmount()
      vi.useRealTimers()
    })
  })
})