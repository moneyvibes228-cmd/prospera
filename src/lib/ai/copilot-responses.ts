import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/lib/auth'
import type { CopilotContext } from '@/lib/ai/copilot-context'
import { answerCopilotQuestion } from '@/lib/ai/copilot-engine'

export type { CopilotContext } from '@/lib/ai/copilot-context'

const FALLBACK = (ctx: CopilotContext) =>
  `${ctx.prenom}, je n'ai pas identifié d'information précise pour cette formulation. En tant que ${ROLE_LABELS[ctx.role]} (${ctx.zone}), reformulez avec un nom client, une référence dossier (DOS-…), ou des mots-clés : objectifs, retard, PAR, collecte.`

export function getCopilotResponse(questionId: string, ctx: CopilotContext): string {
  const answer = answerCopilotQuestion('', ctx, questionId)
  return answer || FALLBACK(ctx)
}

/** Réponse à une question libre — données mock + angle métier selon le rôle */
export function getCopilotFreeTextResponse(question: string, ctx: CopilotContext): string {
  const trimmed = question.trim()
  if (!trimmed) {
    return 'Posez votre question sur un client, un dossier, les retards, vos objectifs du jour, le PAR (y compris comparaison entre agences) ou la collecte.'
  }
  return answerCopilotQuestion(trimmed, ctx)
}
