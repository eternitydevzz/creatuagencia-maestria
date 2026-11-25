import { Clapperboard, Download, Images, UserRound } from 'lucide-react'
import { CopyButton } from '@/components/ui/bits'
import Deliverable from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { saveFile, slug } from '@/lib/files'
import { stepNo } from '@/lib/gamification'
import { str, treeToText } from '@/lib/tree'
import type { AgencyContent } from '@/lib/types'

const texts = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])
const items = <T,>(v: unknown): T[] => (Array.isArray(v) ? v.filter((x) => !!x && typeof x === 'object') as T[] : [])

type Reel = AgencyContent['reels'][number]
type Carousel = AgencyContent['carruseles'][number]

/** Guion de un reel en texto plano, listo para pegar en las notas del móvil y grabar. */
const reelText = (r: Reel) => [
  `GANCHO (0-3 s): ${r.gancho}`, `DESARROLLO: ${r.desarrollo}`, `CIERRE: ${r.cierre}`,
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
      <div className="stagger space-y-6">
        {str(content.bio) && (
          <article className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-2"><UserRound className="h-3.5 w-3.5" />Tu bio de Instagram</p>
              <CopyButton text={str(content.bio) ?? ''} />
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-white">{str(content.bio)}</p>
          </article>
        )}

        {reels.length > 0 && (
          <section className="space-y-3">
            <h3 className="eyebrow flex items-center gap-2"><Clapperboard className="h-3.5 w-3.5" />5 guiones de reel</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {reels.map((r, i) => (
                <article key={`${r.titulo}-${i}`} className="card space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-muted">Reel {i + 1} · {r.titulo}</p>
                    <CopyButton text={reelText(r)} />
                  </div>
                  <p className="text-lg font-bold leading-snug text-white">“{r.gancho}”</p>
                  <p className="text-sm leading-relaxed text-text">{r.desarrollo}</p>
                  <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-white">{r.cierre}</p>
                  {texts(r.texto_pantalla).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">{texts(r.texto_pantalla).map((t) => <span key={t} className="pill">{t}</span>)}</div>
                  )}
                  <p className="text-xs leading-relaxed text-muted"><b className="text-text">Caption:</b> {r.caption}</p>
                  {str(r.palabra_clave) && <p className="text-xs text-muted">Palabra clave: <b className="text-accent-glow">{r.palabra_clave}</b></p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {carousels.length > 0 && (
          <section className="space-y-3">
            <h3 className="eyebrow flex items-center gap-2"><Images className="h-3.5 w-3.5" />3 carruseles</h3>
            <div className="grid gap-3 lg:grid-cols-3">
              {carousels.map((c, i) => (
                <article key={`${c.titulo}-${i}`} className="card space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-white">{c.titulo}</p>
                    <CopyButton text={carouselText(c)} />
                  </div>
                  <ol className="space-y-1.5 text-sm text-text">
                    {texts(c.diapositivas).map((d, k) => <li key={`${k}-${d}`} className="flex gap-2"><span className="w-5 flex-none text-right text-muted">{k + 1}.</span>{d}</li>)}
                  </ol>
                  <p className="text-xs leading-relaxed text-muted"><b className="text-text">Caption:</b> {c.caption}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </Deliverable>
  )
}
