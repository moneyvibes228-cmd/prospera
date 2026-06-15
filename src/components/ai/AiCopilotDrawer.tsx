'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Sparkles, MessageCircleQuestion, Bot, Send } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { AiBadge } from '@/components/dashboard/AiBadge'
import { getCopilotQuestions } from '@/lib/ai/copilot-questions'
import { getCopilotResponse, getCopilotFreeTextResponse } from '@/lib/ai/copilot-responses'
import type { AuthUser } from '@/lib/auth'
import { ROLE_LABELS } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface Props {
  user: AuthUser
}

function firstName(nom: string) {
  return nom.trim().split(/\s+/)[0] || nom
}

export function AiCopilotDrawer({ user }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const questions = getCopilotQuestions(user.role)

  const ctx = {
    prenom: firstName(user.nom),
    role: user.role,
    zone: user.zone,
    nomComplet: user.nom,
  }

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    if (messages.length > 0 || loading) scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const sendMessage = useCallback(
    (text: string, options?: { questionId?: string }) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      setLoading(true)
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: trimmed,
      }
      setMessages(prev => [...prev, userMsg])
      setInput('')

      window.setTimeout(() => {
        const answer = options?.questionId
          ? getCopilotResponse(options.questionId, ctx)
          : getCopilotFreeTextResponse(trimmed, ctx)

        setMessages(prev => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', text: answer },
        ])
        setLoading(false)
      }, 500)
    },
    [loading, ctx],
  )

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (questionId: string, label: string) => {
    sendMessage(label, { questionId })
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      window.setTimeout(() => inputRef.current?.focus(), 300)
    } else {
      setMessages([])
      setInput('')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        aria-label="Ouvrir Prospera IA"
      >
        <Sparkles size={18} className="shrink-0" />
        <span className="hidden sm:inline">Prospera IA</span>
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col p-0 gap-0"
          showCloseButton
        >
          <SheetHeader className="border-b border-slate-200 bg-linear-to-r from-indigo-950 to-slate-900 text-white p-4 shrink-0">
            <div className="flex items-start gap-3 pr-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Bot size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-white text-base font-bold">
                  Prospera IA
                </SheetTitle>
                <SheetDescription className="text-indigo-200 text-xs mt-0.5">
                  {ROLE_LABELS[user.role]} · {user.zone}
                </SheetDescription>
                <div className="mt-2">
                  <AiBadge variant="small" label="Prospera AI" pulse />
                </div>
              </div>
            </div>
          </SheetHeader>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0"
          >
            {messages.length === 0 && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-4 text-sm text-slate-700 leading-relaxed">
                <p className="font-semibold text-indigo-900 mb-1">
                  Bonjour {firstName(user.nom)} 👋
                </p>
                <p>
                  {user.role === 'DAF' ? (
                    <>
                      Compléments opérationnels (suspens 471, clôture J-7, cash 7 j, ratios BCEAO NC)
                      — pas une reprise du bandeau Finance. Cliquez une suggestion ou posez une question
                      sur la comptabilité, les provisions ou la trésorerie par agence.
                    </>
                  ) : (
                    <>
                      Questions en langage naturel : retard client, dossier DOS-…,
                      objectifs du jour, ou pourquoi le PAR diffère entre agences (ex. Bè Kpota vs
                      Kpalimé). La réponse dépend de votre profil {ROLE_LABELS[user.role]}.
                    </>
                  )}
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[95%] whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'ml-auto bg-indigo-600 text-white'
                    : 'mr-auto bg-white border border-slate-200 text-slate-800 shadow-sm',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-indigo-600 uppercase">
                    <Sparkles size={11} />
                    Prospera IA
                  </div>
                )}
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="mr-auto rounded-xl bg-white border border-slate-200 px-3.5 py-3 text-sm text-slate-500 animate-pulse">
                Analyse en cours…
              </div>
            )}
          </div>

          {/* Saisie libre */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-slate-200 bg-white p-3 space-y-2"
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Écrivez votre question…"
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 disabled:opacity-60"
                aria-label="Votre question"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                aria-label="Envoyer"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 px-1">
              Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
            </p>
          </form>

          {/* Suggestions (raccourcis, sans limite) */}
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-3 py-2.5 max-h-[140px] overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5 sticky top-0 bg-slate-50/95 py-0.5">
              <MessageCircleQuestion size={12} />
              Suggestions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {questions.map(q => (
                <button
                  key={q.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSuggestion(q.id, q.label)}
                  className="text-left text-[10px] font-medium rounded-full border border-slate-200 bg-white text-slate-700 px-2.5 py-1 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900 transition-colors duration-200 cursor-pointer disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
