/**
 * Sidebar navigation with expandable groups
 */

export function initSidebarNavigation() {
    const toggleButtons = document.querySelectorAll('.nav-group-toggle');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const groupName = button.dataset.group;
            const submenu = document.querySelector(`[data-submenu="${groupName}"]`);

            if (!submenu) return;

            // Toggle expanded state
            const isExpanded = button.classList.contains('expanded');

            if (isExpanded) {
                collapseGroup(button, submenu);
            } else {
                expandGroup(button, submenu);
            }

            // Save state to localStorage
            saveGroupState(groupName, !isExpanded);
        });
    });

    // Restore saved states
    restoreGroupStates();
}

function expandGroup(button, submenu) {
    button.classList.add('expanded');
    submenu.classList.add('expanded');
    submenu.classList.remove('hidden');
}

function collapseGroup(button, submenu) {
    button.classList.remove('expanded');
    submenu.classList.remove('expanded');

    // Wait for animation before hiding
    setTimeout(() => {
        if (!submenu.classList.contains('expanded')) {
            submenu.classList.add('hidden');
        }
    }, 300);
}

function saveGroupState(groupName, isExpanded) {
    const states = JSON.parse(localStorage.getItem('sidebar-groups') || '{}');
    states[groupName] = isExpanded;
    localStorage.setItem('sidebar-groups', JSON.stringify(states));
}

function restoreGroupStates() {
    const states = JSON.parse(localStorage.getItem('sidebar-groups') || '{}');

    Object.entries(states).forEach(([groupName, isExpanded]) => {
        if (isExpanded) {
            const button = document.querySelector(`[data-group="${groupName}"]`);
            const submenu = document.querySelector(`[data-submenu="${groupName}"]`);

            if (button && submenu) {
                expandGroup(button, submenu);
            }
        }
    });
}

/**
 * Auto-expand group when navigating to a sub-page
 */
export function autoExpandGroup(route) {
    if (route.startsWith('/apoio/')) {
        const button = document.querySelector('[data-group="apoio"]');
        const submenu = document.querySelector('[data-submenu="apoio"]');
        if (button && submenu) {
            expandGroup(button, submenu);
        }
    } else if (route.startsWith('/prompts/')) {
        const button = document.querySelector('[data-group="prompts"]');
        const submenu = document.querySelector('[data-submenu="prompts"]');
        if (button && submenu) {
            expandGroup(button, submenu);
        }
    }
}
