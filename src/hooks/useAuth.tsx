import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/** Mínimo de caracteres de una contraseña. Debe coincidir con `minimum_password_length` en supabase/config.toml
 *  (y en deploy/supabase-prod-auth/supabase/config.toml): si el servidor es más estricto, el formulario deja
 *  enviar contraseñas que luego rechaza. */
export const MIN_PASSWORD_LENGTH = 10

interface AuthCtx { session: Session | null; loading: boolean; needsPassword: boolean; clearNeedsPassword: () => void; signOut: () => Promise<void> }
const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Al entrar desde un enlace de invitación o de recuperación, el alumno debe fijar su contraseña.
  const [needsPassword, setNeedsPassword] = useState(() => /type=(invite|recovery)/.test(window.location.hash))

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setNeedsPassword(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthCtx = {
    session, loading, needsPassword,
    clearNeedsPassword: () => setNeedsPassword(false),
    signOut: async () => { await supabase.auth.signOut() },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}
