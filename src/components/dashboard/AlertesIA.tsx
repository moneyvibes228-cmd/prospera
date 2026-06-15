'use client'
import Link from 'next/link'
import type { AIAlert } from '@/types'

const SEED_ALERTES: AIAlert[] = [
  {
    id: '1', borrowerId: 'b1', borrowerNom: 'Kwami Ekpé',
    severity: 'CRITIQUE', type: 'DEFAUT_PREVU',
    message: 'Défaut J+45 détecté', action_recommandee: 'Escalade superviseur',
    retard_jours: 45, score_ia: 22, agentNom: 'Kofi Amavi',
    createdAt: new Date().toISOString()
  },
  {
    id: '2', borrowerId: 'b2', borrowerNom: 'Enyonam Kpade',
    severity: 'CRITIQUE', type: 'DEFAUT_PREVU',
    message: 'Défaut J+38 — risque élevé', action_recommandee: 'Visite terrain urgente',
    retard_jours: 38, score_ia: 18, agentNom: 'Akua Lawson',
    createdAt: new Date().toISOString()
  },
  {
    id: '3', borrowerId: 'b3', borrowerNom: 'Togbui Apedo',
    severity: 'CRITIQUE', type: 'RETARD_J7',
    message: 'Restructuré J+62 — suivi requis', action_recommandee: 'Révision du plan',
    retard_jours: 62, score_ia: 31, agentNom: 'Edem Kpélim',
    createdAt: new Date().toISOString()
  },
  {
    id: '4', borrowerId: 'b4', borrowerNom: 'Komi Akléssoé',
    severity: 'SURVEILLANCE', type: 'RETARD_J7',
    message: 'Retard J+8 — surveiller', action_recommandee: 'Appel de rappel',
    retard_jours: 8, score_ia: 58, agentNom: 'Kofi Amavi',
    createdAt: new Date().toISOString()
  },
  {
    id: '5', borrowerId: 'b5', borrowerNom: 'Abla Fiagbedzi',
    severity: 'SURVEILLANCE', type: 'SCORE_BAISSE',
    message: 'Retard J+12 — score en baisse', action_recommandee: 'Relance SMS',
    retard_jours: 12, score_ia: 52, agentNom: 'Akua Lawson',
    createdAt: new Date().toISOString()
  },
]

interface AlertesIAProps {
  alertes?: AIAlert[]
}

export function AlertesIA({ alertes }: AlertesIAProps) {
  const data = alertes && alertes.length > 0 ? alertes.slice(0, 5) : SEED_ALERTES

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Alertes IA urgentes</h3>
          <p className="text-xs text-slate-500 mt-0.5">Nécessitent une action immédiate</p>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
          {data.filter(a => a.severity === 'CRITIQUE').length} critiques
        </span>
      </div>

      <div className="space-y-3">
        {data.map((alerte) => (
          <div
            key={alerte.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              alerte.severity === 'CRITIQUE'
                ? 'bg-red-50 border-red-100'
                : 'bg-orange-50 border-orange-100'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${
                alerte.severity === 'CRITIQUE' ? 'bg-red-500 animate-pulse' : 'bg-orange-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900 truncate">{alerte.borrowerNom}</span>
                <span className="text-xs font-bold text-slate-500 flex-shrink-0">
                  Score: {alerte.score_ia}/100
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{alerte.message}</p>
              <p className="text-xs text-slate-500 mt-0.5">Action : {alerte.action_recommandee}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  alerte.severity === 'CRITIQUE'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {alerte.severity}
                </span>
                <Link
                  href={`/emprunteurs/${alerte.borrowerId}`}
                  className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                >
                  Voir fiche →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
