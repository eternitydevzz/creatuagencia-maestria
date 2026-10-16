import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Coins, Hourglass, KeyRound, MailWarning, MessageCircle, Plus, Search, Trash2, UserCheck, UserPlus, Users, X } from 'lucide-react'
import { Avatar, CopyButton, Empty, Skeleton, Spinner } from '@/components/ui/bits'
import { useProfile } from '@/hooks/useData'
import { useToast } from '@/hooks/useToast'
import { adminStudents, GenerationError, type Credentials, type Student } from '@/lib/api'
import { play } from '@/lib/sound'

const ago = (iso: string | null) => {
  if (!iso) return 'nunca ha entrado'
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`
}

export default function Admin() {
  const { data: profile, isLoading: loadingProfile } = useProfile()
  if (loadingProfile) return <Skeleton rows={3} />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <Panel />
}

function Panel() {
  const toast = useToast()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['students'], queryFn: async () => (await adminStudents<{ students: Student[] }>({ action: 'list' })).students, refetchOnMount: 'always' })
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [credits, setCredits] = useState(30)
  const [busy, setBusy] = useState<string | null>(null)
  const [creds, setCreds] = useState<(Credentials & { name?: string }) | null>(null)
  const [q, setQ] = useState('')

  const fail = (e: unknown) => toast(e instanceof GenerationError ? e.message : 'Algo ha fallado. Inténtalo de nuevo.', 'error')
  const reload = () => qc.invalidateQueries({ queryKey: ['students'] })
  const students = useMemo(() => (data ?? []).filter((s) => s.role === 'student' && s.approved_at && `${s.email} ${s.full_name ?? ''}`.toLowerCase().includes(q.toLowerCase())), [data, q])
  const total = (data ?? []).filter((s) => s.role === 'student' && s.approved_at).length
  // Registrados sin aprobar: primero los que ya confirmaron su email (se pueden aprobar), luego los que aún no
  const pending = useMemo(() => (data ?? []).filter((s) => s.role === 'student' && !s.approved_at)
    .sort((a, b) => Number(!!b.email_confirmed_at) - Number(!!a.email_confirmed_at) || b.created_at.localeCompare(a.created_at)), [data])

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy('create')
    try {
      const r = await adminStudents<{ student: Credentials; warning?: string }>({ action: 'create', email, name, credits })
      setCreds({ ...r.student, name }); setEmail(''); setName(''); play('success'); await reload()
      if (r.warning) toast(r.warning, 'error')
    } catch (err) { fail(err) } finally { setBusy(null) }
  }
  const grant = async (s: Student) => {
    const v = window.prompt(`¿Cuántos créditos añadir a ${s.email}? (un número negativo los retira)`, '10')
    const amount = Number(v)
    if (!v || !Number.isFinite(amount) || amount === 0) return
    setBusy(s.id); try { await adminStudents({ action: 'grant', id: s.id, amount }); toast(amount > 0 ? `+${amount} créditos para ${s.email}` : `${amount} créditos para ${s.email}`); await reload() } catch (err) { fail(err) } finally { setBusy(null) }
  }
  const reset = async (s: Student) => {
    if (!window.confirm(`¿Generar una contraseña nueva para ${s.email}? La anterior dejará de funcionar.`)) return
    setBusy(s.id); try { const r = await adminStudents<{ student: Credentials }>({ action: 'reset_password', id: s.id }); setCreds({ ...r.student, name: s.full_name ?? undefined }); play('success') } catch (err) { fail(err) } finally { setBusy(null) }
  }
  const approve = async (s: Student, amount: number) => {
    setBusy(s.id)
    try {
      const r = await adminStudents<{ student: { credits: number } }>({ action: 'approve', id: s.id, credits: amount })
      play('success'); toast(`${s.full_name ?? s.email} ya tiene acceso, con ${r.student.credits} créditos`); await reload()
    } catch (err) { fail(err) } finally { setBusy(null) }
  }
  const reject = async (s: Student) => {
    if (!window.confirm(`¿Rechazar a ${s.email}?\n\nSe borra su cuenta. Podrá volver a registrarse si quiere.`)) return
    setBusy(s.id); try { await adminStudents({ action: 'delete', id: s.id }); toast('Solicitud rechazada'); await reload() } catch (err) { fail(err) } finally { setBusy(null) }
  }
  const remove = async (s: Student) => {
    if (!window.confirm(`¿Eliminar a ${s.email}?\n\nSe borrarán su cuenta, sus proyectos, agentes y números de WhatsApp vinculados. No se puede deshacer.`)) return
    setBusy(s.id); try { await adminStudents({ action: 'delete', id: s.id }); toast('Alumno eliminado'); await reload() } catch (err) { fail(err) } finally { setBusy(null) }
  }

  const message = creds ? `Hola${creds.name ? ` ${creds.name.split(' ')[0]}` : ''}, ya tienes acceso a tu plataforma MaestrIA.\n\nEntra aquí: ${window.location.origin}\nEmail: ${creds.email}\nContraseña temporal: ${creds.password}\n\nCuando entres, cambia la contraseña en Ajustes.` : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Administración</p><h1 className="text-3xl font-bold">Alumnos</h1><p className="text-muted">{total} {total === 1 ? 'alumno' : 'alumnos'} con acceso. Aquí apruebas registros, das de alta y de baja.</p></div>
      </div>

      {pending.length > 0 && (
        <section aria-labelledby="pendientes" className="space-y-3 rounded-2xl border border-[#e8b93a]/40 bg-[#e8b93a]/[0.06] p-5">
          <div>
            <h2 id="pendientes" className="flex items-center gap-2 text-lg font-bold text-white"><Hourglass className="h-5 w-5 text-[#f5d27a]" />Pendientes de aprobar · {pending.length}</h2>
            <p className="text-sm text-muted">Se registraron solos. Hasta que los apruebes no tienen créditos ni pueden usar la plataforma. Los que no confirman su email en 7 días se borran solos.</p>
          </div>
          <ul className="space-y-2.5">{pending.map((s) => <PendingRow key={s.id} s={s} busy={busy === s.id} onApprove={approve} onReject={reject} />)}</ul>
        </section>
      )}

      <form onSubmit={create} className="card space-y-4 p-5">
        <p className="flex items-center gap-2 font-semibold text-white"><UserPlus className="h-5 w-5 text-accent-hi" />Añadir un alumno</p>
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_120px_auto]">
          <input className="field" type="email" required placeholder="email@alumno.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email del alumno" autoComplete="off" />
          <input className="field" placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Nombre del alumno" />
          <label className="relative"><Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="field !pl-9" type="number" min={0} max={1000} value={credits} onChange={(e) => setCredits(Number(e.target.value))} aria-label="Créditos iniciales" /></label>
          <button className="btn" type="submit" disabled={busy === 'create' || !email}>{busy === 'create' ? <Spinner /> : <Plus className="h-4 w-4" />}Crear</button>
        </div>
        <p className="text-xs text-muted">Se crea la cuenta con una contraseña temporal que verás una sola vez. Mándasela por WhatsApp; el alumno la cambia en Ajustes.</p>
      </form>

      {creds && (
        <div role="status" className="animate-pop-in space-y-3 rounded-2xl border border-[#00a884]/50 p-5" style={{ background: 'linear-gradient(135deg, rgba(0,168,132,.2), rgba(0,92,75,.25))' }}>
          <p className="flex items-center gap-2 font-semibold text-[#7fe7cd]"><Check className="h-5 w-5" />Acceso listo para {creds.email}</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-black/30 p-4 font-mono text-sm text-white">{message}</pre>
          <div className="flex flex-wrap items-center gap-3">
            <CopyButton text={message} label="Copiar mensaje" />
            <span className="text-xs text-[#f5d27a]">La contraseña no se vuelve a mostrar. Si la pierdes, genera una nueva.</span>
            <button type="button" className="ml-auto text-sm text-muted underline hover:text-white" onClick={() => setCreds(null)}>Ocultar</button>
          </div>
        </div>
      )}

      <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="field !pl-10" placeholder="Buscar por nombre o email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar alumno" /></div>

      {isLoading ? <Skeleton rows={4} /> : !students.length ? <Empty icon={Users}>{q ? 'Ningún alumno coincide con la búsqueda.' : 'Todavía no hay alumnos. Añade el primero arriba.'}</Empty> : (
        <ul className="stagger space-y-2.5">
          {students.map((s) => (
            <li key={s.id} className="card card-lift flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
              <Avatar name={s.full_name ?? s.email} className="h-11 w-11 text-base" />
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate font-semibold text-white">{s.full_name ?? s.email.split('@')[0]}</p>
                <p className="truncate text-sm text-muted">{s.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="pill"><Coins className="h-3.5 w-3.5" />{s.credits} créditos</span>
                <span className="pill">{s.projects} {s.projects === 1 ? 'proyecto' : 'proyectos'}</span>
                <span className="pill !text-muted">{ago(s.last_sign_in_at)}</span>
              </div>
              <div className="flex gap-1.5">
                <button type="button" className="btn-ghost !px-3 !py-2" onClick={() => void grant(s)} disabled={busy === s.id} title="Añadir o quitar créditos"><Coins className="h-4 w-4" /></button>
                <button type="button" className="btn-ghost !px-3 !py-2" onClick={() => void reset(s)} disabled={busy === s.id} title="Nueva contraseña"><KeyRound className="h-4 w-4" /></button>
                <button type="button" className="btn-ghost !px-3 !py-2 hover:!border-[#ff8f8f] hover:!text-[#ff8f8f]" onClick={() => void remove(s)} disabled={busy === s.id} title="Eliminar alumno" aria-label={`Eliminar ${s.email}`}>{busy === s.id ? <Spinner /> : <Trash2 className="h-4 w-4" />}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Un registro pendiente: datos de contacto, si confirmó el email, créditos con los que entra y aprobar/rechazar. */
function PendingRow({ s, busy, onApprove, onReject }: { s: Student; busy: boolean; onApprove: (s: Student, credits: number) => void; onReject: (s: Student) => void }) {
  const [credits, setCredits] = useState(30)
  const confirmed = !!s.email_confirmed_at
  const wa = s.phone ? s.phone.replace(/[^0-9]/g, '') : ''
  return (
    <li className="card flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
      <Avatar name={s.full_name ?? s.email} className="h-11 w-11 text-base" />
      <div className="min-w-0 flex-1 basis-52">
        <p className="truncate font-semibold text-white">{s.full_name ?? s.email.split('@')[0]}</p>
        <p className="truncate text-sm text-muted">{s.email}</p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
          {confirmed ? <span className="pill !border-[#00a884]/50 !text-[#7fe7cd]"><Check className="h-3.5 w-3.5" />Email confirmado</span>
            : <span className="pill !border-[#e8b93a]/50 !text-[#f5d27a]"><MailWarning className="h-3.5 w-3.5" />Falta confirmar el email</span>}
          {wa && <a className="pill hover:!text-white" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" />{s.phone}</a>}
          <span className="pill !text-muted">se registró {ago(s.created_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="relative w-24" title="Créditos con los que entra"><Coins className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="field !py-2 !pl-9" type="number" min={0} max={1000} value={credits} onChange={(e) => setCredits(Number(e.target.value))} aria-label={`Créditos para ${s.email}`} /></label>
        <button type="button" className="btn !px-4 !py-2" disabled={busy || !confirmed} onClick={() => onApprove(s, credits)} title={confirmed ? 'Darle acceso' : 'Podrás aprobarlo cuando confirme su email'}>
          {busy ? <Spinner /> : <UserCheck className="h-4 w-4" />}Aprobar</button>
        <button type="button" className="btn-ghost !px-3 !py-2 hover:!border-[#ff8f8f] hover:!text-[#ff8f8f]" disabled={busy} onClick={() => onReject(s)} title="Rechazar (borra la cuenta)" aria-label={`Rechazar a ${s.email}`}><X className="h-4 w-4" /></button>
      </div>
    </li>
  )
}
