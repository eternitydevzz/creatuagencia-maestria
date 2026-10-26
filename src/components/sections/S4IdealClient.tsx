import { MessageSquareQuote, TrendingDown } from 'lucide-react'
import { Avatar, CopyButton } from '@/components/ui/bits'
import { Tree } from '@/components/ui/Tree'
import Deliverable, { Expandable } from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { staleness } from '@/lib/freshness'
import { str, treeToText } from '@/lib/tree'
import type { JsonObject } from '@/lib/types'
import { stepNo } from '@/lib/gamification'

/** La cifra que se le escapa al cliente (la que va seguida de "se van", "pierde", "sin facturar"…), para mostrarla en grande. */
function lostPerMonth(text?: string): string | undefined {
  if (!text) return undefined
  for (const m of text.matchAll(/(?:\$\s?[\d.,]+|[\d.,]+\s?€)/g)) {
    const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 60)
    if (/se (van|pierde|escapa)|pierde|escapa|sin facturar|deja/i.test(after)) return m[0].trim()
  }
  return undefined
}

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])

export default function S4IdealClient({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const c = roadmap.ideal_client
  const person = (c.avatar ?? {}) as JsonObject
  const lost = lostPerMonth(str(c.coste_del_problema))
  const pains = list(c.dolores).slice(0, 3)
  const opener = str(c.primer_mensaje)
  const missing = !roadmap.selected_problems.length ? `Elige al menos un problema en el paso ${stepNo(1)}.` : !roadmap.selected_nichos.length ? `Elige tu nicho en el paso ${stepNo(2)}.` : false

  return (
    <Deliverable missing={missing} stale={staleness(roadmap).ideal} done={Object.keys(c).length > 0} busy={isBusy('ideal_client')} cost={2} label="Generar mi cliente ideal"
      pending="La IA usa tus problemas, tu nicho y tus números." onGenerate={() => void run('ideal_client')}
      actions={<CopyButton text={treeToText(c)} />}>
      <div className="stagger space-y-4">
        {/* Quién es y cuánto pierde: lo primero que se lee */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <article className="hero-panel rounded-2xl border border-accent/30 p-5 sm:p-6">
            <p className="eyebrow">Quién es</p>
            {str(c.resumen) && <p className="mt-2 text-lg font-semibold leading-snug text-white sm:text-xl">{str(c.resumen)}</p>}
            {str(person.nombre) && (
              <div className="mt-5 flex items-start gap-3 border-t border-white/10 pt-4">
                <Avatar name={str(person.nombre)} className="h-11 w-11 text-base" />
                <div className="min-w-0">
                  <p className="font-semibold text-white">{str(person.nombre)}</p>
                  {str(person.dia_a_dia) && <p className="mt-1.5 text-sm leading-relaxed text-text">{str(person.dia_a_dia)}</p>}
                </div>
              </div>
            )}
          </article>
          {str(c.coste_del_problema) && (
            <article className="rounded-2xl border border-[#ff8f8f]/35 p-5 sm:p-6" style={{ background: 'radial-gradient(ellipse 90% 90% at 100% 0%, rgba(255,95,95,.16), transparent 65%), rgba(255,255,255,.025)' }}>
              <p className="eyebrow flex items-center gap-1.5 !text-[#ffb3b3]"><TrendingDown className="h-3.5 w-3.5" />Lo que le cuesta el problema</p>
              {lost && <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">{lost}<span className="ml-1 text-base font-semibold text-[#ffb3b3]">/mes</span></p>}
              <p className={`text-sm leading-relaxed text-text ${lost ? 'mt-3' : 'mt-2'}`}>{str(c.coste_del_problema)}</p>
            </article>
          )}
        </div>

        {/* Sus dolores, con sus palabras */}
        {pains.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {pains.map((p) => (
              <blockquote key={p} className="card relative p-4 pl-5">
                <span aria-hidden className="absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-accent-glow to-accent" />
                <p className="text-[15px] leading-relaxed text-white">“{p}”</p>
              </blockquote>
            ))}
          </div>
        )}

        {/* Mensaje listo para enviarle */}
        {opener && (
          <article className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-1.5"><MessageSquareQuote className="h-3.5 w-3.5" />Primer mensaje para escribirle</p>
              <CopyButton text={opener} label="Copiar mensaje" />
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#005c4b]/40 px-4 py-3 text-[15px] leading-relaxed text-[#e9edef]">{opener}</p>
          </article>
        )}

        <Expandable label="Ver la ficha completa: perfil, dolores, objeciones, dónde encontrarlo…"><Tree v={c} /></Expandable>
      </div>
    </Deliverable>
  )
}
