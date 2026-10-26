import { useMemo } from 'react'
import { Download, ExternalLink, MessageCircle, Rocket } from 'lucide-react'
import Deliverable from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { renderAgencySite } from '@/lib/agencySite'
import { openHtml, saveFile, slug } from '@/lib/files'
import { staleness } from '@/lib/freshness'
import { buildKnowledgeBase } from '@/lib/knowledge'
import { stepNo } from '@/lib/gamification'

export default function S6Landing({ roadmap, update, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const agency = roadmap.agency_name || roadmap.project_name
  const contact = roadmap.agency_contact
  const done = Object.keys(roadmap.agency_site).length > 0
  const offerDone = Object.keys((roadmap.agency_offer.oferta ?? {}) as object).length > 0
  const stale = staleness(roadmap)
  const allDone = done && offerDone && Object.keys(roadmap.ideal_client).length > 0
  const custom = typeof roadmap.agency_site.html === 'string' && roadmap.agency_site.html.trim() ? roadmap.agency_site.html : null
  const html = useMemo(() => (!done ? '' : custom ?? renderAgencySite(roadmap.agency_site, contact, agency)), [done, custom, roadmap.agency_site, contact, agency])
  const setContact = (k: 'whatsapp' | 'email') => (e: React.ChangeEvent<HTMLInputElement>) => update({ agency_contact: { ...contact, [k]: e.target.value } })

  return (
    <div className="space-y-8">
      <div className="card space-y-3 p-5">
        <span className="eyebrow flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" />Contacto de tu agencia</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">WhatsApp (con prefijo, ej. 34600000000)<input className="field mt-1.5 font-normal" placeholder="34600000000" inputMode="tel" value={contact.whatsapp ?? ''} onChange={setContact('whatsapp')} /></label>
          <label className="block text-sm font-semibold">Email<input className="field mt-1.5 font-normal" type="email" placeholder="hola@tuagencia.com" value={contact.email ?? ''} onChange={setContact('email')} /></label>
        </div>
        <p className="text-xs text-muted">Si pones WhatsApp, los botones abren una conversación contigo con un mensaje ya escrito. El contacto se aplica al instante, sin regenerar.</p>
      </div>

      <Deliverable missing={!offerDone && `Primero genera tu oferta (paso ${stepNo(5)}): la landing la vende.`} stale={stale.site} done={done} busy={isBusy('agency_site')} cost={3} label="Generar mi landing"
        pending="La IA escribe todos los textos con tu cliente ideal y tu oferta." onGenerate={() => void run('agency_site')}
        actions={<>
          <button type="button" className="btn-ghost" onClick={() => saveFile(`${slug(agency)}-landing.html`, html, 'text/html;charset=utf-8')}><Download className="h-4 w-4" />Descargar .html</button>
          <button type="button" className="btn-ghost" onClick={() => openHtml(html)}><ExternalLink className="h-4 w-4" />Abrir</button>
        </>}>
        <div className="overflow-hidden rounded-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,.5)]">
          <div className="flex items-center gap-3 bg-[#1a2238] px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden><i className="h-3 w-3 rounded-full bg-[#ff5f57]" /><i className="h-3 w-3 rounded-full bg-[#febc2e]" /><i className="h-3 w-3 rounded-full bg-[#28c840]" /></span>
            <span className="flex-1 truncate rounded-md bg-black/30 px-3 py-1 text-center text-xs text-muted">{slug(agency)}.com</span>
          </div>
          {/* Una página propia (modo directo) trae sus animaciones en JavaScript: se le deja ejecutarlo, pero sin allow-same-origin,
              así que sigue aislada de la app (no ve la sesión ni el almacenamiento). La plantilla no lleva JavaScript. */}
          <iframe title="Vista previa de tu landing" srcDoc={html} className="h-[640px] w-full bg-white"
            sandbox={custom ? 'allow-scripts allow-popups allow-popups-to-escape-sandbox' : 'allow-popups allow-popups-to-escape-sandbox'} />
        </div>
      </Deliverable>

      {allDone && !stale.site && !stale.offer && !stale.ideal && (
        <div className="hero-panel flex animate-pop-in flex-col items-center gap-4 rounded-2xl border border-accent-glow/40 p-8 text-center">
          <span className="tile-hero !h-14 !w-14 animate-float"><Rocket className="h-7 w-7" /></span>
          <div>
            <h3 className="text-xl font-bold text-white">Tu agencia está lista para salir a vender</h3>
            <p className="mx-auto mt-1 max-w-lg text-sm text-muted">Tienes tu cliente ideal, tu oferta y tu landing. Descarga el documento con todo y publica la web hoy mismo.</p>
          </div>
          <button type="button" className="btn" onClick={() => saveFile(`${slug(agency)}-cliente-ideal-y-oferta.md`, buildKnowledgeBase(roadmap), 'text/markdown;charset=utf-8')}><Download className="h-4 w-4" />Descargar cliente ideal y oferta (.md)</button>
        </div>
      )}
    </div>
  )
}
