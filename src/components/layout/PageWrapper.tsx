import { Header } from './Header'

interface PageWrapperProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageWrapper({ title, subtitle, actions, children }: PageWrapperProps) {
  return (
    <div className="p-6">
      <Header title={title} subtitle={subtitle} actions={actions} />
      {children}
    </div>
  )
}
