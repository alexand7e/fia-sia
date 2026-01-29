/**
 * Simple hash-based router for client-side navigation
 * Supports routes like #/dashboard, #/prompts, etc.
 */

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeRouteChange = null;
        this.afterRouteChange = null;

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRouteChange());
        window.addEventListener('load', () => this.handleRouteChange());
    }

    /**
     * Define a route and its handler
     * @param {string} path - Route path (e.g., '/dashboard')
     * @param {Function} handler - Function to execute when route is accessed
     */
    defineRoute(path, handler) {
        this.routes.set(path, handler);
    }

    /**
     * Navigate to a specific route
     * @param {string} path - Route path to navigate to
     */
    navigateTo(path) {
        window.location.hash = `#${path}`;
    }

    /**
     * Get current route path
     * @returns {string} Current route path
     */
    getCurrentRoute() {
        const hash = window.location.hash.slice(1); // Remove #
        return hash || '/dashboard'; // Default to dashboard
    }

    /**
     * Handle route changes
     */
    handleRouteChange() {
        const path = this.getCurrentRoute();

        // Execute before hook if defined
        if (this.beforeRouteChange) {
            this.beforeRouteChange(this.currentRoute, path);
        }

        // Find and execute route handler
        const handler = this.routes.get(path);

        if (handler) {
            handler(path);
            this.currentRoute = path;
        } else {
            // Route not found - redirect to dashboard
            console.warn(`Route not found: ${path}, redirecting to /dashboard`);
            this.navigateTo('/dashboard');
            return;
        }

        // Execute after hook if defined
        if (this.afterRouteChange) {
            this.afterRouteChange(path);
        }
    }

    /**
     * Set hook to run before route changes
     * @param {Function} callback - Function to execute before route change
     */
    setBeforeRouteChange(callback) {
        this.beforeRouteChange = callback;
    }

    /**
     * Set hook to run after route changes
     * @param {Function} callback - Function to execute after route change
     */
    setAfterRouteChange(callback) {
        this.afterRouteChange = callback;
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Go forward in history
     */
    forward() {
        window.history.forward();
    }
}

// Create singleton instance
const router = new Router();

export default router;
export { router };
