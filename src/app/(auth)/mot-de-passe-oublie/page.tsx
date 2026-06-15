'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react'
import { DEMO_USERS } from '@/lib/auth'

type Step = 'email' | 'code' | 'reset' | 'success'

export default function MotDePasseOubliePage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Code démo simulé
  const DEMO_CODE = '123456'

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const exists = DEMO_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())
    if (!exists) {
      setError('Aucun compte trouvé avec cet email.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('code')
    }, 1200)
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (code !== DEMO_CODE) {
      setError('Code invalide. Utilisez : 123456')
      return
    }
    setStep('reset')
  }

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('success')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Prospera</h1>
          <p className="text-slate-400 text-sm mt-1">Récupération de compte</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Étape 1 — Email */}
          {step === 'email' && (
            <>
              <div className="flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl mb-4 mx-auto">
                <Mail size={22} className="text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 text-center mb-1">Mot de passe oublié</h2>
              <p className="text-slate-400 text-sm text-center mb-6">
                Entrez votre email pour recevoir un code de réinitialisation.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@imf-togo.com"
                    required
                    autoFocus
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Envoi...</> : 'Envoyer le code'}
                </button>
              </form>
            </>
          )}

          {/* Étape 2 — Code OTP */}
          {step === 'code' && (
            <>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-4 mx-auto">
                <Mail size={22} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 text-center mb-1">Vérification</h2>
              <p className="text-slate-400 text-sm text-center mb-1">
                Un code a été envoyé à
              </p>
              <p className="text-teal-600 text-sm font-medium text-center mb-6">{email}</p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4">
                <p className="text-xs text-amber-700 text-center">
                  Code de vérification : <span className="font-bold tracking-widest">123456</span>
                </p>
              </div>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Code de vérification</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-center tracking-[0.3em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm"
                >
                  Vérifier le code
                </button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-slate-500 hover:text-slate-700 text-sm"
                >
                  Renvoyer le code
                </button>
              </form>
            </>
          )}

          {/* Étape 3 — Nouveau mot de passe */}
          {step === 'reset' && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Nouveau mot de passe</h2>
              <p className="text-slate-400 text-sm mb-6">Choisissez un mot de passe sécurisé.</p>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    required
                    autoFocus
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {/* Indicateur de force */}
                  {newPassword.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          newPassword.length >= i * 2
                            ? newPassword.length < 6 ? 'bg-red-400'
                            : newPassword.length < 10 ? 'bg-orange-400'
                            : 'bg-green-500'
                            : 'bg-slate-200'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Réinitialisation...</> : 'Réinitialiser le mot de passe'}
                </button>
              </form>
            </>
          )}

          {/* Étape 4 — Succès */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mx-auto mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Mot de passe réinitialisé</h2>
              <p className="text-slate-500 text-sm mb-6">
                Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link
                href="/login"
                className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm text-center transition-colors"
              >
                Se connecter
              </Link>
            </div>
          )}

          {/* Retour login */}
          {step !== 'success' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          Prospera by Money Vibes · © 2026
        </p>
      </div>
    </div>
  )
}
