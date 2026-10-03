import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
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

function Protected({ children }: { children: React.ReactNode }) {
  const { session, loading, needsPassword } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner className="h-8 w-8 text-accent-hi" /></div>
  if (!session) return <Navigate to="/login" replace />
  if (needsPassword) return <Navigate to="/reset-password" replace />
  return <AppShell>{children}</AppShell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/privacidad" element={<Privacy />} />
      <Route path="/terminos" element={<Terms />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
