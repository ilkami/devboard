import type { MilestoneItem, Project, TaskItem, Technology } from '../types'

/**
 * Демонстрационные данные интерфейса.
 * Даты считаются относительно текущего дня, чтобы приложение всегда выглядело «живым».
 * При подключении backend этот модуль заменяется вызовами API (см. tz-devboard.md, раздел 7).
 */

export const MONTHS_SHORT = [
  'янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.',
  'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.',
]

export const MONTHS_FULL = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const now = new Date()
export const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

export function addDays(offset: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
}

export function formatShortDate(date: Date | null): string {
  if (!date) return 'без срока'
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function daysUntil(date: Date | null): number {
  if (!date) return Number.POSITIVE_INFINITY
  return Math.round((date.getTime() - today.getTime()) / 86_400_000)
}

/** Значение для сортировки: записи без срока оказываются в конце списка. */
export function deadlineValue(date: Date | null): number {
  return date ? date.getTime() : Number.POSITIVE_INFINITY
}

export function isOverdue(date: Date | null): boolean {
  return daysUntil(date) < 0
}

export function relativeDeadline(date: Date | null): string {
  const days = daysUntil(date)
  if (!Number.isFinite(days)) return 'без срока'
  if (days < 0) return `просрочено на ${Math.abs(days)} дн.`
  if (days === 0) return 'сегодня'
  if (days === 1) return 'завтра'
  return `через ${days} дн.`
}

/* ------------------------------------------------------------------ */
/* Технологии                                                          */
/* ------------------------------------------------------------------ */

export const TECHNOLOGIES: Technology[] = [
  { name: 'Python', short: 'Py', color: '#3776AB' },
  { name: 'FastAPI', short: 'Fa', color: '#009688' },
  { name: 'PostgreSQL', short: 'Pg', color: '#336791' },
  { name: 'Docker', short: 'Do', color: '#2496ED' },
  { name: 'React', short: 'Re', color: '#61DAFB' },
  { name: 'TypeScript', short: 'TS', color: '#3178C6' },
  { name: 'Redis', short: 'Rd', color: '#DC382D' },
  { name: 'GitHub Actions', short: 'GA', color: '#24292F' },
]

export function technologyByName(name: string): Technology {
  return (
    TECHNOLOGIES.find((tech) => tech.name === name) ?? {
      name,
      short: name.slice(0, 2),
      color: '#7A86A3',
    }
  )
}

/* ------------------------------------------------------------------ */
/* Проекты                                                             */
/* ------------------------------------------------------------------ */

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Task Tracker API',
    short: 'TT',
    description: 'REST API для управления задачами с системой авторизации',
    status: 'active',
    icon: 'check-square',
    accent: '#3B62F6',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    progress: 75,
    dueDate: addDays(5),
  },
  {
    id: 'p2',
    name: 'Portfolio Website',
    short: 'PW',
    description: 'Личный сайт-портфолио с блогом и проектами',
    status: 'active',
    icon: 'globe',
    accent: '#7C5CFC',
    tech: ['React', 'TypeScript', 'Docker'],
    progress: 60,
    dueDate: addDays(12),
  },
  {
    id: 'p3',
    name: 'Telegram Bot',
    short: 'TB',
    description: 'Telegram-бот для записи и управления задачами',
    status: 'active',
    icon: 'send',
    accent: '#12B981',
    tech: ['Python', 'FastAPI', 'Redis'],
    progress: 40,
    dueDate: addDays(25),
  },
  {
    id: 'p4',
    name: 'AI Notes App',
    short: 'AN',
    description: 'Приложение для умных заметок с ИИ-ассистентом',
    status: 'active',
    icon: 'sparkles',
    accent: '#F5A524',
    tech: ['Python', 'React', 'PostgreSQL'],
    progress: 20,
    dueDate: addDays(40),
  },
  {
    id: 'p5',
    name: 'DevOps Playground',
    short: 'DP',
    description: 'Инфраструктура, деплой и автоматизация',
    status: 'active',
    icon: 'box',
    accent: '#3B62F6',
    tech: ['Python', 'Docker', 'GitHub Actions'],
    progress: 55,
    dueDate: addDays(18),
  },
  {
    id: 'p6',
    name: 'Study Tracker',
    short: 'ST',
    description: 'Трекер обучения и статистика решённых задач',
    status: 'paused',
    icon: 'book',
    accent: '#7C5CFC',
    tech: ['React', 'TypeScript', 'PostgreSQL'],
    progress: 30,
    dueDate: addDays(45),
  },
]

