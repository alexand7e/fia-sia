export async function mountSidebar(containerId = 'sidebar') {
    const sidebar = document.getElementById(containerId);
    if (!sidebar) return null;

    const response = await fetch('components/sidebar.html');
    if (!response.ok) {
        throw new Error('Falha ao carregar sidebar.');
    }
    const html = await response.text();
    sidebar.className = 'hidden md:flex w-72 flex-col bg-sidebar-light dark:bg-sidebar-dark border-r border-slate-200 dark:border-slate-800 h-full flex-shrink-0 z-20 shadow-sm';
    sidebar.innerHTML = html;

    initSidebarToggle(sidebar);
    return sidebar;
}

export function initSidebarToggle(sidebar) {
    if (!sidebar) return;
    const toggleButton = sidebar.querySelector('#sidebar-toggle');
    const toggleIcon = sidebar.querySelector('#sidebar-toggle-icon');
    const storageKey = 'sia:sidebar:collapsed';
    const stored = localStorage.getItem(storageKey);
    const initialCollapsed = stored === '1';

    const setCollapsed = (collapsed) => {
        sidebar.classList.toggle('is-collapsed', collapsed);
        if (toggleIcon) {
            toggleIcon.textContent = collapsed ? 'chevron_right' : 'chevron_left';
        }
        localStorage.setItem(storageKey, collapsed ? '1' : '0');
    };

    setCollapsed(initialCollapsed);

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const collapsed = sidebar.classList.contains('is-collapsed');
            setCollapsed(!collapsed);
        });
    }
}
