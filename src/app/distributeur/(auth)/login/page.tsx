'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@distributeur/contexts/AuthContext'
import { DEMO_USERS, ROLE_LABELS, ROLE_COLORS } from '@distributeur/lib/auth'
import { ProsperaLogoMark } from '@distributeur/components/brand/ProsperaLogoMark'
import type { AuthUser } from '@distributeur/lib/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/distributeur/dashboard'
  const { login } = useAuth()
  const [identifiant, setIdentifiant] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function finishLogin(authUser: AuthUser) {
    login(authUser)
    router.push(redirectTo)
  }

  async function loginAsDemo(demoUser: (typeof DEMO_USERS)[number]) {
    setLoading(true)
    const { password: _pwd, ...authUser } = demoUser
    finishLogin(authUser)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const id = identifiant.trim().toLowerCase()
    const match = DEMO_USERS.find(u => u.email.toLowerCase() === id && u.password === password)
    if (match) {
      const { password: _pwd, ...authUser } = match
      finishLogin(authUser)
    } else {
      setError('Identifiant ou mot de passe incorrect.')
    }
    setLoading(false)
  }

  const groups = [
    { label: 'Direction & Finance', roles: ['DG', 'DC', 'DAF', 'COMPTABLE'] as const },
    { label: 'Commercial & Terrain', roles: ['RESP_VENTES', 'SUPERVISEUR', 'COMMERCIAL', 'FREELANCE', 'PROSPECTION'] as const },
    { label: 'Opérations', roles: ['RESP_STOCK', 'GEST_ENTREPOT', 'MARKETING', 'RECOUVREMENT'] as const },
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <ProsperaLogoMark size="lg" className="mb-4 rounded-2xl" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Prospera</h1>
          <p className="text-slate-400 text-sm mt-1">Distribution & Grossistes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Connexion</h2>
          <p className="text-slate-400 text-sm mb-6">Accédez à votre espace distributeur</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={identifiant} onChange={e => setIdentifiant(e.target.value)} placeholder="dg@demo.prospera.tg" required autoFocus
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>
        </div>

        <div className="mt-4 bg-slate-800 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-2.5">
            <ShieldCheck size={13} className="text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Accès rapide</span>
          </div>
          {groups.map(g => (
            <div key={g.label} className="mb-2">
              <div className="text-[9px] font-bold text-slate-500 uppercase px-1 mb-1">{g.label}</div>
              <div className="space-y-1">
                {DEMO_USERS.filter(u => (g.roles as readonly string[]).includes(u.role)).map(u => (
                  <button key={u.id} type="button" onClick={() => void loginAsDemo(u)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-left">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg ${ROLE_COLORS[u.role]} flex items-center justify-center text-white text-[10px] font-bold`}>{u.initiales}</div>
                      <span className="text-slate-200 text-xs truncate">{u.nom}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 shrink-0 ml-2">{ROLE_LABELS[u.role]}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-500 mt-2 text-center">Mot de passe : <span className="font-mono text-slate-400">password123</span></p>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">Prospera by Money Vibes · © 2026</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
