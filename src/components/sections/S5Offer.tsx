import { Gift, Mic, ShieldCheck } from 'lucide-react'
import { CopyButton } from '@/components/ui/bits'
import { Tree } from '@/components/ui/Tree'
import Deliverable, { Expandable } from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { staleness } from '@/lib/freshness'
import { str, treeToText } from '@/lib/tree'
import type { JsonObject } from '@/lib/types'
import { stepNo } from '@/lib/gamification'

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])
const objects = (v: unknown): JsonObject[] => (Array.isArray(v) ? v.filter((x): x is JsonObject => !!x && typeof x === 'object' && !Array.isArray(x)) : [])

export default function S5Offer({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const o = roadmap.agency_offer
  const offer = (o.oferta ?? {}) as JsonObject
  const price = (offer.precio ?? {}) as JsonObject
  const bonuses = list(offer.bonos)
  const ladder = objects(o.escalera).slice(0, 3)
  const missing = Object.keys(roadmap.ideal_client).length === 0 && `Primero genera tu cliente ideal (paso ${stepNo(4)}): la oferta se construye sobre él.`

  return (
    <Deliverable missing={missing} stale={staleness(roadmap).offer} done={Object.keys(offer).length > 0} busy={isBusy('agency_offer')} cost={3} label="Generar mi oferta"
      pending="La IA usa tu cliente ideal y tu modo de precios." onGenerate={() => void run('agency_offer')}
      actions={<CopyButton text={treeToText(o)} />}>
      <div className="stagger space-y-4">
        {/* La oferta como una tarjeta de precio: nombre, promesa, precio, garantía y bonos */}
        <article className="relative overflow-hidden rounded-2xl border border-accent/45 p-5 sm:p-7" style={{ background: 'radial-gradient(ellipse 70% 120% at 100% 0%, rgba(0,112,248,.32), transparent 60%), rgba(255,255,255,.03)' }}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="eyebrow">Tu oferta</p>
              {str(offer.nombre) && <h3 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">{str(offer.nombre)}</h3>}
              {str(offer.promesa) && <p className="mt-3 text-[15px] leading-relaxed text-text">{str(offer.promesa)}</p>}
              {str(offer.garantia) && (
                <p className="mt-4 flex gap-2.5 rounded-xl border border-[#00a884]/40 bg-[#00a884]/10 px-4 py-3 text-sm leading-relaxed text-[#cdeee6]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#7fe7cd]" />{str(offer.garantia)}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-bg-deep/70 p-5">
              {str(price.valor_total_percibido) && <p className="text-sm text-muted">Valor <span className="line-through">{str(price.valor_total_percibido)}</span></p>}
              {str(price.setup) && <p className="mt-1 text-4xl font-bold tracking-tight text-white">{str(price.setup)}<span className="ml-1.5 text-sm font-medium text-muted">puesta en marcha</span></p>}
              {str(price.mensual) && <p className="mt-1 text-2xl font-semibold text-accent-glow">+ {str(price.mensual)}</p>}
              {bonuses.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="eyebrow flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" />Incluido sin coste</p>
                  <ul className="mt-2 space-y-2 text-sm leading-snug text-text">
                    {bonuses.map((b) => <li key={b} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent-hi" />{b}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Escalera de precios: entrada, principal y premium */}
        {ladder.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {ladder.map((l, i) => {
              const main = /principal/i.test(str(l.nivel) ?? '') || (ladder.length === 3 && i === 1)
              return (
                <article key={i} className={`card flex flex-col p-5 ${main ? '!border-accent-hi/70 shadow-[0_14px_34px_rgba(0,60,160,.3)]' : ''}`}>
                  <p className="eyebrow">{str(l.nivel) ?? `Nivel ${i + 1}`}</p>
                  {str(l.nombre) && <p className="mt-1.5 text-lg font-bold leading-snug text-white">{str(l.nombre)}</p>}
                  {str(l.precio) && <p className="mt-2 text-xl font-semibold text-accent-glow">{str(l.precio)}</p>}
                  {str(l.incluye) && <p className="mt-3 text-sm leading-relaxed text-text">{str(l.incluye)}</p>}
                  {str(l.para_quien) && <p className="mt-auto pt-3 text-xs leading-relaxed text-muted">{str(l.para_quien)}</p>}
                </article>
              )
            })}
          </div>
        )}

        {/* El pitch para decirlo en voz alta */}
        {str(offer.pitch_30s) && (
          <article className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" />Pitch de 30 segundos</p>
              <CopyButton text={str(offer.pitch_30s) ?? ''} label="Copiar pitch" />
            </div>
            <p className="mt-3 text-[15px] italic leading-relaxed text-white">“{str(offer.pitch_30s)}”</p>
          </article>
        )}

        <Expandable label="Ver la oferta completa: qué incluye, objeciones, oferta piloto, números de tu agencia…"><Tree v={o} /></Expandable>
      </div>
    </Deliverable>
  )
}
