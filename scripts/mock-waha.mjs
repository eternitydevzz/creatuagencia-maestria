// Servidor simulado de WAHA (WhatsApp HTTP API) SOLO para pruebas locales: sesiones, QR, envío de mensajes registrado.
//   node scripts/mock-waha.mjs        (puerto 3100)
// Control para los tests: POST /__status?session=X&status=WORKING · GET /__sent · POST /__reset · POST /__sendfail?n=1
import http from 'node:http'

const PORT = Number(process.env.PORT ?? 3100)
const KEY = process.env.MOCK_WAHA_KEY ?? 'test-key'
const sessions = new Map()   // name -> { status, config }
let sent = []
let sendFail = 0
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }).end(body === undefined ? '' : JSON.stringify(body)) }

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    let body = {}; try { body = raw ? JSON.parse(raw) : {} } catch { /* vacío */ }
    const p = url.pathname

    // ---- control de tests (sin clave)
    if (p === '/__status') { const s = sessions.get(url.searchParams.get('session')); if (s) s.status = url.searchParams.get('status'); return send(res, 200, { ok: !!s }) }
    if (p === '/__sent') return send(res, 200, sent)
    if (p === '/__reset') { sent = []; sendFail = 0; return send(res, 200, { ok: true }) }
    if (p === '/__sendfail') { sendFail = Number(url.searchParams.get('n') ?? 1); return send(res, 200, { ok: true }) }

    if (req.headers['x-api-key'] !== KEY) return send(res, 401, { message: 'Unauthorized' })

    if (p === '/api/sessions' && req.method === 'POST') {
      if (sessions.has(body.name)) return send(res, 422, { message: 'Session already exists' })
      sessions.set(body.name, { status: 'SCAN_QR_CODE', config: body.config })
      return send(res, 201, { name: body.name, status: 'STARTING' })
    }
    let m = p.match(/^\/api\/sessions\/([^/]+)$/)
    if (m && req.method === 'GET') {
      const s = sessions.get(m[1]); if (!s) return send(res, 404, { message: 'Session not found' })
      return send(res, 200, { name: m[1], status: s.status, me: s.status === 'WORKING' ? { id: '34600111222@c.us', pushName: 'Prueba' } : null, config: s.config })
    }
    if (m && req.method === 'DELETE') { sessions.delete(m[1]); return send(res, 200, {}) }
    m = p.match(/^\/api\/sessions\/([^/]+)\/(start|stop|logout|restart)$/)
    if (m) { const s = sessions.get(m[1]); if (!s) return send(res, 404, {}); if (m[2] === 'start' || m[2] === 'restart') s.status = 'SCAN_QR_CODE'; return send(res, 201, {}) }
    m = p.match(/^\/api\/([^/]+)\/auth\/qr$/)
    if (m) { const s = sessions.get(m[1]); if (!s || s.status !== 'SCAN_QR_CODE') return send(res, 422, { message: 'Not in SCAN_QR_CODE' }); return send(res, 200, { mimetype: 'image/png', data: PNG }) }
    if (p === '/api/sendText') {
      if (sendFail > 0) { sendFail--; return send(res, 500, { message: 'fail' }) }
      sent.push({ session: body.session, chatId: body.chatId, text: body.text }); return send(res, 201, { id: 'mock' })
    }
    if (['/api/startTyping', '/api/stopTyping', '/api/sendSeen'].includes(p)) return send(res, 201, {})
    send(res, 404, { message: 'not found' })
  })
}).listen(PORT, '0.0.0.0', () => console.log(`mock waha en :${PORT}`))
