/**
 * Admin Dashboard App - Main Application Logic
 * Handles authentication, navigation, and UI interactions
 */

class AdminDashboard {
  constructor() {
    this.currentPage = 'dashboard';
    this.init();
  }

  /**
   * Initialize the dashboard
   */
  init() {
    // Check authentication first
    if (!this.checkAuth()) {
      return;
    }

    // Setup event listeners
    this.setupNavigation();
    this.setupLogout();
    this.setupUploadArea();

    // Load initial data
    this.loadDashboardData();
  }

  /**
   * Check if user is authenticated
   * Redirect to login if not
   */
  checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    const adminEmail = sessionStorage.getItem('adminEmail');

    if (!isLoggedIn || !adminEmail) {
      window.location.href = '/admin/login';
      return false;
    }

    // Update user email display
    this.updateUserEmail(adminEmail);
    return true;
  }

  /**
   * Update user email in sidebar and header
   */
  updateUserEmail(email) {
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach((element) => {
      element.textContent = email;
    });
  }

  /**
   * Setup navigation between pages
   */
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();

        const page = item.dataset.page;
        if (!page) return;

        // Update active nav item
        navItems.forEach((nav) => nav.classList.remove('active'));
        item.classList.add('active');

        // Show active section
        const sections = document.querySelectorAll('.page-section');
        sections.forEach((sec) => sec.classList.remove('active'));
        const targetSection = document.getElementById(page);
        if (targetSection) {
          targetSection.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
          pageTitle.textContent = item.textContent.trim().split('\n')[0] || item.textContent.trim();
        }

        this.currentPage = page;
      });
    });
  }

  /**
   * Setup logout functionality
   */
  setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
      const confirmed = confirm('Are you sure you want to logout?');
      if (confirmed) {
        // Clear session storage
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminLoginTime');

        // Redirect to login
        window.location.href = '/admin/login';
      }
    });
  }

  /**
   * Setup upload area functionality
   */
  setupUploadArea() {
    const uploadArea = document.querySelector('.upload-area');
    if (!uploadArea) return;

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--dark)';
      uploadArea.style.background = 'rgba(202, 157, 43, 0.1)';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = 'var(--primary)';
      uploadArea.style.background = 'rgba(202, 157, 43, 0.02)';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--primary)';
      uploadArea.style.background = 'rgba(202, 157, 43, 0.02)';

      const files = e.dataTransfer.files;
      this.handleFileUpload(files);
    });

    // Click to upload
    uploadArea.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.docx,.txt';
      input.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files);
      });
      input.click();
    });
  }

  /**
   * Handle file upload
   * Phase 3: Send files to backend
   */
  handleFileUpload(files) {
    console.log('Files selected for upload:', files);
    // TODO: Phase 3 - Implement file upload to backend
    alert(`${files.length} file(s) ready to upload - Phase 3 implementation`);
  }

  /**
   * Load dashboard data
   * Phase 2: Fetch from API
   */
  loadDashboardData() {
    if (this.currentPage !== 'dashboard') return;

    // TODO: Phase 2 - Fetch real data from /api/admin/dashboard
    console.log('Loading dashboard data...');

    // For now, data is static in HTML
  }
}

/**
 * API Service for Admin Dashboard
 */
class AdminAPI {
  constructor(apiUrl = 'http://localhost:3000') {
    this.apiUrl = apiUrl;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await fetch(`${this.apiUrl}/api/admin/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
    }
  }

  /**
   * Get conversations
   */
  async getConversations(page = 1, pageSize = 10) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/admin/conversations?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return null;
    }
  }

  /**
   * Get escalations
   */
  async getEscalations(page = 1, pageSize = 10) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/admin/escalations?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) throw new Error('Failed to fetch escalations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching escalations:', error);
      return null;
    }
  }

  /**
   * Upload document
   */
  async uploadDocument(formData) {
    try {
      const response = await fetch(`${this.apiUrl}/api/admin/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload document');
      return await response.json();
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  }
}

/**
 * Initialize dashboard on DOM ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
    window.adminAPI = new AdminAPI();
  });
} else {
  window.adminDashboard = new AdminDashboard();
  window.adminAPI = new AdminAPI();
}
