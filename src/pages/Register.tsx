import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, MailCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MIN_PASSWORD_LENGTH, useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/bits'

/** Registro abierto: la cuenta se crea, el alumno confirma su email y queda en revisión hasta que un administrador la aprueba
 *  (sin créditos ni acceso al mapa mientras tanto). Nombre y WhatsApp viajan en los metadatos del alta y los copia el servidor. */
export default function Register() {
  const { session } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  if (session) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
    if (!accepted) return setError('Para crear la cuenta tienes que aceptar los términos y la política de privacidad.')
    setBusy(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name.trim(), phone: phone.trim() } },
      })
      if (error) {
        if (/signups? not allowed|disabled/i.test(error.message)) throw new Error('El registro está cerrado por ahora. Escríbenos para pedir acceso.')
        if (/password/i.test(error.message)) throw new Error(`La contraseña no es válida: usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
        if (/rate|too many|security purposes/i.test(error.message)) throw new Error('Demasiados intentos seguidos. Espera un minuto y vuelve a probar.')
        throw new Error('No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.')
      }
      // Si el email ya tenía cuenta, Supabase responde igual (para no revelar quién está registrado): mostramos lo mismo.
      setSentTo(email.trim().toLowerCase())
    } catch (err) { setError(err instanceof Error ? err.message : 'Algo ha fallado') } finally { setBusy(false) }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,112,248,.45), transparent 65%)' }} />
      <div className="card relative w-full max-w-md animate-pop-in overflow-hidden shadow-[0_30px_90px_rgba(0,40,140,.55)]">
        <img src="/brand/portada-acceso.webp" alt="MaestrIA — Creación de Agencias IA" className="aspect-video w-full object-cover" />
        {sentTo ? (
          <div className="space-y-4 p-6 text-center">
            <span className="tile-hero mx-auto !h-14 !w-14"><MailCheck className="h-7 w-7" /></span>
            <h1 className="text-2xl font-bold">Revisa tu email</h1>
            <p className="text-sm text-muted">Te enviamos un enlace a <b className="text-white">{sentTo}</b> para confirmar tu cuenta.</p>
            <p className="text-sm text-muted">Después, el equipo de MaestrIA revisará tu solicitud y te daremos acceso.</p>
            <p className="text-xs text-muted">¿No llega? Mira en spam o promociones. Desde <Link to="/login" className="underline hover:text-white">Entrar</Link> puedes pedir que te lo reenviemos.</p>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            <div className="text-center"><h1 className="text-2xl font-bold">Crea tu cuenta</h1><p className="mt-1 text-sm text-muted">Confirma tu email y el equipo de MaestrIA aprobará tu acceso.</p></div>
            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-semibold">Nombre y apellido<input required autoComplete="name" maxLength={80} className="field mt-1.5 font-normal" value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className="block text-sm font-semibold">Correo electrónico<input type="email" required autoComplete="email" className="field mt-1.5 font-normal" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label className="block text-sm font-semibold">WhatsApp<input type="tel" required inputMode="tel" autoComplete="tel" maxLength={25} className="field mt-1.5 font-normal" placeholder="+1 305 555 0123" value={phone} onChange={(e) => setPhone(e.target.value)} /><span className="mt-1 block text-xs font-normal text-muted">Con el código de país, para que el equipo pueda contactarte.</span></label>
              <label className="block text-sm font-semibold">Contraseña<input type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className="field mt-1.5 font-normal" value={password} onChange={(e) => setPassword(e.target.value)} /><span className="mt-1 block text-xs font-normal text-muted">Mínimo {MIN_PASSWORD_LENGTH} caracteres.</span></label>
              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
                <input type="checkbox" className="mt-0.5 h-4 w-4 flex-none accent-[#0070f8]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>Acepto los <Link to="/terminos" className="underline hover:text-white">términos</Link> y la <Link to="/privacidad" className="underline hover:text-white">política de privacidad</Link>.</span>
              </label>
              {error && <p role="alert" className="text-sm text-[#ff8f8f]">{error}</p>}
              <button className="btn w-full" type="submit" disabled={busy}>{busy ? <Spinner /> : null}Crear cuenta<ArrowRight className="h-4 w-4" /></button>
            </form>
            <p className="text-center text-sm text-muted">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-accent-hi hover:underline">Entra aquí</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}
