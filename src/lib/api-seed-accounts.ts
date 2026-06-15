/**
 * Comptes seed API Phase 1 — alignés sur API_MICROFINANCE_PHASE1.md §0.6
 * Mot de passe : password123
 */
export const API_SEED_ACCOUNTS = [
  {
    label: 'DG',
    identifiant: 'dg@imf-togo.com',
    telephone: '+22890000001',
    roleApi: 'DIRECTEUR_GENERAL',
  },
  {
    label: 'RCC',
    identifiant: 'rop.commercial@imf-togo.com',
    telephone: '+22890000003',
    roleApi: 'RESPONSABLE_COMMERCIAL_COLLECTE',
  },
  {
    label: 'RA Lomé',
    identifiant: 'ra.lome@imf-togo.com',
    telephone: '+22890000004',
    roleApi: 'RESPONSABLE_AGENCE',
  },
  {
    label: 'RA Adidogomé',
    identifiant: 'ra.adido@imf-togo.com',
    telephone: '+22890000005',
    roleApi: 'RESPONSABLE_AGENCE',
  },
  {
    label: 'Agent Lomé',
    identifiant: 'agent.lome@imf-togo.com',
    telephone: '+22890000006',
    roleApi: 'AGENT_TERRAIN',
  },
  {
    label: 'Agent Adidogomé',
    identifiant: 'agent.adido@imf-togo.com',
    telephone: '+22890000009',
    roleApi: 'AGENT_TERRAIN',
  },
  {
    label: 'ROC',
    identifiant: 'rop.credit@imf-togo.com',
    telephone: '+22890000002',
    roleApi: 'RESPONSABLE_OPERATION_CREDIT',
  },
  {
    label: 'GP',
    identifiant: 'gp@imf-togo.com',
    telephone: '+22890000012',
    roleApi: 'GESTIONNAIRE_PORTEFEUILLE',
  },
] as const

export const API_SEED_PASSWORD = 'password123'
