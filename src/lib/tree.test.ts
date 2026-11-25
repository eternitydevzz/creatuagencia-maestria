import { describe, expect, it } from 'vitest'
import { stripReelNumber } from './tree'

describe('stripReelNumber', () => {
  it('quita el "Reel N -" que a veces pone la IA al principio del título', () => {
    expect(stripReelNumber('Reel 1 - El coste de no contestar')).toBe('El coste de no contestar')
    expect(stripReelNumber('Reel 3: Tu agenda')).toBe('Tu agenda')
    expect(stripReelNumber('reel 2 — Mito')).toBe('Mito')
    expect(stripReelNumber('REEL 4. Caso real')).toBe('Caso real')
  })

  it('deja igual los títulos sin número', () => {
    expect(stripReelNumber('El coste de no contestar')).toBe('El coste de no contestar')
    expect(stripReelNumber('Reels que venden')).toBe('Reels que venden')
  })

  it('si el título es solo "Reel 1", no lo deja vacío', () => {
    expect(stripReelNumber('Reel 1')).toBe('Reel 1')
  })
})
