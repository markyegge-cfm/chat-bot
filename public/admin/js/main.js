/**
 * Main Application Logic
 * Orchestrates components and sections with Authentication Guard
 */

class AdminApp {
    constructor() {
        // API Service should already be initialized globally
        if (!window.apiService) {
            console.warn('⚠️ API Service not initialized, creating now...');
            window.apiService = new APIService();
        }

        // Run auth check before anything else
        this.checkAuth().then(isAuth => {
            if (isAuth) {
                this.init();
            }
        });
    }

    /**
     * Authentication Guard
     * Verifies if the user has a valid session token
     * Handles "Remember Me" via Refresh Tokens
     */
    async checkAuth() {
        const token = sessionStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('adminRefreshToken');

        // 1. If we have a session token, assume it's valid for now
        if (token) {
            this.setupAutoRefresh();
            return true;
        }

        // 2. If no session token but we have a refresh token (Remember Me)
        if (refreshToken) {
            console.log('🔄 Attempting to restore session via refresh token...');
            try {
                const refreshed = await this.performTokenRefresh(refreshToken);
                if (refreshed) {
                    this.setupAutoRefresh();
                    return true;
                }
            } catch (err) {
                console.error('Session restoration failed:', err);
            }
        }

        // 3. Otherwise, unauthorized
        console.warn('Unauthorized access attempt. Redirecting to login...');
        window.location.href = 'login.html';
        return false;
    }

    async performTokenRefresh(refreshToken) {
        try {
            const response = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('adminLoggedIn', 'true');

                if (data.user && data.user.email) {
                    sessionStorage.setItem('adminEmail', data.user.email);
                    localStorage.setItem('adminEmail', data.user.email);
                }

                if (data.refreshToken) {
                    localStorage.setItem('adminRefreshToken', data.refreshToken);
                }
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    setupAutoRefresh() {
        // Refresh token every 50 minutes (Firebase tokens last 1 hour)
        if (this.refreshInterval) clearInterval(this.refreshInterval);

        this.refreshInterval = setInterval(async () => {
            const refreshToken = localStorage.getItem('adminRefreshToken');
            if (refreshToken) {
                console.log('⏳ Periodically refreshing access token...');
                await this.performTokenRefresh(refreshToken);
            }
        }, 50 * 60 * 1000);
    }

    init() {
        // Render Layout Components
        this.renderLayout();

        // Setup Navigation Listeners (Sidebar clicks)
        this.setupNavigation();

        // Setup Hash Routing
        window.addEventListener('hashchange', () => this.handleRouting());

        // Initial Routing
        if (window.location.hash && window.location.hash !== '#') {
            this.handleRouting();
        } else {
            // Default view
            window.location.hash = 'dashboard';
        }

        // Setup Mobile Menu
        this.setupMobileMenu();
    }

    handleRouting() {
        const hash = window.location.hash.substring(1); // Remove #
        const [section, ...params] = hash.split('/');

        // Update Sidebar highlighting
        document.querySelectorAll('.nav-item').forEach(el => {
            if (el.dataset.page === section) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        this.loadSection(section, params);
    }

    renderLayout() {
        // Render Sidebar
        const sidebarPlaceholder = document.getElementById('sidebar-container');
        if (sidebarPlaceholder) {
            sidebarPlaceholder.innerHTML = Sidebar.render();
            if (typeof Sidebar.afterRender === 'function') {
                Sidebar.afterRender();
            }
        }

        // Render Header
        const headerPlaceholder = document.getElementById('header-container');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = Header.render();
            if (typeof Header.afterRender === 'function') {
                Header.afterRender();
            }
        }

        // Add Logout Listener - Support multiple logout buttons
        const logoutBtns = document.querySelectorAll('[id="logout-btn"], .logout-icon-btn, [data-logout]');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
            });
        });
    }

    logout() {
        console.log('🔓 Logging out...');
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        sessionStorage.clear();
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminRememberMe');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = 'login.html';
    }

    setupNavigation() {
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const page = navItem.dataset.page;
                window.location.hash = page;
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

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
    }

    loadSection(sectionName, params = []) {
        const contentContainer = document.getElementById('content-container');
        if (!contentContainer) return;

        // Store current params globally so sections can access them if needed during afterRender
        this.currentParams = params;

        let ComponentClass = null;

        switch (sectionName) {
            case 'knowledge':
                ComponentClass = KnowledgeBase;
                break;
            case 'conversations':
                ComponentClass = Conversations;
                break;
            case 'dashboard':
                ComponentClass = Dashboard;
                break;
            case 'escalations':
                ComponentClass = Escalations;
                break;
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