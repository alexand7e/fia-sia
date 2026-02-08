const STORAGE_KEY = 'fia.settings.v1';

const defaultSettings = {
    notificationsEnabled: true,
    savingMode: 'auto',
    lastSavedAt: null
};

function safeParseJson(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function readSettings() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? safeParseJson(raw) : null;
    const merged = {
        ...defaultSettings,
        ...(parsed && typeof parsed === 'object' ? parsed : {})
    };

    if (merged.savingMode !== 'auto' && merged.savingMode !== 'manual') {
        merged.savingMode = 'auto';
    }

    merged.notificationsEnabled = Boolean(merged.notificationsEnabled);
    return merged;
}

function writeSettings(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function setSaveStatus(status) {
    const el = document.getElementById('settings-save-status');
    if (!el) return;

    const icon = el.querySelector('.material-symbols-outlined');
    const label = el.querySelector('span:last-child');
    if (!icon || !label) return;

    if (status === 'saving') {
        icon.textContent = 'sync';
        label.textContent = 'Salvando…';
        el.className =
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
        return;
    }

    if (status === 'pending') {
        icon.textContent = 'info';
        label.textContent = 'Alterações não salvas';
        el.className =
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40';
        return;
    }

    if (status === 'error') {
        icon.textContent = 'error';
        label.textContent = 'Erro ao salvar';
        el.className =
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200 border border-red-200 dark:border-red-900/40';
        return;
    }

    icon.textContent = 'check_circle';
    label.textContent = 'Alterações salvas';
    el.className =
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function setActiveSection(sectionId) {
    const sections = Array.from(document.querySelectorAll('.settings-section'));
    const navButtons = Array.from(document.querySelectorAll('.settings-nav-btn'));

    sections.forEach((s) => {
        s.classList.toggle('hidden', s.id !== `settings-section-${sectionId}`);
    });

    navButtons.forEach((btn) => {
        const target = btn.getAttribute('data-settings-nav');
        const isActive = target === sectionId;
        btn.classList.toggle('bg-slate-50', isActive);
        btn.classList.toggle('dark:bg-slate-800', isActive);
        btn.classList.toggle('text-slate-900', isActive);
        btn.classList.toggle('dark:text-white', isActive);
    });
}

async function fetchSovereigntyStatus() {
    const response = await fetch('/api/sovereignty/status');
    const json = await response.json();
    if (!response.ok || !json || json.success !== true) {
        const message = json?.error?.message || 'Falha ao consultar status do Soberania.';
        throw new Error(message);
    }
    return json.data;
}

async function toggleSovereignty(enabled) {
    const response = await fetch('/api/sovereignty/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
    });
    const json = await response.json();
    if (!response.ok || !json || json.success !== true) {
        const message = json?.error?.message || 'Falha ao atualizar Soberania.';
        throw new Error(message);
    }
    return json.data;
}

function applySovereigntyUI({ available, enabled, message }) {
    const chip = document.getElementById('sovereignty-status-chip');
    const toggle = document.getElementById('sovereignty-toggle');
    const msg = document.getElementById('sovereignty-message');

    if (chip) {
        if (!available) {
            chip.textContent = 'Indisponível';
            chip.className =
                'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200 border border-red-200 dark:border-red-900/40';
        } else {
            chip.textContent = 'Disponível';
            chip.className =
                'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/40';
        }
    }

    if (toggle) {
        toggle.checked = Boolean(available && enabled);
        toggle.disabled = !available;
    }

    if (msg) {
        if (message && String(message).trim().length) {
            msg.textContent = String(message).trim();
        } else {
            msg.textContent = available ? '' : 'Recurso indisponível no backend.';
        }
    }
}

export function initSettingsPage() {
    const navButtons = Array.from(document.querySelectorAll('.settings-nav-btn'));
    navButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-settings-nav');
            if (target) setActiveSection(target);
        });
    });

    setActiveSection('notifications');

    const notificationsToggle = document.getElementById('settings-notifications');
    const savingRadios = Array.from(document.querySelectorAll('input[name="saving-mode"]'));
    const manualActions = document.getElementById('settings-manual-actions');
    const saveNowBtn = document.getElementById('settings-save-now');
    const lastSavedEl = document.getElementById('settings-last-saved');
    const resetBtn = document.getElementById('settings-reset');

    let state = readSettings();

    const render = () => {
        if (notificationsToggle) notificationsToggle.checked = Boolean(state.notificationsEnabled);
        savingRadios.forEach((r) => {
            r.checked = r.value === state.savingMode;
        });

        if (manualActions) {
            manualActions.classList.toggle('hidden', state.savingMode !== 'manual');
        }

        if (lastSavedEl) {
            const formatted = formatDateTime(state.lastSavedAt);
            lastSavedEl.textContent = formatted ? `Último salvamento: ${formatted}` : '';
        }
    };

    const persist = (updateTimestamp) => {
        try {
            setSaveStatus('saving');
            const next = {
                ...state,
                lastSavedAt: updateTimestamp ? new Date().toISOString() : state.lastSavedAt
            };
            writeSettings(next);
            state = next;
            render();
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        }
    };

    const persistAuto = () => {
        if (state.savingMode !== 'auto') return;
        persist(true);
    };

    if (notificationsToggle) {
        notificationsToggle.addEventListener('change', () => {
            state = { ...state, notificationsEnabled: notificationsToggle.checked };
            persistAuto();
            if (state.savingMode !== 'auto') setSaveStatus('pending');
            render();
        });
    }

    savingRadios.forEach((r) => {
        r.addEventListener('change', () => {
            if (!r.checked) return;
            state = { ...state, savingMode: r.value };
            persist(false);
            render();
        });
    });

    if (saveNowBtn) {
        saveNowBtn.addEventListener('click', () => persist(true));
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            state = { ...defaultSettings };
            writeSettings(state);
            render();
            setSaveStatus('saved');
        });
    }

    render();

    const sovereigntyToggle = document.getElementById('sovereignty-toggle');
    let sovereigntyBusy = false;

    fetchSovereigntyStatus()
        .then((data) => applySovereigntyUI(data))
        .catch((err) =>
            applySovereigntyUI({
                available: false,
                enabled: false,
                message: err?.message || 'Falha ao consultar status do Soberania.'
            })
        );

    if (sovereigntyToggle) {
        sovereigntyToggle.addEventListener('change', async () => {
            if (sovereigntyBusy) return;
            sovereigntyBusy = true;

            const nextEnabled = sovereigntyToggle.checked;
            sovereigntyToggle.disabled = true;

            try {
                await toggleSovereignty(nextEnabled);
                const status = await fetchSovereigntyStatus();
                applySovereigntyUI(status);
            } catch (err) {
                const status = await fetchSovereigntyStatus().catch(() => ({
                    available: true,
                    enabled: !nextEnabled,
                    message: err?.message || 'Falha ao atualizar Soberania.'
                }));
                applySovereigntyUI({
                    ...status,
                    message: err?.message || status.message
                });
            } finally {
                sovereigntyBusy = false;
                const status = await fetchSovereigntyStatus().catch(() => null);
                if (status) applySovereigntyUI(status);
            }
        });
    }
}
