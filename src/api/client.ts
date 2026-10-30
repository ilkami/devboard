/**
 * HTTP-клиент DevBoard API.
 *
 * Особенности работы с сессией:
 *  - токены хранятся в HttpOnly-cookie, поэтому каждый запрос идёт с credentials: 'include';
 *  - CSRF-защита построена по схеме double-submit: сервер кладёт читаемую cookie csrf_token,
 *    клиент повторяет её значение в заголовке X-CSRF-Token;
 *  - при ответе 401 клиент один раз пытается обновить сессию через /auth/refresh
 *    и повторяет исходный запрос.
 */

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

/** Автономный HTML открывается через file:// — там API недоступен, работает локальный режим. */
export const API_ENABLED = typeof window !== 'undefined' && window.location.protocol !== 'file:'

const API_BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'
).replace(/\/$/, '')

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'X-CSRF-Token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function readCookie(name: string): string | null {
  const parts = document.cookie ? document.cookie.split(';') : []
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

function messageFromBody(body: unknown, status: number): string {
  if (typeof body === 'string' && body.trim()) return body
  if (body && typeof body === 'object') {
    const detail = (body as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (item && typeof item === 'object') {
            const entry = item as { msg?: string; loc?: unknown[] }
            const field = Array.isArray(entry.loc) ? entry.loc.slice(1).join('.') : ''
            return field ? `${field}: ${entry.msg ?? ''}` : entry.msg ?? ''
          }
          return String(item)
        })
        .filter(Boolean)
      if (parts.length > 0) return parts.join('; ')
    }
  }

  if (status === 401) return 'Требуется вход в систему'
  if (status === 403) return 'Действие запрещено'
  if (status === 404) return 'Запись не найдена'
  if (status === 409) return 'Такая запись уже существует'
  if (status >= 500) return 'Внутренняя ошибка сервера'
  return `Запрос завершился с кодом ${status}`
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Одновременные 401 не должны порождать несколько ротаций refresh-токена. */
let refreshPromise: Promise<boolean> | null = null

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })
        return response.ok
      } catch {
        return false
      } finally {
        // Разблокируем следующий цикл обновления после завершения текущего
        setTimeout(() => {
          refreshPromise = null
        }, 0)
      }
    })()
  }
  return refreshPromise
}

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  /** Повторять запрос после обновления токена (по умолчанию — да). */
  retryOnUnauthorized?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, retryOnUnauthorized = true } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const csrf = readCookie(CSRF_COOKIE)
  if (csrf) headers[CSRF_HEADER] = csrf

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'Не удалось связаться с API. Проверьте, что backend запущен на порту 8000 (см. README).',
      0,
    )
  }

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshed = await refreshSession()
    if (refreshed) {
      return request<T>(path, { ...options, retryOnUnauthorized: false })
    }
  }

  if (!response.ok) {
    const payload = await parseBody(response)
    throw new ApiError(messageFromBody(payload, response.status), response.status)
  }

  if (response.status === 204) return undefined as T

  const payload = await parseBody(response)
  return payload as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { refreshSession }
