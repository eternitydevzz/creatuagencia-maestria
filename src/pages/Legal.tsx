import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { LEGAL, legalIsDraft } from '@/lib/legal'

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" />Volver a MaestrIA</Link>
      <div className="hero-panel mb-6 rounded-2xl border border-white/10 p-6"><p className="eyebrow">Legal</p><h1 className="text-3xl font-bold">{title}</h1><p className="mt-1 text-sm text-muted">Última actualización: {LEGAL.updated}</p></div>
      {legalIsDraft && (
        <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-[#e8b93a]/40 bg-[#e8b93a]/10 px-4 py-3 text-sm text-[#f5d27a]">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" /><p><b>Borrador.</b> Faltan los datos del responsable (<code>src/lib/legal.ts</code>) y conviene que un profesional lo revise antes de abrir la plataforma a alumnos.</p>
        </div>
      )}
      <article className="card space-y-6 p-6 text-[15px] leading-relaxed text-text sm:p-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p+ul]:mt-2 [&_ul]:space-y-1.5">{children}</article>
    </div>
  )
}

export function Privacy() {
  return (
    <Page title="Política de privacidad">
      <section><h2>1. Quién es el responsable</h2>
        <p>{LEGAL.company} ({LEGAL.taxId}), con domicilio en {LEGAL.address}. Para cualquier asunto de privacidad: {LEGAL.email}. Somos una empresa con sede en Estados Unidos: tus datos se tratan allí y en los países de nuestros proveedores.</p></section>
      <section><h2>2. Qué datos tratamos y para qué</h2>
        <ul>
          <li><b>Tu cuenta:</b> email y nombre. Para darte acceso y gestionar el programa. Base legal: ejecución del contrato.</li>
          <li><b>Tus proyectos:</b> las respuestas que escribes y lo que genera la IA (cliente ideal, oferta, landing, agentes). Para prestarte el servicio.</li>
          <li><b>Uso y créditos:</b> qué generaciones haces y cuántos créditos gastas. Para el funcionamiento y la seguridad del servicio.</li>
          <li><b>WhatsApp (función beta):</b> si vinculas un número, tratamos los mensajes que escriben a ese número, el nombre y teléfono de quien escribe, y las citas que el agente registra. Para que el agente responda y para que tú los veas.</li>
        </ul></section>
      <section><h2>3. Tus clientes finales (WhatsApp)</h2>
        <p>Cuando conectas un número, tú decides para qué se usa y a quién atiende: respecto a los datos de quienes escriben a ese número, <b>tú eres el responsable del tratamiento</b> y {LEGAL.company} actúa como encargado, tratándolos solo para prestarte el servicio y siguiendo tus instrucciones. Eres tú quien debe informar a esas personas de que hablan con un asistente virtual y de que sus mensajes se guardan, y quien debe contar con una base legal para tratar sus datos. Puedes pedirnos el contrato de encargo de tratamiento escribiendo a {LEGAL.email}.</p></section>
      <section><h2>4. Con quién compartimos datos</h2>
        <p>Usamos proveedores que tratan datos por cuenta nuestra:</p>
        <ul>
          <li><b>Supabase</b> (base de datos, inicio de sesión y funciones del servidor).</li>
          <li><b>Anthropic</b> (modelos de IA): recibe el contenido necesario para generar textos y respuestas.</li>
          <li><b>Render</b> (alojamiento de la web y del servidor de WhatsApp).</li>
          <li><b>WhatsApp / Meta</b>, como red por la que viajan los mensajes del número que vinculas.</li>
        </ul>
        <p>Algunos de estos proveedores están fuera del Espacio Económico Europeo; cuando es así, se apoyan en garantías como las cláusulas contractuales tipo. No vendemos tus datos.</p></section>
      <section><h2>5. Cuánto tiempo los conservamos</h2>
        <ul>
          <li>Cuenta y proyectos: mientras tengas cuenta y hasta que los borres o lo pidas.</li>
          <li>Mensajes de WhatsApp: <b>30 días</b>, o antes si desvinculas el número (se borran con las conversaciones y las citas).</li>
          <li>Registro de movimientos de créditos: mientras exista la cuenta.</li>
        </ul></section>
      <section><h2>6. Tus derechos</h2>
        <p>Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {LEGAL.email}. Si no te contestamos bien, puedes reclamar ante la autoridad de protección de datos de tu país (en España, la AEPD: aepd.es).</p></section>
      <section><h2>7. Seguridad</h2>
        <p>Cada alumno solo accede a lo suyo (seguridad por filas en la base de datos). Las claves de los servicios de IA y de WhatsApp están solo en el servidor y nunca llegan al navegador. Las comunicaciones van cifradas.</p></section>
      <section><h2>8. Cookies y almacenamiento</h2>
        <p>Solo usamos almacenamiento técnico imprescindible: tu sesión y preferencias como silenciar los sonidos. No usamos cookies de publicidad ni de seguimiento.</p></section>
      <section><h2>9. Cambios</h2>
        <p>Si cambiamos esta política de forma relevante, te lo diremos en la propia plataforma.</p></section>
    </Page>
  )
}

