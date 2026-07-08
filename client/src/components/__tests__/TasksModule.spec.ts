import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import TasksModule from '../TasksModule.vue'

// Store mocké réactif pour que computed/watch du composant réagissent
const mockTasksStore = reactive({
  loading: false,
  error: null as string | null,
  tasks: [] as any[],
  startPolling: vi.fn(),
  fetchTasks: vi.fn(async () => {}),
})

vi.mock('../../stores/tasksStore', () => ({
  useTasksStore: () => mockTasksStore,
}))

function task(id: number, list: string, color = 'red') {
  return { id, title: `T${id}`, status: 'needsAction', level: 0, taskListTitle: list, listColor: color }
}

function sizeContainer(wrapper: ReturnType<typeof mount>, scrollWidth: number, clientWidth: number) {
  const el = wrapper.find('.tasks-container').element as HTMLElement
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
  return el
}

describe('TasksModule', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockTasksStore.loading = false
    mockTasksStore.error = null
    mockTasksStore.tasks = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows loading state when loading', () => {
    mockTasksStore.loading = true

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })

    expect(wrapper.text()).toContain('Chargement...')
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
  })

  it('shows error display when error', () => {
    mockTasksStore.error = 'Network error'

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('network')
  })

  it('shows no data error when no tasks', () => {
    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })

    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ErrorDisplay' }).props('type')).toBe('no-data')
  })

  it('renders task lists when tasks exist and starts polling', () => {
    mockTasksStore.tasks = [task(1, 'List 1'), task(2, 'List 1'), task(3, 'List 2', 'blue')]

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })

    expect(wrapper.findAllComponents({ name: 'TaskList' })).toHaveLength(2)
    expect(mockTasksStore.startPolling).toHaveBeenCalled()
  })

  it('centre la liste la plus fournie', () => {
    mockTasksStore.tasks = [
      task(1, 'Grosse'), task(2, 'Grosse'), task(3, 'Grosse'),
      task(4, 'Moyenne'), task(5, 'Moyenne'),
      task(6, 'Petite'),
    ]

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })

    const titles = wrapper
      .findAllComponents({ name: 'TaskList' })
      .map((c) => c.props('listTitle'))
    expect(titles).toHaveLength(3)
    expect(titles[1]).toBe('Grosse') // la plus grosse au centre
    expect(titles).toEqual(expect.arrayContaining(['Petite', 'Moyenne', 'Grosse']))
  })

  it('applique une couleur par défaut si listColor est absent', () => {
    mockTasksStore.tasks = [{ ...task(1, 'Sans couleur'), listColor: undefined }]

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })

    expect(wrapper.findComponent({ name: 'TaskList' }).props('listColor')).toBe('#ccc')
  })

  it('cycle complet : timer gauche → scroll droite → timer droit → retour', async () => {
    vi.useFakeTimers()
    mockTasksStore.tasks = [task(1, 'A'), task(2, 'B', 'blue')]

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })
    await flushPromises()
    const el = sizeContainer(wrapper, 216, 100) // amplitude 116 px

    await vi.advanceTimersByTimeAsync(1000) // déclenchement post-mount
    expect(wrapper.find('.progress-bar').exists()).toBe(true)
    expect(wrapper.find('.progress-bar').classes()).toContain('progress-left')

    await vi.advanceTimersByTimeAsync(10000) // fin du timer gauche
    // Défilement vers la droite : 116 px à 2 px / 25 ms
    await vi.advanceTimersByTimeAsync(58 * 25 + 25)
    expect(el.scrollLeft).toBe(116)

    expect(wrapper.find('.progress-bar').exists()).toBe(true)
    expect(wrapper.find('.progress-bar').classes()).toContain('progress-right')

    await vi.advanceTimersByTimeAsync(10000) // fin du timer droit
    await vi.advanceTimersByTimeAsync(58 * 25 + 25) // retour à gauche
    expect(el.scrollLeft).toBe(0)

    wrapper.unmount() // couvre stopHorizontalScroll
  })

  it('sans dépassement significatif, alterne les timers sans défiler', async () => {
    vi.useFakeTimers()
    mockTasksStore.tasks = [task(1, 'A')]

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })
    await flushPromises()
    const el = sizeContainer(wrapper, 110, 100) // dépassement 10 px < 16

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.find('.progress-bar').classes()).toContain('progress-left')

    await vi.advanceTimersByTimeAsync(10000)
    expect(el.scrollLeft).toBe(0)
    expect(wrapper.find('.progress-bar').classes()).toContain('progress-right')

    wrapper.unmount()
  })

  it('le démontage en plein défilement nettoie l’intervalle de scroll', async () => {
    vi.useFakeTimers()
    mockTasksStore.tasks = [task(1, 'A'), task(2, 'B', 'blue')]

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })
    await flushPromises()
    const el = sizeContainer(wrapper, 216, 100)

    await vi.advanceTimersByTimeAsync(1000) // timer gauche démarré
    await vi.advanceTimersByTimeAsync(10000) // fin du timer → scroll en cours
    await vi.advanceTimersByTimeAsync(200) // quelques pas de scroll
    expect(el.scrollLeft).toBeGreaterThan(0)

    wrapper.unmount()
    const frozen = el.scrollLeft
    await vi.advanceTimersByTimeAsync(1000)
    expect(el.scrollLeft).toBe(frozen) // plus aucun défilement après démontage
  })

  it('redémarre le cycle quand le nombre de listes change', async () => {
    vi.useFakeTimers()
    mockTasksStore.tasks = [task(1, 'A')]

    const wrapper = mount(TasksModule, { stubs: ['TaskList'] })
    await flushPromises()
    sizeContainer(wrapper, 216, 100)

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)

    // Nouvelle liste → le watch stoppe puis relance après 500 ms
    mockTasksStore.tasks = [task(1, 'A'), task(2, 'B', 'blue')]
    await flushPromises()
    expect(wrapper.find('.progress-bar').exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(500)
    expect(wrapper.find('.progress-bar').exists()).toBe(true)

    wrapper.unmount()
  })
})