export const activeProjects = PROJECTS.filter((project) => project.status === 'active')

export const averageProgress =
  activeProjects.length === 0
    ? 0
    : Math.round(
        activeProjects.reduce((sum, project) => sum + project.progress, 0) /
          activeProjects.length,
      )

export const nearestDeadline = [...activeProjects].sort(
  (a, b) => deadlineValue(a.dueDate) - deadlineValue(b.dueDate),
)[0]

export function technologyUsage(): Array<Technology & { count: number }> {
  return TECHNOLOGIES.map((tech) => ({
    ...tech,
    count: PROJECTS.filter((project) => project.tech.includes(tech.name)).length,
  })).filter((tech) => tech.count > 0)
}

/* ------------------------------------------------------------------ */
/* Задачи                                                              */
/* ------------------------------------------------------------------ */

export const TASKS: TaskItem[] = [
  { id: 't1', title: 'Настройка авторизации JWT', project: 'Task Tracker API', priority: 'high', done: false, dueDate: addDays(0) },
  { id: 't2', title: 'Сверстать страницу профиля', project: 'Portfolio Website', priority: 'medium', done: false, dueDate: addDays(0) },
  { id: 't3', title: 'Подготовить Docker Compose', project: 'DevOps Playground', priority: 'high', done: false, dueDate: addDays(0) },
  { id: 't4', title: 'Написать миграции БД', project: 'Task Tracker API', priority: 'medium', done: false, dueDate: addDays(1) },
  { id: 't5', title: 'Завершить тестовый сценарий', project: 'DevOps Playground', priority: 'low', done: false, dueDate: addDays(2) },
  { id: 't6', title: 'Собрать Kanban-доску', project: 'Task Tracker API', priority: 'high', done: false, dueDate: addDays(3) },
  { id: 't7', title: 'Настроить Redis для кэша', project: 'Telegram Bot', priority: 'medium', done: false, dueDate: addDays(4) },
  { id: 't8', title: 'Подключить GitHub API', project: 'Portfolio Website', priority: 'medium', done: false, dueDate: addDays(6) },
  { id: 't9', title: 'Добавить ИИ-декомпозицию задач', project: 'AI Notes App', priority: 'low', done: false, dueDate: addDays(9) },
  { id: 't10', title: 'Настроить CI для сборки', project: 'DevOps Playground', priority: 'high', done: false, dueDate: addDays(-3) },
  { id: 't11', title: 'Сверстать экран отчётов', project: 'Study Tracker', priority: 'medium', done: false, dueDate: addDays(-1) },
  { id: 't12', title: 'Описать технические решения', project: 'AI Notes App', priority: 'low', done: false, dueDate: addDays(14) },
]

export function tasksForPeriod(period: 'today' | 'week' | 'all'): TaskItem[] {
  if (period === 'all') return TASKS
  const limit = period === 'today' ? 0 : 7
  return TASKS.filter((task) => daysUntil(task.dueDate) <= limit)
}

export const overdueTasks = TASKS.filter((task) => isOverdue(task.dueDate))

/* ------------------------------------------------------------------ */
/* Этапы и дедлайны                                                    */
/* ------------------------------------------------------------------ */

export const MILESTONES: MilestoneItem[] = [
  { id: 'm1', title: 'Завершить API аутентификации', project: 'Task Tracker API', date: addDays(5), color: '#3B62F6' },
  { id: 'm2', title: 'Релиз версии 1.0', project: 'Portfolio Website', date: addDays(12), color: '#7C5CFC' },
  { id: 'm3', title: 'Тестирование бота', project: 'Telegram Bot', date: addDays(25), color: '#12B981' },
  { id: 'm4', title: 'Презентация проекта', project: 'AI Notes App', date: addDays(40), color: '#F5A524' },
]
