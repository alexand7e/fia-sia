/**
 * Teacher Profile UI Component
 * Manages the teacher profile form in the dashboard
 */
import {
    readTeacherProfile,
    saveTeacherProfile,
    updateTeacherProfile,
    isProfileComplete,
    getProfileStats
} from '../utils/teacherProfile.js';

class TeacherProfileUI {
    constructor() {
        this.profile = null;
        this.formContainer = null;
        this.debounceTimer = null;
    }

    /**
     * Initialize the profile UI
     */
    init() {
        this.profile = readTeacherProfile();
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the profile form as a compact checklist
     */
    render() {
        const container = document.getElementById('teacher-profile-container');
        if (!container) {
            console.warn('Teacher profile container not found');
            return;
        }

        this.formContainer = container;

        const isComplete = isProfileComplete();

        container.innerHTML = `
            <div class="quick-checklist">
                <div class="checklist-header">
                    <span class="material-symbols-outlined">verified_user</span>
                    <h3>Checklist Rápido</h3>
                    ${isComplete ? '<span class="checklist-badge complete">✓</span>' : '<span class="checklist-badge">!</span>'}
                </div>
                <p class="checklist-subtitle">Complete para auto-preencher prompts</p>

                <form id="teacher-profile-form" class="checklist-form">
                    <div class="checklist-row">
                        <input 
                            type="text" 
                            id="teacher-name" 
                            name="name"
                            value="${this.profile.name || ''}"
                            placeholder="Seu nome *"
                            class="checklist-input"
                            required
                        />
                    </div>

                    <div class="checklist-row-group">
                        <input 
                            type="text" 
                            id="teacher-school" 
                            name="school"
                            value="${this.profile.school || ''}"
                            placeholder="Escola"
                            class="checklist-input small"
                        />
                        <select id="teacher-level" name="teachingLevel" class="checklist-input small">
                            <option value="Fundamental I" ${this.profile.teachingLevel === 'Fundamental I' ? 'selected' : ''}>Fund. I</option>
                            <option value="Fundamental II" ${this.profile.teachingLevel === 'Fundamental II' ? 'selected' : ''}>Fund. II</option>
                            <option value="Ensino Médio" ${this.profile.teachingLevel === 'Ensino Médio' ? 'selected' : ''}>E. Médio</option>
                        </select>
                    </div>

                    <div class="checklist-tags-section">
                        <label class="checklist-label">Disciplinas *</label>
                        <div class="checklist-tags-container">
                            <div class="checklist-tags" id="subjects-tags">
                                ${this.renderTagsCompact(this.profile.subjects, 'subject')}
                            </div>
                            <input 
                                type="text" 
                                id="teacher-subjects-input" 
                                placeholder="+ Adicionar"
                                class="checklist-tags-input"
                                list="subjects-suggestions"
                            />
                            <datalist id="subjects-suggestions">
                                <option value="Matemática">
                                <option value="Português">
                                <option value="Biologia">
                                <option value="Química">
                                <option value="Física">
                                <option value="História">
                                <option value="Geografia">
                            </datalist>
                        </div>
                    </div>

                    <div class="checklist-tags-section">
                        <label class="checklist-label">Turmas/Anos *</label>
                        <div class="checklist-tags-container">
                            <div class="checklist-tags" id="classes-tags">
                                ${this.renderTagsCompact(this.profile.classes, 'class')}
                            </div>
                            <input 
                                type="text" 
                                id="teacher-classes-input" 
                                placeholder="+ Adicionar"
                                class="checklist-tags-input"
                                list="classes-suggestions"
                            />
                            <datalist id="classes-suggestions">
                                <option value="1º Ano">
                                <option value="2º Ano">
                                <option value="3º Ano">
                                <option value="6º Ano">
                                <option value="7º Ano">
                                <option value="8º Ano">
                                <option value="9º Ano">
                            </datalist>
                        </div>
                    </div>

                    <div class="checklist-save-status" id="profile-save-status">
                        <span class="material-symbols-outlined">check</span>
                        <span>Salvo</span>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Render tags in compact format
     * @param {Array} items - Array of items
     * @param {string} type - 'subject' or 'class'
     * @returns {string} HTML for compact tags
     */
    renderTagsCompact(items, type) {
        if (!items || items.length === 0) {
            return '<span class="checklist-tags-empty">Nenhuma</span>';
        }

        return items.map((item, index) => `
            <span class="checklist-tag" data-type="${type}" data-index="${index}">
                ${item}
                <button type="button" class="checklist-tag-remove" data-type="${type}" data-index="${index}">×</button>
            </span>
        `).join('');
    }


    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const form = document.getElementById('teacher-profile-form');
        if (!form) return;

        // Auto-save on input change
        const inputs = form.querySelectorAll('input:not(.tags-input), select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.debouncedSave());
            input.addEventListener('change', () => this.debouncedSave());
        });

        // Subjects tags input
        const subjectsInput = document.getElementById('teacher-subjects-input');
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
        const classesInput = document.getElementById('teacher-classes-input');
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
            const removeBtn = e.target.closest('.tag-remove');
            if (removeBtn) {
                const type = removeBtn.dataset.type;
                const index = parseInt(removeBtn.dataset.index);
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
     * @param {string} type - 'subject' or 'class'
     * @param {number} index - Index to remove
     */
    removeTag(type, index) {
        const arrayName = type === 'subject' ? 'subjects' : 'classes';
        const currentItems = this.profile[arrayName] || [];
        currentItems.splice(index, 1);
        this.profile[arrayName] = currentItems;
        this.saveProfile();
        this.updateTagsDisplay(arrayName);
    }

    /**
     * Update tags display
     * @param {string} type - 'subjects' or 'classes'
     */
    updateTagsDisplay(type) {
        const tagType = type === 'subjects' ? 'subject' : 'class';
        const container = document.getElementById(`${type}-tags`);
        if (container) {
            container.innerHTML = this.renderTags(this.profile[type], tagType);
        }
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
        const form = document.getElementById('teacher-profile-form');
        if (!form) return;

        const formData = new FormData(form);

        // Update profile object
        this.profile.name = formData.get('name') || '';
        this.profile.school = formData.get('school') || '';
        this.profile.city = formData.get('city') || 'Piauí';
        this.profile.teachingLevel = formData.get('teachingLevel') || 'Ensino Médio';
        this.profile.experience = formData.get('experience') || '';

        // Save to localStorage
        const success = saveTeacherProfile(this.profile);

        if (success) {
            this.showSaveStatus('Salvo automaticamente', 'success');

            // Update header badge if profile became complete
            const headerBadge = this.formContainer.querySelector('.profile-badge');
            if (headerBadge && isProfileComplete()) {
                headerBadge.textContent = '✓ Completo';
                headerBadge.classList.remove('incomplete');
            }
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
        const statusDiv = document.getElementById('profile-save-status');
        if (!statusDiv) return;

        const icon = statusDiv.querySelector('.material-symbols-outlined');
        const text = statusDiv.querySelector('.save-text');

        // Update icon
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning'
        };
        icon.textContent = icons[type] || 'check_circle';

        // Update text
        text.textContent = message;

        // Update class
        statusDiv.className = `save-status ${type}`;

        // Show briefly
        statusDiv.classList.add('visible');
        setTimeout(() => {
            statusDiv.classList.remove('visible');
        }, 2000);
    }
}

// Export singleton instance
export default new TeacherProfileUI();
