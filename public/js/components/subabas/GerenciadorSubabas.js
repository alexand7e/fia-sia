/**
 * @typedef {Object} SubabaDefinition
 * @property {string} id
 * @property {string} title
 * @property {string} icon
 * @property {(ctx: any) => {render:(container:HTMLElement)=>void, destroy?:()=>void}} create
 *
 * @typedef {Object} GerenciadorOptions
 * @property {HTMLElement} navEl
 * @property {HTMLElement} panelEl
 * @property {SubabaDefinition[]} subabas
 * @property {string} initialId
 * @property {any} context
 */

/**
 * @param {GerenciadorOptions} options
 * @returns {{setActive:(id:string)=>void, getActive:()=>string}}
 */
export function createGerenciadorSubabas(options) {
  const { navEl, panelEl, subabas, initialId, context } = options;
  /** @type {string} */
  let activeId = initialId;
  /** @type {{id:string, instance:any}|null} */
  let activeInstance = null;

  navEl.innerHTML = '';
  panelEl.innerHTML = '';

  const tabOrder = subabas.map(s => s.id);

  subabas.forEach((subaba) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-full text-left px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';
    btn.dataset.subabaId = subaba.id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
    btn.innerHTML = `<span class="material-symbols-outlined align-middle mr-2">${subaba.icon}</span>${subaba.title}`;
    btn.addEventListener('click', () => setActive(subaba.id));
    btn.addEventListener('keydown', (e) => handleKeydown(e, subaba.id));
    navEl.appendChild(btn);
  });

  function handleKeydown(e, currentId) {
    const idx = tabOrder.indexOf(currentId);
    if (idx === -1) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      focusTab(tabOrder[(idx + 1) % tabOrder.length]);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      focusTab(tabOrder[(idx - 1 + tabOrder.length) % tabOrder.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusTab(tabOrder[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusTab(tabOrder[tabOrder.length - 1]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActive(currentId);
    }
  }

  function focusTab(id) {
    const btn = navEl.querySelector(`[data-subaba-id="${id}"]`);
    if (btn instanceof HTMLElement) btn.focus();
  }

  function updateTabState() {
    navEl.querySelectorAll('[role="tab"]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const isActive = el.dataset.subabaId === activeId;
      el.setAttribute('aria-selected', isActive ? 'true' : 'false');
      el.setAttribute('tabindex', isActive ? '0' : '-1');
      el.classList.toggle('active', isActive);
    });
  }

  function mountSubaba(id) {
    const def = subabas.find(s => s.id === id);
    if (!def) return;
    panelEl.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'subabas-panel is-entering';
    container.setAttribute('role', 'tabpanel');
    container.setAttribute('aria-label', def.title);
    panelEl.appendChild(container);
    const instance = def.create(context);
    instance.render(container);
    activeInstance = { id, instance };
    requestAnimationFrame(() => {
      container.classList.remove('is-entering');
    });
  }

  function unmountActive() {
    if (!activeInstance) return;
    if (typeof activeInstance.instance?.destroy === 'function') {
      activeInstance.instance.destroy();
    }
    activeInstance = null;
  }

  function setActive(id) {
    if (id === activeId) return;
    const currentPanel = panelEl.firstElementChild;
    activeId = id;
    updateTabState();

    if (currentPanel instanceof HTMLElement) {
      currentPanel.classList.add('is-leaving');
      window.setTimeout(() => {
        unmountActive();
        mountSubaba(id);
      }, 220);
    } else {
      unmountActive();
      mountSubaba(id);
    }
  }

  function getActive() {
    return activeId;
  }

  updateTabState();
  mountSubaba(activeId);
  updateTabState();
  focusTab(activeId);

  return { setActive, getActive };
}

export default { createGerenciadorSubabas };
