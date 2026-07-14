import type { Relance, RelancePriorite, RelanceStatut } from '@distributeur/types'
import { REGISTRE_PDV } from '@distributeur/lib/registries/pdv-registry'
import { ENTREPRISE_REGISTRY } from '@distributeur/lib/registries/entreprise-registry'
import { hashString, pick, randInt, seededRandom } from './mock-seed'

const CANAUX = ['WHATSAPP', 'SMS', 'VISITE', 'APPEL', 'EMAIL'] as const

function prioriteFor(jours: number, montant: number): RelancePriorite {
  if (jours > 45 || montant > 5_000_000) return 'CRITIQUE'
  if (jours > 25 || montant > 2_500_000) return 'HAUTE'
  if (jours > 10) return 'NORMALE'
  return 'BASSE'
}

function statutImpaye(jours: number, rng: () => number): RelanceStatut {
  if (jours > 55) return pick(rng, ['ECHEC', 'VISITE', 'ENVOYEE'] as const)
  if (jours > 35) return pick(rng, ['VISITE', 'ENVOYEE', 'PLANIFIEE', 'REPONDUE'] as const)
  if (jours > 20) return pick(rng, ['ENVOYEE', 'REPONDUE', 'PLANIFIEE', 'DETECTION'] as const)
  if (jours > 10) return pick(rng, ['ENVOYEE', 'PLANIFIEE', 'DETECTION', 'ACCORD'] as const)
  return pick(rng, ['DETECTION', 'PLANIFIEE', 'ENVOYEE'] as const)
}

function statutReappro(rng: () => number): RelanceStatut {
  return pick(rng, ['DETECTION', 'PLANIFIEE', 'ENVOYEE', 'REPONDUE', 'PAYEE'] as const)
}

function statutProspection(rng: () => number): RelanceStatut {
  return pick(rng, ['DETECTION', 'PLANIFIEE', 'ENVOYEE', 'VISITE'] as const)
}

function scoreFor(statut: RelanceStatut, priorite: RelancePriorite, rng: () => number): number {
  let base = randInt(rng, 35, 88)
  if (statut === 'ECHEC') base = randInt(rng, 8, 22)
  if (statut === 'PAYEE') base = randInt(rng, 82, 96)
  if (statut === 'ACCORD' || statut === 'REPONDUE') base = randInt(rng, 55, 78)
  if (priorite === 'CRITIQUE') base = Math.min(base, 40)
  return base
}

function buildRelance(
  id: string,
  pdv: (typeof REGISTRE_PDV)[0],
  type: Relance['type'],
  statut: RelanceStatut,
  rng: () => number,
  montant?: number,
): Relance {
  const jours = pdv.creance_jours || randInt(rng, 3, 18)
  const priorite = prioriteFor(jours, montant ?? pdv.creance)
  const canal = type === 'PROSPECTION' && statut === 'VISITE'
    ? 'VISITE'
    : pick(rng, CANAUX.filter(c => c !== 'VISITE' || type !== 'REAPPRO'))

  return {
    id,
    pdv_id: pdv.id,
    pdv_nom: pdv.nom,
    zone: pdv.zone,
    commercial: pdv.commercial,
    type,
    canal,
    montant: type === 'IMPAYE' ? montant ?? pdv.creance : undefined,
    statut,
    date: `2026-06-${String(randInt(rng, 8, 11)).padStart(2, '0')}`,
    score_succes: scoreFor(statut, priorite, rng),
    facture_ref: type === 'IMPAYE' ? `FAC-2026-${randInt(rng, 8800, 9200)}` : undefined,
    jours_retard: type === 'IMPAYE' ? jours : undefined,
    priorite,
    automate: rng() < 0.78,
    nb_tentatives: type === 'IMPAYE' ? randInt(rng, 0, Math.min(12, Math.floor(jours / 5))) : randInt(rng, 0, 3),
    prochaine_action: pick(rng, [
      'Relance auto J+3 si pas de réponse',
      'Visite commercial assignée',
      'Valider échéancier client',
      'Attendre virement — échéance sous 7j',
      'Escalade superviseur zone',
    ]),
    prochaine_action_date: `2026-06-${String(randInt(rng, 12, 15)).padStart(2, '0')}`,
    synthese_ia: type === 'IMPAYE'
      ? `Encours ${Math.round((montant ?? pdv.creance) / 1000)} K · J+${jours} · ${priorite === 'CRITIQUE' ? 'risque contentieux' : 'suivi standard'}.`
      : type === 'REAPPRO'
        ? `Stock bas estimé — probabilité commande ${randInt(rng, 55, 92)}%.`
        : `Prospect ${pdv.zone} — potentiel ${randInt(rng, 8, 18) / 10} M/mois.`,
    message_template: type === 'IMPAYE' && canal === 'WHATSAPP'
      ? `Bonjour, votre créance ${ENTREPRISE_REGISTRY.nom} est en attente. Merci de régulariser.`
      : undefined,
  }
}

export function generateRelancesBatch(existingPdvRelanceKeys: Set<string>): Relance[] {
  const out: Relance[] = []
  let seq = 200

  for (const pdv of REGISTRE_PDV) {
    if (pdv.creance > 0) {
      const key = `impaye-${pdv.id}`
      if (existingPdvRelanceKeys.has(key)) continue
      existingPdvRelanceKeys.add(key)

      const rng = seededRandom(hashString(`rel-imp-${pdv.id}`))
      const nb = pdv.creance > 3_000_000 ? randInt(rng, 1, 2) : 1
      let reste = pdv.creance

      for (let i = 0; i < nb; i++) {
        const subRng = seededRandom(hashString(`rel-imp-${pdv.id}-${i}`))
        const montant = i === nb - 1 ? reste : Math.round(reste * randInt(subRng, 35, 65) / 100)
        reste -= montant
        const jours = Math.max(5, pdv.creance_jours - randInt(subRng, 0, 5))
        out.push(buildRelance(
          `rel-gen-${seq++}`,
          pdv,
          'IMPAYE',
          statutImpaye(jours, subRng),
          subRng,
          montant,
        ))
      }
    }
  }

  const actifs = REGISTRE_PDV.filter(p => p.ca_mois > 400_000 && p.creance === 0)
  for (const pdv of actifs) {
    const rng = seededRandom(hashString(`rel-reap-${pdv.id}`))
    if (rng() > 0.42) continue
    const key = `reappro-${pdv.id}`
    if (existingPdvRelanceKeys.has(key)) continue
    existingPdvRelanceKeys.add(key)
    out.push(buildRelance(`rel-gen-${seq++}`, pdv, 'REAPPRO', statutReappro(rng), rng))
  }

  const prospects = REGISTRE_PDV.filter(p =>
    p.pipeline === 'PROSPECTION' || p.pipeline === 'PREMIER_CONTACT' || p.pipeline === 'PREMIERE_COMMANDE',
  )
  for (const pdv of prospects) {
    const rng = seededRandom(hashString(`rel-pros-${pdv.id}`))
    if (rng() > 0.55) continue
    const key = `prospection-${pdv.id}`
    if (existingPdvRelanceKeys.has(key)) continue
    existingPdvRelanceKeys.add(key)
    out.push(buildRelance(`rel-gen-${seq++}`, pdv, 'PROSPECTION', statutProspection(rng), rng))
  }

  return out
}
