import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, API_ENABLED, refreshSession } from '../api/client'
import type { ApiSession, ApiUser } from '../api/dto'
import { userFromApi } from '../api/mappers'

/**
 * Слой авторизации интерфейса.
 *
 * При работе через сервер сессия живёт в HttpOnly-cookie, которую выставляет FastAPI:
 * пароль проверяется по Argon2id-хешу в PostgreSQL, access-токен живёт 15 минут
 * и обновляется через /auth/refresh с ротацией refresh-токена.
 *
 * Автономная сборка (file://) работает без сервера: пользователи хранятся в localStorage,
 * пароль сохраняется только в виде SHA-256-хеша с индивидуальной солью.
 */

export interface AuthUser {
  id: string
  name: string
  email: string
  roleTitle: string
  createdAt: string
}

interface StoredUser extends AuthUser {
  passwordHash: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  roleTitle?: string
}

export interface LoginInput {
  email: string
  password: string
}

interface AuthContextValue {
  user: AuthUser | null
  /** true, пока проверяется сохранённая сессия (нужно, чтобы не мигать формой входа). */
  loading: boolean
  register: (input: RegisterInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
}

const USERS_KEY = 'devboard.users'
const SESSION_KEY = 'devboard.session'

const AuthContext = createContext<AuthContextValue | null>(null)

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toProfile(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleTitle: user.roleTitle,
    createdAt: user.createdAt,
  }
}

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buffer)
  } else {
    for (let index = 0; index < buffer.length; index += 1) {
      buffer[index] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Хеш пароля с солью. Основной путь — SHA-256 через Web Crypto. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const value = `${salt}::${password}`

  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  // Резервный вариант для окружений без Web Crypto
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0
  }
  return `fallback-${hash.toString(16)}`
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function initials(name: string): string {
  const value = initialsOf(name)
  return value || 'U'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (API_ENABLED) return null
    try {
      const id = localStorage.getItem(SESSION_KEY)
      if (!id) return null
      const found = readUsers().find((item) => item.id === id)
      return found ? toProfile(found) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(API_ENABLED)

  // Восстановление сессии: access-токен живёт 15 минут, поэтому при 401
  // пробуем обновить его refresh-токеном.
  useEffect(() => {
    if (!API_ENABLED) return

    let alive = true

    const restore = async () => {
      try {
        const profile = await api.get<ApiUser>('/auth/me')
        if (alive) setUser(userFromApi(profile))
      } catch {
        const refreshed = await refreshSession()
        if (!refreshed) return
        try {
          const profile = await api.get<ApiUser>('/auth/me')
          if (alive) setUser(userFromApi(profile))
        } catch {
          // сессия действительно истекла — остаёмся на форме входа
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    void restore()

    return () => {
      alive = false
    }
  }, [])

  const register = useCallback(async ({ name, email, password, roleTitle }: RegisterInput) => {
    if (API_ENABLED) {
      const session = await api.post<ApiSession>('/auth/register', {
        name: name.trim(),
        email: normaliseEmail(email),
        password,
        role_title: roleTitle?.trim() || 'Разработчик',
      })
      setUser(userFromApi(session.user))
      return
    }

    const cleanEmail = normaliseEmail(email)
    const users = readUsers()

    if (users.some((item) => item.email === cleanEmail)) {
      throw new Error('Пользователь с таким email уже зарегистрирован')
    }

    const salt = randomHex(16)
    const passwordHash = `${salt}:${await hashPassword(password, salt)}`

    const created: StoredUser = {
      id: `u-${Date.now().toString(36)}-${randomHex(3)}`,
      name: name.trim(),
      email: cleanEmail,
      roleTitle: roleTitle?.trim() || 'Разработчик',
      createdAt: new Date().toISOString(),
      passwordHash,
    }

    writeUsers([...users, created])
    localStorage.setItem(SESSION_KEY, created.id)
    setUser(toProfile(created))
  }, [])

  const login = useCallback(async ({ email, password }: LoginInput) => {
    if (API_ENABLED) {
      const session = await api.post<ApiSession>('/auth/login', {
        email: normaliseEmail(email),
        password,
      })
      setUser(userFromApi(session.user))
      return
    }

    const cleanEmail = normaliseEmail(email)
    const found = readUsers().find((item) => item.email === cleanEmail)

    if (!found) {
      throw new Error('Пользователь с таким email не зарегистрирован')
    }

    const [salt] = found.passwordHash.split(':')
    const candidate = `${salt}:${await hashPassword(password, salt)}`

    if (candidate !== found.passwordHash) {
      throw new Error('Неверный пароль')
    }

    localStorage.setItem(SESSION_KEY, found.id)
    setUser(toProfile(found))
  }, [])

  const logout = useCallback(async () => {
    if (API_ENABLED) {
      try {
        await api.post('/auth/logout')
      } catch {
        // даже если запрос не дошёл, локальное состояние нужно сбросить
      }
      setUser(null)
      return
    }

    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, register, login, logout }),
    [user, loading, register, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен вызываться внутри AuthProvider')
  }
  return context
}
