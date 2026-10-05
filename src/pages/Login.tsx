import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/bits'

export default function Login() {
  const { session, needsPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  if (session && needsPassword) return <Navigate to="/reset-password" replace />
  if (session) return <Navigate to="/" replace />

  const wrap = async (fn: () => Promise<string | void>) => {
    setBusy(true); setError(''); setInfo('')
    try { const msg = await fn(); if (msg) setInfo(msg) } catch (e) { setError(e instanceof Error ? e.message : 'Algo ha fallado') } finally { setBusy(false) }
  }
  const signIn = (e: React.FormEvent) => { e.preventDefault(); void wrap(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message)
  }) }
  const magic = () => void wrap(async () => {
    if (!email.trim()) throw new Error('Escribe tu email primero.')
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } })
    if (error) throw new Error('No se pudo enviar el enlace. Comprueba que tu email es el de tu invitación.')
    return 'Si tu email está dado de alta, te hemos enviado un enlace de acceso.'
  })
  const forgot = () => void wrap(async () => {
    if (!email.trim()) throw new Error('Escribe tu email primero.')
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
    return 'Si tu email está dado de alta, te hemos enviado un enlace para crear una contraseña nueva.'
  })

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,112,248,.45), transparent 65%)' }} />
      <div className="card relative w-full max-w-md animate-pop-in overflow-hidden shadow-[0_30px_90px_rgba(0,40,140,.55)]">
        <img src="/brand/portada-acceso.webp" alt="MaestrIA — Creación de Agencias IA" className="aspect-video w-full object-cover" />
        <div className="space-y-5 p-6">
          <div className="text-center"><h1 className="text-2xl font-bold">Bienvenido a MaestrIA</h1><p className="mt-1 text-sm text-muted">Acceso solo para alumnos del programa. Usa el email con el que te invitamos.</p></div>
          <form onSubmit={signIn} className="space-y-4">
            <label className="block text-sm font-semibold">Correo electrónico<input type="email" required autoComplete="email" className="field mt-1.5 font-normal" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block text-sm font-semibold">Contraseña<input type="password" required autoComplete="current-password" className="field mt-1.5 font-normal" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            {error && <p role="alert" className="text-sm text-[#ff8f8f]">{error}</p>}
            {info && <p role="status" className="text-sm text-accent-glow">{info}</p>}
            <button className="btn w-full" type="submit" disabled={busy}>{busy ? <Spinner /> : null}Entrar<ArrowRight className="h-4 w-4" /></button>
          </form>
          <div className="flex flex-col items-center gap-1 text-sm text-muted">
            <button type="button" className="underline underline-offset-4 hover:text-white" onClick={magic} disabled={busy}>Enviarme un enlace de acceso por email</button>
            <button type="button" className="underline underline-offset-4 hover:text-white" onClick={forgot} disabled={busy}>Olvidé mi contraseña</button>
          </div>
          <p className="text-center text-xs text-muted">Al entrar aceptas los <Link to="/terminos" className="underline hover:text-white">términos</Link> y la <Link to="/privacidad" className="underline hover:text-white">política de privacidad</Link>.</p>
        </div>
      </div>
    </div>
  )
}
