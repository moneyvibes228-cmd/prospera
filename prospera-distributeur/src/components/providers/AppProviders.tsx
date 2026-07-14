'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { ComboStockWorkflowProvider } from '@/contexts/ComboStockWorkflowContext'
import { TerrainWorkflowProvider } from '@/contexts/TerrainWorkflowContext'
import { ValidationsWorkflowProvider } from '@/contexts/ValidationsWorkflowContext'
import { RecouvrementWorkflowProvider } from '@/contexts/RecouvrementWorkflowContext'
import { StockWorkflowProvider } from '@/contexts/StockWorkflowContext'
import { FacturationWorkflowProvider } from '@/contexts/FacturationWorkflowContext'
import { MarketingWorkflowProvider } from '@/contexts/MarketingWorkflowContext'
import { DecisionsWorkflowProvider } from '@/contexts/DecisionsWorkflowContext'
import { AutomationWorkflowProvider } from '@/contexts/AutomationWorkflowContext'
import { ProspectionWorkflowProvider } from '@/contexts/ProspectionWorkflowContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ComboStockWorkflowProvider>
          <TerrainWorkflowProvider>
            <ValidationsWorkflowProvider>
              <RecouvrementWorkflowProvider>
                <StockWorkflowProvider>
                  <FacturationWorkflowProvider>
                    <MarketingWorkflowProvider>
                      <DecisionsWorkflowProvider>
                        <AutomationWorkflowProvider>
                          <ProspectionWorkflowProvider>{children}</ProspectionWorkflowProvider>
                        </AutomationWorkflowProvider>
                      </DecisionsWorkflowProvider>
                    </MarketingWorkflowProvider>
                  </FacturationWorkflowProvider>
                </StockWorkflowProvider>
              </RecouvrementWorkflowProvider>
            </ValidationsWorkflowProvider>
          </TerrainWorkflowProvider>
        </ComboStockWorkflowProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
