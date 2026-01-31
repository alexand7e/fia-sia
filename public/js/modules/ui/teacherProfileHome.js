/**
 * Teacher Profile Form - Home Page
 * Manages teacher profile form in home.html checklist
 */
import {
    readTeacherProfile,
    saveTeacherProfile,
    isProfileComplete
} from '../utils/teacherProfile.js';

class TeacherProfileFormHome {
    constructor() {
        this.profile = null;
        this.debounceTimer = null;
    }

    /**
     * Initialize the form
     */
    init() {
        this.profile = readTeacherProfile();
        this.loadProfile();
        this.setupEventListeners();
    }

    /**
     * Load profile data into form
     */
    loadProfile() {
        // Load basic fields
        const nameInput = document.getElementById('teacher-name-home');
        const schoolInput = document.getElementById('teacher-school-home');
        const levelSelect = document.getElementById('teacher-level-home');

        if (nameInput) nameInput.value = this.profile.name || '';
        if (schoolInput) schoolInput.value = this.profile.school || '';
        if (levelSelect) levelSelect.value = this.profile.teachingLevel || 'Ensino Médio';

        // Load tags
        this.updateTagsDisplay('subjects');
        this.updateTagsDisplay('classes');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = document.getElementById('teacher-profile-form-home');
        if (!form) return;

        // Auto-save on input change
        const inputs = form.querySelectorAll('input:not([id*="tags-input"]), select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debouncedSave());
            input.addEventListener('change', () => this.debouncedSave());
        });

        // Subjects tags input
        const subjectsInput = document.getElementById('teacher-subjects-input-home');
        if (subjectsInput) {
            subjectsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTag('subjects', subjectsInput.value.trim());
                    subjectsInput.value = '';
                }
            });
        }

        // Classes tags input
        const classesInput = document.getElementById('teacher-classes-input-home');
        if (classesInput) {
            classesInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTag('classes', classesInput.value.trim());
                    classesInput.value = '';
                }
            });
        }

        // Tag removal (event delegation)
        form.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove-btn')) {
                const type = e.target.dataset.type;
                const index = parseInt(e.target.dataset.index);
                this.removeTag(type, index);
            }
        });
    }

    /**
     * Add a tag (subject or class)
     * @param {string} type - 'subjects' or 'classes'
     * @param {string} value - Value to add
     */
    addTag(type, value) {
        if (!value) return;

        const currentItems = this.profile[type] || [];

        // Avoid duplicates
        if (currentItems.includes(value)) {
            this.showSaveStatus('Já adicionado', 'warning');
            return;
        }

        currentItems.push(value);
        this.profile[type] = currentItems;
        this.saveProfile();
        this.updateTagsDisplay(type);
    }

    /**
     * Remove a tag
     * @param {string} type - 'subjects' or 'classes'
     * @param {number} index - Index to remove
     */
    removeTag(type, index) {
        const currentItems = this.profile[type] || [];
        currentItems.splice(index, 1);
        this.profile[type] = currentItems;
        this.saveProfile();
        this.updateTagsDisplay(type);
    }

    /**
     * Update tags display
     * @param {string} type - 'subjects' or 'classes'
     */
    updateTagsDisplay(type) {
        const container = document.getElementById(`${type}-tags-home`);
        if (!container) return;

        const items = this.profile[type] || [];

        if (items.length === 0) {
            container.innerHTML = '<span class="text-sm text-slate-400 italic">Nenhuma adicionada</span>';
            return;
        }

        container.innerHTML = items.map((item, index) => `
            <span class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                ${item}
                <button 
                    type="button" 
                    class="tag-remove-btn text-indigo-600 dark:text-indigo-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    data-type="${type}"
                    data-index="${index}"
                    aria-label="Remover ${item}"
                >
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            </span>
        `).join('');
    }

    /**
     * Debounced save
     */
    debouncedSave() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.saveProfile();
        }, 500);
    }

    /**
     * Save profile from form
     */
    saveProfile() {
        const form = document.getElementById('teacher-profile-form-home');
        if (!form) return;

        const formData = new FormData(form);

        // Update profile object
        this.profile.name = formData.get('name') || '';
        this.profile.school = formData.get('school') || '';
        this.profile.teachingLevel = formData.get('teachingLevel') || 'Ensino Médio';

        // Save to localStorage
        const success = saveTeacherProfile(this.profile);

        if (success) {
            this.showSaveStatus('Salvo automaticamente', 'success');
        } else {
            this.showSaveStatus('Erro ao salvar', 'error');
        }
    }

    /**
     * Show save status message
     * @param {string} message - Message to show
     * @param {string} type - 'success', 'error', 'warning'
     */
    showSaveStatus(message, type = 'success') {
        const statusDiv = document.getElementById('profile-save-status-home');
        if (!statusDiv) return;

        const icon = statusDiv.querySelector('.material-symbols-outlined');
        const text = statusDiv.querySelector('span:last-child');

        // Update icon
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning'
        };
        icon.textContent = icons[type] || 'check_circle';

        // Update text
        if (text) text.textContent = message;

        // Update classes
        statusDiv.className = 'mt-4 p-3 rounded-lg border flex items-center gap-2';

        if (type === 'success') {
            statusDiv.classList.add('bg-green-50', 'dark:bg-green-900/20', 'border-green-200', 'dark:border-green-800');
            if (icon) icon.classList.add('text-green-600', 'dark:text-green-400');
            if (text) text.classList.add('text-sm', 'text-green-700', 'dark:text-green-300');
        } else if (type === 'error') {
            statusDiv.classList.add('bg-red-50', 'dark:bg-red-900/20', 'border-red-200', 'dark:border-red-800');
            if (icon) icon.classList.add('text-red-600', 'dark:text-red-400');
            if (text) text.classList.add('text-sm', 'text-red-700', 'dark:text-red-300');
        } else {
            statusDiv.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20', 'border-yellow-200', 'dark:border-yellow-800');
            if (icon) icon.classList.add('text-yellow-600', 'dark:text-yellow-400');
            if (text) text.classList.add('text-sm', 'text-yellow-700', 'dark:text-yellow-300');
        }

        // Show briefly
        statusDiv.classList.remove('hidden');
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 2000);
    }
}

// Export singleton instance
export default new TeacherProfileFormHome();
