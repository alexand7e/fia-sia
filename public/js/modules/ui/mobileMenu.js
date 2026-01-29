export function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', openMobileMenu);
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
}

function openMobileMenu() {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileSidebar) {
        mobileSidebar.classList.remove('hidden');
        mobileSidebar.classList.add('open');
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('hidden');
        sidebarOverlay.classList.add('show');
    }
}

export function closeMobileMenu() {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (mobileSidebar) {
        mobileSidebar.classList.remove('open');
        setTimeout(() => {
            mobileSidebar.classList.add('hidden');
        }, 300);
    }

    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('show');
        sidebarOverlay.classList.add('hidden');
    }
}
