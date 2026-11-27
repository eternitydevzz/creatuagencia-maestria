import { Gauge, Laptop, MessageSquareQuote, Store, TrendingDown, Wallet, type LucideIcon } from 'lucide-react'
import { Avatar, CopyButton } from '@/components/ui/bits'
import { Tree } from '@/components/ui/Tree'
import Tabs from '@/components/ui/Tabs'
import Deliverable from '@/components/Deliverable'
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
const has = (v: unknown) => v !== undefined && v !== null && v !== '' && !(typeof v === 'object' && Object.keys(v as object).length === 0)
/** Las claves con contenido de un objeto (null si no queda ninguna: esa pestaña no se pinta). */
const pick = (o: JsonObject, keys: string[]): JsonObject | null => {
  const out = Object.fromEntries(keys.filter((k) => has(o[k])).map((k) => [k, o[k]])) as JsonObject
  return Object.keys(out).length ? out : null
}

// Las 4 cifras del perfil que se ven de un vistazo
const FACTS: Array<[string, string, LucideIcon]> = [
  ['tamano_negocio', 'Tamaño', Store], ['facturacion', 'Facturación', Wallet], ['como_capta_hoy', 'Cómo capta hoy', Gauge], ['nivel_digital', 'Nivel digital', Laptop],
]
// Claves que ya se ven arriba o en una pestaña; el resto va a "Más"
const SHOWN = ['resumen', 'avatar', 'perfil', 'coste_del_problema', 'dolores', 'deseos', 'su_lenguaje', 'momentos_de_compra', 'senales_compra', 'red_flags', 'donde_esta', 'preguntas_cualificacion', 'primer_mensaje']

export default function S4IdealClient({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const c = roadmap.ideal_client
  const person = (c.avatar ?? {}) as JsonObject
  const profile = (c.perfil && typeof c.perfil === 'object' && !Array.isArray(c.perfil) ? c.perfil : {}) as JsonObject
  const facts = FACTS.filter(([k]) => str(profile[k]))
  const lost = lostPerMonth(str(c.coste_del_problema))
  const pains = list(c.dolores).slice(0, 3)
  const opener = str(c.primer_mensaje)
  const rest = Object.fromEntries(Object.entries(c).filter(([k]) => !SHOWN.includes(k) && !k.startsWith('_'))) as JsonObject
  const missing = !roadmap.selected_problems.length ? `Elige al menos un problema en el paso ${stepNo(1)}.` : !roadmap.selected_nichos.length ? `Elige tu nicho en el paso ${stepNo(2)}.` : false

  return (
    <Deliverable missing={missing} stale={staleness(roadmap).ideal} done={Object.keys(c).length > 0} busy={isBusy('ideal_client')} cost={2} label="Generar mi cliente ideal"
      pending="La IA usa tus problemas, tu nicho y tus números." onGenerate={() => void run('ideal_client')}
      actions={<CopyButton text={treeToText(c)} />}>
      <div className="stagger space-y-5">
        {/* 1. Quién es y cuánto pierde: lo primero que se lee */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <article className="hero-panel rounded-2xl border border-accent/30 p-5 sm:p-6">
            <p className="eyebrow">Quién es</p>
            {str(c.resumen) && <p className="mt-2 text-lg font-semibold leading-snug text-white sm:text-xl">{str(c.resumen)}</p>}
            {str(person.nombre) && (
              <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                <Avatar name={str(person.nombre)} className="h-11 w-11 text-base" />
                <p className="min-w-0 font-semibold leading-snug text-white">{str(person.nombre)}</p>
              </div>
            )}
          </article>
          {str(c.coste_del_problema) && (
            <article className="rounded-2xl border border-[#ff8f8f]/35 p-5 sm:p-6" style={{ background: 'radial-gradient(ellipse 90% 90% at 100% 0%, rgba(255,95,95,.16), transparent 65%), rgba(255,255,255,.025)' }}>
              <p className="eyebrow flex items-center gap-1.5 !text-[#ffb3b3]"><TrendingDown className="h-3.5 w-3.5" />Lo que le cuesta el problema</p>
              {lost && <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">{lost}<span className="ml-1 text-base font-semibold text-[#ffb3b3]">/mes</span></p>}
              {lost ? (
                // Con la cifra en grande, el cálculo va plegado
                <details className="group mt-3">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-[#ffb3b3] hover:text-white">Ver cómo se calcula ↓</summary>
                  <p className="mt-2 text-sm leading-relaxed text-text">{str(c.coste_del_problema)}</p>
                </details>
              ) : (
                // Sin cifra que destacar, el texto es el protagonista (recortado; entero al desplegar)
                <details className="group mt-2">
                  <summary className="cursor-pointer list-none">
                    <p className="text-[15px] leading-relaxed text-white group-open:hidden line-clamp-6">{str(c.coste_del_problema)}</p>
                    <span className="mt-2 inline-block text-xs font-semibold text-[#ffb3b3] group-open:hidden">Ver todo ↓</span>
                  </summary>
                  <p className="text-[15px] leading-relaxed text-white">{str(c.coste_del_problema)}</p>
                </details>
              )}
            </article>
          )}
        </div>

        {/* 2. Su negocio en 4 cifras */}
        {facts.length > 0 && (
          <div className={`grid gap-3 sm:grid-cols-2 ${facts.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
            {facts.map(([k, label, Icon]) => (
              <div key={k} className="card p-4" title={str(profile[k])}>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Icon className="h-3.5 w-3.5 text-accent-hi" />{label}</p>
                <p className="mt-2 line-clamp-3 text-sm font-medium leading-snug text-white">{str(profile[k])}</p>
              </div>
            ))}
          </div>
        )}

        {/* 3. Sus dolores, con sus palabras */}
        {pains.length > 0 && (
          <section className="space-y-3">
            <h3 className="eyebrow">Lo que dice, con sus palabras</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {pains.map((p) => (
                <blockquote key={p} className="relative rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[15px] leading-relaxed text-white">“{p}”</p>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* 4. Mensaje listo para enviarle */}
        {opener && (
          <article className="card border-l-4 !border-l-[#00a884] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-1.5"><MessageSquareQuote className="h-3.5 w-3.5" />Primer mensaje para escribirle</p>
              <CopyButton text={opener} label="Copiar mensaje" />
            </div>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-[#005c4b]/40 px-4 py-3 text-[15px] leading-relaxed text-[#e9edef]">{opener}</p>
          </article>
        )}

        {/* 5. La ficha completa, en pestañas */}
        <Tabs tabs={[
          { id: 'dia', label: 'Su día a día', content: str(person.dia_a_dia) && <p className="max-w-3xl text-[15px] leading-relaxed text-text">{str(person.dia_a_dia)}</p> },
          { id: 'perfil', label: 'Perfil', content: has(c.perfil) && <Tree v={c.perfil} /> },
          { id: 'dolores', label: 'Dolores y deseos', content: (() => { const v = pick(c, ['dolores', 'deseos', 'su_lenguaje']); return v && <Tree v={v} /> })() },
          { id: 'compra', label: 'Cuándo compra', content: (() => { const v = pick(c, ['momentos_de_compra', 'senales_compra', 'red_flags']); return v && <Tree v={v} /> })() },
          { id: 'donde', label: 'Dónde encontrarlo', content: (() => { const v = pick(c, ['donde_esta', 'preguntas_cualificacion']); return v && <Tree v={v} /> })() },
          { id: 'mas', label: 'Más', content: Object.keys(rest).length > 0 && <Tree v={rest} /> },
        ]} />
      </div>
    </Deliverable>
  )
}
