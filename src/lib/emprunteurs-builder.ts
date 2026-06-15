/**
 * Génération procédurale des emprunteurs réseau — 905 clients (Mai 2026).
 * Conserve les 14 emprunteurs nommés (b01–b14) + génère le reste par agence.
 */
import { AGENCES } from '@/lib/agences'
import { PORTEFEUILLE_AGENCES, commercialPourClientAgence } from '@/lib/portefeuille-agences-config'
import type { Borrower } from '@/types'

const PRENOMS = [
  'Akossiwa', 'Koffi', 'Ama', 'Edem', 'Mawu', 'Sena', 'Yawa', 'Komlan', 'Efua', 'Komi',
  'Afi', 'Mensah', 'Akua', 'Elom', 'Sika', 'Enyonam', 'Kodjo', 'Abla', 'Selom', 'Kafui',
  'Kwami', 'Mawunya', 'Kossi', 'Afi', 'Togbui', 'Dossi', 'Elinam', 'Komla', 'Sena', 'Kofi',
]
const NOMS = [
  'Mensah', 'Dossou', 'Amavi', 'Kpélim', 'Lawson', 'Adjavon', 'Kpodzo', 'Fiagbé', 'Atsu', 'Koffi',
  'Bessan', 'Attivor', 'Hounyo', 'Kpakpo', 'Togbui', 'Agbeko', 'Tchalla', 'Senyo', 'Kpodar', 'Adzro',
  'Hotor', 'Kpade', 'Afetogbo', 'Dewonou', 'Ekpé', 'Kokuvi', 'Apedo', 'Agbenoxevi', 'Togbedji', 'Akléssoé',
]

const STATUTS: Borrower['statut'][] = ['REMBOURSEMENT', 'REMBOURSEMENT', 'REMBOURSEMENT', 'RETARD', 'EVALUATION', 'INSTRUCTION']

function seeded(seed: number, max: number) {
  const x = Math.sin(seed * 12.9898 + max * 78.233) * 43758.5453
  return Math.floor((x - Math.floor(x)) * max)
}

function agentRef(nom: string, zone: string) {
  return {
    id: nom.toLowerCase().replace(/\s+/g, '-').slice(0, 12),
    nom,
    email: `${nom.toLowerCase().replace(/\s+/g, '.')}@prospera.tg`,
    role: 'COLLECTRICE' as const,
    zone,
    actif: true,
    createdAt: '2025-01-01',
  }
}

