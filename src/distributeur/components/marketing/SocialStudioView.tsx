'use client'

import { useMemo, useState } from 'react'
import {
  Sparkles, Calendar, Inbox, BarChart3, Clock, Send,
  ThumbsUp, MousePointerClick, ShoppingCart, AlertTriangle, Image as ImageIcon,
  Pencil, RefreshCw, Eye, Check, History, TrendingUp, TrendingDown, X, Wand2, ListFilter,
  RotateCcw, Users, Zap, ArrowUpRight, Plus, Lightbulb, LayoutGrid, List, Copy, CalendarClock, BookOpen,
} from 'lucide-react'
import { PageHeader } from '@distributeur/components/shared/PageHeader'
import { WorkflowToast } from '@distributeur/components/shared/WorkflowToast'
import {
  buildCalendrierSocial, buildPostsPublies, buildPerfSocial, buildInboxSocial,
  buildVariantesPost, buildMixCalendrier, buildRepartitionReseau, projeterImpactPost,
  prochainsJours, CRENEAUX_PUBLICATION, formatJourLabel,
  ANGLE_META, STATUT_POST_STYLE, COMPTES_SOCIAUX, RYTHMES_COMMERCIAUX,
  type PostSocial, type AnglePost,
} from '@distributeur/lib/social-builder'
import {
  buildIdeesContenu, MODELES_CONTENU, postsCreesDepuisJournal,
  appliquerReprogrammation, adapterPourReseau, brouillonFromIdee, brouillonFromModele,
  postFromBrouillon,
  type PostBrouillonInput, type IdeeContenu, type ModeleContenu,
} from '@distributeur/lib/social-studio'
import { RESEAU_META, INTENTION_META, type ReseauSocial } from '@distributeur/lib/registries/social-registry'
import { MARKETING_ACTION_LABEL, type MarketingActionEntry } from '@distributeur/lib/marketing-workflow'
import { genId } from '@distributeur/lib/persistence'
import { formatFcfa } from '@distributeur/lib/utils'
import { useMarketingWorkflow, type MarketingWorkflowContextValue } from '@distributeur/contexts/MarketingWorkflowContext'

type Onglet = 'calendrier' | 'idees' | 'inbox' | 'performance' | 'journal'

const ONGLETS: { id: Onglet; label: string; icone: typeof Calendar }[] = [
  { id: 'calendrier', label: 'Calendrier éditorial', icone: Calendar },
  { id: 'idees', label: 'Idées & modèles', icone: Lightbulb },
  { id: 'inbox', label: 'Boîte de réception', icone: Inbox },
  { id: 'performance', label: 'Ce que ça rapporte', icone: BarChart3 },
  { id: 'journal', label: 'Journal d\'activité', icone: History },
]

