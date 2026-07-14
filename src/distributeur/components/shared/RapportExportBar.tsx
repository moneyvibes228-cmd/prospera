'use client'

import { FileSpreadsheet, Printer } from 'lucide-react'
import { telechargerCsv, imprimerPdf, suffixeDateFichier, type CsvCell } from '@distributeur/lib/export-utils'

interface RapportExportBarProps {
  /** Nom de fichier sans extension ni date (la date est ajoutée automatiquement). */
  nomFichier: string
  /** En-têtes de colonnes du CSV. */
  colonnes: string[]
  /** Lignes du CSV (recalculées à la volée via une fonction pour capter l'état courant). */
  getLignes: () => CsvCell[][]
  /** Libellé optionnel affiché devant les boutons. */
  label?: string
  className?: string
}

/**
 * Barre d'export réutilisable pour les rapports décision (DG, DAF, RESP_STOCK).
 * — « Exporter Excel » télécharge un CSV lisible par Excel/LibreOffice.
 * — « Exporter PDF » ouvre l'impression navigateur (Enregistrer au format PDF).
 */
export function RapportExportBar({ nomFichier, colonnes, getLignes, label, className }: RapportExportBarProps) {
  return (
    <div className={`no-print flex items-center gap-2 ${className ?? ''}`}>
      {label && <span className="text-[10px] text-slate-400 font-medium mr-1">{label}</span>}
      <button
        type="button"
        onClick={() => telechargerCsv(`${nomFichier}-${suffixeDateFichier()}`, colonnes, getLignes())}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-bold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
      >
        <FileSpreadsheet size={13} /> Exporter Excel
      </button>
      <button
        type="button"
        onClick={imprimerPdf}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-bold hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-colors"
      >
        <Printer size={13} /> Exporter PDF
      </button>
    </div>
  )
}
