'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '@/lib/api'
import { MOCK_LOANS } from '@/lib/mockMicrofinance'
import type { Loan } from '@/types'

export function useLoans(stage?: string) {
  return useQuery<Loan[]>({
    queryKey: ['loans', stage],
    queryFn: async () => {
      try {
        const res = await endpoints.loans(stage)
        return res.data
      } catch {
        if (stage) return MOCK_LOANS.filter(l => l.stage === stage)
        return MOCK_LOANS
      }
    },
    staleTime: 60_000,
  })
}

export function useUpdateLoanStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      endpoints.loanUpdateStage(id, stage).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}
