class Escalations {
   static allEscalations = []; // Store all unfiltered documents
   static filteredData = [];
   static currentPage = 1;
   static itemsPerPage = 8;
   static currentStatusFilter = 'all';
   static currentSearchTerm = '';

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

        <!-- Table Container (Horizontal Scroll for Mobile) -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-x-auto mb-6 shadow-sm min-h-[400px]">
           <table class="w-full min-w-[800px]">
              <thead class="bg-gray-50/50 border-b border-gray-100">
                 <tr>
                    <th class="w-16 p-5 text-center">
                       <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer">
                    </th>
                    <th class="text-left py-5 px-2 text-[13px] font-semibold text-gray-500">User</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">User Question</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Reason</th>
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
                 <!-- First Page -->
                 <button id="esc-first-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                 </button>
                 <!-- Previous Page -->
                 <button id="esc-prev-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 <!-- Next Page -->
                 <button id="esc-next-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 </button>
                 <!-- Last Page -->
                 <button id="esc-last-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                 </button>
              </div>
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
      <tr class="group hover:bg-gray-50/50 transition-colors">
        <td class="p-5 text-center">
           <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity">
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
           <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[13px] font-medium ${this.getReasonBadgeClass(row.reason)}">
              <span class="w-2 h-2 rounded-full" style="background-color: ${this.getReasonColor(row.reason)}"></span>
              ${this.escapeHtml(row.reason || '-')}
           </span>
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
      const tbody = document.getElementById('escalations-table-body');
      try {
         const data = await window.apiService.getAllEscalations();
         this.allEscalations = Array.isArray(data) ? data : [];
         this.applyFilters();
      } catch (error) {
         console.error('Failed to load escalations:', error);
         if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-red-500 text-sm">Failed to load escalations.</td></tr>';
      }
   }

   static applyFilters() {
      const searchInput = document.getElementById('escalations-search');
      const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

      let filtered = [...this.allEscalations];

      // Status Filter
      if (this.currentStatusFilter && this.currentStatusFilter !== 'all') {
         filtered = filtered.filter(item => item.status === this.currentStatusFilter);
      }

      // Search Filter
      if (searchTerm) {
         filtered = filtered.filter(item =>
            (item.user && item.user.toLowerCase().includes(searchTerm)) ||
            (item.question && item.question.toLowerCase().includes(searchTerm)) ||
            (item.reason && item.reason.toLowerCase().includes(searchTerm))
         );
      }

      this.filteredData = filtered;
      this.currentPage = 1;
      this.updateTable();
   }

   static updateTable() {
      const tbody = document.getElementById('escalations-table-body');
      const countEl = document.getElementById('escalations-count');
      const pageInfo = document.getElementById('escalations-page-info');

      if (!tbody) return;

      const totalItems = this.filteredData.length;
      const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

      if (this.currentPage > totalPages) this.currentPage = totalPages;

      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const paginatedData = this.filteredData.slice(startIndex, endIndex);

      if (countEl) countEl.textContent = totalItems;
      if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;

      tbody.innerHTML = this.renderRows(paginatedData);
      this.updatePaginationButtons(totalPages);
   }

   static updatePaginationButtons(totalPages) {
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

      // Search
      const searchInput = document.getElementById('escalations-search');
      if (searchInput) {
         searchInput.addEventListener('input', () => this.applyFilters());
      }

      // Filter Toggle
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
               const status = btn.dataset.status;
               this.currentStatusFilter = status;
               if (filterLabel) {
                  filterLabel.textContent = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1);
               }
               filterMenu.classList.add('hidden');
               this.applyFilters();
            });
         });

         document.addEventListener('click', () => filterMenu.classList.add('hidden'));
      }

      // Limit Select
      const limitSelect = document.getElementById('escalations-limit-select');
      if (limitSelect) {
         limitSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.updateTable();
         });
      }

      // Pagination
      document.getElementById('esc-first-btn')?.addEventListener('click', () => {
         this.currentPage = 1;
         this.updateTable();
      });
      document.getElementById('esc-prev-btn')?.addEventListener('click', () => {
         if (this.currentPage > 1) {
            this.currentPage--;
            this.updateTable();
         }
      });
      document.getElementById('esc-next-btn')?.addEventListener('click', () => {
         const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
         if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateTable();
         }
      });
      document.getElementById('esc-last-btn')?.addEventListener('click', () => {
         this.currentPage = Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
         this.updateTable();
      });

      // Actions
      const tbody = document.getElementById('escalations-table-body');
      if (tbody) {
         tbody.addEventListener('click', async (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const { action, id, status } = btn.dataset;

            if (action === 'delete') {
               if (confirm('Delete this escalation?')) {
                  await this.deleteEscalation(id);
               }
            } else if (action === 'toggle-status') {
               await this.toggleStatus(id, status === 'open' ? 'resolved' : 'open');
            }
         });
      }
   }

   static async deleteEscalation(id) {
      try {
         const res = await fetch(`/api/escalations/${id}`, { method: 'DELETE' });
         const result = await res.json();
         if (result.success) this.loadEscalations();
      } catch (err) { console.error(err); }
   }

   static async toggleStatus(id, newStatus) {
      try {
         const res = await fetch(`/api/escalations/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
         });
         const result = await res.json();
         if (result.success) this.loadEscalations();
      } catch (err) { console.error(err); }
   }

   static getReasonBadgeClass(reason) {
      return reason === 'Low confidence' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-700';
   }
   static getReasonColor(reason) {
      return reason === 'Low confidence' ? '#f39c12' : '#cbd5e1';
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