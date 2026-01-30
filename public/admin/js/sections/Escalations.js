class Escalations {
   static allEscalations = []; // Store all unfiltered documents
   static filteredData = [];
   static currentPage = 1;
   static itemsPerPage = 8;
   static currentStatusFilter = 'all';
   static currentSearchTerm = '';
   static selectedIds = new Set();

   static render() {
      return `
      <div class="px-8 py-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
           <div class="flex items-center gap-3">
             <h1 class="text-[24px] font-bold text-[#1E293B]">Escalations Issues</h1>
             <span class="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md text-[13px] font-medium" id="escalations-count">0</span>
           </div>
        </div>

        <!-- Controls -->
        <div class="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
           <!-- Search Input -->
           <div class="relative flex-1">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search by Email, or Key words" class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[14px] placeholder-gray-400" id="escalations-search">
           </div>
           
           <!-- Sort/Filter Button -->
           <div class="relative" id="esc-filter-container">
              <button id="esc-filter-btn" class="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-[14px] font-medium transition-colors whitespace-nowrap">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="21" y1="10" x2="3" y2="10"></line>
                    <line x1="21" y1="6" x2="3" y2="6"></line>
                    <line x1="21" y1="14" x2="3" y2="14"></line>
                    <line x1="21" y1="18" x2="3" y2="18"></line>
                 </svg>
                 <span>Sort: <span id="esc-filter-label" class="font-bold text-[#E5A000]">All</span></span>
              </button>
              <!-- Dropdown Menu -->
              <div id="esc-filter-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 overflow-hidden">
                 <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" data-status="all">
                    <span class="w-2 h-2 rounded-full bg-gray-300"></span>
                    All Statuses
                 </button>
                 <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" data-status="open">
                    <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                    Open Issues
                 </button>
                 <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" data-status="resolved">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    Resolved
                 </button>
              </div>
           </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-x-auto mb-6 shadow-sm min-h-[400px]">
           <table class="w-full min-w-[800px]">
              <thead class="bg-gray-50/50 border-b border-gray-100">
                 <tr>
                    <th class="w-16 p-5 text-center">
                       <input type="checkbox" id="esc-select-all" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer">
                    </th>
                     <th class="text-left py-5 px-2 text-[13px] font-semibold text-gray-500">User</th>
                     <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">User Question</th>
                     <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Full Context</th>
                     <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Issue date</th>
                     <th class="w-16 p-5"></th>
                 </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="escalations-table-body">
                 <tr><td colspan="6" class="p-8 text-center text-gray-400 text-sm">Loading escalations...</td></tr>
              </tbody>
           </table>
        </div>

        <!-- Pagination -->
        <div class="flex justify-between items-center text-[13px] font-medium text-gray-600 px-2 mt-4">
           <div class="flex items-center gap-3">
              <span id="escalations-page-info">Page 1 of 1</span>
              <div class="relative">
                 <select id="escalations-limit-select" class="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-gray-300 cursor-pointer text-gray-700 text-[13px]">
                    <option value="8">8</option>
                    <option value="16">16</option>
                    <option value="24">24</option>
                 </select>
                 <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                 </svg>
              </div>
           </div>
           
           <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                 <button id="esc-first-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                 </button>
                 <button id="esc-prev-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 <button id="esc-next-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 </button>
                 <button id="esc-last-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                 </button>
              </div>
           </div>
        </div>

        <!-- Bulk Action Bar -->
        <div id="esc-bulk-bar" class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-[100] transition-all duration-300 translate-y-32 opacity-0">
           <div class="flex items-center gap-3 border-r border-gray-700 pr-6">
              <span class="bg-[#E5A000] text-white w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold" id="esc-selected-count">0</span>
              <span class="text-[14px] font-medium">items selected</span>
           </div>
           <div class="flex items-center gap-2">
              <button id="esc-bulk-delete" class="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors text-[14px] font-semibold">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                 </svg>
                 Delete Selected
              </button>
              <button id="esc-clear-selection" class="px-4 py-2 hover:bg-gray-700 rounded-lg transition-colors text-[14px] font-medium text-gray-400">
                 Cancel
              </button>
           </div>
        </div>
      </div>
    `;
   }

   static renderRows(data = []) {
      if (data.length === 0) {
         return '<tr><td colspan="6" class="p-8 text-center text-gray-400 text-sm">No escalations found</td></tr>';
      }

      return data.map(row => `
      <tr class="group hover:bg-gray-50/50 transition-colors ${this.selectedIds.has(String(row.id)) ? 'bg-amber-50/50' : ''}">
        <td class="p-5 text-center">
           <input type="checkbox" class="esc-row-checkbox w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer ${this.selectedIds.has(String(row.id)) ? 'opacity-100' : 'opacity-40'} group-hover:opacity-100 transition-opacity" ${this.selectedIds.has(String(row.id)) ? 'checked' : ''} data-id="${row.id}">
        </td>
        <td class="py-5 px-2">
           <div class="flex items-center gap-3">
             <span class="text-[15px] font-semibold text-gray-700">${this.escapeHtml(row.user)}</span>
           </div>
        </td>
        <td class="py-5 px-4 text-[14px] text-gray-600 font-medium max-w-md truncate" title="${this.escapeHtml(row.question)}">
          ${this.escapeHtml(row.question || '-')}
        </td>
        <td class="py-5 px-4">
           <button 
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-[#E5A000]/10 text-[#E5A000] hover:bg-[#E5A000]/20 transition-all"
              onclick="window.location.hash = 'conversations/${row.sessionId}';">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              View Session
           </button>
        </td>
        <td class="py-5 px-4 text-[14px] text-gray-500">${this.formatDate(row.date)}</td>
         <td class="p-5 text-center">
            <div class="flex items-center justify-center gap-2">
               <button 
                  data-action="toggle-status" 
                  data-id="${row.id}" 
                  data-status="${row.status}"
                  title="${row.status === 'resolved' ? 'Mark as Open' : 'Mark as Resolved'}"
                  class="p-2 rounded-full transition-all ${row.status === 'resolved' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-gray-100'}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
               </button>
               <button 
                  data-action="delete" 
                  data-id="${row.id}" 
                  title="Delete Escalation"
                  class="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <polyline points="3 6 5 6 21 6"></polyline>
                     <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
               </button>
            </div>
         </td>
      </tr>
    `).join('');
   }

   static async loadEscalations() {
      try {
         const data = await window.apiService.getAllEscalations();
         this.allEscalations = Array.isArray(data) ? data : [];
         this.applyFilters();
      } catch (error) {
         console.error('Failed to load escalations:', error);
      }
   }

   static applyFilters() {
      const searchInput = document.getElementById('escalations-search');
      const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

      let filtered = [...this.allEscalations];

      if (this.currentStatusFilter && this.currentStatusFilter !== 'all') {
         filtered = filtered.filter(item => item.status === this.currentStatusFilter);
      }

      if (searchTerm) {
         filtered = filtered.filter(item =>
            (item.user && item.user.toLowerCase().includes(searchTerm)) ||
            (item.question && item.question.toLowerCase().includes(searchTerm))
         );
      }

      this.filteredData = filtered;
      this.updateTable();
   }

   static updateTable() {
      const tbody = document.getElementById('escalations-table-body');
      const countEl = document.getElementById('escalations-count');
      const pageInfo = document.getElementById('escalations-page-info');

      if (!tbody) return;

      const totalItems = this.filteredData.length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedData = this.filteredData.slice(startIndex, endIndex);

      if (countEl) countEl.textContent = totalItems;
      if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;

      tbody.innerHTML = this.renderRows(paginatedData);

      const firstBtn = document.getElementById('esc-first-btn');
      const prevBtn = document.getElementById('esc-prev-btn');
      const nextBtn = document.getElementById('esc-next-btn');
      const lastBtn = document.getElementById('esc-last-btn');

      if (firstBtn) firstBtn.disabled = this.currentPage <= 1;
      if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
      if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
      if (lastBtn) lastBtn.disabled = this.currentPage >= totalPages;
   }

   static afterRender() {
      this.loadEscalations();
      this.setupSelectionListeners();

      const searchInput = document.getElementById('escalations-search');
      if (searchInput) {
         searchInput.addEventListener('input', () => {
            this.currentPage = 1;
            this.applyFilters();
         });
      }

      const filterBtn = document.getElementById('esc-filter-btn');
      const filterMenu = document.getElementById('esc-filter-menu');
      const filterLabel = document.getElementById('esc-filter-label');

      if (filterBtn && filterMenu) {
         filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.classList.toggle('hidden');
         });

         filterMenu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
               this.currentStatusFilter = btn.dataset.status;
               if (filterLabel) filterLabel.textContent = this.currentStatusFilter === 'all' ? 'All' : this.currentStatusFilter.charAt(0).toUpperCase() + this.currentStatusFilter.slice(1);
               filterMenu.classList.add('hidden');
               this.currentPage = 1;
               this.applyFilters();
            });
         });

         document.addEventListener('click', () => filterMenu.classList.add('hidden'));
      }

      const limitSelect = document.getElementById('escalations-limit-select');
      if (limitSelect) {
         limitSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.updateTable();
         });
      }

      document.getElementById('esc-first-btn')?.addEventListener('click', () => { this.currentPage = 1; this.updateTable(); });
      document.getElementById('esc-prev-btn')?.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; this.updateTable(); } });
      document.getElementById('esc-next-btn')?.addEventListener('click', () => {
         const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
         if (this.currentPage < totalPages) { this.currentPage++; this.updateTable(); }
      });
      document.getElementById('esc-last-btn')?.addEventListener('click', () => {
         this.currentPage = Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
         this.updateTable();
      });

      const tbody = document.getElementById('escalations-table-body');
      if (tbody) {
         tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const { action, id, status } = btn.dataset;
            if (action === 'delete') {
               const ok = await this.showConfirm('Delete this escalation?');
               if (ok) await this.deleteEscalation(id);
            } else if (action === 'toggle-status') {
               await this.toggleStatus(id, status === 'open' ? 'resolved' : 'open');
            }
         });
      }
   }

   static setupSelectionListeners() {
      const selectAll = document.getElementById('esc-select-all');
      const tableBody = document.getElementById('escalations-table-body');
      const bulkDeleteBtn = document.getElementById('esc-bulk-delete');
      const clearBtn = document.getElementById('esc-clear-selection');

      if (selectAll) {
         selectAll.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const checkboxes = document.querySelectorAll('.esc-row-checkbox');
            checkboxes.forEach(cb => {
               cb.checked = isChecked;
               if (isChecked) this.selectedIds.add(cb.dataset.id);
               else this.selectedIds.delete(cb.dataset.id);
            });
            this.updateBulkBar();
            this.updateRowsHighlight();
         });
      }

      tableBody?.addEventListener('change', (e) => {
         if (e.target.classList.contains('esc-row-checkbox')) {
            if (e.target.checked) this.selectedIds.add(e.target.dataset.id);
            else {
               this.selectedIds.delete(e.target.dataset.id);
               if (selectAll) selectAll.checked = false;
            }
            this.updateBulkBar();
            this.updateRowsHighlight();
         }
      });

      bulkDeleteBtn?.addEventListener('click', async () => {
         const ok = await this.showConfirm(`Delete ${this.selectedIds.size} selected escalations?`);
         if (ok) this.deleteSelected();
      });

      clearBtn?.addEventListener('click', () => {
         this.selectedIds.clear();
         if (selectAll) selectAll.checked = false;
         this.updateBulkBar();
         this.updateRowsHighlight();
         this.updateTable();
      });
   }

   static updateBulkBar() {
      const bar = document.getElementById('esc-bulk-bar');
      const countEl = document.getElementById('esc-selected-count');
      if (!bar || !countEl) return;
      if (this.selectedIds.size > 0) {
         countEl.textContent = this.selectedIds.size;
         bar.classList.remove('translate-y-32', 'opacity-0');
         bar.classList.add('translate-y-0', 'opacity-100');
      } else {
         bar.classList.add('translate-y-32', 'opacity-0');
         bar.classList.remove('translate-y-0', 'opacity-100');
      }
   }

   static updateRowsHighlight() {
      const rows = document.querySelectorAll('#escalations-table-body tr');
      rows.forEach(row => {
         const checkbox = row.querySelector('.esc-row-checkbox');
         if (checkbox && this.selectedIds.has(String(checkbox.dataset.id))) {
            row.classList.add('bg-amber-50/50');
            checkbox.classList.add('opacity-100');
         } else {
            row.classList.remove('bg-amber-50/50');
            checkbox?.classList.remove('opacity-100');
         }
      });
   }

   static async deleteSelected() {
      try {
         const ids = Array.from(this.selectedIds);
         const res = await fetch('/api/escalations/batch-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
         });
         const result = await res.json();
         if (result.success) {
            this.selectedIds.clear();
            this.updateBulkBar();
            await this.loadEscalations();
            this.showToast(result.message || `Deleted ${ids.length} escalations`, 'success');
         }
      } catch (err) { console.error(err); }
   }

   // Simple confirm modal that returns a promise
   static showConfirm(message) {
      return new Promise((resolve) => {
         const overlay = document.createElement('div');
         overlay.className = 'fixed inset-0 bg-black/40 z-[300] flex items-center justify-center';

         const modal = document.createElement('div');
         modal.className = 'bg-white rounded-lg p-6 w-[420px] shadow-lg text-center';
         modal.innerHTML = `
            <p class="text-gray-800 mb-4">${this.escapeHtml(message)}</p>
            <div class="flex items-center justify-center gap-4">
               <button class="px-4 py-2 rounded-md bg-gray-100" id="confirm-cancel">Cancel</button>
               <button class="px-4 py-2 rounded-md bg-red-600 text-white" id="confirm-ok">Delete</button>
            </div>
         `;

         overlay.appendChild(modal);
         document.body.appendChild(overlay);

         const cleanup = (result) => {
            overlay.remove();
            resolve(result);
         };

         modal.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
         modal.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
      });
   }

   static async deleteEscalation(id) {
      try {
         const res = await fetch(`/api/escalations/${id}`, { method: 'DELETE' });
         const result = await res.json();
         if (result.success) {
            this.showToast('Escalation deleted', 'success');
         } else {
            this.showToast(result.error || 'Failed to delete escalation', 'error');
         }
      } catch (err) {
         console.error('Failed to delete escalation:', err);
         this.showToast('Failed to delete escalation', 'error');
      }
      await this.loadEscalations();
   }

   static showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-[200] transition-all duration-300 transform translate-y-[-20px] opacity-0 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
      toast.textContent = message;
      document.body.appendChild(toast);

      // Trigger animation
      setTimeout(() => {
         toast.classList.remove('translate-y-[-20px]', 'opacity-0');
      }, 10);

      // Remove after 3s
      setTimeout(() => {
         toast.classList.add('translate-y-[-20px]', 'opacity-0');
         setTimeout(() => toast.remove(), 300);
      }, 3000);
   }

   static async toggleStatus(id, newStatus) {
      await fetch(`/api/escalations/${id}/status`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: newStatus })
      });
      await this.loadEscalations();
   }

   static escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
   }
   static formatDate(dateStr) {
      if (!dateStr) return '-';
      try {
         return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
         });
      } catch { return dateStr; }
   }
}