import { NavLink, Link } from 'react-router-dom'
import { FolderOpen, LayoutDashboard, LogOut, Map, Settings as Cog, Coins, Users, Volume2, VolumeX } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useGenerationCount, useProfile, useRoadmaps } from '@/hooks/useData'
import { computeXp, levelFor } from '@/lib/gamification'
import { Avatar } from '@/components/ui/bits'
import { useSound } from '@/hooks/useSound'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/roadmap', label: 'Mapa de Ruta', icon: Map },
  { to: '/projects', label: 'Mis Proyectos', icon: FolderOpen },
  { to: '/settings', label: 'Ajustes', icon: Cog },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const { data: roadmaps } = useRoadmaps()
  const { data: gens } = useGenerationCount()
  const xp = computeXp(roadmaps ?? [], gens ?? 0)
  const lvl = levelFor(xp)
  const low = (profile?.credits ?? 99) <= 5
  const sound = useSound()

  return (
    <div className="min-h-screen ">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="MaestrIA · inicio"><img src="/brand/logo-horizontal.png" alt="MaestrIA" className="h-9 w-auto" /></Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:overflow-visible" aria-label="Principal">
            {[...links, ...(profile?.role === 'admin' ? [{ to: '/admin', label: 'Alumnos', icon: Users, end: false }] : [])].map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-none items-center gap-2 rounded-xl px-2.5 py-2 lg:px-3 text-sm font-semibold transition ${isActive ? 'border border-accent/40 bg-accent/15 text-white' : 'border border-transparent text-muted hover:text-white'}`}>
                <Icon className="hidden h-4 w-4 min-[1500px]:block" />{label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className={`pill ${low ? '!border-[#ff8f8f] !text-[#ffb3b3]' : ''}`} title="Créditos de IA disponibles" aria-label={`${profile?.credits ?? 0} créditos`}><Coins className="h-4 w-4" /><span className="font-mono">{profile?.credits ?? '…'}</span></div>
            <div className="hidden items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3 xl:flex" title={`${xp} XP`}>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-base font-bold text-white">{lvl.level}</span>
              <span className="text-left"><span className="block text-[11px] leading-tight text-muted">{lvl.name}</span><span className="mt-1 block h-1.5 w-28 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-accent-hi transition-all" style={{ width: `${Math.round(lvl.progress * 100)}%` }} /></span></span>
              <span className="font-mono text-xs text-muted"><b className="text-sm text-white">{xp}</b> XP</span>
            </div>
            <div className="hidden items-center gap-2.5 border-l border-white/10 pl-3 lg:flex" title={profile?.email}>
              <Avatar name={profile?.full_name ?? profile?.email} />
              <span className="hidden max-w-[170px] text-left leading-tight 2xl:block"><span className="block truncate text-sm font-bold text-white">{profile?.full_name ?? '…'}</span><span className="block truncate text-xs text-muted">{profile?.email}</span></span>
            </div>
            <button type="button" data-silent onClick={sound.toggle} aria-pressed={sound.on} aria-label={sound.on ? 'Silenciar sonidos' : 'Activar sonidos'} title={sound.on ? 'Silenciar sonidos' : 'Activar sonidos'}
              className="rounded-xl p-2 text-muted transition hover:bg-white/5 hover:text-white">{sound.on ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>
            <button type="button" className="rounded-xl p-2 text-muted hover:bg-white/5 hover:text-white" onClick={() => void signOut()} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-5 gap-y-1 px-4 pb-8 text-xs text-muted sm:px-6">
        <Link to="/terminos" className="hover:text-white">Términos</Link><Link to="/privacidad" className="hover:text-white">Privacidad</Link>
      </footer>
    </div>
  )
}
