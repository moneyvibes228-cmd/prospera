'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, AlertTriangle, BookOpen, Scale, ArrowRight, LayoutDashboard,
  ShoppingCart, Sprout, Hammer, Briefcase, Car, UtensilsCrossed, GraduationCap,
  TrendingUp, Target, Shield,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { getSecteurHub, SEUIL_CONCENTRATION_BCEAO } from '@/lib/secteur-hub'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ExportButton } from '@/components/dashboard/ExportButton'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { SecteurTables } from '@/components/secteurs/SecteurTables'
import { formatFcfa, cn } from '@/lib/utils'

type Tab = 'agences' | 'sous_secteurs' | 'dossiers'

const SECTOR_ICONS: Record<string, typeof ShoppingCart> = {
  Commerce: ShoppingCart,
  Agriculture: Sprout,
  Artisanat: Hammer,
  Services: Briefcase,
  Transport: Car,
  Restauration: UtensilsCrossed,
  'Éducation': GraduationCap,
}

interface Props {
  slug: string
}

export function SecteurDgView({ slug }: Props) {
  const router = useRouter()
  const hub = getSecteurHub(slug)
  const [tab, setTab] = useState<Tab>('agences')

  if (!hub) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Secteur introuvable.</p>
        <button type="button" onClick={() => router.back()} className="text-teal-600 text-sm mt-2 cursor-pointer">← Retour</button>
      </div>
    )
  }

  const Icon = SECTOR_ICONS[hub.nom] ?? Briefcase
  const chartHist = hub.historique_6m.map(h => ({ ...h, encoursM: h.encours / 1_000_000 }))
  const benchmarkData = hub.benchmark_secteurs.map(b => ({
    nom: b.nom.length > 10 ? b.nom.slice(0, 9) + '…' : b.nom,
    part: b.part_reseau_pct,
    par: b.par_pct,
    current: b.slug === hub.slug,
  }))
  const sousSectPar = hub.sous_secteurs_detail.map(ss => ({
    nom: ss.nom.length > 14 ? ss.nom.slice(0, 13) + '…' : ss.nom,
    par: ss.par,
    fill: ss.par > 10 ? '#ef4444' : ss.par > 8 ? '#f97316' : '#14b8a6',
  }))

  const depassePlafond = hub.decaissements_mois.montant_fcfa > hub.decaissements_mois.plafond_fcfa

  return (
    <PageWrapper
      title={hub.nom}
      subtitle={`${hub.nb_dossiers} dossiers · ${formatFcfa(hub.encours)} · ${hub.part_reseau_pct} % encours réseau (${formatFcfa(hub.encours_reseau_fcfa)})`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer px-2 py-1.5 rounded-lg border border-slate-200 bg-white">
            <ArrowLeft size={14} /> Dashboard
          </button>
          {hub.alerte_concentration && (
            <span className="text-xs font-semibold text-orange-800 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg">
              Concentration BCEAO
            </span>
          )}
          <ExportButton label="Exporter secteur" filename={`secteur_${hub.slug}`} size="sm" />
        </div>
      }
    >
      <div className="flex items-center gap-3 mb-5 -mt-2">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${hub.color}20` }}>
          <Icon size={24} style={{ color: hub.color }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <AiBadge variant="small" label="Analyse sectorielle DG" />
          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            Saisonnalité {hub.saisonalite}
          </span>
        </div>
      </div>

      <Link
        href="/dashboard"
        className="flex items-center gap-3 mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-colors cursor-pointer group"
      >
        <LayoutDashboard size={20} className="text-teal-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-800">Vue synthétique sur le Tableau de bord</div>
          <div className="text-xs text-slate-600 mt-0.5">
            Répartition sectorielle globale — cette page approfondit {hub.nom} : concentration, sous-secteurs, dossiers à risque et arbitrages DG.
          </div>
        </div>
        <ArrowRight size={16} className="text-slate-400 group-hover:text-teal-600 shrink-0" />
      </Link>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-5 mb-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={18} className="text-teal-300" />
          <h2 className="text-sm font-bold">Memo sectoriel — lecture DG</h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-100">{hub.synthese_memo}</p>
        <p className="text-sm text-teal-200 font-medium mt-3">→ {hub.ia_recommandation}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: 'Part encours réseau',
            value: `${hub.part_reseau_pct} %`,
            sub: hub.ecart_seuil_concentration_pct > 0 ? `+${hub.ecart_seuil_concentration_pct} pt vs BCEAO 30 %` : 'Sous seuil 30 %',
            color: hub.part_reseau_pct > SEUIL_CONCENTRATION_BCEAO ? 'text-orange-600' : 'text-emerald-600',
          },
          { label: 'PAR 30j sectoriel', value: `${hub.par_30j_pct} %`, sub: `${hub.dossiers_en_retard} dossiers en retard`, color: hub.par_30j_pct > 10 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Expected Loss', value: formatFcfa(hub.expected_loss), sub: `Provision ${formatFcfa(hub.provision_requise)}`, color: 'text-red-700' },
          { label: 'Décaissements mois', value: formatFcfa(hub.decaissements_mois.montant_fcfa), sub: depassePlafond ? 'Au-dessus plafond IA' : `Plafond ${formatFcfa(hub.decaissements_mois.plafond_fcfa)}`, color: depassePlafond ? 'text-orange-600' : 'text-slate-900' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-500">{k.label}</div>
            <div className={cn('text-xl font-black mt-1', k.color)}>{k.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {hub.alerte_concentration && (
        <div className="mb-5 p-4 rounded-xl bg-orange-50 border border-orange-200 flex gap-3">
          <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-orange-900">Concentration sectorielle — seuil BCEAO</div>
            <div className="mt-2 h-3 bg-orange-100 rounded-full overflow-hidden relative">
              <div className="absolute h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, hub.part_reseau_pct)}%` }} />
              <div className="absolute h-full w-0.5 bg-red-600" style={{ left: `${SEUIL_CONCENTRATION_BCEAO}%` }} title="Seuil 30%" />
            </div>
            <div className="flex justify-between text-[10px] text-orange-800 mt-1">
              <span>{hub.part_reseau_pct} % actuel</span>
              <span>Seuil 30 %</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">Benchmark réseau — part encours</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={benchmarkData} layout="vertical" margin={{ left: 4, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" unit=" %" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nom" width={72} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `${Number(v)} %`} />
              <Bar dataKey="part" name="Part réseau" radius={[0, 4, 4, 0]}>
                {benchmarkData.map((entry, i) => (
                  <Cell key={i} fill={entry.current ? hub.color : '#cbd5e1'} />
                ))}
              </Bar>
              <ReferenceLine x={SEUIL_CONCENTRATION_BCEAO} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '30%', fontSize: 9 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} className="text-orange-600" />
            <h3 className="text-sm font-semibold text-slate-900">PAR par sous-secteur</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sousSectPar} margin={{ bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => `${Number(v)} %`} />
              <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Seuil 10%', fontSize: 9 }} />
              <Bar dataKey="par" name="PAR" radius={[4, 4, 0, 0]}>
                {sousSectPar.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Évolution 6 mois — encours & PAR</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartHist}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} unit=" M" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
            <Tooltip formatter={(v, name) => (name === 'PAR %' ? `${Number(v)} %` : `${Number(v).toFixed(1)} M FCFA`)} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="encoursM" name="Encours" stroke={hub.color} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="par" name="PAR %" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Répartition produits</h3>
          </div>
          <div className="space-y-2">
            {hub.repartition_produits.map(p => (
              <div key={p.produit} className="text-xs">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-slate-700">{p.produit}</span>
                  <span className="font-bold">{p.pct} % · PAR {p.par_pct} %</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Migrations BCEAO (mois)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">NORMAL → Surveillance</span>
              <span className="font-bold text-orange-600">{hub.migrations_bceao_mois.normal_vers_surveillance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Surveillance → Douteux</span>
              <span className="font-bold text-red-600">{hub.migrations_bceao_mois.surveillance_vers_douteux}</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed">{hub.migrations_bceao_mois.commentaire}</p>
          <Link href="/conformite" className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 mt-2 hover:underline">
            Voir conformité BCEAO <ArrowRight size={12} />
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Scénarios IA — 90 jours</h3>
          <div className="space-y-2">
            {hub.scenarios_choc.map(s => (
              <div key={s.scenario} className="p-2 rounded-lg border border-slate-100 text-xs">
                <div className="font-bold text-slate-800">{s.scenario}</div>
                <div className="flex justify-between mt-1 text-slate-600">
                  <span>PAR {s.par_prevu_pct} %</span>
                  <span>EL {formatFcfa(s.el_prevu_fcfa)}</span>
                  <span>{s.probabilite_pct} %</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hub.alertes.length > 0 && (
        <div className="space-y-2 mb-5">
          {hub.alertes.map((a, i) => (
            <div key={i} className={cn('p-3 rounded-xl border flex gap-2', a.severite === 'CRITIQUE' ? 'bg-red-50 border-red-100' : a.severite === 'HAUTE' ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100')}>
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-slate-800">{a.titre}</div>
                <p className="text-xs text-slate-600">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Décisions DG — arbitrage sectoriel</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {hub.decisions_dg.map(d => (
            <div key={d.titre} className={cn('px-5 py-3 flex gap-3', d.priorite === 1 && 'bg-teal-50/30')}>
              <span className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white', d.priorite === 1 ? 'bg-teal-600' : d.priorite === 2 ? 'bg-indigo-500' : 'bg-slate-400')}>
                P{d.priorite}
              </span>
              <div>
                <div className="text-sm font-bold text-slate-900">{d.titre}</div>
                <div className="text-xs text-slate-600 mt-0.5">{d.detail}</div>
                <div className="text-[10px] text-teal-700 mt-1">Impact : {d.impact} · Délai : {d.delai}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <details className="bg-slate-50 rounded-xl border border-slate-200 mb-5 group">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors list-none">
          <BookOpen size={16} className="text-teal-600" />
          Comprendre le risque sectoriel (guide DG)
        </summary>
        <div className="px-4 pb-4 grid md:grid-cols-2 gap-3">
          {hub.glossaire.map(g => (
            <div key={g.terme} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-teal-700">{g.terme}</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{g.definition}</p>
              {g.seuil_dg && <p className="text-[10px] text-orange-700 font-medium mt-1.5">{g.seuil_dg}</p>}
            </div>
          ))}
        </div>
      </details>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['agences', 'Exposition agences', hub.agences_exposition.length],
          ['sous_secteurs', 'Sous-secteurs', hub.sous_secteurs_detail.length],
          ['dossiers', 'Dossiers à risque', hub.dossiers_risque.length],
        ] as const).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              tab === id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200',
            )}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <SecteurTables hub={hub} tab={tab} />
    </PageWrapper>
  )
}
