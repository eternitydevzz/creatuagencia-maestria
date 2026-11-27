import { ChevronDown, Gift, Mic, ShieldCheck } from 'lucide-react'
import { CopyButton } from '@/components/ui/bits'
import { Tree } from '@/components/ui/Tree'
import Tabs from '@/components/ui/Tabs'
import Deliverable from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { staleness } from '@/lib/freshness'
import { str, treeToText } from '@/lib/tree'
import type { JsonObject } from '@/lib/types'
import { stepNo } from '@/lib/gamification'

const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])
const objects = (v: unknown): JsonObject[] => (Array.isArray(v) ? v.filter((x): x is JsonObject => !!x && typeof x === 'object' && !Array.isArray(x)) : [])
const has = (v: unknown) => v !== undefined && v !== null && v !== '' && !(typeof v === 'object' && Object.keys(v as object).length === 0)
/** Título corto de la garantía: lo que va antes de los dos puntos (o el principio de la frase). */
const shortTitle = (s: string) => { const head = s.split(':')[0].trim(); return head.length <= 90 ? head : `${s.slice(0, 80).trim()}…` }

// Claves que ya se ven arriba o en otra pestaña; el resto (de la oferta y de dentro de `oferta`) va a "Más"
const SHOWN = ['oferta', 'escalera', 'objeciones', 'oferta_piloto', 'numeros_agencia']
const OFFER_SHOWN = ['nombre', 'promesa', 'precio', 'bonos', 'garantia', 'pitch_30s', 'mecanismo', 'incluye', 'para_quien', 'urgencia', 'objeciones']

/** "Qué incluye" como cuadrícula: el mecanismo destacado, cada entregable en su tarjeta y para quién / urgencia al final. */
function Includes({ offer }: { offer: JsonObject }) {
  const items = objects(offer.incluye)
  return (
    <div className="space-y-4">
      {str(offer.mecanismo) && <p className="rounded-xl border border-accent/30 bg-accent/[0.07] p-4 text-sm leading-relaxed text-white"><span className="eyebrow mr-2">Cómo funciona</span>{str(offer.mecanismo)}</p>}
      {items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="font-semibold leading-snug text-white">{str(it.entregable) ?? str(it.nombre) ?? `Entregable ${i + 1}`}</p>
              {str(it.que_resuelve) && <p className="mt-2 text-sm leading-relaxed text-muted">{str(it.que_resuelve)}</p>}
              {str(it.valor_percibido) && <span className="mt-auto self-start pt-3"><span className="rounded-full bg-accent-hi/15 px-2.5 py-1 text-xs font-semibold text-accent-glow">Valor {str(it.valor_percibido)}</span></span>}
            </div>
          ))}
        </div>
      )}
      {!items.length && has(offer.incluye) && <Tree v={offer.incluye} />}
      {(str(offer.para_quien) || str(offer.urgencia)) && (
        <div className="grid gap-3 md:grid-cols-2">
          {str(offer.para_quien) && <div className="rounded-xl border border-white/10 p-4"><p className="eyebrow">Para quién</p><p className="mt-1.5 text-sm leading-relaxed text-text">{str(offer.para_quien)}</p></div>}
          {str(offer.urgencia) && <div className="rounded-xl border border-[#e8b93a]/30 p-4"><p className="eyebrow !text-[#f5d27a]">Urgencia</p><p className="mt-1.5 text-sm leading-relaxed text-text">{str(offer.urgencia)}</p></div>}
        </div>
      )}
    </div>
  )
}

/** Objeciones como tarjetas de pregunta y respuesta. */
function Objections({ v }: { v: unknown }) {
  const items = objects(v)
  if (!items.length) return <Tree v={v as JsonObject} />
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm font-semibold leading-snug text-white">“{str(it.objecion) ?? str(it.pregunta) ?? ''}”</p>
          {str(it.respuesta) && <p className="mt-2 border-l-2 border-accent-hi/60 pl-3 text-sm leading-relaxed text-text">{str(it.respuesta)}</p>}
        </div>
      ))}
    </div>
  )
}

