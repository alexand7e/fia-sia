/**
 * @typedef {{ok:true,value:any}|{ok:false,errors:string[]}} ValidationResult
 */

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
export function isObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {ValidationResult}
 */
export function validateContexto(value) {
  const errors = [];
  if (!isObject(value)) return { ok: false, errors: ['contexto deve ser um objeto'] };

  if (value.materias != null && typeof value.materias !== 'string') errors.push('materias deve ser string');
  if (value.serie != null && typeof value.serie !== 'string') errors.push('serie deve ser string');
  if (value.cargaSemanal != null && typeof value.cargaSemanal !== 'number') errors.push('cargaSemanal deve ser number');
  if (value.prioridades != null && typeof value.prioridades !== 'string') errors.push('prioridades deve ser string');

  return errors.length ? { ok: false, errors } : { ok: true, value };
}

/**
 * @param {unknown} value
 * @returns {ValidationResult}
 */
export function validateCalendario(value) {
  const errors = [];
  if (!isObject(value)) return { ok: false, errors: ['calendario deve ser um objeto'] };
  if (value.inicio != null && typeof value.inicio !== 'string') errors.push('inicio deve ser string');
  if (value.fim != null && typeof value.fim !== 'string') errors.push('fim deve ser string');
  if (value.eventos != null && !Array.isArray(value.eventos)) errors.push('eventos deve ser array');
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

/**
 * @param {unknown} value
 * @returns {ValidationResult}
 */
export function validateGeneric(value) {
  if (!isObject(value) && !Array.isArray(value)) {
    return { ok: false, errors: ['resposta deve ser objeto ou array'] };
  }
  return { ok: true, value };
}