export function Terms() {
  return (
    <Page title="Términos de uso">
      <section><h2>1. El servicio</h2>
        <p>MaestrIA es una plataforma de acceso por invitación para los alumnos del programa. Te ayuda a definir tu cliente ideal, tu oferta y tu landing, y a crear agentes de atención con IA. Los textos y las respuestas los genera una inteligencia artificial: <b>pueden contener errores</b>; revísalos antes de usarlos con clientes.</p></section>
      <section><h2>2. Créditos</h2>
        <p>Cada generación con IA consume créditos, que se indican en cada botón. Si una generación falla, se te devuelven. Los créditos no son canjeables por dinero.</p></section>
      <section><h2>3. WhatsApp (beta)</h2>
        <ul>
          <li>La vinculación por QR <b>no es la vía oficial de Meta</b> y WhatsApp puede limitar o bloquear el número. Úsala con un número dedicado, bajo tu responsabilidad.</li>
          <li>El agente solo responde a quien escribe; no se puede usar para enviar mensajes masivos, publicidad no solicitada ni spam.</li>
          <li>Debes informar a las personas de que hablan con un asistente virtual y de que se guardan sus mensajes, y cumplir la normativa que te aplique (protección de datos, comunicaciones comerciales).</li>
          <li>Puedes desvincular el número cuando quieras; al hacerlo se borran sus conversaciones y citas.</li>
        </ul></section>
      <section><h2>4. Uso aceptable</h2>
        <p>No uses la plataforma para contenido ilegal, engañoso o que suplante a otras personas, ni para intentar acceder a datos de otros alumnos o a sistemas internos (por ejemplo, con direcciones web diseñadas para ello en las demos). Podemos suspender cuentas que incumplan esto.</p></section>
      <section><h2>5. Tu contenido</h2>
        <p>Lo que escribes y lo que genera la IA para tus proyectos es tuyo y puedes usarlo comercialmente. Nos das permiso para tratarlo con el único fin de prestarte el servicio.</p></section>
      <section><h2>6. Sin garantía de resultados</h2>
        <p>Los precios, estimaciones y ejemplos son orientativos. No garantizamos ingresos ni clientes: dependen de tu trabajo y de tu mercado. El servicio se ofrece «tal cual», sin garantía de disponibilidad continua.</p></section>
      <section><h2>7. Responsabilidad</h2>
        <p>En la medida que permita la ley, no respondemos de daños indirectos (como pérdida de clientes o bloqueo de un número de WhatsApp) derivados del uso del servicio.</p></section>
      <section><h2>8. Contacto</h2>
        <p>Dudas sobre estos términos: {LEGAL.email}.</p></section>
    </Page>
  )
}
