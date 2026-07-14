'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@distributeur/lib/auth'
import { ENTREPRISE_REGISTRY } from '@distributeur/lib/registries/entreprise-registry'
import { getStoredUser, saveUser, clearUser, setAuthCookie } from '@distributeur/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      const entreprise = stored.entreprise === 'BB Lomé' ? ENTREPRISE_REGISTRY.nom : stored.entreprise
      const synced = entreprise !== stored.entreprise ? { ...stored, entreprise } : stored
      if (synced !== stored) saveUser(synced)
      setUser(synced)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((authUser: AuthUser) => {
    setUser(authUser)
    saveUser(authUser)
    setAuthCookie(authUser.id)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    clearUser()
    router.push('/distributeur/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
