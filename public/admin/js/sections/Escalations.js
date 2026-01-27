class Escalations {
   // State management for pagination
   static state = {
      currentPage: 1,
      limit: 8,
      total: 0,
      totalPages: 1,
      isLoading: false
   };

   static render() {
      return `
      <div class="px-8 py-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
           <div class="flex items-center gap-3">
             <h1 class="text-[24px] font-bold text-[#1E293B]">Escalations Issues</h1>
             <span class="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md text-[13px] font-medium" id="escalations-count">...</span>
           </div>
        </div>

        <!-- Controls -->
        <div class="flex justify-between items-center gap-4 mb-6">
           <!-- Search Input -->
           <div class="relative flex-1">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search by Email, or Key words" class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[14px] placeholder-gray-400" id="escalations-search">
           </div>
           
           <!-- Sort Button -->
           <button class="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-[14px] font-medium transition-colors whitespace-nowrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <line x1="21" y1="10" x2="3" y2="10"></line>
                 <line x1="21" y1="6" x2="3" y2="6"></line>
                 <line x1="21" y1="14" x2="3" y2="14"></line>
                 <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
              Sort by
           </button>
        </div>

        <!-- Table -->
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
           <table class="w-full">
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
              <span id="escalations-page-info2">Page 1 of 1</span>
              <div class="flex items-center gap-1">
                 <!-- First Page -->
                 <button id="esc-first-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                 </button>
                 <!-- Previous Page -->
                 <button id="esc-prev-btn" class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="15 18 9 12 15 6"></polyline></svg>
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
           <button class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="1"></circle>
                 <circle cx="12" cy="5" r="1"></circle>
                 <circle cx="12" cy="19" r="1"></circle>
              </svg>
           </button>
        </td>
      </tr>
    `).join('');
   }

   static getReasonBadgeClass(reason) {
      if (reason === 'Low confidence') {
         return 'bg-orange-50 text-orange-700';
      }
      return 'bg-gray-100 text-gray-700';
   }

   static getReasonColor(reason) {
      if (reason === 'Low confidence') {
         return '#f39c12';
      }
      return '#cbd5e1';
   }

   static escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
   }

   static formatDate(dateStr) {
      if (!dateStr) return '-';
      try {
         const date = new Date(dateStr);
         return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
         });
      } catch {
         return dateStr;
      }
   }

   static async loadEscalations(page = 1) {
      this.state.isLoading = true;
      this.state.currentPage = page;
      
      const tbody = document.getElementById('escalations-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-400 text-sm">Loading...</td></tr>';

      try {
         const api = new APIService(); 
         const result = await api.getEscalations(this.state.currentPage, this.state.limit);
         
         const escalations = result.escalations || [];
         this.state.total = result.total || 0;
         this.state.totalPages = result.totalPages || Math.ceil(this.state.total / this.state.limit) || 1;
         
         // Update UI
         const countEl = document.getElementById('escalations-count');
         if (countEl) countEl.textContent = this.state.total;
         
         if (tbody) tbody.innerHTML = this.renderRows(escalations);
         
         this.updatePaginationUI();
         
      } catch (error) {
         console.error('Failed to load escalations:', error);
         if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-red-500 text-sm">Failed to load escalations. Is the API running?</td></tr>';
      } finally {
         this.state.isLoading = false;
      }
   }

   static updatePaginationUI() {
      const { currentPage, totalPages } = this.state;
      
      // Update text
      const info1 = document.getElementById('escalations-page-info');
      const info2 = document.getElementById('escalations-page-info2');
      if (info1) info1.textContent = `Page ${currentPage} of ${totalPages}`;
      if (info2) info2.textContent = `Page ${currentPage} of ${totalPages}`;

      // Update buttons state
      const firstBtn = document.getElementById('esc-first-btn');
      const prevBtn = document.getElementById('esc-prev-btn');
      const nextBtn = document.getElementById('esc-next-btn');
      const lastBtn = document.getElementById('esc-last-btn');

      if (firstBtn) {
         firstBtn.disabled = currentPage <= 1;
         firstBtn.classList.toggle('text-gray-400', currentPage <= 1);
         firstBtn.classList.toggle('text-gray-600', currentPage > 1);
      }
      
      if (prevBtn) {
         prevBtn.disabled = currentPage <= 1;
         prevBtn.classList.toggle('text-gray-400', currentPage <= 1);
         prevBtn.classList.toggle('text-gray-600', currentPage > 1);
      }
      
      if (nextBtn) {
         nextBtn.disabled = currentPage >= totalPages;
         nextBtn.classList.toggle('text-gray-400', currentPage >= totalPages);
         nextBtn.classList.toggle('text-gray-600', currentPage < totalPages);
      }
      
      if (lastBtn) {
         lastBtn.disabled = currentPage >= totalPages;
         lastBtn.classList.toggle('text-gray-400', currentPage >= totalPages);
         lastBtn.classList.toggle('text-gray-600', currentPage < totalPages);
      }
   }

   static afterRender() {
      // Initial Load
      this.loadEscalations(1);

      // Search functionality
      const searchInput = document.getElementById('escalations-search');
      let searchTimeout;
      if (searchInput) {
         searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
               const query = e.target.value.toLowerCase();
               console.log('Searching for:', query);
               // Future: pass query to loadEscalations
            }, 500);
         });
      }

      // Limit Select
      const limitSelect = document.getElementById('escalations-limit-select');
      if (limitSelect) {
         limitSelect.value = this.state.limit;
         limitSelect.addEventListener('change', (e) => {
            this.state.limit = parseInt(e.target.value);
            this.loadEscalations(1);
         });
      }

      // Pagination Buttons
      document.getElementById('esc-first-btn')?.addEventListener('click', () => {
         if (this.state.currentPage > 1) this.loadEscalations(1);
      });

      document.getElementById('esc-prev-btn')?.addEventListener('click', () => {
         if (this.state.currentPage > 1) this.loadEscalations(this.state.currentPage - 1);
      });

      document.getElementById('esc-next-btn')?.addEventListener('click', () => {
         if (this.state.currentPage < this.state.totalPages) this.loadEscalations(this.state.currentPage + 1);
      });

      document.getElementById('esc-last-btn')?.addEventListener('click', () => {
         if (this.state.currentPage < this.state.totalPages) this.loadEscalations(this.state.totalPages);
      });
   }
}