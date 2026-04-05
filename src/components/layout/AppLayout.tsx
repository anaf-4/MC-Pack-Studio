import { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'

interface Props {
  children: ReactNode
  inspector?: ReactNode
}

export function AppLayout({ children, inspector }: Props) {
  return (
    <div className="h-screen flex flex-col bg-mc-bg-dark text-mc-text-primary overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
        {inspector && (
          <aside className="w-72 bg-mc-bg-panel border-l border-mc-border overflow-y-auto shrink-0">
            {inspector}
          </aside>
        )}
      </div>
    </div>
  )
}
