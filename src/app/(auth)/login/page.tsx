'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { DEMO_USERS, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth'
import { mapApiUserToAuthUser } from '@/lib/api-role-map'
import { phase1 } from '@/lib/api-phase1'
import { API_SEED_ACCOUNTS, API_SEED_PASSWORD } from '@/lib/api-seed-accounts'
import { API_ROLE_TO_FRONT } from '@/lib/api-role-map'
import { resolveRedirectForSession } from '@/lib/api-ui-switch'
import type { UserRole } from '@/types'
import type { AuthUser } from '@/lib/auth'
import { ProsperaLogoMark } from '@/components/brand/ProsperaLogoMark'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'
  const sessionReason = searchParams.get('reason')
  const { login } = useAuth()

  const [identifiant, setIdentifiant] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function finishDemoLogin(authUser: AuthUser) {
    login(authUser, { source: 'mock' })
    router.push(resolveRedirectForSession(redirectTo, 'mock'))
  }

  async function loginAsDemo(demoUser: (typeof DEMO_USERS)[number]) {
    setError('')
    setLoading(true)
    const { password: _pwd, ...authUser } = demoUser
    finishDemoLogin(authUser)
  }

  async function loginAsApiSeed(acc: (typeof API_SEED_ACCOUNTS)[number]) {
    setError('')
    setLoading(true)
    try {
      const res = await phase1.auth.login({
        identifiant: acc.identifiant,
        password: API_SEED_PASSWORD,
      })
      const token = res.data?.access_token
      const rawUser = res.data?.user
      if (!token || !rawUser) {
        setError('Réponse serveur invalide.')
        return
      }
      if (rawUser.actif === false) {
        setError('Compte désactivé. Contactez l’administrateur.')
        return
      }
      login(mapApiUserToAuthUser(rawUser), { token, source: 'api' })
      router.push(resolveRedirectForSession(redirectTo, 'api'))
    } catch {
      setError('Connexion serveur impossible ou identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const id = identifiant.trim()

    // Compte démo connu → mock direct (évite le 401 API quand le backend tourne)
    const demoMatch = DEMO_USERS.find(
      (u) =>
        (u.email.toLowerCase() === id.toLowerCase() || u.email === id) &&
        u.password === password,
    )
    if (demoMatch) {
      const { password: _pwd, ...authUser } = demoMatch
      finishDemoLogin(authUser)
      setLoading(false)
      return
    }

    try {
      const res = await phase1.auth.login({ identifiant: id, password })
      const token = res.data?.access_token
      const rawUser = res.data?.user
      if (token && rawUser) {
        if (rawUser.actif === false) {
          setError('Compte désactivé. Contactez l’administrateur.')
          setLoading(false)
          return
        }
        login(mapApiUserToAuthUser(rawUser), { token, source: 'api' })
        router.push(resolveRedirectForSession(redirectTo, 'api'))
        return
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        setError('Identifiant ou mot de passe incorrect.')
        setLoading(false)
        return
      }
      // API indisponible
    }

    setError('Connexion impossible. Vérifiez vos identifiants ou choisissez un compte ci-dessous.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <ProsperaLogoMark size="lg" className="mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Prospera</h1>
          <p className="text-slate-400 text-sm mt-1">Plateforme microfinance — Togo</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Connexion</h2>
          <p className="text-slate-400 text-sm mb-6">Accédez à votre espace Prospera</p>

          {sessionReason === 'session_expired' && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-amber-800">
              Session expirée — reconnectez-vous (JWT ~15 min).
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email ou téléphone
              </label>
              <input
                type="text"
                inputMode="email"
                autoComplete="username"
                value={identifiant}
                onChange={e => setIdentifiant(e.target.value)}
                placeholder="dg@imf-togo.com ou +22890000006"
                required
                autoFocus
                suppressHydrationWarning
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="text-red-500 text-sm mt-0.5">⚠</span>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Connexion en cours...</>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-slate-800 rounded-xl p-3 border border-teal-900/50">
          <div className="flex items-center gap-2 mb-2.5">
            <ShieldCheck size={13} className="text-teal-400" />
            <span className="text-xs font-semibold text-slate-300">Connexion serveur</span>
            <span className="ml-auto text-[10px] text-slate-500">cliquez</span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {API_SEED_ACCOUNTS.map(acc => {
              const frontRole = API_ROLE_TO_FRONT[acc.roleApi] as UserRole
              return (
                <button
                  key={acc.identifiant}
                  type="button"
                  onClick={() => void loginAsApiSeed(acc)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  <span className="text-slate-200 text-xs font-medium truncate">{acc.label}</span>
                  <span className="text-[10px] text-teal-400 shrink-0 ml-2">
                    {ROLE_LABELS[frontRole] ?? acc.roleApi}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Mot de passe : <span className="font-mono text-slate-400">{API_SEED_PASSWORD}</span>
          </p>
        </div>

        <div className="mt-3 bg-slate-800 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-2.5">
            <ShieldCheck size={13} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-400">Accès rapide</span>
            <span className="ml-auto text-[10px] text-slate-600">cliquez</span>
          </div>

          {/* Groupe Direction */}
          <div className="mb-1">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1">Direction & Contrôle</div>
            <div className="space-y-1">
              {DEMO_USERS.filter(u => ['MANAGER','RESPONSABLE_CREDIT','DAF','AUDITEUR'].includes(u.role)).map(u => (
                <button key={u.id} type="button" suppressHydrationWarning
                  onClick={() => void loginAsDemo(u)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${ROLE_COLORS[u.role]} flex items-center justify-center text-white font-bold shrink-0`} style={{ fontSize: u.initiales.length > 2 ? '8px' : '11px' }}>
                      {u.initiales}
                    </div>
                    <span className="text-slate-200 text-xs font-medium truncate">{u.nom}</span>
                  </div>
                  <span className="text-[10px] text-teal-400 font-medium shrink-0 ml-2">{ROLE_LABELS[u.role]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Groupe Agences & Crédit */}
          <div className="mb-1 mt-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1">Agences & Crédit</div>
            <div className="space-y-1">
              {DEMO_USERS.filter(u => ['GESTIONNAIRE','GESTIONNAIRE_PORTEFEUILLE','CREDIT'].includes(u.role)).map(u => (
                <button key={u.id} type="button" suppressHydrationWarning
                  onClick={() => void loginAsDemo(u)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${ROLE_COLORS[u.role]} flex items-center justify-center text-white font-bold shrink-0`} style={{ fontSize: u.initiales.length > 2 ? '8px' : '11px' }}>
                      {u.initiales}
                    </div>
                    <span className="text-slate-200 text-xs font-medium truncate">{u.nom}</span>
                  </div>
                  <span className="text-[10px] text-teal-400 font-medium shrink-0 ml-2">{ROLE_LABELS[u.role]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Groupe Commercial & Terrain & Communication */}
          <div className="mt-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1">Commercial, Terrain & Com.</div>
            <div className="space-y-1">
              {DEMO_USERS.filter(u => ['RESPONSABLE_COMMERCIAL','AGENT_TERRAIN','COLLECTRICE','COMMUNICATION'].includes(u.role)).map(u => (
                <button key={u.id} type="button" suppressHydrationWarning
                  onClick={() => void loginAsDemo(u)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${ROLE_COLORS[u.role]} flex items-center justify-center text-white font-bold shrink-0`} style={{ fontSize: u.initiales.length > 2 ? '8px' : '11px' }}>
                      {u.initiales}
                    </div>
                    <span className="text-slate-200 text-xs font-medium truncate">{u.nom}</span>
                  </div>
                  <span className="text-[10px] text-teal-400 font-medium shrink-0 ml-2">{ROLE_LABELS[u.role]}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 mt-2.5 text-center border-t border-slate-700 pt-2">Mot de passe universel : <span className="text-slate-400 font-mono">password123</span></p>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          Prospera by Money Vibes · © 2026
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
