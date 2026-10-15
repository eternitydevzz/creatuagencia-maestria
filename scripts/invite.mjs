#!/usr/bin/env node
// Alta de alumnos y gestión de créditos. Usa la clave de servicio: NUNCA la subas a git ni la pongas en el frontend.
//
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... SITE_URL=https://tu-dominio.com node scripts/invite.mjs <comando>
//
//   SITE_URL es obligatorio para invitar (invite, csv): es el dominio al que llegará el alumno desde el email.
//
//   invite  ana@correo.com "Ana Pérez" [--credits 30]     Envía la invitación por email (crea su cuenta)
//   csv     alumnos.csv                                   Invita en bloque. Columnas: email,nombre,creditos
//   grant   ana@correo.com 20 ["motivo"]                  Suma créditos (negativo para restar)
//   balance ana@correo.com                                Muestra créditos y uso
//   create  ana@correo.com "Contraseña-Larga-1" [Nombre] [--credits 30]   SOLO PRUEBAS LOCALES: cuenta con contraseña, sin email
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws' // Node < 22 no trae WebSocket nativo

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const site = (process.env.SITE_URL ?? '').replace(/\/+$/, '')
if (!url || !key) { console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: WebSocket } })

const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(`--${name}`); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v }
const credits = flag('credits')
const [cmd, ...rest] = args

async function grant(userId, amount, reason) {
  const { error } = amount >= 0
    ? await db.rpc('refund_credits', { p_user: userId, p_amount: amount, p_reason: reason })
    : await db.rpc('spend_credits', { p_user: userId, p_cost: -amount, p_reason: reason })
  if (error) throw new Error(error.message)
}
// Las altas por script se aprueban en el momento (el registro público deja las cuentas en revisión y sin créditos).
// approve_student da los créditos de alta: los pedidos o, si no se indican, los de app_settings.
const creditsOf = (wanted) => {
  const n = wanted === undefined || wanted === '' ? null : Number(wanted)
  if (n !== null && (!Number.isInteger(n) || n < 0 || n > 1000)) throw new Error(`Créditos no válidos: ${wanted} (entre 0 y 1000)`)
  return n
}
async function approve(userId, wanted, email) {
  const { data, error } = await db.rpc('approve_student', { p_user: userId, p_credits: creditsOf(wanted) })
  if (error) throw new Error(error.message)
  if (data === false) console.warn(`  ${email ?? userId} ya estaba aprobado: no se le añadieron créditos (usa grant)`)
}
// Con el registro abierto, alguien podría registrarse con el email de un futuro alumno (con su propia contraseña) antes de
// que lo invitemos: la invitación reutilizaría esa cuenta. Si existe sin confirmar, se borra y se invita desde cero.
async function clearUnconfirmed(email) {
  const { data: p } = await db.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!p) return
  const { data: u } = await db.auth.admin.getUserById(p.id)
  if (u?.user && !u.user.email_confirmed_at) {
    const { error } = await db.auth.admin.deleteUser(p.id)
    if (error) throw new Error(`${email}: no se pudo limpiar un registro sin confirmar (${error.message})`)
    console.warn(`  ${email} tenía un registro sin confirmar: se borró antes de invitar`)
  }
}
// Igualdad exacta (los emails se guardan en minúsculas). Con ilike, "_" y "%" funcionan como comodines y podrían coincidir otros alumnos.
async function userByEmail(email) {
  const { data } = await db.from('profiles').select('*').eq('email', String(email ?? '').trim().toLowerCase()).maybeSingle()
  if (!data) throw new Error(`No existe ningún alumno con el email ${email}`)
  return data
}
async function invite(email, name, wantedCredits = credits) {
  if (!site) throw new Error('Falta SITE_URL (el dominio de tu web, p. ej. https://app.tu-dominio.com): sin él, el enlace de la invitación no llevaría al alumno a ningún sitio.')
  email = String(email ?? '').trim().toLowerCase()
  creditsOf(wantedCredits) // se valida antes de enviar nada
  await clearUnconfirmed(email)
  const { data, error } = await db.auth.admin.inviteUserByEmail(email, { data: { full_name: name || undefined }, redirectTo: `${site}/reset-password` })
  if (error) throw new Error(`${email}: ${error.message}`)
  await approve(data.user.id, wantedCredits, email)
  console.log(`✓ invitado ${email}`)
}

try {
  if (cmd === 'invite') await invite(rest[0], rest[1])
  else if (cmd === 'csv') {
    const rows = fs.readFileSync(rest[0], 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (/^email/i.test(rows[0])) rows.shift()
    let ok = 0, fail = 0
    for (const row of rows) {
      const [email, name, cr] = row.split(',').map((s) => s.trim())
      try { await invite(email, name, cr || credits); ok++ }
      catch (e) { console.error(`✗ ${e.message}`); fail++ }
    }
    console.log(`\n${ok} invitados, ${fail} con error`)
  } else if (cmd === 'grant') {
    const u = await userByEmail(rest[0]); const n = Number(rest[1])
    if (!Number.isInteger(n)) throw new Error('La cantidad debe ser un número entero')
    await grant(u.id, n, rest[2] ? `manual: ${rest[2]}` : 'manual: ajuste de créditos')
    const { data } = await db.from('profiles').select('credits').eq('id', u.id).single()
    console.log(`✓ ${rest[0]}: ${data.credits} créditos`)
  } else if (cmd === 'balance') {
    const u = await userByEmail(rest[0])
    const { count } = await db.from('generations').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('status', 'succeeded')
    console.log(`${u.email}: ${u.credits} créditos · ${count} generaciones exitosas`)
  } else if (cmd === 'create') {
    const { data, error } = await db.auth.admin.createUser({ email: rest[0].toLowerCase(), password: rest[1], email_confirm: true, user_metadata: { full_name: rest[2] } })
    if (error) throw new Error(error.message)
    await approve(data.user.id, credits, rest[0])
    console.log(`✓ creado ${rest[0]}`)
  } else { console.error('Comando desconocido. Mira la cabecera del archivo.'); process.exit(1) }
} catch (e) { console.error(`✗ ${e.message}`); process.exit(1) }
