'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Search, Star, MapPin, GripVertical, Check, X, Sparkles, AlertTriangle,
  SlidersHorizontal, ChevronDown, LayoutGrid, Clock, Plus, FolderPlus,
} from 'lucide-react'
import {
  buildCcPipelineStages,
  buildRaPipelineStages,
  buildRocPipelineStages,
  getRocPipelineTotals,
  getCcPipelineTotals,
  getRaPipelineTotals,
  getAgencePipelineTotals,
  isPreCcAnalyseStage,
  isCcAnalyseStage,
  AGENCE_PIPELINE_STAGE_IDS,
  type RocPipelineCard,
  type RocPipelineStage,
  type RocPipelineStageId,
  type AgencePipelineStageId,
  ROC_STAGE_LABELS,
  AGENCE_PIPELINE_LABELS,
} from '@/lib/credit-pipeline-roc'
import {
  refreshDemoStoreFromSession,
  canAdvanceToStage,
  setDemoStage,
  ensureDemoTracking,
  stageAddHint,
} from '@/lib/credit-pipeline-demo-store'
import { PipelineAddDossierModal } from '@/components/credit/PipelineAddDossierModal'
import { PipelineAddElementModal } from '@/components/credit/PipelineAddElementModal'
import { getDecisionsForRole, isRocRole, isCcRole, isRaRole, type DecisionCredit } from '@/lib/credit-decisions'
import { getSentimentStyle } from '@/lib/dossier-enrichissement'
import { AGENCE_RA } from '@/lib/ra-agence-hub'
import { useAuth } from '@/contexts/AuthContext'
import { formatFcfa } from '@/lib/utils'

