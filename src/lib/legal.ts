// Datos del responsable que aparecen en la política de privacidad y en los términos.
// (Si algún valor vuelve a empezar por «[», las páginas muestran un aviso de borrador.)
export const LEGAL = {
  company: 'TRUDSALES LLC (dba Codigo Maestria)',
  taxId: 'EIN 33-1750081',
  address: '7901 4th St N, Suite 300, St. Petersburg, FL 33702, Estados Unidos',
  email: 'info@codigomaestria.com',
  updated: '4 de octubre de 2026',
}

export const legalIsDraft = Object.values(LEGAL).some((v) => v.startsWith('['))