/** 14 emprunteurs nommés historiques (démo / alertes) */
export const EMPRUNTEURS_NOMES: Borrower[] = [
  { id: 'b01', nom: 'Akossiwa Mensah', telephone: '+228 90 11 22 33', score_ia: 87, score_tendance: 'STABLE', montant_credit: 450_000, montant_rembourse: 312_500, statut: 'REMBOURSEMENT', retard_jours: 0, agent: agentRef('Yawo Adjavon', 'Lomé Centre'), lat: 6.1380, lng: 1.2100, zone: 'Lomé Centre', derniere_visite: '2026-04-15', createdAt: '2025-06-01' },
  { id: 'b02', nom: 'Yawa Dossou', telephone: '+228 90 22 33 44', score_ia: 81, score_tendance: 'HAUSSE', montant_credit: 200_000, montant_rembourse: 160_000, statut: 'REMBOURSEMENT', retard_jours: 0, agent: agentRef('Enyonam Kpade', 'Adidogomé'), lat: 6.1520, lng: 1.2050, zone: 'Adidogomé', derniere_visite: '2026-04-12', createdAt: '2025-07-01' },
  { id: 'b03', nom: 'Afi Togbedji', telephone: '+228 90 33 44 55', score_ia: 79, score_tendance: 'STABLE', montant_credit: 350_000, montant_rembourse: 245_000, statut: 'REMBOURSEMENT', retard_jours: 0, agent: agentRef('Afi Lawson', 'Bè Kpota'), lat: 6.1310, lng: 1.2200, zone: 'Bè Kpota', derniere_visite: '2026-04-10', createdAt: '2025-07-15' },
  { id: 'b04', nom: 'Komlan Attivor', telephone: '+228 90 44 55 66', score_ia: 74, score_tendance: 'BAISSE', montant_credit: 600_000, montant_rembourse: 420_000, statut: 'REMBOURSEMENT', retard_jours: 2, agent: agentRef('Yawo Adjavon', 'Lomé Centre'), lat: 6.1400, lng: 1.2150, zone: 'Lomé Centre', derniere_visite: '2026-04-18', createdAt: '2025-08-01' },
  { id: 'b05', nom: 'Sena Agbenoxevi', telephone: '+228 90 55 66 77', score_ia: 72, score_tendance: 'STABLE', montant_credit: 180_000, montant_rembourse: 126_000, statut: 'REMBOURSEMENT', retard_jours: 0, agent: agentRef('Enyonam Kpade', 'Adidogomé'), lat: 6.1560, lng: 1.2010, zone: 'Adidogomé', derniere_visite: '2026-04-08', createdAt: '2025-09-01' },
  { id: 'b06', nom: 'Mawuena Hotor', telephone: '+228 90 66 77 88', score_ia: 61, score_tendance: 'BAISSE', montant_credit: 420_000, montant_rembourse: 252_000, statut: 'RETARD', retard_jours: 5, agent: agentRef('Afi Lawson', 'Bè Kpota'), lat: 6.1290, lng: 1.2250, zone: 'Bè Kpota', derniere_visite: '2026-04-05', createdAt: '2025-05-01' },
  { id: 'b07', nom: 'Komi Akléssoé', telephone: '+228 90 77 88 99', score_ia: 58, score_tendance: 'BAISSE', montant_credit: 500_000, montant_rembourse: 250_000, statut: 'RETARD', retard_jours: 8, agent: agentRef('Mensah Kodjo', 'Lomé Centre'), lat: 6.1420, lng: 1.2080, zone: 'Lomé Centre', derniere_visite: '2026-03-28', createdAt: '2025-04-01' },
  { id: 'b08', nom: 'Abla Fiagbedzi', telephone: '+228 91 00 11 22', score_ia: 52, score_tendance: 'BAISSE', montant_credit: 300_000, montant_rembourse: 120_000, statut: 'RETARD', retard_jours: 12, agent: agentRef('Abla Tchalla', 'Adidogomé'), lat: 6.1540, lng: 1.1990, zone: 'Adidogomé', derniere_visite: '2026-03-20', createdAt: '2025-03-01' },
  { id: 'b09', nom: 'Dossi Kokuvi', telephone: '+228 91 11 22 33', score_ia: 47, score_tendance: 'BAISSE', montant_credit: 250_000, montant_rembourse: 87_500, statut: 'RETARD', retard_jours: 21, agent: agentRef('Kofi Senyo', 'Bè Kpota'), lat: 6.1340, lng: 1.2180, zone: 'Bè Kpota', derniere_visite: '2026-03-10', createdAt: '2025-02-01' },
  { id: 'b10', nom: 'Togbui Apedo', telephone: '+228 91 22 33 44', score_ia: 31, score_tendance: 'BAISSE', montant_credit: 350_000, montant_rembourse: 175_000, statut: 'RESTRUCTURE', retard_jours: 62, agent: agentRef('Mensah Kodjo', 'Lomé Centre'), lat: 6.1360, lng: 1.2130, zone: 'Lomé Centre', derniere_visite: '2026-02-28', createdAt: '2024-10-01' },
  { id: 'b11', nom: 'Kwami Ekpé', telephone: '+228 91 33 44 55', score_ia: 22, score_tendance: 'BAISSE', montant_credit: 800_000, montant_rembourse: 200_000, statut: 'DEFAUT', retard_jours: 45, agent: agentRef('Mensah Kodjo', 'Lomé Centre'), lat: 6.1500, lng: 1.2030, zone: 'Lomé Centre', derniere_visite: '2026-02-10', createdAt: '2024-09-01' },
  { id: 'b12', nom: 'Enyonam Kpade', telephone: '+228 91 44 55 66', score_ia: 18, score_tendance: 'BAISSE', montant_credit: 150_000, montant_rembourse: 37_500, statut: 'DEFAUT', retard_jours: 38, agent: agentRef('Kofi Senyo', 'Bè Kpota'), lat: 6.1280, lng: 1.2270, zone: 'Bè Kpota', derniere_visite: '2026-02-15', createdAt: '2024-08-01' },
  { id: 'b13', nom: 'Elinam Afetogbo', telephone: '+228 91 55 66 77', score_ia: 65, score_tendance: 'HAUSSE', montant_credit: 300_000, montant_rembourse: 0, statut: 'EVALUATION', retard_jours: 0, agent: agentRef('Yawo Adjavon', 'Lomé Centre'), lat: 6.1390, lng: 1.2110, zone: 'Lomé Centre', derniere_visite: null, createdAt: '2026-04-01' },
  { id: 'b14', nom: 'Kafui Dewonou', telephone: '+228 91 66 77 88', score_ia: 70, score_tendance: 'STABLE', montant_credit: 500_000, montant_rembourse: 0, statut: 'INSTRUCTION', retard_jours: 0, agent: agentRef('Enyonam Kpade', 'Adidogomé'), lat: 6.1510, lng: 1.2060, zone: 'Adidogomé', derniere_visite: null, createdAt: '2026-04-10' },
]

