/**
 * @param {string} html
 * @returns {HTMLElement}
 */
export function elFromHtml(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  const node = tpl.content.firstElementChild;
  if (!node) throw new Error('HTML vazio');
  return /** @type {HTMLElement} */ (node);
}

/**
 * @param {HTMLElement} root
 * @param {string} selector
 * @returns {HTMLElement}
 */
export function mustGet(root, selector) {
  const el = root.querySelector(selector);
  if (!(el instanceof HTMLElement)) throw new Error(`Elemento não encontrado: ${selector}`);
  return el;
}

export default { elFromHtml, mustGet };