export default function S5Offer({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const o = roadmap.agency_offer
  const offer = (o.oferta ?? {}) as JsonObject
  const price = (offer.precio ?? {}) as JsonObject
  const bonuses = list(offer.bonos)
  const ladder = objects(o.escalera).slice(0, 3)
  const guarantee = str(offer.garantia)
  const missing = Object.keys(roadmap.ideal_client).length === 0 && `Primero genera tu cliente ideal (paso ${stepNo(4)}): la oferta se construye sobre él.`
  const rest = {
    ...Object.fromEntries(Object.entries(offer).filter(([k]) => !OFFER_SHOWN.includes(k))),
    ...Object.fromEntries(Object.entries(o).filter(([k]) => !SHOWN.includes(k) && !k.startsWith('_'))),
  } as JsonObject
  const objections = has(o.objeciones) ? o.objeciones : offer.objeciones

  return (
    <Deliverable missing={missing} stale={staleness(roadmap).offer} done={Object.keys(offer).length > 0} busy={isBusy('agency_offer')} cost={3} label="Generar mi oferta"
      pending="La IA usa tu cliente ideal y tu modo de precios." onGenerate={() => void run('agency_offer')}
      actions={<CopyButton text={treeToText(o)} />}>
      <div className="stagger space-y-5">
        {/* 1. La oferta: promesa a la izquierda, precio protagonista a la derecha */}
        <article className="relative overflow-hidden rounded-2xl border border-accent/40 p-5 sm:p-7" style={{ background: 'radial-gradient(ellipse 70% 120% at 100% 0%, rgba(0,112,248,.28), transparent 60%), rgba(255,255,255,.03)' }}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="eyebrow">Tu oferta</p>
              {str(offer.nombre) && <h3 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-[32px]">{str(offer.nombre)}</h3>}
              {str(offer.promesa) && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-text">{str(offer.promesa)}</p>}
            </div>
            {(str(price.setup) || str(price.mensual)) && (
              <div className="flex flex-col justify-center lg:min-w-[240px] lg:border-l lg:border-white/10 lg:pl-8">
                {str(price.valor_total_percibido) && <p className="text-sm text-muted">Valor <span className="line-through">{str(price.valor_total_percibido)}</span></p>}
                {str(price.setup) && <p className="mt-1 text-5xl font-bold tracking-tight text-white">{str(price.setup)}</p>}
                {str(price.setup) && <p className="text-xs font-medium uppercase tracking-wider text-muted">puesta en marcha</p>}
                {str(price.mensual) && <p className="mt-2 text-2xl font-semibold text-accent-glow">+ {str(price.mensual)}</p>}
              </div>
            )}
          </div>
          {/* La garantía en una línea; el texto completo al desplegar */}
          {guarantee && (
            <details className="group mt-6 rounded-xl border border-[#00a884]/40 bg-[#00a884]/10">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#cdeee6]">
                <ShieldCheck className="h-4 w-4 flex-none text-[#7fe7cd]" />
                <span className="min-w-0 flex-1">{shortTitle(guarantee)}</span>
                <span className="flex flex-none items-center gap-1 text-xs font-medium text-[#7fe7cd]">Ver garantía<ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></span>
              </summary>
              <p className="border-t border-[#00a884]/30 px-4 py-3 text-sm leading-relaxed text-[#cdeee6]">{guarantee}</p>
            </details>
          )}
        </article>

        {/* 2. Lo que regalas: tarjetas cortas en fila */}
        {bonuses.length > 0 && (
          <section className="space-y-3">
            <h3 className="eyebrow flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" />Incluido sin coste</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {bonuses.map((b, i) => (
                <div key={b} className="card flex gap-3 p-4">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-accent/20 font-mono text-xs font-bold text-accent-glow">{i + 1}</span>
                  <p className="text-sm leading-relaxed text-text">{b}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Escalera de precios: entrada, principal y premium, comparables */}
        {ladder.length > 0 && (
          <section className="space-y-3">
            <h3 className="eyebrow">Tus 3 niveles de precio</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {ladder.map((l, i) => {
                const main = /principal/i.test(str(l.nivel) ?? '') || (ladder.length === 3 && i === 1)
                return (
                  <article key={i} className={`card flex flex-col p-5 ${main ? '!border-accent-hi/70 bg-accent/[0.06] shadow-[0_14px_34px_rgba(0,60,160,.3)]' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="eyebrow">{str(l.nivel) ?? `Nivel ${i + 1}`}</p>
                      {main && <span className="rounded-full bg-accent-hi/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-glow">Recomendado</span>}
                    </div>
                    {str(l.nombre) && <p className="mt-1.5 text-lg font-bold leading-snug text-white">{str(l.nombre)}</p>}
                    {str(l.precio) && <p className="mt-2 text-xl font-semibold text-accent-glow">{str(l.precio)}</p>}
                    {str(l.incluye) && <p className="mt-3 text-sm leading-relaxed text-text">{str(l.incluye)}</p>}
                    {str(l.para_quien) && <p className="mt-auto border-t border-white/10 pt-3 text-xs leading-relaxed text-muted">{str(l.para_quien)}</p>}
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* 4. El pitch para decirlo en voz alta */}
        {str(offer.pitch_30s) && (
          <article className="card border-l-4 !border-l-accent-hi p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" />Pitch de 30 segundos</p>
              <CopyButton text={str(offer.pitch_30s) ?? ''} label="Copiar pitch" />
            </div>
            <p className="mt-3 text-[15px] italic leading-relaxed text-white">“{str(offer.pitch_30s)}”</p>
          </article>
        )}

        {/* 5. El resto de la oferta, en pestañas en vez de una lista larga */}
        <Tabs tabs={[
          { id: 'incluye', label: 'Qué incluye', content: (has(offer.incluye) || str(offer.mecanismo)) && <Includes offer={offer} /> },
          { id: 'objeciones', label: 'Objeciones', content: has(objections) && <Objections v={objections} /> },
          { id: 'piloto', label: 'Oferta piloto', content: has(o.oferta_piloto) && <Tree v={o.oferta_piloto} /> },
          { id: 'numeros', label: 'Números de tu agencia', content: has(o.numeros_agencia) && <Tree v={o.numeros_agencia} /> },
          { id: 'mas', label: 'Más', content: Object.keys(rest).length > 0 && <Tree v={rest} /> },
        ]} />
      </div>
    </Deliverable>
  )
}
