/**
 * Main Application Logic
 * Orchestrates components and sections
 */

class AdminApp {
    constructor() {
        this.init();
    }

    init() {
        // Render Layout Components
        this.renderLayout();

        // Setup Navigation Listeners
        this.setupNavigation();

        // Setup Mobile Menu
        this.setupMobileMenu();

        // Load Default Section (Conversations)
        this.loadSection('conversations');
    }

    renderLayout() {
        // Render Sidebar
        const sidebarPlaceholder = document.getElementById('sidebar-container');
        if (sidebarPlaceholder) {
            sidebarPlaceholder.innerHTML = Sidebar.render();
        }

        // Render Header
        const headerPlaceholder = document.getElementById('header-container');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = Header.render();
        }
    }

    setupNavigation() {
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const page = navItem.dataset.page;

                // Update Active State
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                navItem.classList.add('active');

                // Load Section
                this.loadSection(page);

                // Close mobile menu after navigation
                this.closeMobileMenu();
            }
        });
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('mobile-menu-toggle');
        const overlay = document.getElementById('sidebar-overlay');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Close mobile menu on window resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (sidebar) {
            sidebar.classList.toggle('open');
        }
        if (overlay) {
            overlay.classList.toggle('open');
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (sidebar) {
            sidebar.classList.remove('open');
        }
        if (overlay) {
            overlay.classList.remove('open');
        }
    }

    loadSection(sectionName) {
        const contentContainer = document.getElementById('content-container');
        if (!contentContainer) return;

        // Update Header Title based on section (Optional, if we had a dynamic header)

        let ComponentClass = null;

        switch (sectionName) {
            case 'knowledge':
                ComponentClass = KnowledgeBase;
                break;
            case 'conversations':
                ComponentClass = Conversations;
                break;
            case 'dashboard':
                contentContainer.innerHTML = '<div class="p-8">Dashboard Coming Soon</div>';
                return;
            case 'escalations':
                contentContainer.innerHTML = '<div class="p-8">Escalations Coming Soon</div>';
                return;
            default:
                console.warn(`Section ${sectionName} not found`);
                return;
        }

        if (ComponentClass) {
            contentContainer.innerHTML = ComponentClass.render();
            if (typeof ComponentClass.afterRender === 'function') {
                ComponentClass.afterRender();
            }
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AdminApp();
});
