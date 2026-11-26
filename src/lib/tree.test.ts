import { describe, expect, it } from 'vitest'
import { stripItemNumber } from './tree'

describe('stripItemNumber', () => {
  it('quita el "Reel N -" que a veces pone la IA al principio del título', () => {
    expect(stripItemNumber('Reel 1 - El coste de no contestar')).toBe('El coste de no contestar')
    expect(stripItemNumber('Reel 3: Tu agenda')).toBe('Tu agenda')
    expect(stripItemNumber('reel 2 — Mito')).toBe('Mito')
    expect(stripItemNumber('REEL 4. Caso real')).toBe('Caso real')
  })

  it('también quita "Vídeo N -", "Video N", "Anuncio N" y "Carrusel N"', () => {
    expect(stripItemNumber('Vídeo 1 - El paciente de las 11:00')).toBe('El paciente de las 11:00')
    expect(stripItemNumber('Video 2: Lo que pierdes')).toBe('Lo que pierdes')
    expect(stripItemNumber('Anuncio 3 · Oferta piloto')).toBe('Oferta piloto')
    expect(stripItemNumber('Carrusel 1 - Errores')).toBe('Errores')
  })

  it('deja igual los títulos sin número', () => {
    expect(stripItemNumber('El coste de no contestar')).toBe('El coste de no contestar')
    expect(stripItemNumber('Reels que venden')).toBe('Reels que venden')
    expect(stripItemNumber('Vídeos cortos: cómo empezar')).toBe('Vídeos cortos: cómo empezar')
  })

  it('si el título es solo "Reel 1", no lo deja vacío', () => {
    expect(stripItemNumber('Reel 1')).toBe('Reel 1')
  })
})
