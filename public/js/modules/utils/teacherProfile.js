/**
 * Teacher Profile Management
 * Stores and manages teacher contextual information for auto-populating prompts
 */

const TEACHER_PROFILE_KEY = 'sia:teacher-profile:v1';

/**
 * Teacher profile data structure
 */
const DEFAULT_PROFILE = {
    name: '',
    school: '',
    city: 'Piauí',
    subjects: [], // Array of strings: ['Matemática', 'Física']
    classes: [], // Array of strings: ['1º Ano', '2º Ano']
    experience: '', // 'menos de 1 ano', '1-5 anos', '5-10 anos', 'mais de 10 anos'
    teachingLevel: 'Ensino Médio', // 'Fundamental I', 'Fundamental II', 'Ensino Médio'
    createdAt: null,
    updatedAt: null
};

/**
 * Read teacher profile from localStorage
 * @returns {object} Teacher profile
 */
export function readTeacherProfile() {
    try {
        const stored = localStorage.getItem(TEACHER_PROFILE_KEY);
        if (!stored) {
            return { ...DEFAULT_PROFILE };
        }

        const profile = JSON.parse(stored);
        return { ...DEFAULT_PROFILE, ...profile };
    } catch (error) {
        console.error('Error reading teacher profile:', error);
        return { ...DEFAULT_PROFILE };
    }
}

/**
 * Save teacher profile to localStorage
 * @param {object} profile - Profile data to save
 * @returns {boolean} Success status
 */
export function saveTeacherProfile(profile) {
    try {
        const now = new Date().toISOString();
        const profileToSave = {
            ...profile,
            updatedAt: now,
            createdAt: profile.createdAt || now
        };

        localStorage.setItem(TEACHER_PROFILE_KEY, JSON.stringify(profileToSave));
        return true;
    } catch (error) {
        console.error('Error saving teacher profile:', error);
        return false;
    }
}

/**
 * Update specific fields in the profile
 * @param {object} updates - Fields to update
 * @returns {object} Updated profile
 */
export function updateTeacherProfile(updates) {
    const currentProfile = readTeacherProfile();
    const updatedProfile = { ...currentProfile, ...updates };
    saveTeacherProfile(updatedProfile);
    return updatedProfile;
}

/**
 * Check if profile is complete (has minimum required fields)
 * @returns {boolean} True if profile has basic info
 */
export function isProfileComplete() {
    const profile = readTeacherProfile();
    return !!(
        profile.name &&
        profile.subjects.length > 0 &&
        profile.classes.length > 0
    );
}

/**
 * Get contextual data for auto-filling prompts
 * @returns {object} Contextual data
 */
export function getContextualData() {
    const profile = readTeacherProfile();
    return {
        disciplina: profile.subjects[0] || '', // First subject as default
        disciplinas: profile.subjects,
        ano: profile.classes[0] || '', // First class as default
        turmas: profile.classes,
        escola: profile.school,
        cidade: profile.city,
        nivel: profile.teachingLevel,
        professorNome: profile.name
    };
}

/**
 * Reset profile (for testing or clearing data)
 */
export function resetTeacherProfile() {
    localStorage.removeItem(TEACHER_PROFILE_KEY);
}

/**
 * Get profile statistics
 * @returns {object} Profile stats
 */
export function getProfileStats() {
    const profile = readTeacherProfile();
    return {
        hasProfile: isProfileComplete(),
        subjectsCount: profile.subjects.length,
        classesCount: profile.classes.length,
        lastUpdated: profile.updatedAt
    };
}