function priorityStars(n: 1 | 2 | 3) {
  return (
    <div className="flex items-center gap-px">
      {[1, 2, 3].map(i => (
        <Star key={i} size={10} className={i <= n ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
      ))}
    </div>
  )
}

function scoreColor(s: number) {
  if (s >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (s >= 55) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function isAgenceStage(id: RocPipelineStageId): id is AgencePipelineStageId {
  return (AGENCE_PIPELINE_STAGE_IDS as readonly string[]).includes(id)
}

interface SortableCardProps {
  card: RocPipelineCard
  stageId: RocPipelineStageId
  onOpen: () => void
  onDecision: (d: DecisionCredit, e: React.MouseEvent) => void
  showActions: boolean
  showDemoActions?: boolean
  onAddElement?: (e: React.MouseEvent) => void
  stageHint?: string
}

function SortableCard({ card, stageId, onOpen, onDecision, showActions, showDemoActions, onAddElement, stageHint }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { card, stageId },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const sentiment = getSentimentStyle(card.sentiment)
  const sla = (card.attente_h ?? 0) >= 48
  const preAnalyse = isPreCcAnalyseStage(stageId)
  const enAnalyseCc = isCcAnalyseStage(stageId)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-xl border shadow-sm transition-shadow duration-200 ${
        isDragging ? 'opacity-40 shadow-none' : 'hover:shadow-md'
      } ${sla ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200/90 hover:border-indigo-300'}`}
    >
      {sla && <div className="h-0.5 bg-gradient-to-r from-red-500 to-orange-400 rounded-t-xl" />}

      <div className="p-3">
        <div className="flex items-start gap-1.5 mb-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="mt-0.5 p-0.5 rounded text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Déplacer"
          >
            <GripVertical size={14} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={onOpen} className="font-bold text-[13px] text-slate-900 truncate hover:text-indigo-700 cursor-pointer text-left">
                {card.client}
              </button>
              {!preAnalyse && card.score > 0 && (
              <span className={`shrink-0 text-[11px] font-black px-1.5 py-0.5 rounded border ${scoreColor(card.score)}`}>
                {card.score}
              </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{card.reference}</div>
          </div>
        </div>

        <button type="button" onClick={onOpen} className="w-full text-left cursor-pointer">
          <div className="text-sm font-black text-slate-800 mb-1">{formatFcfa(card.montant)}</div>
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug mb-2">{card.resume}</p>
        </button>

        <div className="flex items-center justify-between mb-2">
          {!preAnalyse && priorityStars(card.etoiles)}
          {!preAnalyse && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sentiment.bg} ${sentiment.text}`}>
            {sentiment.label}
          </span>
          )}
          {preAnalyse && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              {stageId === 'SOUMIS' ? 'Administratif' : 'Docs à valider'}
            </span>
          )}
        </div>

        {card.avis_cc && stageId === 'VALIDE_CHARGE' && (
          <div className="text-[10px] text-violet-700 bg-violet-50 rounded-lg px-2 py-1.5 mb-2 line-clamp-2 border border-violet-100">
            CC : {card.avis_cc}
          </div>
        )}

        {enAnalyseCc && (
          <div className="text-[10px] text-indigo-700 bg-indigo-50 rounded-lg px-2 py-1.5 mb-2 border border-indigo-100 font-semibold">
            Analyse CC en cours — ouvrir le workspace
          </div>
        )}

        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.tags.map(tag => (
              <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="inline-flex items-center gap-0.5 truncate max-w-[55%]">
            <MapPin size={9} className="shrink-0" /> {card.agence}
          </span>
          {card.attente_h ? (
            <span className={`inline-flex items-center gap-0.5 font-bold ${sla ? 'text-red-600' : 'text-slate-500'}`}>
              <Clock size={9} /> {card.attente_h}h
            </span>
          ) : (
            <span className="truncate">{card.agent.split(' ')[0]}</span>
          )}
        </div>

        {showDemoActions && onAddElement && isAgenceStage(stageId) && (
          <div className="mt-2 pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={onAddElement}
              className="w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold cursor-pointer transition-colors"
            >
              <Plus size={11} /> Ajouter un élément
            </button>
            {stageHint && (
              <p className="text-[9px] text-slate-400 mt-1.5 leading-snug">{stageHint}</p>
            )}
          </div>
        )}

        {showActions && stageId === 'EN_ANALYSE_ROC' && (
          <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={e => onDecision('APPROUVER', e)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer transition-colors"
            >
              <Check size={11} /> Valider
            </button>
            <button
              type="button"
              onClick={e => onDecision('REFUSER', e)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer transition-colors"
            >
              <X size={11} /> Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CardOverlay({ card }: { card: RocPipelineCard }) {
  return (
    <div className="bg-white rounded-xl border-2 border-indigo-400 shadow-2xl p-3 w-[272px] rotate-1 opacity-95">
      <div className="font-bold text-sm text-slate-900">{card.client}</div>
      <div className="text-lg font-black text-slate-800">{formatFcfa(card.montant)}</div>
      <div className={`inline-block mt-1 text-[11px] font-black px-1.5 py-0.5 rounded border ${scoreColor(card.score)}`}>
        {card.score}/100
      </div>
    </div>
  )
}

function DroppableColumn({ stageId, children, className }: { stageId: RocPipelineStageId; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${stageId}` })
  return (
    <div ref={setNodeRef} className={`${className ?? ''} ${isOver ? 'ring-2 ring-inset ring-indigo-400/60' : ''}`}>
      {children}
    </div>
  )
}

function ColumnHealth({ cards }: { cards: RocPipelineCard[] }) {
  if (!cards.length) return <div className="h-1 rounded-full bg-slate-200" />
  let g = 0, y = 0, r = 0
  for (const c of cards) {
    if (c.score >= 75) g++
    else if (c.score >= 55) y++
    else r++
  }
  const t = cards.length
  return (
    <div className="h-1 rounded-full overflow-hidden flex bg-slate-100">
      {g > 0 && <div className="bg-emerald-500" style={{ width: `${(g / t) * 100}%` }} />}
      {y > 0 && <div className="bg-amber-400" style={{ width: `${(y / t) * 100}%` }} />}
      {r > 0 && <div className="bg-red-500" style={{ width: `${(r / t) * 100}%` }} />}
    </div>
  )
}

export function PipelineCreditKanban() {
  const router = useRouter()
  const { user } = useAuth()
  const isCc = isCcRole(user?.role)
  const isRa = isRaRole(user?.role)
  const isRoc = isRocRole(user?.role)
  const raAgence = AGENCE_RA.nom
  const isAgencePipeline = isRa || isCc
  const [demoTick, setDemoTick] = useState(0)
  const [showAddDossier, setShowAddDossier] = useState(false)
  const [addElementTarget, setAddElementTarget] = useState<{
    card: RocPipelineCard
    stageId: AgencePipelineStageId
  } | null>(null)

  const mockStages = useMemo(() => {
    if (isAgencePipeline) refreshDemoStoreFromSession()
    return isRa
      ? buildRaPipelineStages(raAgence)
      : isCc
        ? buildCcPipelineStages()
        : buildRocPipelineStages()
  }, [isRa, isCc, isAgencePipeline, raAgence, demoTick])

  const refreshPipeline = useCallback(() => setDemoTick(t => t + 1), [])
  const [stages, setStages] = useState<RocPipelineStage[]>(mockStages)
  const [search, setSearch] = useState('')
  const [filtreAgence, setFiltreAgence] = useState(isRa ? raAgence : 'ALL')
  const [fileRocOnly, setFileRocOnly] = useState(false)
  const [activeCard, setActiveCard] = useState<RocPipelineCard | null>(null)

  useEffect(() => {
    setStages(mockStages)
  }, [mockStages])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const totals = isRa || isCc
    ? getAgencePipelineTotals(stages)
    : getRocPipelineTotals(stages)
  const showCardActions = isRoc

  const agences = useMemo(() => {
    const s = new Set<string>()
    stages.forEach(st => st.cards.forEach(c => s.add(c.agence)))
    return Array.from(s).sort()
  }, [stages])

  const filteredStages = useMemo(() => {
    return stages.map(st => ({
      ...st,
      cards: st.cards.filter(c => {
        if (filtreAgence !== 'ALL' && c.agence !== filtreAgence) return false
        if (fileRocOnly && st.id !== 'EN_ANALYSE_ROC') return false
        if (search) {
          const q = search.toLowerCase()
          return c.client.toLowerCase().includes(q) || c.reference.toLowerCase().includes(q) || c.resume.toLowerCase().includes(q)
        }
        return true
      }),
    }))
  }, [stages, search, filtreAgence, fileRocOnly])

  const findCard = useCallback((id: string) => {
    for (const st of stages) {
      const card = st.cards.find(c => c.id === id)
      if (card) return { card, stageId: st.id }
    }
    return null
  }, [stages])

  const handleDragStart = (e: DragStartEvent) => {
    const found = findCard(String(e.active.id))
    if (found) setActiveCard(found.card)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = e
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    let targetStageId: RocPipelineStageId | null = null
    if (overId.startsWith('column-')) {
      targetStageId = overId.replace('column-', '') as RocPipelineStageId
    } else {
      const overFound = findCard(overId)
      if (overFound) targetStageId = overFound.stageId
    }
    if (!targetStageId) return

    const source = findCard(activeId)
    if (!source || source.stageId === targetStageId) return

    if (isAgencePipeline && isAgenceStage(source.stageId) && isAgenceStage(targetStageId)) {
      const card = source.card
      const check = canAdvanceToStage(
        card.dossier_id,
        source.stageId,
        targetStageId,
      )
      if (!check.ok) {
        alert(check.reason ?? 'Étape suivante non autorisée.')
        return
      }
      ensureDemoTracking(
        card.dossier_id,
        {
          reference: card.reference,
          client: card.client,
          activite: card.activite,
          montant: card.montant,
          objet: card.objet,
          agence: card.agence,
          agent: card.agent,
        },
        targetStageId,
      )
      setDemoStage(card.dossier_id, targetStageId)
      refreshPipeline()
      return
    }

    setStages(prev => {
      const next = prev.map(st => ({ ...st, cards: [...st.cards] }))
      const srcCol = next.find(st => st.id === source.stageId)!
      const tgtCol = next.find(st => st.id === targetStageId!)!
      const idx = srcCol.cards.findIndex(c => c.id === activeId)
      if (idx === -1) return prev
      const [moved] = srcCol.cards.splice(idx, 1)
      tgtCol.cards.push(moved)
      return next
    })
  }

  const openDossier = (card: RocPipelineCard, stageId: RocPipelineStageId) => {
    const id = card.dossier_id || card.reference
    if (isCc && isCcAnalyseStage(stageId)) {
      router.push(`/credit/analyse?ref=${encodeURIComponent(card.reference)}`)
      return
    }
    router.push(`/credit/dossiers/${encodeURIComponent(id)}`)
  }

  const handleDecision = (card: RocPipelineCard, decision: DecisionCredit, e: React.MouseEvent) => {
    e.stopPropagation()
    const label = getDecisionsForRole(user?.role).find(d => d.id === decision)?.label ?? decision
    alert(`Décision ROC : ${label}\nDossier ${card.reference} — ${card.client}\nDécision enregistrée.`)
    if (decision === 'APPROUVER' && card.reference) {
      setStages(prev => {
        const next = prev.map(st => ({ ...st, cards: st.cards.filter(c => c.id !== card.id) }))
        const comite = next.find(st => st.id === 'EN_COMITE_CREDIT')!
        comite.cards.push(card)
        return next
      })
    }
    if (decision === 'REFUSER') {
      setStages(prev => prev.map(st => ({ ...st, cards: st.cards.filter(c => c.id !== card.id) })))
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="shrink-0 bg-white border-y border-slate-200 px-4 py-2.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher dossier, client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
        </div>
        <select
          value={filtreAgence}
          onChange={e => setFiltreAgence(e.target.value)}
          disabled={isRa}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRa ? (
            <option value={raAgence}>{raAgence}</option>
          ) : (
            <>
              <option value="ALL">Toutes agences</option>
              {agences.map(a => <option key={a} value={a}>{a}</option>)}
            </>
          )}
        </select>
        {!isCc && !isRa && (
          <button
            type="button"
            onClick={() => setFileRocOnly(v => !v)}
            className={`inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              fileRocOnly ? 'bg-orange-50 border-orange-300 text-orange-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={13} />
            Ma file ROC ({'enAttenteRoc' in totals ? totals.enAttenteRoc : 0})
          </button>
        )}
        {isAgencePipeline && (
          <button
            type="button"
            onClick={() => setShowAddDossier(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 cursor-pointer transition-colors"
          >
            <FolderPlus size={13} />
            Nouvelle demande
          </button>
        )}
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-600">
          <span><strong className="text-slate-900">{totals.totalCards}</strong> dossiers</span>
          <span className="text-slate-300">|</span>
          <span><strong className="text-indigo-700">{formatFcfa(totals.totalMontant)}</strong></span>
          {isRa || isCc ? (
            <span className="inline-flex items-center gap-1 text-violet-700">
              <Sparkles size={12} /> {'validesCc' in totals ? totals.validesCc : 0} validé CC
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-orange-700">
              <Sparkles size={12} /> {'enAttenteRoc' in totals ? totals.enAttenteRoc : 0} validation ROC
            </span>
          )}
          <LayoutGrid size={16} className="text-indigo-600" />
        </div>
      </div>

      {/* Kanban board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-x-auto overflow-y-hidden bg-[#eef1f6]">
          {filteredStages.map(stage => {
            const montant = stage.cards.reduce((s, c) => s + c.montant, 0)
            const cardIds = stage.cards.map(c => c.id)
            return (
              <DroppableColumn
                key={stage.id}
                stageId={stage.id}
                className={`flex-shrink-0 w-[300px] flex flex-col border-r border-slate-200/90 h-full ${
                  stage.id === 'EN_ANALYSE_ROC' ? 'bg-orange-50/50'
                    : stage.id === 'EN_COMITE_CREDIT' ? 'bg-purple-50/40'
                    : 'bg-[#eef1f6]'
                }`}
              >
                <div className="shrink-0 px-3 pt-3 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.accent}`} />
                    <h3 className="text-[13px] font-bold text-slate-800">{stage.label}</h3>
                    {stage.id === 'EN_ANALYSE_ROC' && <Sparkles size={12} className="text-orange-500" />}
                  </div>
                  <ColumnHealth cards={stage.cards} />
                  <div className="flex justify-between mt-2 text-[11px]">
                    <span className="font-semibold text-slate-500">{stage.cards.length} dossier{stage.cards.length !== 1 ? 's' : ''}</span>
                    <span className="font-black text-slate-700">{formatFcfa(montant)}</span>
                  </div>
                  {stage.id === 'EN_ANALYSE_ROC' && stage.cards.some(c => (c.attente_h ?? 0) >= 48) && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-red-600">
                      <AlertTriangle size={10} /> SLA dépassé
                    </div>
                  )}
                </div>

                <SortableContext id={`column-${stage.id}`} items={cardIds} strategy={verticalListSortingStrategy}>
                  <div
                    className="flex-1 overflow-y-auto px-2.5 pb-4 space-y-2.5 min-h-[80px]"
                    data-stage={stage.id}
                  >
                    {stage.cards.length === 0 ? (
                      <div className="py-12 text-center rounded-xl border-2 border-dashed border-slate-300/70 bg-white/40">
                        <p className="text-[11px] text-slate-400">Glissez un dossier ici</p>
                      </div>
                    ) : (
                      stage.cards.map(card => (
                        <SortableCard
                          key={card.id}
                          card={card}
                          stageId={stage.id}
                          onOpen={() => openDossier(card, stage.id)}
                          onDecision={(d, e) => handleDecision(card, d, e)}
                          showActions={showCardActions}
                          showDemoActions={isAgencePipeline && isAgenceStage(stage.id)}
                          stageHint={isAgencePipeline && isAgenceStage(stage.id) ? stageAddHint(stage.id) : undefined}
                          onAddElement={e => {
                            e.stopPropagation()
                            if (!isAgenceStage(stage.id)) return
                            setAddElementTarget({ card, stageId: stage.id })
                          }}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DroppableColumn>
            )
          })}
        </div>
        <DragOverlay>{activeCard ? <CardOverlay card={activeCard} /> : null}</DragOverlay>
      </DndContext>

      <p className="shrink-0 text-[10px] text-slate-400 px-4 py-2 bg-white border-t border-slate-200">
        {isRa || isCc
          ? `Pipeline agence · ${AGENCE_PIPELINE_LABELS.SOUMIS} → ${AGENCE_PIPELINE_LABELS.VALIDE_CHARGE} · ${isRa ? `Périmètre ${raAgence} · ` : ''}Ajoutez des éléments à chaque étape puis avancez le dossier (glisser-déposer)`
          : `Pipeline ROC · ${ROC_STAGE_LABELS.EN_ANALYSE} → ${ROC_STAGE_LABELS.EN_COMITE_CREDIT} → ${ROC_STAGE_LABELS.DECAISSEMENT} · Glissez-déposez · Valider/Rejeter uniquement en Validation ROC`}
      </p>

      <PipelineAddDossierModal
        open={showAddDossier}
        onClose={() => setShowAddDossier(false)}
        onCreated={refreshPipeline}
        defaultAgence={isRa ? raAgence : undefined}
      />
      {addElementTarget && (
        <PipelineAddElementModal
          open={Boolean(addElementTarget)}
          onClose={() => setAddElementTarget(null)}
          onAdded={refreshPipeline}
          dossierId={addElementTarget.card.dossier_id}
          dossierRef={addElementTarget.card.reference}
          client={addElementTarget.card.client}
          stageId={addElementTarget.stageId}
        />
      )}
    </div>
  )
}
