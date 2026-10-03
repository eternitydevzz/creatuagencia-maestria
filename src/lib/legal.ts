// Datos del responsable que aparecen en la política de privacidad y en los términos. RELLÉNALOS antes de abrir a alumnos.
// (Mientras tengan corchetes, las páginas avisan de que son un borrador.)
export const LEGAL = {
  company: '[Nombre o razón social del responsable]',
  taxId: '[NIF/CIF]',
  address: '[Dirección postal]',
  email: '[Email de contacto de privacidad]',
  updated: '4 de octubre de 2026',
}

export const legalIsDraft = Object.values(LEGAL).some((v) => v.startsWith('['))
