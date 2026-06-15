'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/lib/auth'
import { getStoredUser, saveUser, clearUser, setAuthCookie } from '@/lib/auth'
import { clearSessionSource, getSessionSource, saveSessionSource, type SessionSource } from '@/lib/session-source'
import { phase1 } from '@/lib/api-phase1'
import { mapApiUserToAuthUser } from '@/lib/api-role-map'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  sessionSource: SessionSource | null
  login: (user: AuthUser, options?: { token?: string; source?: SessionSource }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  sessionSource: null,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [sessionSource, setSessionSource] = useState<SessionSource | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('prospera_token') : null

      if (token) {
        try {
          const res = await phase1.auth.me()
          if (!cancelled) {
            const authUser = mapApiUserToAuthUser(res.data)
            setUser(authUser)
            setSessionSource('api')
            saveSessionSource('api')
            saveUser(authUser)
            setAuthCookie(authUser.id)
          }
          return
        } catch {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('prospera_token')
          }
        }
      }

      const stored = getStoredUser()
      const source = getSessionSource()
      if (!cancelled && stored) {
        setUser(stored)
        setSessionSource(source ?? 'mock')
      }
    }

    restoreSession().finally(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback((authUser: AuthUser, options?: { token?: string; source?: SessionSource }) => {
    const source: SessionSource = options?.source ?? (options?.token ? 'api' : 'mock')
    setUser(authUser)
    setSessionSource(source)
    saveSessionSource(source)
    saveUser(authUser)
    setAuthCookie(authUser.id)
    if (source === 'api' && options?.token) {
      localStorage.setItem('prospera_token', options.token)
    } else {
      localStorage.removeItem('prospera_token')
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await phase1.auth.logout()
    } catch {
      // API indisponible — déconnexion locale uniquement
    }
    setUser(null)
    setSessionSource(null)
    clearUser()
    clearSessionSource()
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionSource, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
