// Qué HTML enseña y descarga el paso de la landing, según cómo se guardó:
//  - premium (plantilla de Jose, lleva JavaScript) → lib/premiumSite/render.ts
//  - página propia ya hecha (`html`, modo directo antiguo) → tal cual, con su JavaScript
//  - formato de siempre (proyectos guardados antes de la plantilla premium) → lib/agencySite.ts, sin JavaScript
import { renderAgencySite } from './agencySite'
import { renderPremiumSite } from './premiumSite/render'
import type { AgencyContact, AgencySite, PremiumSite } from './types'

export const isPremium = (site: unknown): site is PremiumSite =>
  !!site && typeof site === 'object' && (site as { plantilla?: unknown }).plantilla === 'premium'

/** HTML de la landing y si necesita JavaScript (el iframe de la vista previa lo permite solo entonces). */
export function siteHtml(site: AgencySite | PremiumSite, contact: AgencyContact, agency: string): { html: string; scripts: boolean } {
  if (isPremium(site)) return { html: renderPremiumSite(site, contact, agency), scripts: true }
  const custom = typeof site.html === 'string' && site.html.trim() ? site.html : null
  if (custom) return { html: custom, scripts: true }
  return { html: renderAgencySite(site, contact, agency), scripts: false }
}
