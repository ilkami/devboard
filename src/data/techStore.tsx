import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TECHNOLOGIES } from './mockData'
import type { Technology } from '../types'

/**
 * Справочник технологий.
 * Категория хранится рядом с названием, сокращением и цветом метки.
 * Новые технологии сохраняются в localStorage и попадают в панель на главной.
 */

export type TechCategory = 'language' | 'framework' | 'database' | 'devops'

export interface TechEntry extends Technology {
  category: TechCategory
}

export interface TechDraft {
  name: string
  short: string
  color: string
  category: TechCategory
}

export const CATEGORY_LABEL: Record<TechCategory, string> = {
  language: 'Язык',
  framework: 'Фреймворк',
  database: 'База данных',
  devops: 'DevOps',
}

export const CATEGORY_ORDER: TechCategory[] = ['language', 'framework', 'database', 'devops']

export const TECH_PALETTE = [
  '#3776AB',
  '#009688',
  '#336791',
  '#2496ED',
  '#61DAFB',
  '#3178C6',
  '#DC382D',
  '#7C5CFC',
  '#12B981',
  '#F5A524',
  '#EF4444',
  '#24292F',
]

const CATEGORY_BY_NAME: Record<string, TechCategory> = {
  Python: 'language',
  TypeScript: 'language',
  FastAPI: 'framework',
  React: 'framework',
  PostgreSQL: 'database',
  Redis: 'database',
  Docker: 'devops',
  'GitHub Actions': 'devops',
}

const STORAGE_KEY = 'devboard.technologies'

function seed(): TechEntry[] {
  return TECHNOLOGIES.map((tech) => ({
    ...tech,
    category: CATEGORY_BY_NAME[tech.name] ?? 'framework',
  }))
}

function load(): TechEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as TechEntry[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seed()
  } catch {
    return seed()
  }
}

function save(technologies: TechEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(technologies))
}

function makeShort(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '??'
  if (words.length === 1) return words[0].slice(0, 2)
  return (words[0][0] + words[1][0]).toUpperCase()
}

interface TechnologiesContextValue {
  technologies: TechEntry[]
  addTechnology: (draft: TechDraft) => string | null
  resetTechnologies: () => void
}

const TechnologiesContext = createContext<TechnologiesContextValue | null>(null)

export function TechnologiesProvider({ children }: { children: ReactNode }) {
  const [technologies, setTechnologies] = useState<TechEntry[]>(load)

  const resetTechnologies = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setTechnologies(seed())
  }, [])

  const addTechnology = useCallback(
    (draft: TechDraft): string | null => {
      const name = draft.name.trim()

      if (name.length < 2) return 'Название должно содержать минимум 2 символа'
      if (technologies.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return 'Такая технология уже есть в справочнике'
      }

      const entry: TechEntry = {
        name,
        short: draft.short.trim() ? draft.short.trim().slice(0, 3) : makeShort(name),
        color: draft.color,
        category: draft.category,
      }

      const next = [...technologies, entry]
      save(next)
      setTechnologies(next)
      return null
    },
    [technologies],
  )

  const value = useMemo<TechnologiesContextValue>(
    () => ({ technologies, addTechnology, resetTechnologies }),
    [technologies, addTechnology, resetTechnologies],
  )

  return <TechnologiesContext.Provider value={value}>{children}</TechnologiesContext.Provider>
}

export function useTechnologies(): TechnologiesContextValue {
  const context = useContext(TechnologiesContext)
  if (!context) {
    throw new Error('useTechnologies должен вызываться внутри TechnologiesProvider')
  }
  return context
}
