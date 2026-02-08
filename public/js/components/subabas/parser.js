/**
 * @typedef {{success:true,data:any}|{success:false,error:Error}} ParseResult
 */

/**
 * @param {string} text
 * @returns {ParseResult}
 */
export function extractJson(text) {
  if (typeof text !== 'string') {
    return { success: false, error: new Error('Resposta não é string') };
  }

  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: new Error('Resposta vazia') };

  try {
    return { success: true, data: JSON.parse(trimmed) };
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) {
    try {
      return { success: true, data: JSON.parse(fenced[1].trim()) };
    } catch {}
  }

  const firstObj = findFirstJsonBlock(trimmed);
  if (firstObj) {
    try {
      return { success: true, data: JSON.parse(firstObj) };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e : new Error('Falha ao parsear JSON') };
    }
  }

  return { success: false, error: new Error('Não foi possível extrair JSON da resposta') };
}

/**
 * @param {string} input
 * @returns {string|null}
 */
export function findFirstJsonBlock(input) {
  const startObj = input.indexOf('{');
  const startArr = input.indexOf('[');
  let start = -1;
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);

  if (start === -1) return null;

  const open = input[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === open) depth++;
    if (ch === close) depth--;

    if (depth === 0) {
      return input.slice(start, i + 1);
    }
  }

  return null;
}