const RESEAUX: ReseauSocial[] = ['WHATSAPP', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']

const parseHashtags = (s: string): string[] =>
  s.split(/[\s,]+/).filter(Boolean).map(h => (h.startsWith('#') ? h : `#${h}`))

/** Fond coloré léger par réseau, pour la pastille d'icône. */
const RESEAU_PASTILLE: Record<ReseauSocial, string> = {
  WHATSAPP: 'bg-green-100',
  FACEBOOK: 'bg-blue-100',
  TIKTOK: 'bg-slate-900',
  INSTAGRAM: 'bg-pink-100',
}

function contenuEffectif(post: PostSocial, getEntry: MarketingWorkflowContextValue['getEntry']) {
  const edit = getEntry('POST_EDITE', post.id)
  return {
    edit,
    accroche: (edit?.payload?.accroche as string) ?? post.accroche,
    corps: (edit?.payload?.corps as string) ?? post.corps,
  }
}

/* ------------------------------------------------------------------ */
/* Aperçu natif — comment le post rend réellement sur le réseau        */
/* ------------------------------------------------------------------ */

function ApercuReseau({ post, accroche, corps }: { post: PostSocial; accroche: string; corps: string }) {
  const compte = COMPTES_SOCIAUX.find(c => c.reseau === post.reseau)
  const handle = compte?.handle ?? 'Prospera Distribution'

  if (post.reseau === 'WHATSAPP') {
    return (
      <div className="rounded-xl bg-[#e5ddd5] p-3">
        <div className="text-[9px] text-slate-500 mb-2 text-center font-semibold">Aperçu WhatsApp Business</div>
        <div className="bg-[#dcf8c6] rounded-lg rounded-tl-none p-3 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-800 mb-1">{handle.split('·')[0].trim()}</div>
          <div className="text-xs font-bold text-slate-900 leading-snug">{accroche}</div>
          <p className="text-[11px] text-slate-800 whitespace-pre-line mt-1.5">{corps}</p>
          <div className="text-[11px] text-sky-700 mt-2 underline break-words">{post.cta}</div>
          <div className="text-[9px] text-slate-500 text-right mt-1.5">{post.heure} ✓✓</div>
        </div>
      </div>
    )
  }

  if (post.reseau === 'FACEBOOK') {
    return (
      <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
        <div className="text-[9px] text-slate-400 mb-2 font-semibold">Aperçu Facebook</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">P</div>
          <div>
            <div className="text-[11px] font-bold text-slate-900">{handle}</div>
            <div className="text-[9px] text-slate-400">Publié · {post.heure} · 🌍</div>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-900 leading-snug">{accroche}</div>
        <p className="text-[11px] text-slate-700 whitespace-pre-line mt-1.5">{corps}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {post.hashtags.map(h => <span key={h} className="text-[10px] text-blue-600">{h}</span>)}
        </div>
        <div className="flex items-center justify-around border-t border-slate-100 mt-2.5 pt-2 text-[10px] text-slate-500 font-semibold">
          <span>👍 J&apos;aime</span><span>💬 Commenter</span><span>↗ Partager</span>
        </div>
      </div>
    )
  }

  if (post.reseau === 'TIKTOK') {
    return (
      <div className="rounded-xl bg-black p-3">
        <div className="text-[9px] text-slate-400 mb-2 text-center font-semibold">Aperçu TikTok</div>
        <div className="relative rounded-lg bg-gradient-to-b from-slate-700 to-black aspect-9/16 max-h-72 mx-auto w-[62%] overflow-hidden flex flex-col justify-end p-3">
          <div className="text-[11px] font-black text-white">@{handle.replace(/^@/, '')}</div>
          <div className="text-xs font-bold text-white leading-snug mt-1">{accroche}</div>
          <p className="text-[10px] text-white/85 whitespace-pre-line mt-1.5 line-clamp-4">{corps}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.hashtags.map(h => <span key={h} className="text-[10px] text-white font-semibold">{h}</span>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
      <div className="text-[9px] text-slate-400 mb-2 font-semibold">Aperçu Instagram</div>
      <div className="aspect-square bg-gradient-to-br from-pink-100 to-violet-100 rounded-lg flex items-center justify-center text-[11px] text-slate-400 p-4 text-center">
        Visuel — {accroche.slice(0, 40)}…
      </div>
      <p className="text-[11px] text-slate-700 whitespace-pre-line mt-2"><span className="font-bold">{handle} </span>{corps}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bloc impact — projeté (brouillon) ou réel (publié)                  */
/* ------------------------------------------------------------------ */

function ImpactBlock({ post }: { post: PostSocial }) {
  if (post.resultats) {
    const cases = [
      { label: 'Portée', value: post.resultats.portee.toLocaleString('fr-FR'), icone: Eye },
      { label: 'Clics', value: post.resultats.clics.toLocaleString('fr-FR'), icone: MousePointerClick },
      { label: 'Leads', value: String(post.resultats.leads), icone: Users },
      { label: 'CA attribué', value: `${formatFcfa(post.resultats.ca_attribue)} F`, icone: ShoppingCart },
    ]
    return (
      <div>
        <div className="text-[10px] font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1"><TrendingUp size={12} /> Résultats réels</div>
        <div className="grid grid-cols-2 gap-2">
          {cases.map(r => {
            const Ic = r.icone
            return (
              <div key={r.label} className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                <div className="flex items-center gap-1 text-[9px] text-emerald-700"><Ic size={11} /> {r.label}</div>
                <div className="text-sm font-black text-emerald-900 mt-0.5">{r.value}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const impact = projeterImpactPost(post)
  const cases = [
    { label: 'Portée estimée', value: impact.portee_estimee.toLocaleString('fr-FR'), icone: Eye },
    { label: 'Interactions', value: impact.interactions_estimees.toLocaleString('fr-FR'), icone: ThumbsUp },
    { label: 'Leads estimés', value: String(impact.leads_estimes), icone: Users },
  ]
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Zap size={12} className="text-amber-500" /> Impact projeté</div>
      <div className="grid grid-cols-3 gap-2">
        {cases.map(r => {
          const Ic = r.icone
          return (
            <div key={r.label} className="bg-white border border-slate-200 rounded-xl p-2.5">
              <div className="flex items-center gap-1 text-[9px] text-slate-400"><Ic size={11} /> {r.label}</div>
              <div className="text-sm font-black text-slate-800 mt-0.5">{r.value}</div>
            </div>
          )
        })}
      </div>
      <p className="text-[9px] text-slate-400 mt-1.5">Projeté depuis la portée et l&apos;engagement réels du canal, pondérés par le score du post.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Carte compacte — le calendrier                                      */
/* ------------------------------------------------------------------ */

function CartePostCompacte({ post, onOpen }: { post: PostSocial; onOpen: () => void }) {
  const reseau = RESEAU_META[post.reseau]
  const angle = ANGLE_META[post.angle]
  const { isDone, getEntry } = useMarketingWorkflow()
  const { accroche, corps, edit } = contenuEffectif(post, getEntry)

  const supprime = isDone('POST_SUPPRIME', post.id)
  const programme = isDone('POST_PROGRAMME', post.id)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group text-left rounded-2xl border bg-white p-4 flex flex-col gap-2.5 h-full transition-all hover:shadow-lg hover:-translate-y-0.5 ${supprime ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:border-pink-300'}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${RESEAU_PASTILLE[post.reseau]}`}>{reseau.icone}</span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold text-slate-800 truncate">{reseau.label}</div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><Clock size={9} /> {post.jour_label.split(' ')[0]} · {post.heure}</div>
        </div>
        <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${supprime ? 'bg-slate-100 text-slate-500' : programme ? 'bg-emerald-100 text-emerald-700' : STATUT_POST_STYLE[post.statut]}`}>
          {supprime ? 'supprimé' : programme ? 'programmé' : post.statut.replace('_', ' ').toLowerCase()}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${angle.couleur}`}>{angle.label}</span>
        {edit && !post.resultats && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">modifié</span>}
      </div>

      <div className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">{accroche}</div>
      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 flex-1">{corps}</p>

      {post.resultats ? (
        <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-slate-100">
          <span className="font-bold text-emerald-700">{formatFcfa(post.resultats.ca_attribue)} F</span>
          <span className="text-slate-400">· {post.resultats.leads} leads</span>
          <ArrowUpRight size={12} className="ml-auto text-slate-300 group-hover:text-pink-500" />
        </div>
      ) : (
        <div className="pt-1">
          <div className="flex items-center justify-between text-[9px] mb-1">
            <span className="text-slate-400 font-semibold">Potentiel d&apos;engagement</span>
            <span className="font-bold text-slate-500">{post.score_engagement}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500 rounded-full" style={{ width: `${post.score_engagement}%` }} />
          </div>
        </div>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Composer — créer / adapter un post à la main                        */
/* ------------------------------------------------------------------ */

function ComposerModal({ initial, titre, onClose, onSubmit }: {
  initial: PostBrouillonInput
  titre: string
  onClose: () => void
  onSubmit: (input: PostBrouillonInput) => void
}) {
  const [draft, setDraft] = useState<PostBrouillonInput>(initial)
  const jours = useMemo(() => prochainsJours(14), [])
  const set = (patch: Partial<PostBrouillonInput>) => setDraft(d => ({ ...d, ...patch }))
  const preview = useMemo(() => postFromBrouillon('preview', draft), [draft])
  const valide = draft.accroche.trim().length > 0 && draft.corps.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-3 flex items-center gap-2 rounded-t-2xl">
          <Pencil size={16} className="text-pink-600" />
          <div className="text-sm font-bold text-slate-900">{titre}</div>
          <button type="button" onClick={onClose} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button>
        </div>

        <div className="grid md:grid-cols-2">
          {/* Formulaire */}
          <div className="p-5 space-y-3 md:border-r border-slate-100">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Réseau</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {RESEAUX.map(r => (
                  <button key={r} type="button" onClick={() => set({ reseau: r })}
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 ${draft.reseau === r ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    {RESEAU_META[r].icone} {RESEAU_META[r].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Angle</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(Object.keys(ANGLE_META) as AnglePost[]).map(a => (
                  <button key={a} type="button" onClick={() => set({ angle: a })}
                    className={`text-[9px] px-2 py-1 rounded-full font-bold ${draft.angle === a ? ANGLE_META[a].couleur : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                    {ANGLE_META[a].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Jour</label>
                <select value={draft.date} onChange={e => set({ date: e.target.value })} className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 mt-1 focus:border-pink-400 outline-none">
                  {jours.map(j => <option key={j.date} value={j.date}>{j.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase">Heure</label>
                <select value={draft.heure} onChange={e => set({ heure: e.target.value })} className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 mt-1 focus:border-pink-400 outline-none">
                  {CRENEAUX_PUBLICATION.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Accroche</label>
              <input value={draft.accroche} onChange={e => set({ accroche: e.target.value })} placeholder="La première ligne qui arrête le scroll…" className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 mt-1 focus:border-pink-400 outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Corps du message</label>
              <textarea value={draft.corps} onChange={e => set({ corps: e.target.value })} rows={5} placeholder="Le contenu du post…" className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 mt-1 focus:border-pink-400 outline-none resize-y" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Hashtags</label>
              <input value={draft.hashtags.join(' ')} onChange={e => set({ hashtags: parseHashtags(e.target.value) })} placeholder="#Prospera #Togo" className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 mt-1 focus:border-pink-400 outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Appel à l&apos;action</label>
              <input value={draft.cta} onChange={e => set({ cta: e.target.value })} className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 mt-1 focus:border-pink-400 outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Brief visuel</label>
              <textarea value={draft.visuel_suggere} onChange={e => set({ visuel_suggere: e.target.value })} rows={2} placeholder="Ce que le graphiste doit produire…" className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 mt-1 focus:border-pink-400 outline-none resize-y" />
            </div>
          </div>

          {/* Aperçu en direct */}
          <div className="p-5 space-y-4 bg-slate-50/60 rounded-br-2xl">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Aperçu en direct</div>
            <ApercuReseau post={preview} accroche={draft.accroche || 'Votre accroche…'} corps={draft.corps || 'Votre message apparaîtra ici au fur et à mesure que vous écrivez.'} />
            <ImpactBlock post={preview} />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 px-5 py-3 rounded-b-2xl flex items-center gap-2">
          {!valide && <span className="text-[10px] text-slate-400">Renseignez au moins l&apos;accroche et le corps.</span>}
          <button type="button" onClick={() => valide && onSubmit(draft)} disabled={!valide}
            className={`ml-auto text-[11px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 ${valide ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            <Plus size={12} /> Ajouter au calendrier
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fiche détaillée — modale                                            */
/* ------------------------------------------------------------------ */

function PostDetailModal({ post, onClose, onDupliquer }: { post: PostSocial; onClose: () => void; onDupliquer: (post: PostSocial, cible: ReseauSocial) => void }) {
  const reseau = RESEAU_META[post.reseau]
  const angle = ANGLE_META[post.angle]
  const { isDone, getEntry, executer, annuler } = useMarketingWorkflow()
  const { accroche, corps, edit } = contenuEffectif(post, getEntry)

  const supprime = isDone('POST_SUPPRIME', post.id)
  const programme = isDone('POST_PROGRAMME', post.id)

  const [panneau, setPanneau] = useState<'reecriture' | 'edition' | null>(null)
  const [draftAccroche, setDraftAccroche] = useState(accroche)
  const [draftCorps, setDraftCorps] = useState(corps)
  const [replanif, setReplanif] = useState(false)
  const [draftDate, setDraftDate] = useState(post.date)
  const [draftHeure, setDraftHeure] = useState(post.heure)
  const variantes = useMemo(() => buildVariantesPost(post), [post])
  const jours = useMemo(() => prochainsJours(14), [])
  const reprog = getEntry('POST_REPROGRAMME', post.id)

  const replanifier = () => {
    executer('POST_REPROGRAMME', post.id, {
      label: `Post replanifié — « ${accroche} »`,
      detail: `${formatJourLabel(draftDate)} · ${draftHeure}`,
      message: 'Publication replanifiée.',
      payload: { date: draftDate, heure: draftHeure },
    })
    setReplanif(false)
  }

  const appliquer = (nouvelleAccroche: string, nouveauCorps: string, via: string) => {
    executer('POST_EDITE', post.id, {
      label: `Contenu modifié — « ${nouvelleAccroche} »`,
      detail: `${reseau.label} · ${via}`,
      message: 'Nouveau contenu appliqué au post.',
      payload: { accroche: nouvelleAccroche, corps: nouveauCorps },
    })
    setPanneau(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-3 flex items-center gap-3 rounded-t-2xl">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${RESEAU_PASTILLE[post.reseau]}`}>{reseau.icone}</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900">{reseau.label}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10} /> {post.jour_label} · {post.heure}</div>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${angle.couleur}`}>{angle.label}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${supprime ? 'bg-slate-100 text-slate-500' : programme ? 'bg-emerald-100 text-emerald-700' : STATUT_POST_STYLE[post.statut]}`}>
              {supprime ? 'supprimé' : programme ? 'programmé' : post.statut.replace('_', ' ').toLowerCase()}
            </span>
            <button type="button" onClick={onClose} className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2">
          {/* Colonne contenu */}
          <div className="p-5 space-y-3 md:border-r border-slate-100">
            <div className="flex gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
              <Sparkles size={12} className="text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-indigo-900">
                <span className="font-bold">Pourquoi maintenant : </span>{post.pourquoi}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Contenu rédigé</div>
              <div className="font-bold text-sm text-slate-900 leading-snug">{accroche}</div>
              <p className="text-[12px] text-slate-800 whitespace-pre-line mt-1.5 leading-relaxed">{corps}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {post.hashtags.map(h => <span key={h} className="text-[10px] text-sky-600 font-semibold">{h}</span>)}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-2 break-words">{post.cta}</div>
              {edit && !post.resultats && (
                <button type="button" onClick={() => annuler(edit.id)} className="mt-2 text-[10px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1">
                  <RotateCcw size={10} /> Rétablir le texte d&apos;origine
                </button>
              )}
            </div>

            {/* Réécriture */}
            {panneau === 'reecriture' && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-800">
                  <Wand2 size={12} /> 3 réécritures proposées — choisissez le ton
                </div>
                {variantes.map(v => (
                  <div key={v.ton} className="bg-white border border-violet-100 rounded-lg p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">{v.ton}</span>
                      <button type="button" onClick={() => appliquer(v.accroche, corps, `réécriture « ${v.ton} »`)} className="text-[9px] font-bold px-2 py-1 rounded bg-violet-600 text-white hover:bg-violet-700 flex items-center gap-1">
                        <Check size={9} /> Appliquer
                      </button>
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 mt-1">{v.accroche}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{v.note}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Édition */}
            {panneau === 'edition' && (
              <div className="bg-white border border-slate-300 rounded-lg p-2.5 space-y-2">
                <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5"><Pencil size={12} /> Modifier le contenu</div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Accroche</label>
                  <input value={draftAccroche} onChange={e => setDraftAccroche(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 mt-0.5 focus:border-pink-400 outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Corps du message</label>
                  <textarea value={draftCorps} onChange={e => setDraftCorps(e.target.value)} rows={5} className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 mt-0.5 focus:border-pink-400 outline-none resize-y" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => appliquer(draftAccroche.trim() || accroche, draftCorps.trim() || corps, 'édition manuelle')} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1">
                    <Check size={10} /> Enregistrer
                  </button>
                  <button type="button" onClick={() => setPanneau(null)} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">Annuler</button>
                </div>
              </div>
            )}

            <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <ImageIcon size={12} className="text-slate-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-slate-600">
                <span className="font-bold text-slate-700">Visuel à produire : </span>{post.visuel_suggere}
              </div>
            </div>
          </div>

          {/* Colonne présentation + impact */}
          <div className="p-5 space-y-4 bg-slate-50/60 rounded-br-2xl">
            <ApercuReseau post={post} accroche={accroche} corps={corps} />
            <ImpactBlock post={post} />

            {!post.resultats && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                {/* Planification */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><CalendarClock size={12} /> Planification</div>
                    <button type="button" onClick={() => { setDraftDate(post.date); setDraftHeure(post.heure); setReplanif(v => !v) }} className="text-[10px] font-bold text-pink-600 hover:text-pink-800">
                      {replanif ? 'Fermer' : 'Replanifier'}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-1">{post.jour_label} · {post.heure}
                    {reprog && <span className="ml-1 text-[9px] font-bold text-indigo-600">(replanifié)</span>}
                  </div>
                  {replanif && (
                    <div className="mt-2 bg-white border border-slate-200 rounded-lg p-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select value={draftDate} onChange={e => setDraftDate(e.target.value)} className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:border-pink-400 outline-none">
                          {jours.map(j => <option key={j.date} value={j.date}>{j.label}</option>)}
                        </select>
                        <select value={draftHeure} onChange={e => setDraftHeure(e.target.value)} className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:border-pink-400 outline-none">
                          {CRENEAUX_PUBLICATION.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={replanifier} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1"><Check size={10} /> Replanifier</button>
                        {reprog && <button type="button" onClick={() => { annuler(reprog.id); setReplanif(false) }} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">Remettre à l&apos;origine</button>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Duplication */}
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Copy size={12} /> Décliner sur un autre réseau</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {RESEAUX.filter(r => r !== post.reseau).map(r => (
                      <button key={r} type="button" onClick={() => onDupliquer(post, r)}
                        className="text-[10px] px-2.5 py-1.5 rounded-lg font-semibold bg-white border border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-700 flex items-center gap-1">
                        {RESEAU_META[r].icone} {RESEAU_META[r].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Le format est adapté automatiquement (longueur, hashtags, créneau, brief visuel).</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 px-5 py-3 rounded-b-2xl">
          {post.resultats ? (
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <TrendingUp size={13} className="text-emerald-600" /> Post publié — résultats réels affichés ci-dessus.
            </div>
          ) : supprime ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-semibold">Post supprimé du calendrier.</span>
              <button type="button" onClick={() => { const e = getEntry('POST_SUPPRIME', post.id); if (e) annuler(e.id) }} className="ml-auto font-bold text-slate-600 hover:text-slate-900 underline">Rétablir</button>
            </div>
          ) : programme ? (
            <div className="flex items-center gap-2 text-[11px] text-emerald-800">
              <Send size={13} className="shrink-0" />
              <span className="font-bold">Validé et programmé pour {post.heure}</span>
              <button type="button" onClick={() => { const e = getEntry('POST_PROGRAMME', post.id); if (e) annuler(e.id) }} className="ml-auto font-bold text-emerald-700 hover:text-emerald-900 underline">Annuler</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => executer('POST_PROGRAMME', post.id, { label: `Post « ${accroche} » programmé`, detail: `${reseau.label} · ${post.heure}`, message: 'Post validé et programmé.' })} className="text-[11px] font-bold px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5">
                <Send size={12} /> Valider et programmer
              </button>
              <button type="button" onClick={() => setPanneau(p => (p === 'reecriture' ? null : 'reecriture'))} className={`text-[11px] font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 ${panneau === 'reecriture' ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}>
                <RefreshCw size={12} /> Réécrire
              </button>
              <button type="button" onClick={() => { setDraftAccroche(accroche); setDraftCorps(corps); setPanneau(p => (p === 'edition' ? null : 'edition')) }} className={`text-[11px] font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 ${panneau === 'edition' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Pencil size={12} /> Modifier
              </button>
              <button type="button" onClick={() => { executer('POST_SUPPRIME', post.id, { label: `Post supprimé — « ${accroche} »`, message: 'Post retiré du calendrier.' }); onClose() }} className="text-[11px] font-semibold px-3.5 py-2 rounded-lg text-slate-400 hover:bg-slate-50 ml-auto">
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Journal d'activité                                                  */
/* ------------------------------------------------------------------ */

const KIND_STYLE: Record<string, string> = {
  POST_PROGRAMME: 'bg-emerald-100 text-emerald-700',
  POST_REECRIRE: 'bg-violet-100 text-violet-700',
  POST_EDITE: 'bg-indigo-100 text-indigo-700',
  POST_SUPPRIME: 'bg-slate-100 text-slate-500',
  POST_CREE: 'bg-pink-100 text-pink-700',
  POST_REPROGRAMME: 'bg-indigo-100 text-indigo-700',
  POST_DUPLIQUE: 'bg-fuchsia-100 text-fuchsia-700',
  MESSAGE_REPONDU: 'bg-sky-100 text-sky-700',
  LEAD_CREE: 'bg-pink-100 text-pink-700',
  CAMPAGNE_ECOULEMENT: 'bg-amber-100 text-amber-700',
}

function JournalActivite({ journal, onAnnuler }: { journal: MarketingActionEntry[]; onAnnuler: (id: string) => void }) {
  if (journal.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
        <History size={22} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-semibold">Aucune action enregistrée pour l&apos;instant.</p>
        <p className="text-[10px] text-slate-400 mt-1">Programmez un post, répondez à un message ou créez un lead : tout est tracé ici, et réversible.</p>
      </div>
    )
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-2">
      <div className="text-[11px] text-slate-500">
        {journal.length} action(s) tracée(s) — chaque décision prise dans le studio est horodatée et annulable.
      </div>
      {journal.map(e => (
        <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 mt-0.5 ${KIND_STYLE[e.kind] ?? 'bg-slate-100 text-slate-600'}`}>
            {MARKETING_ACTION_LABEL[e.kind] ?? e.kind}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-slate-900">{e.label}</div>
            {e.detail && <div className="text-[10px] text-slate-500 mt-0.5 truncate">{e.detail}</div>}
            <div className="text-[9px] text-slate-400 mt-1">{e.by} · {fmt(e.at)}</div>
          </div>
          <button type="button" onClick={() => onAnnuler(e.id)} className="text-[9px] font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 shrink-0">
            <X size={11} /> Annuler
          </button>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vue semaine — grille jours × créneaux                               */
/* ------------------------------------------------------------------ */

function VueSemaine({ jours, creneaux, onOpen }: {
  jours: { label: string; date: string; posts: PostSocial[] }[]
  creneaux: string[]
  onOpen: (id: string) => void
}) {
  const colonnes = jours.slice(0, 7)
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2 overflow-x-auto">
      <div className="min-w-[720px]">
        {/* En-tête jours */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `56px repeat(${colonnes.length}, minmax(120px, 1fr))` }}>
          <div />
          {colonnes.map(c => (
            <div key={c.date} className="text-center py-1.5">
              <div className="text-[11px] font-black text-slate-800">{c.label.split(' ')[0]}</div>
              <div className="text-[9px] text-slate-400">{c.label.split(' ')[1]}</div>
            </div>
          ))}
        </div>
        {/* Lignes créneaux */}
        {creneaux.map(h => (
          <div key={h} className="grid gap-1.5 border-t border-slate-100 py-1.5" style={{ gridTemplateColumns: `56px repeat(${colonnes.length}, minmax(120px, 1fr))` }}>
            <div className="text-[10px] font-bold text-slate-400 flex items-start pt-1 gap-0.5"><Clock size={10} /> {h}</div>
            {colonnes.map(c => {
              const cases = c.posts.filter(p => p.heure === h)
              return (
                <div key={c.date + h} className="space-y-1">
                  {cases.map(p => (
                    <button key={p.id} type="button" onClick={() => onOpen(p.id)}
                      className="w-full text-left rounded-lg px-1.5 py-1 border border-slate-200 bg-white hover:border-pink-300 hover:shadow-sm transition">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] leading-none">{RESEAU_META[p.reseau].icone}</span>
                        <span className={`text-[7px] px-1 rounded-full font-bold ${ANGLE_META[p.angle].couleur}`}>{ANGLE_META[p.angle].label}</span>
                      </div>
                      <div className="text-[9px] font-semibold text-slate-700 line-clamp-2 mt-0.5">{p.accroche}</div>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Onglet Idées & modèles                                              */
/* ------------------------------------------------------------------ */

function IdeesModelesTab({ idees, onUtiliserIdee, onUtiliserModele }: {
  idees: IdeeContenu[]
  onUtiliserIdee: (idee: IdeeContenu) => void
  onUtiliserModele: (modele: ModeleContenu) => void
}) {
  return (
    <div className="space-y-6">
      {/* Idées à partir du terrain */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={15} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Idées du moment</h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">Déduites de ce que l&apos;entreprise vit maintenant — un surstock à écouler, une zone à conquérir, une preuve à montrer. Jamais en panne d&apos;idées.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {idees.map(idee => (
            <div key={idee.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col hover:border-amber-300 hover:shadow-sm transition">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[13px]">{RESEAU_META[idee.reseau_suggere].icone}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${ANGLE_META[idee.angle].couleur}`}>{ANGLE_META[idee.angle].label}</span>
              </div>
              <div className="text-[12px] font-black text-slate-800">{idee.titre}</div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-start gap-1"><Zap size={10} className="text-amber-500 mt-0.5 shrink-0" /> {idee.source}</p>
              <div className="text-[11px] text-slate-700 mt-2 bg-slate-50 rounded-lg p-2 line-clamp-3">« {idee.accroche} »</div>
              <button type="button" onClick={() => onUtiliserIdee(idee)}
                className="mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center gap-1.5">
                <Pencil size={11} /> Écrire ce post
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bibliothèque de modèles */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={15} className="text-violet-500" />
          <h3 className="text-sm font-bold text-slate-900">Bibliothèque de modèles</h3>
        </div>
        <p className="text-[11px] text-slate-500 mb-3">Des trames prêtes à remplir : on garde la structure qui marche, on change le produit et les chiffres.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODELES_CONTENU.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col hover:border-violet-300 hover:shadow-sm transition">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[13px]">{RESEAU_META[m.reseau].icone}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-violet-100 text-violet-700">{m.categorie}</span>
              </div>
              <div className="text-[12px] font-black text-slate-800">{m.nom}</div>
              <div className="text-[11px] text-slate-700 mt-2 bg-slate-50 rounded-lg p-2 whitespace-pre-line line-clamp-4">{m.corps}</div>
              <button type="button" onClick={() => onUtiliserModele(m)}
                className="mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 flex items-center justify-center gap-1.5">
                <Pencil size={11} /> Utiliser ce modèle
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Vue principale                                                      */
/* ------------------------------------------------------------------ */

export function SocialStudioView() {
  const [onglet, setOnglet] = useState<Onglet>('calendrier')
  const [postOuvertId, setPostOuvertId] = useState<string | null>(null)
  const [filtreReseau, setFiltreReseau] = useState<ReseauSocial | 'TOUS'>('TOUS')
  const [filtreAngle, setFiltreAngle] = useState<AnglePost | 'TOUS'>('TOUS')
  const [vueCalendrier, setVueCalendrier] = useState<'liste' | 'semaine'>('liste')
  const [composer, setComposer] = useState<{ initial: PostBrouillonInput; titre: string } | null>(null)
  const { journal, isDone, getEntry, executer, annuler, lastAction, clearLastAction } = useMarketingWorkflow()

  const genere = useMemo(() => buildCalendrierSocial(), [])
  const publies = useMemo(() => buildPostsPublies(), [])
  const inbox = useMemo(() => buildInboxSocial(), [])
  const repartition = useMemo(() => buildRepartitionReseau(), [])
  const idees = useMemo(() => buildIdeesContenu(), [])

  // Posts affichés = générés + créés par l'utilisateur, avec replanifications appliquées.
  const calendrier = useMemo(() => {
    const crees = postsCreesDepuisJournal(journal)
    const repMap = new Map(
      journal.filter(e => e.kind === 'POST_REPROGRAMME').map(e => [e.refId, e.payload as { date?: string; heure?: string }]),
    )
    return [...genere, ...crees].map(p => {
      const rep = repMap.get(p.id)
      return rep ? appliquerReprogrammation(p, rep) : p
    })
  }, [genere, journal])

  const perf = useMemo(() => buildPerfSocial(calendrier), [calendrier])
  const mix = useMemo(() => buildMixCalendrier(calendrier), [calendrier])

  const postOuvert = useMemo(
    () => (postOuvertId ? calendrier.find(p => p.id === postOuvertId) ?? publies.find(p => p.id === postOuvertId) ?? null : null),
    [postOuvertId, calendrier, publies],
  )

  const calendrierFiltre = useMemo(
    () => calendrier.filter(p =>
      (filtreReseau === 'TOUS' || p.reseau === filtreReseau)
      && (filtreAngle === 'TOUS' || p.angle === filtreAngle),
    ),
    [calendrier, filtreReseau, filtreAngle],
  )

  // Regroupé par date réelle, trié dans le temps ; posts d'un jour triés par heure.
  const parJour = useMemo(() => {
    const map = new Map<string, { label: string; date: string; posts: PostSocial[] }>()
    for (const p of calendrierFiltre) {
      const cur = map.get(p.date) ?? { label: p.jour_label, date: p.date, posts: [] }
      cur.posts.push(p)
      map.set(p.date, cur)
    }
    return [...map.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(g => ({ ...g, posts: [...g.posts].sort((a, b) => a.heure.localeCompare(b.heure)) }))
  }, [calendrierFiltre])

  // Créneaux présents, pour la vue semaine (grille jours × heures).
  const creneaux = useMemo(
    () => [...new Set(calendrierFiltre.map(p => p.heure))].sort((a, b) => a.localeCompare(b)),
    [calendrierFiltre],
  )

  const aValider = calendrier.filter(p => p.statut === 'A_VALIDER' || p.statut === 'BROUILLON_IA').length
  const journalMarketing = useMemo(() => [...journal].sort((a, b) => (a.at < b.at ? 1 : -1)), [journal])

  const nouveauBrouillon = (): PostBrouillonInput => ({
    reseau: 'WHATSAPP', angle: 'PROMO',
    date: prochainsJours(1)[0].date, heure: '07:30',
    accroche: '', corps: '', hashtags: ['#Prospera'],
    cta: 'https://wa.me/22890001212', visuel_suggere: '',
  })

  const creerPost = (input: PostBrouillonInput) => {
    const id = genId('post')
    executer('POST_CREE', id, {
      label: `Post créé — « ${input.accroche} »`,
      detail: `${RESEAU_META[input.reseau].label} · ${formatJourLabel(input.date)} ${input.heure}`,
      message: 'Post créé et ajouté au calendrier.',
      payload: input as unknown as Record<string, unknown>,
    })
    setComposer(null)
    setOnglet('calendrier')
  }

  const dupliquer = (post: PostSocial, cible: ReseauSocial) => {
    const input = adapterPourReseau(post, cible)
    const id = genId('post')
    executer('POST_DUPLIQUE', id, {
      label: `Post dupliqué vers ${RESEAU_META[cible].label}`,
      detail: `Depuis « ${post.accroche} »`,
      message: `Décliné sur ${RESEAU_META[cible].label} — visible dans le calendrier.`,
      payload: input as unknown as Record<string, unknown>,
    })
    setPostOuvertId(id)
  }

  return (
    <div className="p-6 max-w-[90rem] space-y-5">
      <PageHeader
        title="Studio réseaux sociaux"
        subtitle="Communication & marketing — le calendrier se remplit à partir de ce que l'entreprise a réellement à dire et à vendre"
        badge={`${aValider} posts à valider`}
      />

      {/* Les comptes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COMPTES_SOCIAUX.map(c => {
          const meta = RESEAU_META[c.reseau]
          const monte = c.croissance_30j_pct >= 0
          return (
            <div key={c.reseau} className={`rounded-xl border p-3 ${c.connecte ? 'bg-white border-slate-200' : 'bg-slate-50 border-dashed border-slate-300'}`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${RESEAU_PASTILLE[c.reseau]}`}>{meta.icone}</span>
                <span className="font-bold text-xs">{meta.label}</span>
                {c.connecte
                  ? <span className={`text-[8px] font-bold ml-auto flex items-center gap-0.5 ${monte ? 'text-emerald-600' : 'text-red-500'}`}>
                      {monte ? <TrendingUp size={9} /> : <TrendingDown size={9} />}{monte ? '+' : ''}{c.croissance_30j_pct}%
                    </span>
                  : <span className="text-[8px] text-slate-400 ml-auto">non connecté</span>}
              </div>
              <div className="text-[9px] text-slate-400 mt-1 leading-tight">{meta.role}</div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                <div>
                  <div className="text-slate-400">Abonnés</div>
                  <div className="font-bold">{c.abonnes.toLocaleString('fr-FR')}</div>
                </div>
                <div>
                  <div className="text-slate-400">Engagement</div>
                  <div className="font-bold text-violet-700">{c.engagement_pct}%</div>
                </div>
                <div>
                  <div className="text-slate-400">CA incr. 30 j</div>
                  <div className="font-bold text-emerald-700">{formatFcfa(c.ca_incremental_30j)}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-slate-100">
                <Clock size={9} className="text-slate-300" />
                {c.heures_optimales.map(h => (
                  <span key={h} className="text-[8px] font-semibold text-slate-500 bg-slate-100 rounded px-1">{h}</span>
                ))}
                <span className="text-[8px] text-slate-300 ml-auto">créneaux · 90 j</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap items-center gap-2">
        {ONGLETS.map(o => {
          const Icone = o.icone
          return (
            <button key={o.id} type="button" onClick={() => setOnglet(o.id)}
              className={`text-[11px] px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 ${onglet === o.id ? 'bg-pink-100 text-pink-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              <Icone size={12} /> {o.label}
              {o.id === 'inbox' && inbox.hors_sla > 0 && (
                <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 rounded-full">{inbox.hors_sla}</span>
              )}
              {o.id === 'journal' && journal.length > 0 && (
                <span className="bg-slate-400 text-white text-[8px] font-bold px-1.5 rounded-full">{journal.length}</span>
              )}
            </button>
          )
        })}
        <button type="button" onClick={() => setComposer({ initial: nouveauBrouillon(), titre: 'Nouveau post' })}
          className="ml-auto text-[11px] px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 bg-pink-600 text-white hover:bg-pink-700 shadow-sm">
          <Plus size={13} /> Nouveau post
        </button>
      </div>

      {/* Calendrier */}
      {onglet === 'calendrier' && (
        <div className="space-y-4">
          {/* Mix éditorial */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5"><BarChart3 size={14} className="text-slate-500" /> Mix éditorial de la semaine</h3>
              <span className="text-[10px] text-slate-400">{mix.programmes} programmés · {mix.a_valider} à valider</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden mb-2">
              {mix.par_angle.map(a => (
                <div key={a.angle} className={ANGLE_META[a.angle].couleur.split(' ')[0]} style={{ width: `${a.part_pct}%` }} title={`${ANGLE_META[a.angle].label} — ${a.part_pct}%`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {mix.par_angle.map(a => (
                <span key={a.angle} className="text-[9px] text-slate-500 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${ANGLE_META[a.angle].couleur.split(' ')[0]}`} />
                  {ANGLE_META[a.angle].label} · {a.n}
                </span>
              ))}
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><ListFilter size={11} /> Filtrer</span>
            <button type="button" onClick={() => setFiltreReseau('TOUS')}
              className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${filtreReseau === 'TOUS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Tous réseaux</button>
            {mix.par_reseau.map(r => (
              <button key={r.reseau} type="button" onClick={() => setFiltreReseau(prev => (prev === r.reseau ? 'TOUS' : r.reseau))}
                className={`text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${filtreReseau === r.reseau ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{RESEAU_META[r.reseau].icone} {RESEAU_META[r.reseau].label} · {r.n}</button>
            ))}
            {filtreAngle !== 'TOUS' && (
              <button type="button" onClick={() => setFiltreAngle('TOUS')}
                className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-pink-100 text-pink-700 flex items-center gap-1">{ANGLE_META[filtreAngle].label} <X size={10} /></button>
            )}
            <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <button type="button" onClick={() => setVueCalendrier('liste')}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${vueCalendrier === 'liste' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}><List size={11} /> Liste</button>
              <button type="button" onClick={() => setVueCalendrier('semaine')}
                className={`text-[10px] px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${vueCalendrier === 'semaine' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}><LayoutGrid size={11} /> Semaine</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-violet-600" />
              <h3 className="text-sm font-bold">Les rythmes que le calendrier suit</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {RYTHMES_COMMERCIAUX.map(r => (
                <div key={r.cle} className="bg-white/70 rounded-lg p-2.5">
                  <div className="text-[11px] font-bold text-slate-800">{r.libelle}</div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{r.explication}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda */}
          {parJour.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
              Aucun post ne correspond à ce filtre.
              <button type="button" onClick={() => setComposer({ initial: nouveauBrouillon(), titre: 'Nouveau post' })} className="ml-1 font-bold text-pink-600 hover:underline">Créer un post</button>
            </div>
          ) : vueCalendrier === 'liste' ? (
            <div className="space-y-5">
              {parJour.map(g => (
                <section key={g.date}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-pink-400 to-violet-500" />
                    <h3 className="text-sm font-black text-slate-800">{g.label}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{g.posts.length} publication{g.posts.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {g.posts.map(p => (
                      <CartePostCompacte key={p.id} post={p} onOpen={() => setPostOuvertId(p.id)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <VueSemaine jours={parJour} creneaux={creneaux} onOpen={id => setPostOuvertId(id)} />
          )}
        </div>
      )}

      {/* Idées & modèles */}
      {onglet === 'idees' && (
        <IdeesModelesTab
          idees={idees}
          onUtiliserIdee={idee => setComposer({ initial: brouillonFromIdee(idee, prochainsJours(1)[0].date), titre: `Idée : ${idee.titre}` })}
          onUtiliserModele={m => setComposer({ initial: brouillonFromModele(m, prochainsJours(1)[0].date), titre: `Modèle : ${m.nom}` })}
        />
      )}

      {/* Boîte de réception */}
      {onglet === 'inbox' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Messages', value: String(inbox.total), accent: 'text-slate-800' },
              { label: 'Traitables par l\'IA', value: String(inbox.auto_repondables), accent: 'text-emerald-700' },
              { label: 'Pour vous', value: String(inbox.a_traiter), accent: 'text-amber-700' },
              { label: 'Potentiel en jeu', value: `${formatFcfa(inbox.potentiel_fcfa)} F`, accent: 'text-emerald-700' },
            ].map(t => (
              <div key={t.label} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-[10px] text-slate-400">{t.label}</div>
                <div className={`text-base font-black ${t.accent}`}>{t.value}</div>
              </div>
            ))}
          </div>

          {inbox.hors_sla > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-[11px] text-red-800">
              <AlertTriangle size={13} />
              <span>
                <strong>{inbox.hors_sla} message(s) hors délai.</strong> Une intention d&apos;achat non répondue
                dans l&apos;heure part chez le concurrent — c&apos;est la métrique qui compte ici, pas le nombre d&apos;abonnés.
              </span>
            </div>
          )}

          <div className="space-y-2">
            {inbox.messages.map(m => {
              const meta = INTENTION_META[m.intention]
              const reseau = RESEAU_META[m.reseau]
              return (
                <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm">{reseau.icone}</span>
                        <span className="font-bold text-xs text-slate-900">{m.auteur}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${meta.couleur}`}>
                          {meta.label} · {m.confiance}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1.5 italic">« {m.contenu} »</p>
                    </div>
                    <div className="text-right shrink-0">
                      {m.potentiel_fcfa > 0 && (
                        <div className="text-xs font-black text-emerald-700">{formatFcfa(m.potentiel_fcfa)} F</div>
                      )}
                      <div className={`text-[9px] ${m.age_minutes > meta.sla_h * 60 ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                        {m.recu_il_y_a}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-2 rounded-lg p-2.5 border ${m.auto_repondable ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="text-[9px] font-bold uppercase mb-1 text-slate-500">
                      {m.auto_repondable ? 'Réponse automatique — part dans 2 min sauf annulation' : 'Réponse préparée — votre validation requise'}
                    </div>
                    <p className="text-[11px] text-slate-800">{m.reponse_suggeree}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {isDone('MESSAGE_REPONDU', m.id) ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                        <Send size={10} /> Réponse envoyée
                        <button type="button" onClick={() => { const e = getEntry('MESSAGE_REPONDU', m.id); if (e) annuler(e.id) }} className="ml-1 font-bold text-emerald-800 hover:text-emerald-950 underline">Annuler</button>
                      </span>
                    ) : (
                      <>
                        <button type="button" onClick={() => executer('MESSAGE_REPONDU', m.id, { label: `Réponse à ${m.auteur}`, detail: m.reponse_suggeree, message: 'Réponse envoyée.' })} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Envoyer</button>
                        <button type="button" onClick={() => executer('POST_REECRIRE', `msg-${m.id}`, { label: `Réponse à ${m.auteur} en réécriture`, message: 'Réponse ouverte pour ajustement.' })} className="text-[10px] font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">Modifier</button>
                      </>
                    )}
                    {m.potentiel_fcfa > 0 && (
                      isDone('LEAD_CREE', m.id) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-3 py-1 rounded-lg">Lead créé</span>
                      ) : (
                        <button type="button" onClick={() => executer('LEAD_CREE', m.id, { label: `Lead créé depuis ${m.auteur}`, detail: `${formatFcfa(m.potentiel_fcfa)} F de potentiel`, message: 'Lead créé et rattaché au commercial.' })} className="text-[10px] font-semibold px-3 py-1 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200">Créer le lead</button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Performance */}
      {onglet === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Portée 30 j', value: `${(perf.portee_30j / 1000).toFixed(0)} K`, accent: 'text-slate-800' },
              { label: 'Leads générés', value: String(perf.leads_30j), accent: 'text-sky-700' },
              { label: 'Commandes', value: String(perf.commandes_30j), accent: 'text-emerald-700' },
              { label: 'CA incrémental', value: `${formatFcfa(perf.ca_incremental_30j)} F`, accent: 'text-emerald-700' },
              { label: 'Coût par lead', value: `${formatFcfa(perf.cout_par_lead)} F`, accent: 'text-slate-800' },
              { label: 'ROI', value: `${perf.roi_pct}%`, accent: 'text-pink-600' },
            ].map(t => (
              <div key={t.label} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-[10px] text-slate-400">{t.label}</div>
                <div className={`text-base font-black ${t.accent}`}>{t.value}</div>
              </div>
            ))}
          </div>

          {perf.ca_en_attente > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900">
              <Clock size={14} className="shrink-0" />
              <span>
                <strong>{formatFcfa(perf.ca_en_attente)} F de CA potentiel</strong> attend votre validation :
                {' '}{aValider} post(s) sont prêts mais pas encore programmés. Chaque jour d&apos;attente est une audience qui passe sans voir l&apos;offre.
              </span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">Où va réellement le résultat</h3>
            <div className="space-y-2">
              {repartition.map(r => {
                const meta = RESEAU_META[r.reseau]
                return (
                  <div key={r.reseau} className="flex items-center gap-3">
                    <div className="w-32 shrink-0 flex items-center gap-1.5">
                      <span className="text-sm">{meta.icone}</span>
                      <span className="text-[11px] font-bold text-slate-800">{meta.label}</span>
                    </div>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-400 to-emerald-500 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max(r.part_leads_pct, 4)}%` }}>
                        <span className="text-[8px] font-bold text-white">{r.part_leads_pct}%</span>
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <div className="text-[11px] font-black text-emerald-700">{formatFcfa(r.ca_incremental_30j)} F</div>
                      <div className="text-[9px] text-slate-400">{r.leads_30j} leads · {formatFcfa(r.ca_par_lead)}/lead</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[9px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
              Part des leads incrémentaux par canal. TikTok pèse peu en CA mais recrute des gérants jeunes à faible coût ;
              WhatsApp convertit, Facebook nourrit le vivier. C&apos;est cet équilibre qu&apos;il faut financer, pas le seul canal qui « rapporte ».
            </p>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 text-xs space-y-2">
            <div>
              <p className="font-bold mb-1">Le ROI ne se calcule ni sur la portée, ni sur le CA du canal.</p>
              <p className="text-slate-300 leading-relaxed">
                {formatFcfa(perf.ca_attribue_30j)} F sont passés par les canaux sociaux, mais un client fidèle
                qui commande son riz par WhatsApp aurait commandé de toute façon. Seuls{' '}
                <strong className="text-white">{formatFcfa(perf.ca_incremental_30j)} F</strong> sont réellement
                créés par le social (nouveaux clients et réactivations), soit{' '}
                {formatFcfa(perf.marge_incrementale_30j)} F de marge à 13%, pour {formatFcfa(perf.cout_30j)} F de
                budget — d&apos;où un ROI de {perf.roi_pct}%.
              </p>
            </div>
            <p className="text-slate-400 leading-relaxed border-t border-slate-700 pt-2">
              S&apos;attribuer tout le CA du canal donnerait un ROI trois fois supérieur et un budget trois fois
              trop gros. C&apos;est flatteur le premier mois, et intenable le jour où le DG compare la dépense à
              la croissance réelle.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Publications récentes et ce qu&apos;elles ont rapporté</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {publies.map(p => (
                <CartePostCompacte key={p.id} post={p} onOpen={() => setPostOuvertId(p.id)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Journal d'activité */}
      {onglet === 'journal' && (
        <JournalActivite journal={journalMarketing} onAnnuler={annuler} />
      )}

      {postOuvert && <PostDetailModal post={postOuvert} onClose={() => setPostOuvertId(null)} onDupliquer={dupliquer} />}

      {composer && (
        <ComposerModal initial={composer.initial} titre={composer.titre} onClose={() => setComposer(null)} onSubmit={creerPost} />
      )}

      <WorkflowToast action={lastAction} onClose={clearLastAction} />
    </div>
  )
}
