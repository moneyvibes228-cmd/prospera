'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Bot, Sparkles, ShieldCheck,
  ArrowRight, Megaphone, Share2, Inbox, Clock,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformancePostePanel } from '@/components/dashboard/PerformancePostePanel'
import { buildReglesMarketing, buildNuitMarketing } from '@/lib/automation/marketing-automations'
import { buildSyntheseAutomation, MODE_STYLE, MODE_LABEL, CANAL_ICON } from '@/lib/automation/automation-types'
import { buildCalendrierSocial, buildPerfSocial, buildInboxSocial, ANGLE_META } from '@/lib/social-builder'
import { audienceAdressable, exclusionsCampagne } from '@/lib/automation/garde-fous'
import { getLeads } from '@/lib/marketing-dg-builder'
import { formatFcfa } from '@/lib/utils'

function Tuile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <div className="text-[10px] text-slate-400 font-medium">{label}</div>
      <div className={`text-base font-black mt-0.5 ${accent ?? 'text-slate-800'}`}>{value}</div>
      {sub ? <div className="text-[9px] text-slate-400 mt-0.5">{sub}</div> : null}
    </div>
  )
}

export function DashboardMarketing() {
  const regles = useMemo(() => buildReglesMarketing(), [])
  const calendrier = useMemo(() => buildCalendrierSocial(), [])
  const perfSocial = useMemo(() => buildPerfSocial(calendrier), [calendrier])
  const inbox = useMemo(() => buildInboxSocial(), [])
  const nuit = useMemo(
    () => buildNuitMarketing(regles, calendrier.filter(p => p.statut === 'PROGRAMME').length),
    [regles, calendrier],
  )
  const synthese = useMemo(() => buildSyntheseAutomation(regles), [regles])
  const audience = useMemo(() => audienceAdressable(), [])
  const exclus = useMemo(() => exclusionsCampagne(), [])
  const leads = useMemo(() => getLeads(), [])

  const leadsChauds = leads.filter(l => l.statut === 'CHAUD' || l.statut === 'NEGOCIATION')
  const potentielPipeline = leadsChauds.reduce((s, l) => s + l.ca_potentiel_mois * 12, 0)

  // Ce qui attend une décision humaine, toutes règles confondues, trié par ce que ça rapporte.
  const aValider = regles
    .filter(r => r.actif && r.mode !== 'AUTO')
    .flatMap(r => r.cibles.filter(c => !c.bloque_par).map(cible => ({ regle: r, cible })))
    .sort((a, b) => b.cible.valeur_fcfa - a.cible.valeur_fcfa)
    .slice(0, 5)

  const postsAValider = calendrier.filter(p => p.statut === 'A_VALIDER' || p.statut === 'BROUILLON_IA')
  const bloques = regles.flatMap(r => r.cibles.filter(c => c.bloque_par))

  return (
    <div className="p-6 max-w-[90rem] space-y-5">
      <PageHeader
        title="Cockpit marketing"
        subtitle="La machine tourne la nuit — vous arbitrez le matin"
        badge={`${synthese.actions_a_valider + postsAValider.length} décisions en attente`}
      />

      {/* Ce que la machine a fait pendant la nuit */}
      <div className="bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 rounded-xl border border-violet-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={16} className="text-violet-600" />
          <h3 className="text-sm font-bold text-slate-900">Cette nuit, sans vous</h3>
          <span className="text-[10px] text-slate-500">
            {synthese.regles_actives} règles actives · {synthese.gain_temps_h_mois} h/mois de travail manuel évitées
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Tuile label="Messages partis" value={String(nuit.messages_envoyes)} sub="WhatsApp · SMS" accent="text-emerald-700" />
          <Tuile label="Leads qualifiés" value={String(nuit.leads_qualifies)} sub="par le chatbot" accent="text-sky-700" />
          <Tuile label="Posts programmés" value={String(nuit.posts_programmes)} sub="7 prochains jours" accent="text-pink-700" />
          <Tuile label="Clients protégés" value={String(nuit.clients_proteges)} sub="exclus des promos" accent="text-red-600" />
          <Tuile label="À valider" value={String(nuit.a_valider + postsAValider.length)} sub="votre file" accent="text-amber-700" />
          <Tuile label="CA attribué 30 j" value={formatFcfa(nuit.ca_attribue)} sub="campagnes + social" accent="text-emerald-700" />
        </div>

        {bloques.length > 0 && (
          <div className="mt-3 bg-white/70 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-800 mb-1.5">
              <ShieldCheck size={12} /> Garde-fou déclenché — {bloques.length} client(s) retirés des campagnes
            </div>
            <div className="space-y-1">
              {bloques.slice(0, 3).map(c => (
                <div key={c.id} className="text-[10px] text-slate-600">
                  <span className="font-semibold text-slate-800">{c.libelle}</span> — {c.bloque_par}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 italic">
              Envoyer une promo à un client qui ne paie plus, c&apos;est lui apprendre qu&apos;il peut ne pas payer.
            </p>
          </div>
        )}
      </div>

      {/* Les chiffres du poste */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Tuile label="Audience adressable" value={String(audience.length)} sub={`${exclus.size} exclus pour impayés`} accent="text-slate-800" />
        <Tuile label="Leads chauds" value={String(leadsChauds.length)} sub="à relancer sous 48 h" accent="text-orange-600" />
        <Tuile label="Pipeline potentiel" value={formatFcfa(potentielPipeline)} sub="sur 12 mois" accent="text-emerald-700" />
        <Tuile label="ROI social" value={`${perfSocial.roi_pct}%`} sub={`${formatFcfa(perfSocial.cout_30j)} F investis`} accent="text-pink-600" />
        <Tuile label="Coût par lead" value={`${formatFcfa(perfSocial.cout_par_lead)} F`} sub={`${perfSocial.leads_30j} leads / 30 j`} accent="text-sky-700" />
        <Tuile label="Inbox sociale" value={String(inbox.a_traiter)} sub={inbox.hors_sla > 0 ? `${inbox.hors_sla} hors délai` : 'dans les délais'} accent={inbox.hors_sla > 0 ? 'text-red-600' : 'text-emerald-700'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* File de validation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold">Prêt à partir — votre validation suffit</h3>
            </div>
            <Link href="/automatisations" className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              Toutes les règles <ArrowRight size={11} />
            </Link>
          </div>

          {aValider.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Rien à valider — tout est parti automatiquement.</p>
          ) : (
            <div className="space-y-2">
              {aValider.map(({ regle, cible }) => (
                <div key={cible.id} className="border border-slate-200 rounded-lg p-3 hover:border-amber-300 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{CANAL_ICON[cible.canal]}</span>
                        <span className="font-bold text-xs text-slate-900 truncate">{cible.libelle}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border ${MODE_STYLE[regle.mode]}`}>
                          {MODE_LABEL[regle.mode]}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{cible.detail}</div>
                      <div className="text-[10px] text-slate-400 mt-1 italic">via « {regle.nom} »</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-700">{formatFcfa(cible.valeur_fcfa)} F</div>
                      <div className="text-[9px] text-slate-400">confiance {cible.score}%</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button type="button" className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                      Lancer
                    </button>
                    <button type="button" className="text-[10px] font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                      Modifier le message
                    </button>
                    <button type="button" className="text-[10px] font-semibold px-3 py-1 rounded-lg text-slate-400 hover:bg-slate-50">
                      Ignorer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Raccourcis du poste */}
        <div className="space-y-3">
          <Link href="/marketing/social" className="block bg-gradient-to-br from-pink-50 to-violet-50 rounded-xl border border-pink-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Share2 size={15} className="text-pink-600" />
              <h3 className="text-sm font-bold text-slate-900">Studio réseaux sociaux</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <div className="text-slate-400">Posts à valider</div>
                <div className="font-black text-pink-700">{postsAValider.length}</div>
              </div>
              <div>
                <div className="text-slate-400">Portée 30 j</div>
                <div className="font-black text-slate-800">{(perfSocial.portee_30j / 1000).toFixed(0)} K</div>
              </div>
              <div>
                <div className="text-slate-400">Commandes issues du social</div>
                <div className="font-black text-emerald-700">{perfSocial.commandes_30j}</div>
              </div>
              <div>
                <div className="text-slate-400">CA créé (incrémental)</div>
                <div className="font-black text-emerald-700">{formatFcfa(perfSocial.ca_incremental_30j)}</div>
              </div>
            </div>
            {postsAValider[0] ? (
              <div className="mt-2 pt-2 border-t border-pink-200/70">
                <div className="text-[9px] text-slate-400 mb-0.5">
                  Prochain post · {postsAValider[0].jour_label} {postsAValider[0].heure} ·{' '}
                  <span className={`px-1 rounded ${ANGLE_META[postsAValider[0].angle].couleur}`}>
                    {ANGLE_META[postsAValider[0].angle].label}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-800 line-clamp-2">
                  « {postsAValider[0].accroche} »
                </div>
              </div>
            ) : null}
          </Link>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Inbox size={15} className="text-sky-600" />
              <h3 className="text-sm font-bold">Messages entrants</h3>
            </div>
            {inbox.hors_sla > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 mb-2">
                <Clock size={11} />
                {inbox.hors_sla} message(s) hors délai de réponse
              </div>
            )}
            <div className="space-y-1.5">
              {inbox.messages.slice(0, 3).map(m => (
                <div key={m.id} className="text-[10px] border-b border-slate-100 pb-1.5 last:border-0">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-slate-700 truncate">{m.auteur.split('·')[1]?.trim() ?? m.auteur}</span>
                    <span className="font-bold text-emerald-700 shrink-0">{m.potentiel_fcfa > 0 ? `${formatFcfa(m.potentiel_fcfa)} F` : '—'}</span>
                  </div>
                  <div className="text-slate-500 truncate">{m.contenu}</div>
                </div>
              ))}
            </div>
            <Link href="/marketing/social" className="text-[10px] font-semibold text-sky-600 hover:underline mt-2 inline-flex items-center gap-1">
              Traiter la boîte de réception <ArrowRight size={10} />
            </Link>
          </div>

          <Link href="/marketing" className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-300 transition-colors">
            <div className="flex items-center gap-2">
              <Megaphone size={15} className="text-amber-600" />
              <h3 className="text-sm font-bold">Campagnes & pipeline leads</h3>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Segmentation IA, zones blanches, combos d&apos;écoulement — le détail opérationnel.
            </p>
          </Link>
        </div>
      </div>

      <PerformancePostePanel role="MARKETING" />
    </div>
  )
}
