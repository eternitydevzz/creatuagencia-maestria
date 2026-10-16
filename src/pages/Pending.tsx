import { useQueryClient } from '@tanstack/react-query'
import { Hourglass, LogOut, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/lib/types'

/** Lo que ve una cuenta registrada mientras el equipo no la aprueba: no puede entrar al mapa ni usar la IA. */
export default function Pending({ profile }: { profile: Profile }) {
  const { signOut } = useAuth()
  const qc = useQueryClient()
  const first = profile.full_name?.split(' ')[0]

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,112,248,.4), transparent 65%)' }} />
      <div className="card relative w-full max-w-md animate-pop-in space-y-5 p-8 text-center shadow-[0_30px_90px_rgba(0,40,140,.55)]">
        <img src="/brand/logo-horizontal.png" alt="MaestrIA" className="mx-auto h-9 w-auto" />
        <span className="tile-hero mx-auto !h-14 !w-14"><Hourglass className="h-7 w-7" /></span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{first ? `${first}, tu cuenta está en revisión` : 'Tu cuenta está en revisión'}</h1>
          <p className="text-sm text-muted">Ya confirmaste tu email. Ahora el equipo de MaestrIA tiene que aprobar tu acceso: cuando lo haga, entrarás directamente a tu Mapa de Ruta con tus créditos de IA.</p>
          {profile.phone && <p className="text-sm text-muted">El equipo puede escribirte por WhatsApp al <b className="font-mono text-white">{profile.phone}</b>.</p>}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className="btn" onClick={() => void qc.invalidateQueries({ queryKey: ['profile'] })}><RefreshCw className="h-4 w-4" />Comprobar de nuevo</button>
          <button type="button" className="btn-ghost" onClick={() => void signOut()}><LogOut className="h-4 w-4" />Salir</button>
        </div>
        <p className="text-xs text-muted">Cuenta: {profile.email}</p>
      </div>
    </div>
  )
}
