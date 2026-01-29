class Header {
  static render() {
    const email = sessionStorage.getItem('adminEmail') || 'admin';
    const initials = email.split('@')[0].substring(0, 2).toUpperCase();

    return `
      <header class="h-[64px] bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
        <!-- Mobile Menu Toggle (hidden on desktop) -->
        <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle menu">
          ☰
        </button>

        <!-- Left: System Status -->
        <div class="flex items-center gap-2.5 text-[13px] font-medium text-gray-600">
          <span class="w-2 h-2 rounded-full bg-[#27ae60] shadow-[0_0_0_3px_rgba(39,174,96,0.15)]"></span>
          System Ok
        </div>

        <!-- Right: User Profile -->
        <div class="relative" id="user-dropdown-container">
           <button class="flex items-center gap-3 px-4 py-2 bg-[#F5F5F5] hover:bg-[#EAEAEA] rounded-full transition-colors cursor-pointer" id="header-user-btn">
             <div class="w-7 h-7 rounded-full bg-[#E5A000] flex items-center justify-center text-[11px] font-bold text-white tracking-wider">${initials}</div>
             <span class="text-[13px] font-semibold text-gray-800">Admin</span>
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-gray-400">
                <polyline points="6 9 12 15 18 9"></polyline>
             </svg>
           </button>

           <!-- Dropdown Menu -->
           <div id="user-dropdown-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
               <div class="px-4 py-2 border-b border-gray-50 mb-1">
                  <p class="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Account</p>
                  <p class="text-[13px] text-gray-700 font-semibold truncate">${email}</p>
               </div>
               <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors" id="header-reset-password">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Reset Password
               </button>
               <button class="w-full px-4 py-2.5 text-left text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors" id="header-logout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Sign Out
               </button>
           </div>
        </div>
      </header>
    `;
  }

  static afterRender() {
    const userBtn = document.getElementById('header-user-btn');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    const resetBtn = document.getElementById('header-reset-password');
    const logoutBtn = document.getElementById('header-logout');

    if (userBtn && dropdownMenu) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
      });

      document.addEventListener('click', () => {
        dropdownMenu.classList.add('hidden');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const email = sessionStorage.getItem('adminEmail');
        if (!email) return;

        if (confirm(`Send password reset email to ${email}?`)) {
          try {
            const response = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (data.success) {
              alert('Reset link sent! Check your inbox.');
            } else {
              alert('Failed to send reset link: ' + (data.error || 'Unknown error'));
            }
          } catch (err) {
            console.error(err);
            alert('Network error. Please try again.');
          }
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.app && typeof window.app.logout === 'function') {
          window.app.logout();
        } else {
          sessionStorage.clear();
          window.location.href = 'login.html';
        }
      });
    }
  }
}
