import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { play } from '@/lib/sound'

interface Toast { id: number; text: string; kind: 'ok' | 'error' }
const Ctx = createContext<{ toast: (text: string, kind?: Toast['kind']) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random()
    if (kind === 'error') play('error')
    setItems((l) => [...l, { id, text, kind }])
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 2800)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-[92vw] animate-step-in items-center gap-2 rounded-full border-[1.5px] border-line-strong bg-bg-deep/95 px-4 py-2.5 text-sm font-semibold text-white">
            {t.kind === 'ok' ? <CheckCircle2 className="h-4 w-4 text-accent-hi" /> : <AlertCircle className="h-4 w-4 text-[#ff8f8f]" />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast fuera de ToastProvider')
  return c.toast
}
