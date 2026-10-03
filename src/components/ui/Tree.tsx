import { isObject, itemTitle, label, ordered } from '@/lib/tree'
import type { Json, JsonObject } from '@/lib/types'

/** Pinta el cliente ideal o la oferta: objetos → apartados, listas → viñetas o tarjetas, textos → párrafos. */
export function Tree({ v, k, depth = 0 }: { v: Json | undefined; k?: string; depth?: number }) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v !== 'object') {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{k && <span className="font-semibold text-white">{label(k)}: </span>}{String(v)}</p>
  }
  const heading = k ? (depth <= 1
    ? <h3 className="border-l-4 border-accent-hi pl-3 text-lg font-bold text-white">{label(k)}</h3>
    : <h4 className="font-bold text-white">{label(k)}</h4>) : null
  if (Array.isArray(v)) {
    if (v.every((x) => !isObject(x))) {
      return <div className="space-y-2">{heading}<ul className="list-disc space-y-1.5 pl-5 text-sm text-text">{v.map((x, i) => <li key={i} className="whitespace-pre-wrap leading-relaxed">{String(x)}</li>)}</ul></div>
    }
    return (
      <div className="space-y-3">{heading}
        <div className="grid gap-3">
          {v.map((x, i) => {
            const { title, rest } = itemTitle(x as JsonObject, i)
            return (
              <div key={i} className="space-y-2 rounded-xl border border-line bg-bg-deep/60 p-4">
                <p className="font-bold text-accent-glow">{title}</p>
                {ordered(rest).map(([kk, vv]) => <Tree key={kk} k={kk} v={vv} depth={depth + 2} />)}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return <div className={depth <= 1 ? 'space-y-4' : 'space-y-2'}>{heading}{ordered(v).map(([kk, vv]) => <Tree key={kk} k={kk} v={vv} depth={depth + 1} />)}</div>
}
