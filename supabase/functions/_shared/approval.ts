// Registro abierto con aprobación manual: una cuenta recién registrada queda "en revisión" hasta que la aprueba un administrador.
// Las Edge Functions que gastan IA o crean datos lo comprueban aquí, además de la seguridad por filas de la base de datos.
// Si la consulta falla se lanza el error (no se da por aprobada): un control que se apaga con un error no protege nada.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

export const NOT_APPROVED_MESSAGE = 'Tu cuenta está en revisión. Te avisaremos cuando el equipo la apruebe.'

export async function isApproved(admin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await admin.from('profiles').select('approved_at, role').eq('id', userId).maybeSingle()
  if (error) throw new Error(`approval_check_failed: ${error.message}`)
  return !!data?.approved_at || data?.role === 'admin' // un admin cuenta siempre como aprobado (igual que is_approved() en la base)
}
