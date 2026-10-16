import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useData'
import AppShell from '@/components/AppShell'
import { Spinner } from '@/components/ui/bits'
import Login from '@/pages/Login'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import Settings from '@/pages/Settings'
import RoadmapPage from '@/pages/RoadmapPage'
import { Privacy, Terms } from '@/pages/Legal'
import Admin from '@/pages/Admin'
import PublicDemo from '@/pages/PublicDemo'
import Register from '@/pages/Register'
import Pending from '@/pages/Pending'

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading, needsPassword } = useAuth()
  const { data: profile, isLoading: loadingProfile, isError: profileError, refetch } = useProfile()
  if (loading || (session && loadingProfile)) return <div className="grid min-h-screen place-items-center"><Spinner className="h-8 w-8 text-accent-hi" /></div>
  if (!session) return <Navigate to="/login" replace />
  if (needsPassword) return <Navigate to="/reset-password" replace />
  // Sin perfil no se sabe si la cuenta está aprobada: se reintenta en vez de dejar pasar (el servidor bloquearía igual)
  if (profileError || !profile) return (
    <div className="grid min-h-screen place-items-center px-4"><div className="card max-w-sm space-y-3 p-6 text-center">
      <p className="font-semibold text-white">No pudimos cargar tu cuenta</p><p className="text-sm text-muted">Revisa tu conexión y vuelve a intentarlo.</p>
      <button type="button" className="btn mx-auto" onClick={() => void refetch()}>Reintentar</button>
    </div></div>
  )
  // Registrada pero sin aprobar: pantalla de espera (el servidor y la base de datos también le cierran el paso)
  if (profile && !profile.approved_at && profile.role !== 'admin') return <Pending profile={profile} />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/privacidad" element={<Privacy />} />
      <Route path="/terminos" element={<Terms />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Link público de una demo: lo abre el prospecto del alumno, sin cuenta */}
      <Route path="/d/:token" element={<PublicDemo />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/projects" element={<Protected><Projects /></Protected>} />
      <Route path="/roadmap" element={<Protected><RoadmapPage /></Protected>} />
      <Route path="/roadmap/:id" element={<Protected><RoadmapPage /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/admin" element={<Protected><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
