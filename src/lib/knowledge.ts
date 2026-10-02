import { describeProblem, problemLabel } from '@shared/catalog'
import { treeToText } from './tree'
import type { Roadmap } from './types'

/** Reúne en un solo documento todo el trabajo del alumno: problemas, nicho, cliente ideal y oferta (la landing se descarga aparte). */
export function buildKnowledgeBase(r: Roadmap): string {
  const parts: string[] = [`# ${r.agency_name || r.project_name}`, '']
  if (r.selected_problems.length) parts.push('## Problemas que resuelves', ...r.selected_problems.map((id) => `- **${problemLabel(id, r.custom_problem_descriptions)}** — ${describeProblem(id, r.custom_problem_descriptions)}`), '')
  if (r.selected_nichos.length) parts.push('## Nicho', r.selected_nichos.join(', '), '')
  if (Object.keys(r.ideal_client ?? {}).length) parts.push('## Cliente ideal', treeToText(r.ideal_client), '')
  if (Object.keys(r.agency_offer ?? {}).length) parts.push('## Oferta', treeToText(r.agency_offer), '')
  return parts.join('\n')
}
