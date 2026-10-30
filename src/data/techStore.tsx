import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TECHNOLOGIES } from './mockData'
import type { Technology } from '../types'
import { useAuth } from '../auth/AuthContext'
import { api, API_ENABLED } from '../api/client'
import type { ApiTechnology } from '../api/dto'
import { technologyFromApi } from '../api/mappers'

/**
 * Справочник технологий.
 *
 * В обычном режиме читается из /technologies (таблица technologies в PostgreSQL).
 * Автономная сборка (file://) хранит справочник в localStorage.
 */

export type TechCategory = 'language' | 'framework' | 'database' | 'devops'

export interface TechEntry extends Technology {
  /** Идентификатор в базе; в автономном режиме отсутствует. */
  id?: string
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

function seedLocal(): TechEntry[] {
  return TECHNOLOGIES.map((tech) => ({
    ...tech,
    category: CATEGORY_BY_NAME[tech.name] ?? 'framework',
  }))
}

function loadLocal(): TechEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedLocal()
    const parsed = JSON.parse(raw) as TechEntry[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedLocal()
  } catch {
    return seedLocal()
  }
}

function saveLocal(technologies: TechEntry[]): void {
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
  ready: boolean
  addTechnology: (draft: TechDraft) => Promise<string | null>
}

const TechnologiesContext = createContext<TechnologiesContextValue | null>(null)

export function TechnologiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [technologies, setTechnologies] = useState<TechEntry[]>(() =>
    API_ENABLED ? [] : loadLocal(),
  )
  const [ready, setReady] = useState(!API_ENABLED)

  const reload = useCallback(async () => {
    try {
      const items = await api.get<ApiTechnology[]>('/technologies')
      setTechnologies(items.map(technologyFromApi))
    } catch {
      setTechnologies([])
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!API_ENABLED) return
    if (!user) {
      setTechnologies([])
      setReady(false)
      return
    }
    void reload()
  }, [user, reload])

  const addTechnology = useCallback(
    async (draft: TechDraft): Promise<string | null> => {
      const name = draft.name.trim()

      if (name.length < 2) return 'Название должно содержать минимум 2 символа'
      if (technologies.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return 'Такая технология уже есть в справочнике'
      }

      const short = draft.short.trim() ? draft.short.trim().slice(0, 3) : makeShort(name)

      if (API_ENABLED) {
        try {
          const created = await api.post<ApiTechnology>('/technologies', {
            name,
            short,
            color: draft.color,
            category: draft.category,
          })
          setTechnologies((prev) => [...prev, technologyFromApi(created)])
          return null
        } catch (cause) {
          return cause instanceof Error ? cause.message : 'Не удалось добавить технологию'
        }
      }

      const entry: TechEntry = { name, short, color: draft.color, category: draft.category }
      const next = [...technologies, entry]
      saveLocal(next)
      setTechnologies(next)
      return null
    },
    [technologies],
  )

  const value = useMemo<TechnologiesContextValue>(
    () => ({ technologies, ready, addTechnology }),
    [technologies, ready, addTechnology],
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
