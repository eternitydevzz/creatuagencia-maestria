import { describe, expect, it } from 'vitest'
import { SECTIONS, isSectionDone, progressOf } from './gamification'
import type { Progress, Roadmap } from './types'

const base: Progress = {
  selected_problems: [], selected_nichos: [], business_metrics: {},
  has_ideal: false, has_offer: false, has_site: false, has_content: false, has_ads: false,
  has_agent: false, has_demo: false, has_whatsapp: false, visited_sections: [],
}

describe('paso "Tus anuncios"', () => {
  it('va justo después de "Tu contenido" y antes del agente', () => {
    const ids = SECTIONS.map((s) => s.id as number)
    expect(ids.indexOf(13)).toBe(ids.indexOf(12) + 1)
    expect(ids.indexOf(7)).toBe(ids.indexOf(13) + 1)
  })

  it('se marca hecho cuando el proyecto tiene anuncios', () => {
    expect(isSectionDone(base, 13)).toBe(false)
    expect(isSectionDone({ ...base, has_ads: true }, 13)).toBe(true)
  })

  it('progressOf detecta los anuncios guardados', () => {
    const rm = { ...base, ideal_client: {}, agency_offer: {}, agency_site: {}, agency_content: {}, agency_ads: { anuncios: [] } } as unknown as Roadmap
    expect(progressOf(rm).has_ads).toBe(true)
    expect(progressOf({ ...rm, agency_ads: {} } as Roadmap).has_ads).toBe(false)
  })
})