function buildEmprunteurAgence(
  agenceId: string,
  index: number,
  agenceNom: string,
  lat: number,
  lng: number,
): Borrower {
  const seed = index * 31 + agenceId.charCodeAt(3) * 17
  const prenom = PRENOMS[seeded(seed, PRENOMS.length)]
  const nom = NOMS[seeded(seed + 1, NOMS.length)]
  const aff = commercialPourClientAgence(agenceId, index)
  const montant = 150_000 + seeded(seed + 2, 12) * 50_000
  const pctRemb = 0.35 + seeded(seed + 3, 60) / 100
  const retard = seeded(seed + 4, 10) < 2 ? seeded(seed + 5, 35) : 0
  const score = retard > 0 ? 35 + seeded(seed + 6, 30) : 62 + seeded(seed + 6, 35)
  const agShort = agenceId.replace('AG-', '')

  return {
    id: `EMP-${agShort}-${String(index).padStart(4, '0')}`,
    nom: `${prenom} ${nom}`,
    telephone: `+228 ${90 + seeded(seed + 7, 9)} ${String(seeded(seed + 8, 99)).padStart(2, '0')} ${String(seeded(seed + 9, 99)).padStart(2, '0')} ${String(seeded(seed + 10, 99)).padStart(2, '0')}`,
    score_ia: score,
    score_tendance: score >= 70 ? 'STABLE' : score >= 50 ? 'BAISSE' : 'BAISSE',
    montant_credit: montant,
    montant_rembourse: Math.round(montant * pctRemb),
    statut: retard > 30 ? 'DEFAUT' : retard > 14 ? 'RESTRUCTURE' : retard > 0 ? 'RETARD' : STATUTS[seeded(seed + 11, STATUTS.length)],
    retard_jours: retard,
    agent: agentRef(aff.nom, agenceNom),
    lat: lat + (seeded(seed + 12, 200) - 100) / 10000,
    lng: lng + (seeded(seed + 13, 200) - 100) / 10000,
    zone: agenceNom,
    derniere_visite: retard > 0 ? '2026-03-15' : '2026-05-20',
    createdAt: `202${4 + seeded(seed + 14, 2)}-${String(1 + seeded(seed + 15, 11)).padStart(2, '0')}-01`,
  }
}

const EMPRUNTEURS_CACHE_VERSION = 2
let _cache: Borrower[] | null = null
let _cacheVersion = 0

/** Emprunteurs nommés déjà rattachés à une agence — ne pas les compter deux fois dans le total agence */
function countEmprunteursNommesAgence(agenceNomCourt: string): number {
  return EMPRUNTEURS_NOMES.filter(b => b.zone === agenceNomCourt).length
}

export function buildEmprunteursReseau(): Borrower[] {
  if (_cache && _cacheVersion === EMPRUNTEURS_CACHE_VERSION) return _cache

  const generated: Borrower[] = [...EMPRUNTEURS_NOMES]

  for (const cfg of PORTEFEUILLE_AGENCES) {
    const agence = AGENCES.find(a => a.id === cfg.agence_id)!
    const slots = cfg.total - countEmprunteursNommesAgence(agence.nom_court)
    for (let i = 1; i <= slots; i++) {
      generated.push(buildEmprunteurAgence(cfg.agence_id, i, agence.nom_court, agence.latitude, agence.longitude))
    }
  }

  _cache = generated
  _cacheVersion = EMPRUNTEURS_CACHE_VERSION
  return generated
}

/** IDs emprunteurs d'une agence (pour vues GP / RA) */
export function getEmprunteurIdsAgence(agenceNomCourt: string): string[] {
  return buildEmprunteursReseau()
    .filter(b => b.zone === agenceNomCourt)
    .map(b => b.id)
}

export function resetEmprunteursCache(): void {
  _cache = null
  _cacheVersion = 0
}
