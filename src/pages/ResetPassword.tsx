import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/bits'

export default function ResetPassword() {
  const { session, loading, clearNeedsPassword } = useAuth()
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (pw.length < 10) return setError('Usa al menos 10 caracteres.')
    if (pw !== pw2) return setError('Las contraseñas no coinciden.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setError(error.message)
    clearNeedsPassword(); window.history.replaceState({}, '', '/reset-password'); nav('/', { replace: true })
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card w-full max-w-md space-y-5 p-6">
        <img src="/brand/logo-horizontal.png" alt="MaestrIA" className="mx-auto h-12 w-auto" />
        {loading ? <div className="grid place-items-center py-6"><Spinner className="h-6 w-6" /></div> : !session ? (
          <p className="text-center text-sm text-muted">Este enlace ha caducado o ya se usó. <Link className="underline" to="/login">Vuelve al acceso</Link> y pide uno nuevo.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="text-center"><h1 className="text-xl font-bold">Crea tu contraseña</h1><p className="mt-1 text-sm text-muted">Con ella entrarás siempre a tu cuenta de MaestrIA.</p></div>
            <label className="block text-sm font-semibold">Contraseña nueva<input type="password" required minLength={10} autoComplete="new-password" className="field mt-1.5 font-normal" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
            <label className="block text-sm font-semibold">Repítela<input type="password" required minLength={10} autoComplete="new-password" className="field mt-1.5 font-normal" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
            {error && <p role="alert" className="text-sm text-[#ff8f8f]">{error}</p>}
            <button className="btn w-full" type="submit" disabled={busy}>{busy ? <Spinner /> : null}Guardar y entrar</button>
          </form>
        )}
      </div>
    </div>
  )
}
