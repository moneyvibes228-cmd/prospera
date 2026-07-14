'use client'
import { Building2, CalendarClock, Sparkles, Phone, Mail } from 'lucide-react'
import { cn, formatFcfa } from '@distributeur/lib/utils'
import { AiBadge } from '@distributeur/components/dashboard/AiBadge'
import { buildFicheFournisseur } from '@distributeur/lib/fournisseurs-hub'
import { STATUT_FOURNISSEUR_STYLE } from '@distributeur/lib/registries/fournisseurs-registry'
import { STATUT_CF_STYLE } from '@distributeur/lib/registries/commandes-fournisseurs-registry'

function Jauge({ label, valeur, invert = false }: { label: string; valeur: number; invert?: boolean }) {
  const bon = invert ? valeur <= 30 : valeur >= 80
  const moyen = invert ? valeur <= 60 : valeur >= 60
  const couleur = bon ? 'bg-emerald-500' : moyen ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className={cn('font-bold', bon ? 'text-emerald-600' : moyen ? 'text-amber-600' : 'text-red-600')}>
          {valeur}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn('h-full rounded-full', couleur)} style={{ width: `${Math.min(100, valeur)}%` }} />
      </div>
    </div>
  )
}

export function FicheFournisseur({ fournisseurId }: { fournisseurId: string }) {
  const fiche = buildFicheFournisseur(fournisseurId)
  if (!fiche) return null

  const { fournisseur: f, produits, commandes, synthese_ia, ecart_delai_j, part_dette_pct, litiges, commandes_en_cours } = fiche
  const statut = STATUT_FOURNISSEUR_STYLE[f.statut]
  const detteSousPlafond = f.encours_du <= f.plafond_credit_accorde

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm space-y-4">
      {/* Identité */}
      <div className="flex flex-wrap gap-4">
        <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <Building2 size={24} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-black text-slate-900">{f.nom}</h3>
            <span className="font-mono text-[10px] text-slate-400">{f.code}</span>
            <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-bold', statut.className)}>{statut.label}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {f.categories.join(' · ')} · {f.pays} · {f.contact.nom}
          </p>
          <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1"><Phone size={10} /> {f.contact.telephone}</span>
            <span className="inline-flex items-center gap-1"><Mail size={10} /> {f.contact.email}</span>
          </p>
        </div>
        <AiBadge variant="small" label="Score fiabilité" confidence={f.score_fiabilite} />
      </div>

      <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex gap-2">
        <Sparkles size={14} className="text-indigo-600 shrink-0 mt-0.5" />
        {synthese_ia}
      </p>

      {/* Conditions commerciales */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Conditions commerciales</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          {[
            { label: 'Délai livraison', value: `${f.delai_livraison_j} j` },
            { label: 'Délai réel moyen', value: `${f.delai_reel_moyen_j} j`, color: ecart_delai_j > 2 ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Délai paiement', value: `${f.delai_paiement_j} j` },
            { label: 'Franco de port', value: formatFcfa(f.franco_de_port) },
            { label: 'Remise volume', value: `${f.remise_volume_pct} %`, color: 'text-emerald-600' },
          ].map(k => (
            <div key={k.label} className="bg-slate-50 rounded-lg p-2.5">
              <div className="text-slate-400">{k.label}</div>
              <div className={cn('font-bold', k.color ?? 'text-slate-800')}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dette & échéancier */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className={cn('rounded-xl border p-4', f.encours_echu > 0 ? 'border-red-200 bg-red-50/60' : 'border-slate-200 bg-slate-50')}>
          <div className="flex items-center gap-1.5 mb-3">
            <CalendarClock size={13} className={f.encours_echu > 0 ? 'text-red-600' : 'text-slate-500'} />
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Encours & échéancier</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Encours total dû</span>
              <span className="font-black text-slate-900">{formatFcfa(f.encours_du)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">dont échu</span>
              <span className={cn('font-bold', f.encours_echu > 0 ? 'text-red-600' : 'text-emerald-600')}>
                {f.encours_echu > 0 ? formatFcfa(f.encours_echu) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Prochaine échéance</span>
              <span className="font-bold text-slate-700">
                {f.prochaine_echeance} · {formatFcfa(f.montant_prochaine_echeance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Plafond accordé</span>
              <span className={cn('font-bold', detteSousPlafond ? 'text-slate-700' : 'text-red-600')}>
                {formatFcfa(f.plafond_credit_accorde)}
                {!detteSousPlafond && ' — dépassé'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between">
              <span className="text-slate-500">Part de la dette totale</span>
              <span className="font-bold text-slate-700">{part_dette_pct} %</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mb-3">Performance</div>
          <div className="space-y-2.5">
            <Jauge label="Fiabilité" valeur={f.score_fiabilite} />
            <Jauge label="Livraisons conformes %" valeur={f.taux_livraison_conforme_pct} />
            <Jauge label="Compétitivité prix" valeur={f.competitivite_prix} />
            <Jauge label="Taux de litige %" valeur={f.taux_litige_pct} invert />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px]">
            <span className="text-slate-500">CA annuel</span>
            <span className="font-bold text-slate-800">{formatFcfa(f.ca_annuel_avec_fournisseur)}</span>
          </div>
          <div className="flex justify-between text-[11px] mt-1">
            <span className="text-slate-500">Commandes en cours · litiges</span>
            <span className="font-bold text-slate-800">
              {commandes_en_cours} · <span className={litiges > 0 ? 'text-red-600' : ''}>{litiges}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Produits fournis + comparatif prix */}
      <div>
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">
          Produits fournis — comparatif avec le meilleur prix concurrent
        </div>
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 sticky top-0">
              <tr>
                <th className="text-left p-2.5">Produit</th>
                <th className="text-center p-2.5">Rôle</th>
                <th className="text-right p-2.5">Prix d&apos;achat</th>
                <th className="text-right p-2.5">Meilleur concurrent</th>
                <th className="text-right p-2.5">Écart</th>
                <th className="text-right p-2.5">Lot</th>
              </tr>
            </thead>
            <tbody>
              {produits.map(p => (
                <tr key={p.produit_ref} className="border-t border-slate-100">
                  <td className="p-2.5 font-medium text-slate-800">{p.produit_nom}</td>
                  <td className="p-2.5 text-center">
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                      p.prioritaire ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {p.prioritaire ? 'Prioritaire' : 'Secours'}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-bold tabular-nums">{p.prix_achat.toLocaleString('fr-FR')}</td>
                  <td className="p-2.5 text-right text-slate-400 tabular-nums">
                    {p.concurrent_prix ? p.concurrent_prix.toLocaleString('fr-FR') : '—'}
                  </td>
                  <td className={cn('p-2.5 text-right font-bold tabular-nums',
                    (p.ecart_prix_pct ?? 0) <= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {p.ecart_prix_pct != null ? `${p.ecart_prix_pct > 0 ? '+' : ''}${p.ecart_prix_pct} %` : '—'}
                  </td>
                  <td className="p-2.5 text-right text-slate-500 tabular-nums">{p.quantite_lot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historique commandes */}
      {commandes.length > 0 && (
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Historique des commandes</div>
          <div className="space-y-1.5">
            {commandes.map(c => {
              const st = STATUT_CF_STYLE[c.statut]
              return (
                <div key={c.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-slate-400">{c.reference}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', st.className)}>{st.label}</span>
                    <span className="text-[10px] text-slate-400 truncate hidden md:inline">
                      {c.lignes.length} ligne{c.lignes.length > 1 ? 's' : ''} · {c.date_creation}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0">{formatFcfa(c.montant_ttc)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
