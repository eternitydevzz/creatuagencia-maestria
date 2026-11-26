import { Download, Megaphone, Target, Video } from 'lucide-react'
import { CopyButton } from '@/components/ui/bits'
import Deliverable from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { saveFile, slug } from '@/lib/files'
import { stepNo } from '@/lib/gamification'
import { str } from '@/lib/tree'
import type { AgencyAds } from '@/lib/types'

const texts = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : [])
const items = <T,>(v: unknown): T[] => (Array.isArray(v) ? v.filter((x) => !!x && typeof x === 'object') as T[] : [])

type Ad = AgencyAds['anuncios'][number]
type AdVideo = AgencyAds['videos'][number]
type Audience = Partial<AgencyAds['publico']>

/** Un anuncio con los nombres de los campos del administrador de anuncios de Meta, listo para pegar. */
const adText = (a: Ad) => [
  `TEXTO PRINCIPAL:\n${a.texto_principal}`, `TITULAR: ${a.titular}`,
  str(a.descripcion) ? `DESCRIPCIÓN: ${a.descripcion}` : '', str(a.boton) ? `BOTÓN: ${a.boton}` : '',
].filter(Boolean).join('\n\n')
const videoText = (v: AdVideo) => [`GANCHO (0-3 s): ${v.gancho}`, `GUION: ${v.guion}`, `CIERRE: ${v.cierre}`].join('\n\n')
const audienceText = (p: Audience) => [
  str(p.ubicacion) && `Ubicación: ${p.ubicacion}`, str(p.edad) && `Edad: ${p.edad}`,
  texts(p.intereses).length > 0 && `Intereses: ${texts(p.intereses).join(', ')}`,
  texts(p.comportamientos).length > 0 && `Comportamientos: ${texts(p.comportamientos).join(', ')}`,
  str(p.notas) && `Notas: ${p.notas}`,
].filter(Boolean).join('\n')

/** Todo en Markdown, con sus propias etiquetas (en tree.ts "ubicacion" significa la dirección de un negocio). */
const allText = (ads: Ad[], videos: AdVideo[], p: Audience) => [
  '# Anuncios', ...ads.map((a, i) => `## Anuncio ${i + 1} · ${a.angulo}\n\n${adText(a)}`),
  '# Guiones de vídeo', ...videos.map((v, i) => `## Vídeo ${i + 1} · ${v.titulo}\n\n${videoText(v)}`),
  '# Público', audienceText(p),
].join('\n\n')

export default function S13Ads({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const data = roadmap.agency_ads ?? {}
  const done = Object.keys(data).length > 0
  const offerDone = Object.keys((roadmap.agency_offer.oferta ?? {}) as object).length > 0
  const ads = items<Ad>(data.anuncios)
  const videos = items<AdVideo>(data.videos)
  const audience = (data.publico && typeof data.publico === 'object' && !Array.isArray(data.publico) ? data.publico : {}) as Audience
  const agency = roadmap.agency_name || roadmap.project_name
  const all = allText(ads, videos, audience)

  return (
    <Deliverable missing={!offerDone && `Primero genera tu oferta (paso ${stepNo(5)}): los anuncios la venden.`} done={done} busy={isBusy('agency_ads')} cost={3} label="Generar mis anuncios"
      pending="La IA escribe 3 anuncios, 2 guiones de vídeo y el público, con tu cliente ideal y tu oferta." onGenerate={() => void run('agency_ads')}
      actions={<>
        <CopyButton text={all} label="Copiar todo" />
        <button type="button" className="btn-ghost" onClick={() => saveFile(`${slug(agency)}-anuncios.md`, all, 'text/markdown;charset=utf-8')}><Download className="h-4 w-4" />Descargar .md</button>
      </>}>
      <div className="stagger space-y-6">
        {ads.length > 0 && (
          <section className="space-y-3">
            <h3 className="eyebrow flex items-center gap-2"><Megaphone className="h-3.5 w-3.5" />3 anuncios para Facebook e Instagram</h3>
            <div className="grid gap-3 lg:grid-cols-3">
              {ads.map((a, i) => (
                <article key={`${a.angulo}-${i}`} className="card flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-muted">Anuncio {i + 1} · {a.angulo}</p>
                    <CopyButton text={adText(a)} />
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-text">{a.texto_principal}</p>
                  <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="font-semibold text-white">{a.titular}</p>
                    {str(a.descripcion) && <p className="text-xs text-muted">{a.descripcion}</p>}
                    {str(a.boton) && <span className="pill mt-2 inline-block">{a.boton}</span>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {videos.length > 0 && (
          <section className="space-y-3">
            <h3 className="eyebrow flex items-center gap-2"><Video className="h-3.5 w-3.5" />2 guiones de vídeo</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {videos.map((v, i) => (
                <article key={`${v.titulo}-${i}`} className="card space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-muted">Vídeo {i + 1} · {v.titulo}</p>
                    <CopyButton text={videoText(v)} />
                  </div>
                  <p className="text-lg font-bold leading-snug text-white">“{v.gancho}”</p>
                  <p className="text-sm leading-relaxed text-text">{v.guion}</p>
                  <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-white">{v.cierre}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {audienceText(audience) && (
          <article className="card space-y-3 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow flex items-center gap-2"><Target className="h-3.5 w-3.5" />A quién enseñárselos</p>
              <CopyButton text={audienceText(audience)} />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {str(audience.ubicacion) && <div><dt className="text-xs text-muted">Ubicación</dt><dd className="text-white">{audience.ubicacion}</dd></div>}
              {str(audience.edad) && <div><dt className="text-xs text-muted">Edad</dt><dd className="text-white">{audience.edad}</dd></div>}
            </dl>
            {texts(audience.intereses).length > 0 && <div><p className="mb-1.5 text-xs text-muted">Intereses</p><div className="flex flex-wrap gap-1.5">{texts(audience.intereses).map((t) => <span key={t} className="pill">{t}</span>)}</div></div>}
            {texts(audience.comportamientos).length > 0 && <div><p className="mb-1.5 text-xs text-muted">Comportamientos</p><div className="flex flex-wrap gap-1.5">{texts(audience.comportamientos).map((t) => <span key={t} className="pill">{t}</span>)}</div></div>}
            {str(audience.notas) && <p className="text-sm leading-relaxed text-text">{audience.notas}</p>}
          </article>
        )}
      </div>
    </Deliverable>
  )
}
