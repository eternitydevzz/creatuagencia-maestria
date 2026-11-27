import { describe, expect, it } from 'vitest'
import { PHASES, SECTIONS, isSectionDone, phaseOf, phaseProgress, progressOf } from './gamification'
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

describe('fases del mapa de ruta', () => {
  it('las 4 fases cubren los 13 pasos una sola vez y en el orden del mapa', () => {
    expect(PHASES.flatMap((f) => f.steps)).toEqual(SECTIONS.map((s) => s.id))
  })

  it('agrupan los pasos como en el diseño', () => {
    expect(PHASES.map((f) => [f.id, f.steps])).toEqual([
      ['estrategia', [1, 11, 2, 3]], ['oferta', [4, 5]], ['captacion', [6, 12, 13]], ['agente', [7, 8, 9, 10]],
    ])
  })

  it('phaseOf dice a qué fase pertenece un paso', () => {
    expect(phaseOf(12).id).toBe('captacion')
    expect(phaseOf(1).id).toBe('estrategia')
    expect(phaseOf(10).id).toBe('agente')
  })

  it('phaseProgress cuenta los pasos hechos de la fase', () => {
    const p = { ...base, has_ideal: true }
    expect(phaseProgress(p, PHASES[1])).toEqual({ done: 1, total: 2 })
    expect(phaseProgress({ ...p, has_offer: true }, PHASES[1])).toEqual({ done: 2, total: 2 })
  })
})
