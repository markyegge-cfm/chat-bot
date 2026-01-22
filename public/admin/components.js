/**
 * Admin Dashboard Components - Reusable UI Components
 * Sidebar, Header, Stats Cards, Tables, etc.
 */

/**
 * Sidebar Component
 */
class Sidebar {
  static render() {
    return `
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-2-13h4v6h-4zm0 8h4v2h-4z"/>
            </svg>
            Chatbot
          </h2>
          <p class="phase-badge">Phase 1 - Preview</p>
        </div>

        <nav class="sidebar-nav">
          <a href="#" data-page="dashboard" class="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span>Dashboard</span>
          </a>
          <a href="#" data-page="knowledge" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <span>Knowledge Base</span>
          </a>
          <a href="#" data-page="conversations" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Conversations</span>
          </a>
          <a href="#" data-page="escalations" class="nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Escalations</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div style="padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px;">
            <p style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 4px;">LOGGED IN AS</p>
            <p class="user-email" style="font-size: 13px; color: white; font-weight: 600; word-break: break-all;">admin@example.com</p>
          </div>
          <button class="logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </aside>
    `;
  }
}

/**
 * Header Component
 */
class Header {
  static render() {
    return `
      <header class="page-header">
        <h1 id="page-title">Dashboard</h1>
        <div class="header-right">
          <span class="health-status">
            <span class="status-indicator"></span>
            System OK
          </span>
          <span class="user-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Admin
          </span>
        </div>
      </header>
    `;
  }
}

/**
 * Stats Card Component
 */
class StatsCard {
  static render(icon, label, value, trend) {
    return `
      <div class="stat-card">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${icon}
        </svg>
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-trend">${trend}</div>
      </div>
    `;
  }
}

/**
 * Card Component
 */
class Card {
  static render(title, content, badge = null) {
    return `
      <div class="card">
        <div class="card-title">
          <span>${title}</span>
          ${badge ? `<span class="card-badge">${badge}</span>` : ''}
        </div>
        ${content}
      </div>
    `;
  }
}

/**
 * Button Component
 */
class Button {
  static primary(text, icon = null) {
    return `
      <button class="btn btn-primary">
        ${icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">${icon}</svg>` : ''}
        ${text}
      </button>
    `;
  }

  static secondary(text, icon = null) {
    return `
      <button class="btn btn-secondary">
        ${icon ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">${icon}</svg>` : ''}
        ${text}
      </button>
    `;
  }
}

/**
 * Badge Component
 */
class Badge {
  static success(text) {
    return `<span class="badge badge-success">${text}</span>`;
  }

  static warning(text) {
    return `<span class="badge badge-warning">${text}</span>`;
  }

  static pending(text) {
    return `<span class="badge badge-pending">${text}</span>`;
  }
}

/**
 * Upload Area Component
 */
class UploadArea {
  static render() {
    return `
      <div class="upload-area">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div class="upload-text">Click or drag files here</div>
        <div class="upload-hint">Supported: PDF, DOCX, TXT (Max 10MB)</div>
      </div>
    `;
  }
}

/**
 * Placeholder Component
 */
class Placeholder {
  static render(icon, title, description) {
    return `
      <div class="placeholder-content">
        <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${icon}
        </svg>
        <p><strong>${title}:</strong> ${description}</p>
      </div>
    `;
  }
}

/**
 * Loading Spinner Component
 */
class Spinner {
  static render() {
    return `
      <div style="text-align: center; padding: 20px;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(202, 157, 43, 0.2); border-top-color: #CA9D2B; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }
}

/**
 * Alert Component
 */
class Alert {
  static success(message) {
    return `
      <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
        ✓ ${message}
      </div>
    `;
  }

  static error(message) {
    return `
      <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
        ❌ ${message}
      </div>
    `;
  }

  static info(message) {
    return `
      <div style="background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
        ℹ️ ${message}
      </div>
    `;
  }
}
