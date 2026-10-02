import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Gem, Globe, Plus, UserCheck } from 'lucide-react'
import { useProfile, useRoadmaps } from '@/hooks/useData'
import { SECTIONS, completedCount } from '@/lib/gamification'
import { StatusBadge } from '@/components/ui/bits'
import NewProjectModal from '@/components/NewProjectModal'

export default function Dashboard() {
  const { data: profile } = useProfile()
  const { data: roadmaps, isLoading } = useRoadmaps()
  const [creating, setCreating] = useState(false)
  const first = (profile?.full_name ?? '').split(' ')[0]
  const latest = roadmaps?.[0]

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Bienvenido{first ? `, ${first}` : ''}</h1>
        <p className="mt-1.5 text-muted">Tu centro de control para crear tu agencia de IA.</p>
      </div>

      <section aria-labelledby="latest">
        <div className="mb-4 flex items-center justify-between"><h2 id="latest" className="flex items-center gap-3 text-xl font-bold"><img src="/brand/logo-icono.png" alt="" className="h-9 w-9 rounded-full" />Últimos Proyectos</h2><Link to="/projects" className="text-sm font-semibold text-accent-hi hover:underline">Ver todos →</Link></div>
        {isLoading ? <div className="card h-24 animate-pulse" /> : !roadmaps?.length ? (
          <div className="card flex flex-col items-center gap-4 p-8 text-center">
            <img src="/brand/logo-icono.png" alt="" className="h-16 w-16 rounded-2xl" />
            <div><h3 className="text-xl font-bold">Crea tu primer proyecto</h3><p className="mt-1 max-w-md text-muted">En 6 pasos, con IA: defines a quién vendes y te llevas tu cliente ideal, tu oferta y tu landing listos.</p></div>
            <button className="btn" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Crear proyecto</button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {roadmaps.slice(0, 4).map((r) => {
              const done = completedCount(r)
              return (
                <Link key={r.id} to={`/roadmap/${r.id}`} className="card flex items-center gap-4 p-4 transition hover:border-line-strong">
                  <img src="/brand/logo-icono.png" alt="" className="h-12 w-12 rounded-xl" />
                  <div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{r.project_name}</p><p className="text-sm text-muted">{r.selected_nichos[0] ?? 'Sin nicho'} · {done}/{SECTIONS.length} secciones</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-accent-hi" style={{ width: `${(done / SECTIONS.length) * 100}%` }} /></div></div>
                  <StatusBadge status={r.status} />
                  <ArrowRight className="h-5 w-5 text-muted" />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="map">
        <h2 id="map" className="mb-4 text-xl font-bold">Recursos personalizados</h2>
        <Link to={latest ? `/roadmap/${latest.id}` : '/roadmap'} className="card group flex flex-col items-center gap-6 p-6 transition hover:border-line-strong sm:flex-row">
          <img src="/brand/mapa.png" alt="" className="h-28 w-28 flex-none" />
          <div className="flex-1 text-center sm:text-left"><h3 className="text-2xl font-bold">Mapa de ruta</h3><p className="mt-1 text-muted">Responde unas preguntas y la IA te entrega tu cliente ideal, tu oferta y tu landing de venta.</p></div>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-white transition group-hover:translate-x-1"><ArrowRight className="h-5 w-5" /></span>
        </Link>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="mb-4 text-xl font-bold">Cómo funciona</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[[UserCheck, '01', 'Tu cliente ideal', 'Elige los problemas que resuelves y tu nicho. La IA define quién es tu cliente, qué le duele, cuánto pierde y dónde encontrarlo.'], [Gem, '02', 'Tu oferta', 'Una oferta irresistible con promesa, precio anclado en lo que pierde tu cliente, garantía y oferta piloto.'], [Globe, '03', 'Tu landing', 'Una web de venta premium con tu oferta, lista para descargar y publicar.']].map(([Icon, n, t, d]) => {
            const I = Icon as typeof Gem
            return <div key={n as string} className="card space-y-3 p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-accent/20 text-accent-glow"><I className="h-5 w-5" /></span><span className="font-mono text-sm text-muted">{n as string}</span></div><h3 className="text-lg font-bold">{t as string}</h3><p className="text-sm text-muted">{d as string}</p></div>
          })}
        </div>
      </section>
      <NewProjectModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
