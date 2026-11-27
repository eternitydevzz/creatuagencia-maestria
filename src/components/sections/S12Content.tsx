import { Clapperboard, Download, Images, UserRound } from 'lucide-react'
import { CopyButton } from '@/components/ui/bits'
import Deliverable from '@/components/Deliverable'
import Tabs from '@/components/ui/Tabs'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { saveFile, slug } from '@/lib/files'
import { stepNo } from '@/lib/gamification'
import { storyParts, str, stripItemNumber, treeToText } from '@/lib/tree'
import type { AgencyContent } from '@/lib/types'

const texts = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])
const items = <T,>(v: unknown): T[] => (Array.isArray(v) ? v.filter((x) => !!x && typeof x === 'object') as T[] : [])

type Reel = AgencyContent['reels'][number]
type Carousel = AgencyContent['carruseles'][number]

/** Guion de un reel en texto plano, listo para pegar en las notas del móvil y grabar. */
const reelText = (r: Reel) => [
  `GANCHO (0-3 s): ${r.gancho}`, ...storyParts(r).map((p) => `${(p.label || 'Guion').toUpperCase()}:\n${p.text}`), `CIERRE: ${r.cierre}`,
  texts(r.texto_pantalla).length ? `TEXTO EN PANTALLA: ${texts(r.texto_pantalla).join(' · ')}` : '', `CAPTION: ${r.caption}`,
].filter(Boolean).join('\n\n')
const carouselText = (c: Carousel) => [...texts(c.diapositivas).map((d, i) => `${i + 1}. ${d}`), '', `CAPTION: ${c.caption}`].join('\n')

export default function S12Content({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const content = roadmap.agency_content ?? {}
  const done = Object.keys(content).length > 0
  const offerDone = Object.keys((roadmap.agency_offer.oferta ?? {}) as object).length > 0
  const reels = items<Reel>(content.reels)
  const carousels = items<Carousel>(content.carruseles)
  const agency = roadmap.agency_name || roadmap.project_name

  return (
    <Deliverable missing={!offerDone && `Primero genera tu oferta (paso ${stepNo(5)}): el contenido la vende.`} done={done} busy={isBusy('agency_content')} cost={3} label="Generar mi contenido"
      pending="La IA escribe 5 reels, tu bio y 3 carruseles con tu cliente ideal y tu oferta." onGenerate={() => void run('agency_content')}
      actions={<>
        <CopyButton text={treeToText(content)} label="Copiar todo" />
        <button type="button" className="btn-ghost" onClick={() => saveFile(`${slug(agency)}-contenido.md`, treeToText(content), 'text/markdown;charset=utf-8')}><Download className="h-4 w-4" />Descargar .md</button>
      </>}>
      <Tabs tabs={[
        {
          id: 'reels', label: `Reels (${reels.length})`, content: reels.length > 0 && (
            // Tarjetas compactas: lo que engancha a la vista, el guion entero al desplegar
            <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {reels.map((r, i) => (
                <article key={`${r.titulo}-${i}`} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted"><Clapperboard className="h-3.5 w-3.5 flex-none text-accent-hi" />Reel {i + 1}{str(r.formato) && <span className="truncate rounded-full bg-accent/20 px-2 py-0.5 text-[11px] text-accent-glow">{r.formato}</span>}</p>
                    <CopyButton text={reelText(r)} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-muted">{stripItemNumber(String(r.titulo ?? ''))}</p>
                  <p className="mt-2 text-lg font-bold leading-snug text-white">“{r.gancho}”</p>
                  {str(r.palabra_clave) && <p className="mt-3 text-xs text-muted">Palabra clave <span className="ml-1 rounded-md bg-accent/15 px-2 py-0.5 font-mono font-bold text-accent-glow">{r.palabra_clave}</span></p>}
                  <details className="group mt-auto pt-3">
                    <summary className="cursor-pointer list-none text-xs font-semibold text-accent-glow hover:text-white">Ver guion completo ↓</summary>
                    <div className="mt-3 space-y-3">
                      {storyParts(r).map((p) => <p key={p.label || 'guion'} className="whitespace-pre-line text-sm leading-relaxed text-text">{p.label && <b className="text-xs font-semibold uppercase tracking-wide text-muted">{p.label} · </b>}{p.text}</p>)}
                      <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-white">{r.cierre}</p>
                      {texts(r.texto_pantalla).length > 0 && <div className="flex flex-wrap gap-1.5">{texts(r.texto_pantalla).map((t) => <span key={t} className="pill">{t}</span>)}</div>}
                      <p className="text-xs leading-relaxed text-muted"><b className="text-text">Caption:</b> {r.caption}</p>
                    </div>
                  </details>
                </article>
              ))}
            </div>
          ),
        },
        {
          id: 'carruseles', label: `Carruseles (${carousels.length})`, content: carousels.length > 0 && (
            // Cada carrusel como una tira de diapositivas que se desliza
            <div className="space-y-5">
              {carousels.map((c, i) => (
                <article key={`${c.titulo}-${i}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 font-semibold text-white"><Images className="h-4 w-4 text-accent-hi" />{c.titulo}</p>
                    <CopyButton text={carouselText(c)} />
                  </div>
                  <ol className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2">
                    {texts(c.diapositivas).map((d, k) => (
                      <li key={`${k}-${d}`} className={`flex aspect-[4/5] w-44 flex-none snap-start flex-col justify-between rounded-xl border p-3 ${k === 0 ? 'border-accent/50 bg-accent/15' : 'border-white/10 bg-white/[0.03]'}`}>
                        <span className="font-mono text-[11px] text-muted">{k + 1}/{texts(c.diapositivas).length}</span>
                        <p className={`text-sm leading-snug ${k === 0 ? 'font-bold text-white' : 'text-text'}`}>{d}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-1 text-xs leading-relaxed text-muted"><b className="text-text">Caption:</b> {c.caption}</p>
                </article>
              ))}
            </div>
          ),
        },
        {
          id: 'bio', label: 'Bio de Instagram', content: str(content.bio) && (
            <div className="flex max-w-xl items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-gradient-to-br from-accent-glow to-accent text-white"><UserRound className="h-6 w-6" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3"><p className="font-semibold text-white">{agency}</p><CopyButton text={str(content.bio) ?? ''} /></div>
                <p className="mt-2 text-[15px] leading-relaxed text-white">{str(content.bio)}</p>
              </div>
            </div>
          ),
        },
      ]} />
    </Deliverable>
  )
}
