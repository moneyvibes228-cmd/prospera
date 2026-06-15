'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  AlertTriangle,
  Users,
  Briefcase,
  Filter,
  Plus,
  Sparkles,
} from 'lucide-react'
import {
  getCcHubData,
  CC_CALENDRIER_REFERENCE,
  type EvenementCalendrierCC,
} from '@/lib/cc-credit-hub'
import { cn } from '@/lib/utils'

const REF_DATE = CC_CALENDRIER_REFERENCE
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

const TYPE_META: Record<
  EvenementCalendrierCC['type'],
  { label: string; color: string; border: string; bg: string; icon: typeof Calendar }
> = {
  RDV: { label: 'RDV terrain / agence', color: 'text-violet-800', border: 'border-violet-300', bg: 'bg-violet-50', icon: MapPin },
  ECHEANCE: { label: 'Échéance dossier', color: 'text-red-800', border: 'border-red-300', bg: 'bg-red-50', icon: AlertTriangle },
  DOSSIER: { label: 'Pièces / instruction', color: 'text-indigo-800', border: 'border-indigo-300', bg: 'bg-indigo-50', icon: FileText },
  RELANCE: { label: 'Relance', color: 'text-orange-800', border: 'border-orange-300', bg: 'bg-orange-50', icon: Clock },
  COMITE: { label: 'Comité crédit', color: 'text-teal-800', border: 'border-teal-300', bg: 'bg-teal-50', icon: Users },
  BUREAU: { label: 'Bureau / admin', color: 'text-slate-700', border: 'border-slate-300', bg: 'bg-slate-50', icon: Briefcase },
}

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'] as const

