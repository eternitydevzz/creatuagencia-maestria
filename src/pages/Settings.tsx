import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Coins, LogOut, Save, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useData'
import { useToast } from '@/hooks/useToast'
import { Avatar, Spinner } from '@/components/ui/bits'

interface Ledger { id: number; delta: number; reason: string; balance_after: number; created_at: string }
type Tab = 'profile' | 'credits'

export default function Settings() {
  const { data: profile } = useProfile()
  const { signOut } = useAuth()
  const qc = useQueryClient(); const toast = useToast()
  const [tab, setTab] = useState<Tab>('profile')
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { if (profile) setName(profile.full_name ?? '') }, [profile])
  const { data: ledger } = useQuery({
    queryKey: ['ledger', profile?.id], enabled: !!profile,
    queryFn: async () => { const { data, error } = await supabase.from('credit_ledger').select('*').order('created_at', { ascending: false }).limit(15); if (error) throw error; return data as Ledger[] },
  })

  const save = async () => {
    if (!profile) return
    setBusy(true)
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() || null }).eq('id', profile.id)
    setBusy(false)
    if (error) return toast('No se pudieron guardar los cambios.', 'error')
    await qc.invalidateQueries({ queryKey: ['profile'] }); toast('Cambios guardados')
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof User }> = [{ id: 'profile', label: 'Perfil', icon: User }, { id: 'credits', label: 'Créditos', icon: Coins }]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><p className="eyebrow">Tu cuenta</p><h1 className="text-3xl font-bold">Ajustes</h1><p className="mt-1 text-muted">Gestiona tu cuenta y preferencias</p></div>

      <div role="tablist" aria-label="Ajustes" className="inline-flex gap-1 rounded-2xl border border-line bg-black/30 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === id ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <section className="hero-panel space-y-6 rounded-2xl border border-white/10 p-6" aria-labelledby="perfil">
          <h2 id="perfil" className="flex items-center gap-2 text-lg font-bold text-accent-glow"><User className="h-5 w-5" />Información personal</h2>
          <div className="flex items-center gap-5">
            <Avatar name={profile?.full_name ?? profile?.email} className="h-20 w-20 text-2xl" />
            <div>
              <p className="text-xl font-bold text-white">{profile?.full_name ?? '…'}</p>
              <p className="text-muted">{profile?.email}</p>
              <span className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">{profile?.role === 'admin' ? 'Administrador' : 'Alumno MaestrIA'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-semibold">Nombre completo<input className="field mt-1.5 font-normal" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="block text-sm font-semibold">Email<input className="field mt-1.5 font-normal opacity-60" value={profile?.email ?? ''} readOnly /><span className="mt-1 block text-xs font-normal text-muted">El email no se puede cambiar</span></label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn" onClick={() => void save()} disabled={busy}>{busy ? <Spinner /> : <Save className="h-4 w-4" />}Guardar cambios</button>
            <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl bg-[#d92d2d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e63b3b]"><LogOut className="h-4 w-4" />Cerrar sesión</button>
          </div>
        </section>
      ) : (
        <section className="hero-panel space-y-4 rounded-2xl border border-white/10 p-6" aria-labelledby="creditos">
          <div className="flex items-end justify-between"><h2 id="creditos" className="flex items-center gap-2 text-lg font-bold text-accent-glow"><Coins className="h-5 w-5" />Créditos de IA</h2><div className="text-right"><span className="text-5xl font-bold text-white">{profile?.credits ?? '…'}</span><span className="ml-1 text-sm text-muted">disponibles</span></div></div>
          <p className="text-sm text-muted">Cada generación con IA consume créditos; el coste aparece en cada botón. Si una generación falla, se te devuelven automáticamente. ¿Necesitas más? Escribe a tu equipo de MaestrIA.</p>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm"><thead className="bg-white/[0.04] text-left text-xs text-muted"><tr><th className="px-3 py-2 font-semibold">Movimiento</th><th className="px-3 py-2 text-right font-semibold">Créditos</th><th className="px-3 py-2 text-right font-semibold">Saldo</th></tr></thead>
              <tbody>{(ledger ?? []).map((l) => <tr key={l.id} className="border-t border-line"><td className="px-3 py-2"><span className="text-white">{l.reason}</span><span className="block text-xs text-muted">{new Date(l.created_at).toLocaleString('es-ES')}</span></td><td className={`px-3 py-2 text-right font-mono ${l.delta < 0 ? 'text-[#ffb3b3]' : 'text-accent-glow'}`}>{l.delta > 0 ? '+' : ''}{l.delta}</td><td className="px-3 py-2 text-right font-mono text-muted">{l.balance_after}</td></tr>)}
                {ledger && !ledger.length && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted">Aún no hay movimientos.</td></tr>}</tbody></table>
          </div>
        </section>
      )}
    </div>
  )
}
