import type { AuthSession } from './authApi'

const TOKEN_KEY = 'global_stock_token'
const USER_KEY = 'global_stock_user'

export function saveSession(session: AuthSession) {
  localStorage.setItem(TOKEN_KEY, session.token)
  localStorage.setItem(USER_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getSessionUser(): AuthSession | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getSessionToken())
}
