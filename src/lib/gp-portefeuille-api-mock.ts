import { getGpHubData } from '@/lib/gp-portefeuille-hub'
import { mockListDossiersCredit } from '@/lib/credit-mock-workflow'
import type {
  AgentMissionsResponse,
  PortefeuilleGpDossier,
} from '@/types/gestion-portefeuille'

/** Mock aligné GET /gestion-portefeuille/portefeuille */
export function mockPortefeuilleGp(): PortefeuilleGpDossier[] {
  const hub = getGpHubData()
  const gestion = mockListDossiersCredit().filter(
    (d) => d.statut === 'EN_GESTION' || d.statut === 'CLOTURE',
  )

  return gestion.map((d, i) => {
    const hubClient = hub.clients[i % hub.clients.length]
    const enRetard = (hubClient?.retard_j ?? 0) > 0
    return {
      dossier_id: d.id,
      reference: d.reference,
      statut: String(d.statut),
      montant_accorde: Number(d.montant_demande),
      mensualite: 45_833,
      client: {
        id: d.client.id,
        nom: d.client.nom,
        prenom: d.client.prenom,
        telephone: d.client.telephone,
      },
      en_retard: enRetard,
      jours_retard: hubClient?.retard_j,
      prochaine_echeance: enRetard ? null : '2026-06-15',
      montant_prochaine_echeance: 45_833,
      est_mauvais_payeur: enRetard && (hubClient?.retard_j ?? 0) > 15,
      a_agent_terrain: i % 2 === 0,
      agent_terrain:
        i % 2 === 0
          ? { id: 'agent-1', nom: 'Amavi', prenom: 'Kofi' }
          : null,
    }
  })
}

export function mockMauvaisPayeursGp(): PortefeuilleGpDossier[] {
  return mockPortefeuilleGp().filter((d) => d.est_mauvais_payeur || d.en_retard)
}

export function mockAgentMissions(): AgentMissionsResponse {
  const mp = mockMauvaisPayeursGp().slice(0, 4)
  return {
    missions_clients: mp.map((d) => ({
      client_id: d.client.id,
      client_nom: `${d.client.prenom} ${d.client.nom}`,
      dossiers: [
        {
          id: d.dossier_id,
          reference: d.reference,
          jours_retard: d.jours_retard ?? 0,
          montant_retard: d.montant_prochaine_echeance ?? undefined,
        },
      ],
    })),
    promesses_a_suivre: [
      {
        id: 'prom-mock-1',
        dossier_id: mp[0]?.dossier_id ?? 'DOS-MOCK',
        reference: mp[0]?.reference,
        client_nom: mp[0] ? `${mp[0].client.prenom} ${mp[0].client.nom}` : 'Client',
        montant_promis: 50_000,
        date_promesse: '2026-06-10',
        statut: 'ACTIVE',
        notes: 'Suivi terrain assigné',
      },
    ],
    activite_recente: [
      {
        id: 'vis-mock-1',
        date: '2026-05-27',
        objet_visite: 'RELANCE',
        client_nom: mp[0] ? `${mp[0].client.prenom} ${mp[0].client.nom}` : '—',
        dossier_reference: mp[0]?.reference,
        compte_rendu: 'Client promet paiement vendredi',
      },
    ],
  }
}
