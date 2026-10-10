// Datos del responsable que aparecen en la política de privacidad y en los términos. Completalos con los de TU empresa.
// (Si algún valor vuelve a empezar por «[», las páginas muestran un aviso de borrador.)
export const LEGAL = {
  company: '[Nombre de tu empresa LLC]',
  taxId: '[EIN o identificación fiscal]',
  address: '[Dirección completa de tu empresa]',
  email: '[email de contacto]',
  updated: '[fecha de la última actualización]',
}

export const legalIsDraft = Object.values(LEGAL).some((v) => v.startsWith('['))
