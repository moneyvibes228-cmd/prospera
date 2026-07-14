'use client'

import { useState } from 'react'
import { X, MapPin, CheckCircle2, Crosshair, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import type { ResultatVisite, Visite } from '@/types'
import type { ClotureVisitePayload } from '@/contexts/TerrainWorkflowContext'
import { formatFcfa } from '@/lib/utils'
import { haversineKm } from '@/lib/cartographie-distance-builder'

/** Rayon en mètres sous lequel on considère l'agent « sur place ». */
const RAYON_GEOFENCE_M = 200

type EtatGeo =
  | { statut: 'idle' }
  | { statut: 'checking' }
  | { statut: 'ok'; metres: number }
  | { statut: 'loin'; metres: number }
  | { statut: 'erreur'; message: string }

interface Props {
  visite: Visite
  freelance: boolean
  onClose: () => void
  onConfirm: (payload: ClotureVisitePayload) => void
}

const RESULTATS: { value: ResultatVisite; label: string; className: string }[] = [
  { value: 'COMMANDE', label: 'Commande prise', className: 'peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600' },
  { value: 'ENCAISSEMENT', label: 'Encaissement', className: 'peer-checked:bg-teal-600 peer-checked:text-white peer-checked:border-teal-600' },
  { value: 'PROMESSE', label: 'Promesse', className: 'peer-checked:bg-amber-600 peer-checked:text-white peer-checked:border-amber-600' },
  { value: 'SANS_SUITE', label: 'Sans suite', className: 'peer-checked:bg-slate-700 peer-checked:text-white peer-checked:border-slate-700' },
  { value: 'ABSENT', label: 'Client absent', className: 'peer-checked:bg-slate-500 peer-checked:text-white peer-checked:border-slate-500' },
]

export function ClotureVisiteModal({ visite, freelance, onClose, onConfirm }: Props) {
  const [resultat, setResultat] = useState<ResultatVisite>('COMMANDE')
  const [montantCommande, setMontantCommande] = useState('')
  const [montantEncaisse, setMontantEncaisse] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [geo, setGeo] = useState<EtatGeo>({ statut: 'idle' })

  const attendCommande = resultat === 'COMMANDE'
  const attendEncaissement = resultat === 'ENCAISSEMENT' || resultat === 'COMMANDE'

  const geoDisponible = Number.isFinite(visite.lat) && Number.isFinite(visite.lng)

  function verifierPosition() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeo({ statut: 'erreur', message: 'GPS indisponible sur cet appareil.' })
      return
    }
    setGeo({ statut: 'checking' })
    navigator.geolocation.getCurrentPosition(
      pos => {
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, visite.lat, visite.lng)
        const metres = Math.round(km * 1000)
        setGeo(metres <= RAYON_GEOFENCE_M ? { statut: 'ok', metres } : { statut: 'loin', metres })
      },
      err => setGeo({
        statut: 'erreur',
        message: err.code === err.PERMISSION_DENIED
          ? 'Position refusée — activez la localisation pour vérifier.'
          : 'Position introuvable pour le moment.',
      }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }

  function distanceLabel(metres: number): string {
    return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
  }

  function valider() {
    // Trace du contrôle GPS dans le commentaire — audit léger du géofencing.
    const noteGeo = geo.statut === 'ok'
      ? `[GPS ✓ ${distanceLabel(geo.metres)} du PDV]`
      : geo.statut === 'loin'
        ? `[GPS ⚠ ${distanceLabel(geo.metres)} du PDV]`
        : ''
    const commentaireFinal = [commentaire.trim(), noteGeo].filter(Boolean).join(' ')
    onConfirm({
      resultat,
      montant_commande: attendCommande && montantCommande ? Number(montantCommande) : undefined,
      montant_encaisse: attendEncaissement && montantEncaisse ? Number(montantEncaisse) : undefined,
      commentaire: commentaireFinal || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 sticky top-0 bg-white">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">Clôturer la visite</h3>
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin size={11} className="shrink-0" /> {visite.pdv_nom} · {visite.zone}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-2 block">Résultat de la visite</label>
            <div className="grid grid-cols-2 gap-2">
              {RESULTATS.map(r => (
                <label key={r.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="resultat"
                    className="peer sr-only"
                    checked={resultat === r.value}
                    onChange={() => setResultat(r.value)}
                  />
                  <span className={`block text-center text-xs font-semibold px-2 py-2 rounded-lg border border-slate-200 text-slate-600 transition-colors ${r.className}`}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {attendCommande && (
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Montant commande {freelance && <span className="text-slate-400 font-normal">(tarif société)</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={montantCommande}
                  onChange={e => setMontantCommande(e.target.value)}
                  placeholder="0"
                  className="w-full pr-8 pl-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">F</span>
              </div>
            </div>
          )}

          {attendEncaissement && (
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Encaissé sur place <span className="text-slate-400 font-normal">(Mobile Money / espèces)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={montantEncaisse}
                  onChange={e => setMontantEncaisse(e.target.value)}
                  placeholder="0"
                  className="w-full pr-8 pl-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">F</span>
              </div>
            </div>
          )}

          {geoDisponible && (
            <div className="rounded-lg border border-slate-200 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Crosshair size={12} className="text-slate-400" /> Contrôle de présence (GPS)
                </span>
                <button
                  type="button"
                  onClick={verifierPosition}
                  disabled={geo.statut === 'checking'}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {geo.statut === 'checking' ? 'Vérification…' : 'Vérifier ma position'}
                </button>
              </div>
              {geo.statut === 'checking' && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Loader2 size={12} className="animate-spin" /> Lecture du GPS en cours…
                </p>
              )}
              {geo.statut === 'ok' && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck size={13} /> Sur place — à ~{distanceLabel(geo.metres)} du point de vente.
                </p>
              )}
              {geo.statut === 'loin' && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700">
                  <ShieldAlert size={13} className="shrink-0 mt-0.5" />
                  <span>Vous semblez à {distanceLabel(geo.metres)} du PDV. La clôture reste possible mais sera signalée.</span>
                </p>
              )}
              {geo.statut === 'erreur' && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                  <ShieldAlert size={13} className="shrink-0 mt-0.5" /> {geo.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Commentaire</label>
            <textarea
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              rows={2}
              placeholder="Observation terrain, prochaine action…"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            />
          </div>

          {(montantCommande || montantEncaisse) && (
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
              <span>Total visite</span>
              <span className="font-bold text-slate-900">
                {formatFcfa((Number(montantCommande) || 0) + (Number(montantEncaisse) || 0))} F
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-2 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={valider}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            <CheckCircle2 size={15} /> Clôturer
          </button>
        </div>
      </div>
    </div>
  )
}
