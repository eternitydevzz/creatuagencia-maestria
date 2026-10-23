// Una respuesta de la secretaria virtual: la usan el simulador del panel (agent-chat) y WhatsApp real (wa-webhook).
import Anthropic from 'npm:@anthropic-ai/sdk'
import { buildAgentPrompt, dateContext, extractBooking, type AgentConfig, type Booking, type Turn } from './agent.ts'

export const AGENT_MODEL = Deno.env.get('AGENT_MODEL') ?? 'claude-haiku-4-5-20251001'
export type { Turn }

/** Red de seguridad para WhatsApp: **negrita** de markdown pasa a *negrita* de WhatsApp y se quitan títulos con #. */
export function stripMarkdown(t: string): string {
  return t.replace(/\*\*([^*\n]+)\*\*/g, '*$1*').replace(/\*\*/g, '').replace(/^#{1,6}\s+/gm, '').replace(/__([^_\n]+)__/g, '$1')
}

export async function agentReply(anthropic: Anthropic, config: AgentConfig, turns: Turn[], timeoutMs = 30_000): Promise<{ text: string; booking: Booking | null }> {
  const system = buildAgentPrompt(config, dateContext(new Date()), true)
  const msg = await anthropic.messages.create({ model: AGENT_MODEL, max_tokens: 450, system, messages: turns }, { signal: AbortSignal.timeout(timeoutMs) })
  const reply = (msg.content as Array<{ type: string; text?: string }>).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('').trim()
  const { text, booking } = extractBooking(reply)
  return { text: stripMarkdown(text) || (booking ? 'Listo, le paso tu pedido al equipo y te confirman el turno por acá.' : ''), booking }
}
