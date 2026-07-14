'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@distributeur/contexts/AuthContext'
import { ComboStockWorkflowProvider } from '@distributeur/contexts/ComboStockWorkflowContext'
import { TerrainWorkflowProvider } from '@distributeur/contexts/TerrainWorkflowContext'
import { ValidationsWorkflowProvider } from '@distributeur/contexts/ValidationsWorkflowContext'
import { RecouvrementWorkflowProvider } from '@distributeur/contexts/RecouvrementWorkflowContext'
import { StockWorkflowProvider } from '@distributeur/contexts/StockWorkflowContext'
import { FacturationWorkflowProvider } from '@distributeur/contexts/FacturationWorkflowContext'
import { MarketingWorkflowProvider } from '@distributeur/contexts/MarketingWorkflowContext'
import { DecisionsWorkflowProvider } from '@distributeur/contexts/DecisionsWorkflowContext'
import { AutomationWorkflowProvider } from '@distributeur/contexts/AutomationWorkflowContext'
import { ProspectionWorkflowProvider } from '@distributeur/contexts/ProspectionWorkflowContext'

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
