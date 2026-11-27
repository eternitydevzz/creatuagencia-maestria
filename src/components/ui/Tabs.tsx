import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface TabItem { id: string; label: string; content: ReactNode }

/** Pestañas accesibles (role tablist/tab/tabpanel, flechas izquierda/derecha, Inicio/Fin). En móvil la fila se desliza. */
export default function Tabs({ tabs, initial }: { tabs: TabItem[]; initial?: string }) {
  const shown = tabs.filter((t) => t.content)
  const [active, setActive] = useState(initial && shown.some((t) => t.id === initial) ? initial : shown[0]?.id)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const base = useId()
  if (!shown.length) return null
  const current = shown.find((t) => t.id === active) ?? shown[0]

  const onKey = (e: KeyboardEvent) => {
    const i = shown.findIndex((t) => t.id === current.id)
    const next = e.key === 'ArrowRight' ? (i + 1) % shown.length : e.key === 'ArrowLeft' ? (i - 1 + shown.length) % shown.length
      : e.key === 'Home' ? 0 : e.key === 'End' ? shown.length - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setActive(shown[next].id)
    refs.current[shown[next].id]?.focus()
  }

  return (
    <div className="card overflow-hidden">
      <div role="tablist" aria-orientation="horizontal" onKeyDown={onKey} className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 pt-2">
        {shown.map((t) => {
          const on = t.id === current.id
          return (
            <button key={t.id} ref={(el) => { refs.current[t.id] = el }} type="button" role="tab" id={`${base}-tab-${t.id}`} aria-selected={on}
              aria-controls={`${base}-panel-${t.id}`} tabIndex={on ? 0 : -1} onClick={() => setActive(t.id)}
              className={`relative flex-none whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${on ? 'text-white' : 'text-muted hover:text-white'}`}>
              {t.label}
              {on && <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent-hi" />}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`${base}-panel-${current.id}`} aria-labelledby={`${base}-tab-${current.id}`} tabIndex={0} className="p-5 sm:p-6">
        {current.content}
      </div>
    </div>
  )
}
