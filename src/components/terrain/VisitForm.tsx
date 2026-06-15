'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Navigation, Loader2 } from 'lucide-react'
import { ProximityAlert } from './ProximityAlert'
import { useCreateVisit } from '@/hooks/useVisits'
import { useVisitNearby } from '@/hooks/useVisits'
import { useAuth } from '@/contexts/AuthContext'
import type { ContactMethod, VisitStatus } from '@/types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function DraggableMarker({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null)
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return (
    <Marker
      position={[lat, lng]}
      ref={markerRef}
      draggable
      eventHandlers={{
        dragend() {
          const m = markerRef.current
          if (m) {
            const pos = m.getLatLng()
            onChange(pos.lat, pos.lng)
          }
        },
      }}
    />
  )
}

export function VisitForm() {
  const router = useRouter()
  const { user } = useAuth()
  const createVisit = useCreateVisit()

  const [borrowerNom, setBorrowerNom] = useState('')
  const [telephoneProspect, setTelephoneProspect] = useState('')
  const [borrowerId, setBorrowerId] = useState('')
  const [methode, setMethode] = useState<ContactMethod>('VISITE_TERRAIN')
  const [statut, setStatut] = useState<VisitStatus>('POSITIVE')
  const [commentaire, setCommentaire] = useState('')
  const [lat, setLat] = useState(6.1374)
  const [lng, setLng] = useState(1.2123)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { data: nearbyVisits } = useVisitNearby(lat, lng, true)

  const handleDetectGPS = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setGpsLoading(false)
      },
      () => setGpsLoading(false)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createVisit.mutateAsync({
        borrowerId: borrowerId || undefined,
        borrowerNom,
        nom_prospect: !borrowerId ? borrowerNom : undefined,
        telephone_prospect: !borrowerId ? telephoneProspect : undefined,
        objet_visite: methode,
        agentId: user?.id ?? '1',
        agentNom: user?.nom ?? 'Agent',
        lat,
        lng,
        adresse: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        methode,
        statut,
        commentaire,
        date: new Date().toISOString(),
      } as Parameters<typeof createVisit.mutateAsync>[0])
      setSuccess(true)
      setTimeout(() => router.push('/terrain'), 1500)
    } catch (e) {
      // continuer
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-green-600 text-xl">✓</span>
        </div>
        <p className="text-slate-700 font-medium">Visite enregistrée avec succès !</p>
        <p className="text-slate-500 text-sm mt-1">Redirection en cours...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Formulaire */}
      <div className="col-span-12 lg:col-span-5">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nom de l&apos;emprunteur *
            </label>
            <input
              type="text"
              value={borrowerNom}
              onChange={e => setBorrowerNom(e.target.value)}
              placeholder="Akossiwa Mensah..."
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              ID client (si déjà en base)
            </label>
            <input
              type="text"
              value={borrowerId}
              onChange={e => setBorrowerId(e.target.value)}
              placeholder="UUID client — laisser vide pour prospect"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {!borrowerId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Téléphone prospect *
              </label>
              <input
                type="tel"
                required={!borrowerId}
                value={telephoneProspect}
                onChange={e => setTelephoneProspect(e.target.value)}
                placeholder="+228 90 00 00 00"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Requis par POST /visites sans clientId</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Méthode de contact *
            </label>
            <select
              value={methode}
              onChange={e => setMethode(e.target.value as ContactMethod)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="VISITE_TERRAIN">Visite terrain</option>
              <option value="PORTE_A_PORTE">Porte-à-porte</option>
              <option value="APPEL">Appel</option>
              <option value="BROCHURE">Brochure</option>
              <option value="LETTRE">Lettre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Statut de la réponse *
            </label>
            <div className="flex gap-2">
              {(['POSITIVE', 'NEGATIVE', 'SANS_REPONSE'] as VisitStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatut(s)}
                  className={`flex-1 py-2 text-xs rounded-lg font-medium border transition-colors ${
                    statut === s
                      ? s === 'POSITIVE' ? 'bg-green-500 text-white border-green-500'
                        : s === 'NEGATIVE' ? 'bg-red-500 text-white border-red-500'
                        : 'bg-slate-500 text-white border-slate-500'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s === 'POSITIVE' ? 'Positive' : s === 'NEGATIVE' ? 'Négative' : 'Sans réponse'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Commentaire
            </label>
            <textarea
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Observations de terrain..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {nearbyVisits && nearbyVisits.length > 0 && (
            <ProximityAlert visits={nearbyVisits} />
          )}

          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={gpsLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-teal-200 text-teal-700 rounded-lg text-sm hover:bg-teal-50 transition-colors"
          >
            {gpsLoading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
            {gpsLoading ? 'Détection...' : 'Détecter ma position GPS'}
          </button>

          <button
            type="submit"
            disabled={createVisit.isPending}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {createVisit.isPending && <Loader2 size={15} className="animate-spin" />}
            {createVisit.isPending ? 'Enregistrement...' : 'Enregistrer la visite'}
          </button>
        </form>
      </div>

      {/* Carte interactive */}
      <div className="col-span-12 lg:col-span-7">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-medium text-slate-700">Position GPS</span>
            <div className="text-xs text-slate-400 mt-0.5">
              Lat: {lat.toFixed(4)} · Lng: {lng.toFixed(4)}
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <MapContainer
              center={[lat, lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <DraggableMarker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln) }} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
