import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, Link2Off, MessageCircle } from 'lucide-react'
import WhatsAppChat, { type ChatAgent } from '@/components/agent/WhatsAppChat'
import { Spinner } from '@/components/ui/bits'
import { chatWithDemoLink, publicDemo } from '@/lib/api'

/** Página pública de una demo (…/d/<código>): el prospecto del alumno habla con "su" secretaria desde el móvil, sin cuenta.
 *  Solo muestra lo que devuelve `public_demo` (negocio, secretaria, agencia); la ficha y las instrucciones nunca llegan aquí. */
export default function PublicDemo() {
  const { token = '' } = useParams()
  const { data: demo, isLoading, isError } = useQuery({ queryKey: ['public-demo', token], queryFn: () => publicDemo(token), retry: 1, staleTime: 60_000 })

  // Los links son privados: que no los indexe ningún buscador
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'; meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => { meta.remove() }
  }, [])
  useEffect(() => { if (demo) document.title = `Demo · ${demo.business_name}` }, [demo])

  const agent = useMemo<ChatAgent | null>(() => demo ? { id: token, business_name: demo.business_name, config: { secretaria: { nombre: demo.secretary_name || 'Asistente' } } } : null, [demo, token])

  if (isLoading) return <div className="grid min-h-screen place-items-center"><Spinner className="h-8 w-8 text-accent-hi" /></div>

  if (isError || !demo || !agent) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <span className="tile-icon mx-auto h-12 w-12"><Link2Off className="h-6 w-6" strokeWidth={1.75} /></span>
          <h1 className="mt-4 text-xl font-bold">{isError ? 'No se pudo abrir la demo' : 'Este link ya no está activo'}</h1>
          <p className="mt-2 text-sm text-muted">{isError ? 'Revisa tu conexión y vuelve a intentarlo.' : 'Los links de demo duran 7 días. Pide uno nuevo a quien te lo envió.'}</p>
        </div>
      </div>
    )
  }

  const first = demo.first_service
  const suggestions = ['Hola', 'Quiero pedir una cita', first ? `¿Cuánto cuesta ${first.toLowerCase()}?` : '¿Qué servicios ofrecen?', '¿Dónde están y qué horario tienen?']
  const expires = new Date(demo.expires_at).toLocaleDateString('es', { day: 'numeric', month: 'long' })

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:py-10">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-50 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,112,248,.4), transparent 65%)' }} />
      <main className="relative mx-auto w-full max-w-[460px] space-y-4">
        <header className="space-y-2 text-center">
          <p className="eyebrow inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />Secretaria virtual 24/7</p>
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{demo.business_name}</h1>
          <p className="text-sm text-muted">Escríbele como lo haría uno de tus clientes. {agent.config.secretaria.nombre} contesta al momento, también fuera de horario.</p>
        </header>
        <WhatsAppChat agent={agent} suggestions={suggestions} send={(turns) => chatWithDemoLink(token, turns)} />
        <footer className="space-y-1 text-center text-xs text-muted">
          {demo.agency_name && <p>Demo preparada por <span className="font-semibold text-text">{demo.agency_name}</span></p>}
          <p><Clock className="mr-1 inline h-3 w-3 -translate-y-px" aria-hidden />Disponible hasta el {expires}. La conversación no se guarda.</p>
          <p>Es una demostración: no compartas contraseñas ni datos de pago.</p>
        </footer>
      </main>
    </div>
  )
}
