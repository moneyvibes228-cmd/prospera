'use client'
import { useQuery } from '@tanstack/react-query'
import { endpoints } from '@/lib/api'
import { MOCK_BORROWERS } from '@/lib/mockMicrofinance'
import { getSessionClient } from '@/lib/clients-session'
import type { Borrower, BorrowerFilters } from '@/types'

export function useBorrowers(filters?: BorrowerFilters) {
  return useQuery<Borrower[]>({
    queryKey: ['borrowers', filters],
    queryFn: async () => {
      try {
        const res = await endpoints.borrowers(filters)
        return res.data
      } catch {
        // Filtrage côté mock si l'API est indisponible
        let data = [...MOCK_BORROWERS]
        if (filters?.statut) data = data.filter(b => b.statut === filters.statut)
        if (filters?.zone) data = data.filter(b => b.zone === filters.zone)
        if (filters?.scoreMin !== undefined) data = data.filter(b => b.score_ia >= (filters.scoreMin ?? 0))
        if (filters?.scoreMax !== undefined) data = data.filter(b => b.score_ia <= (filters.scoreMax ?? 100))
        return data
      }
    },
    staleTime: 60_000,
  })
}

export function useBorrower(id: string) {
  return useQuery<Borrower>({
    queryKey: ['borrower', id],
    queryFn: async () => {
      try {
        const res = await endpoints.borrower(id)
        return res.data
      } catch {
        const session = getSessionClient(id)
        const found = session ?? MOCK_BORROWERS.find(b => b.id === id)
        if (!found) throw new Error('Emprunteur introuvable')
        return {
          ...found,
          historique_paiements: [
            { id: 'p1', borrowerId: id, montant: Math.round(found.montant_credit / 12), type: 'REMBOURSEMENT', canal: 'MOBILE_MONEY', date: '2026-04-01', agent: found.agent.nom },
            { id: 'p2', borrowerId: id, montant: Math.round(found.montant_credit / 12), type: 'REMBOURSEMENT', canal: 'ESPECES',       date: '2026-03-01', agent: found.agent.nom },
            { id: 'p3', borrowerId: id, montant: Math.round(found.montant_credit / 24), type: 'PARTIEL',       canal: 'MOBILE_MONEY', date: '2026-02-01', agent: found.agent.nom },
          ],
          visites: [
            { id: 'vs1', borrowerId: id, borrowerNom: found.nom, agentId: found.agent.id, agentNom: found.agent.nom, lat: found.lat, lng: found.lng, adresse: `${found.zone}`, methode: 'VISITE_TERRAIN', statut: 'POSITIVE', commentaire: 'Visite de suivi mensuel — situation stable.', date: '2026-04-15' },
            { id: 'vs2', borrowerId: id, borrowerNom: found.nom, agentId: found.agent.id, agentNom: found.agent.nom, lat: found.lat, lng: found.lng, adresse: `${found.zone}`, methode: 'APPEL',          statut: 'POSITIVE', commentaire: 'Contact téléphonique — engagement confirmé.', date: '2026-03-20' },
          ],
          alertes_ia: found.score_ia < 40 ? [
            { id: 'al1', borrowerId: id, borrowerNom: found.nom, severity: 'CRITIQUE' as const, type: 'DEFAUT_PREVU' as const, message: `Retard J+${found.retard_jours} — risque de défaut élevé`, action_recommandee: 'Escalade superviseur', retard_jours: found.retard_jours, score_ia: found.score_ia, agentNom: found.agent.nom, createdAt: new Date().toISOString() },
          ] : found.score_ia < 70 ? [
            { id: 'al1', borrowerId: id, borrowerNom: found.nom, severity: 'SURVEILLANCE' as const, type: 'SCORE_BAISSE' as const, message: `Score en baisse — à surveiller`, action_recommandee: 'Appel de rappel', retard_jours: found.retard_jours, score_ia: found.score_ia, agentNom: found.agent.nom, createdAt: new Date().toISOString() },
          ] : [],
        }
      }
    },
    enabled: !!id,
  })
}