function parseHeure(h: string): number {
  const [hh, mm] = h.split(':').map(Number)
  return hh + (mm ?? 0) / 60
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function startOfWeekMonday(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 4)
  const s = new Date(weekStart + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  return `${s.toLocaleDateString('fr-FR', opts)} — ${e.toLocaleDateString('fr-FR', { ...opts, year: 'numeric' })}`
}

export function CalendrierCcBlock() {
  const hub = getCcHubData()
  const router = useRouter()
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(REF_DATE))
  const [vue, setVue] = useState<'semaine' | 'jour'>('semaine')
  const [selectedDate, setSelectedDate] = useState(REF_DATE)
  const [selectedEvent, setSelectedEvent] = useState<EvenementCalendrierCC | null>(null)
  const [typeFilter, setTypeFilter] = useState<EvenementCalendrierCC['type'] | 'ALL'>('ALL')

  const weekDays = useMemo(
    () => JOURS.map((_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const filteredEvents = useMemo(() => {
    return hub.calendrier.filter(e => {
      if (typeFilter !== 'ALL' && e.type !== typeFilter) return false
      if (vue === 'jour') return e.date === selectedDate
      return weekDays.includes(e.date)
    })
  }, [hub.calendrier, typeFilter, vue, selectedDate, weekDays])

  const stats = useMemo(() => {
    const dayEvents = hub.calendrier.filter(e => e.date === selectedDate)
    return {
      total: dayEvents.length,
      rdv: dayEvents.filter(e => e.type === 'RDV').length,
      echeances: dayEvents.filter(e => e.type === 'ECHEANCE').length,
      critiques: dayEvents.filter(e => e.priorite === 'CRITIQUE').length,
      charge_h: Math.round(dayEvents.reduce((s, e) => s + e.duree_min, 0) / 60),
    }
  }, [hub.calendrier, selectedDate])

  function goToday() {
    const ws = startOfWeekMonday(REF_DATE)
    setWeekStart(ws)
    setSelectedDate(REF_DATE)
  }

  function openEvent(evt: EvenementCalendrierCC) {
    setSelectedEvent(evt)
    if (evt.dossier_ref) {
      router.push(`/credit/analyse?ref=${encodeURIComponent(evt.dossier_ref)}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barre outils */}
      <div className="flex flex-wrap items-center gap-3 justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
            aria-label="Semaine précédente"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
            aria-label="Semaine suivante"
          >
            <ChevronRight size={18} />
          </button>
          <span className="text-sm font-bold text-slate-800 ml-1 hidden sm:inline">
            {formatWeekRange(weekStart)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['semaine', 'jour'] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setVue(v)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold capitalize cursor-pointer transition-colors',
                  vue === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            <Plus size={14} />
            Planifier
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Colonne gauche */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-indigo-200" />
              <span className="text-xs font-bold uppercase tracking-wide text-indigo-100">IA — journée</span>
            </div>
            <p className="text-sm leading-relaxed text-indigo-50">
              Priorité 08h : dossier critique Bessan (dépôt suspect). Enchaîner signatures 13h puis étude 15h.
              Objectif : 3 décisions avant 17h.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase">Filtrer</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={typeFilter === 'ALL'} onClick={() => setTypeFilter('ALL')} label="Tout" />
              {(Object.keys(TYPE_META) as EvenementCalendrierCC['type'][]).map(t => (
                <FilterChip
                  key={t}
                  active={typeFilter === t}
                  onClick={() => setTypeFilter(t)}
                  label={TYPE_META[t].label.split(' ')[0]}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Événements" value={stats.total} />
            <StatCard label="RDV" value={stats.rdv} />
            <StatCard label="Critiques" value={stats.critiques} alert={stats.critiques > 0} />
            <StatCard label="Charge (h)" value={stats.charge_h} />
          </div>

          {selectedEvent && (
            <EventDetailCard evt={selectedEvent} onClose={() => setSelectedEvent(null)} />
          )}
        </aside>

        {/* Grille principale */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {vue === 'semaine' ? (
            <WeekGrid
              weekDays={weekDays}
              events={filteredEvents}
              refDate={REF_DATE}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectEvent={setSelectedEvent}
              onOpenEvent={openEvent}
            />
          ) : (
            <DayAgenda
              date={selectedDate}
              events={filteredEvents.filter(e => e.date === selectedDate)}
              onOpenEvent={openEvent}
              onSelectEvent={setSelectedEvent}
            />
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
          ← Tableau de bord CC
        </Link>
        {' · '}
        <Link href="/credit/analyse" className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer">
          Analyse dossiers
        </Link>
      </p>
    </div>
  )
}

function WeekGrid({
  weekDays,
  events,
  refDate,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  onOpenEvent,
}: {
  weekDays: string[]
  events: EvenementCalendrierCC[]
  refDate: string
  selectedDate: string
  onSelectDate: (d: string) => void
  onSelectEvent: (e: EvenementCalendrierCC) => void
  onOpenEvent: (e: EvenementCalendrierCC) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        {/* En-têtes jours */}
        <div className="grid grid-cols-[52px_repeat(5,1fr)] border-b border-slate-200 bg-slate-50">
          <div className="p-2" />
          {weekDays.map((iso, i) => {
            const isToday = iso === refDate
            const isSelected = iso === selectedDate
            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate(iso)}
                className={cn(
                  'p-2 text-center border-l border-slate-200 cursor-pointer transition-colors',
                  isSelected && 'bg-indigo-50',
                  isToday && 'ring-2 ring-inset ring-teal-400',
                )}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase">{JOURS[i]}</div>
                <div className={cn('text-lg font-black', isToday ? 'text-teal-700' : 'text-slate-900')}>
                  {formatDayLabel(iso).split(' ')[0]}
                </div>
                <div className="text-[10px] text-slate-500">
                  {events.filter(e => e.date === iso).length} evt.
                </div>
              </button>
            )
          })}
        </div>

        {/* Grille horaire */}
        <div className="relative max-h-[520px] overflow-y-auto">
          {HOURS.map(h => (
            <div key={h} className="grid grid-cols-[52px_repeat(5,1fr)] border-b border-slate-100 min-h-[56px]">
              <div className="px-2 py-1 text-[10px] font-mono text-slate-400 text-right border-r border-slate-100">
                {String(h).padStart(2, '0')}:00
              </div>
              {weekDays.map(iso => {
                const slotEvents = events.filter(e => {
                  if (e.date !== iso) return false
                  const start = parseHeure(e.heure)
                  return Math.floor(start) === h
                })
                return (
                  <div
                    key={`${iso}-${h}`}
                    className="border-l border-slate-100 p-0.5 relative bg-white hover:bg-slate-50/80"
                  >
                    {slotEvents.map(evt => (
                      <EventChip
                        key={evt.id}
                        evt={evt}
                        onSelect={() => onSelectEvent(evt)}
                        onOpen={() => onOpenEvent(evt)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DayAgenda({
  date,
  events,
  onOpenEvent,
  onSelectEvent,
}: {
  date: string
  events: EvenementCalendrierCC[]
  onOpenEvent: (e: EvenementCalendrierCC) => void
  onSelectEvent: (e: EvenementCalendrierCC) => void
}) {
  const label = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (events.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-medium">Aucun événement — {label}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-bold text-slate-900 mb-4 capitalize">{label}</h3>
      <div className="space-y-2">
        {events.map(evt => (
          <AgendaRow
            key={evt.id}
            evt={evt}
            onSelect={() => onSelectEvent(evt)}
            onOpen={() => onOpenEvent(evt)}
          />
        ))}
      </div>
    </div>
  )
}

function EventChip({
  evt,
  onSelect,
  onOpen,
}: {
  evt: EvenementCalendrierCC
  onSelect: () => void
  onOpen: () => void
}) {
  const meta = TYPE_META[evt.type]
  const Icon = meta.icon
  const rows = Math.max(1, Math.ceil(evt.duree_min / 60))

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onSelect()
        if (evt.dossier_ref) onOpen()
      }}
      className={cn(
        'w-full text-left rounded-md border px-1.5 py-1 mb-0.5 transition-all cursor-pointer hover:shadow-md',
        meta.bg,
        meta.border,
        evt.priorite === 'CRITIQUE' && 'ring-1 ring-red-400',
      )}
      style={{ minHeight: rows * 28 }}
    >
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-mono font-bold text-slate-600">{evt.heure}</span>
        {evt.priorite === 'CRITIQUE' && <span className="w-1 h-1 rounded-full bg-red-500" />}
      </div>
      <div className={cn('text-[10px] font-bold leading-tight truncate', meta.color)}>{evt.titre}</div>
      <Icon size={10} className="opacity-50 mt-0.5" />
    </button>
  )
}

function AgendaRow({
  evt,
  onSelect,
  onOpen,
}: {
  evt: EvenementCalendrierCC
  onSelect: () => void
  onOpen: () => void
}) {
  const meta = TYPE_META[evt.type]
  const Icon = meta.icon

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onSelect()
        if (evt.dossier_ref) onOpen()
      }}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
      className={cn(
        'flex gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md',
        meta.bg,
        meta.border,
      )}
    >
      <div className="flex flex-col items-center flex-shrink-0 w-14">
        <span className="text-sm font-mono font-black text-slate-800">{evt.heure}</span>
        <span className="text-[10px] text-slate-500">{evt.duree_min} min</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
              meta.bg,
              meta.color,
            )}
          >
            {meta.label}
          </span>
          {evt.priorite === 'CRITIQUE' && (
            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 rounded">Critique</span>
          )}
        </div>
        <h4 className="text-sm font-bold text-slate-900 mt-1">{evt.titre}</h4>
        <p className="text-xs text-slate-600 mt-0.5">{evt.sous_titre}</p>
        {evt.lieu && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <MapPin size={11} /> {evt.lieu}
          </span>
        )}
        {evt.dossier_ref && (
          <span className="text-[11px] font-bold text-indigo-700 mt-1 block">{evt.dossier_ref}</span>
        )}
      </div>
      <Icon size={18} className={cn('flex-shrink-0 opacity-40', meta.color)} />
    </div>
  )
}

function EventDetailCard({ evt, onClose }: { evt: EvenementCalendrierCC; onClose: () => void }) {
  const meta = TYPE_META[evt.type]
  return (
    <div className={cn('rounded-xl border p-4', meta.bg, meta.border)}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold uppercase text-slate-500">Détail</span>
        <button type="button" onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer">
          Fermer
        </button>
      </div>
      <p className="text-sm font-bold text-slate-900">{evt.titre}</p>
      <p className="text-xs text-slate-600 mt-1">{evt.sous_titre}</p>
      <p className="text-xs text-slate-500 mt-2">
        {evt.heure} · {evt.duree_min} min
      </p>
      {evt.dossier_ref && (
        <Link
          href={`/credit/analyse?ref=${encodeURIComponent(evt.dossier_ref)}`}
          className="inline-block mt-2 text-xs font-bold text-indigo-700 hover:underline"
        >
          Ouvrir {evt.dossier_ref} →
        </Link>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-1 text-[10px] font-semibold rounded-md border cursor-pointer transition-colors',
        active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
      )}
    >
      {label}
    </button>
  )
}

function StatCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border p-2.5',
        alert ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200',
      )}
    >
      <div className="text-[9px] font-bold text-slate-500 uppercase">{label}</div>
      <div className={cn('text-xl font-black', alert ? 'text-red-800' : 'text-slate-900')}>{value}</div>
    </div>
  )
}
