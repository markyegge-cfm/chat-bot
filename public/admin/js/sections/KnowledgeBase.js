class KnowledgeBase {
   static allDocuments = []; // Store all unfiltered documents
   static currentData = [];
   static currentPage = 1;
   static itemsPerPage = 8;
   static currentSortType = 'all'; // Default sort/filter type

   static render() {
      return `
      <div class="px-4 md:px-8 py-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
           <div class="flex items-center gap-3">
             <h1 class="text-[24px] font-bold text-[#1E293B]">Knowledge Base</h1>
             <span class="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md text-[13px] font-medium" id="kb-count">0</span>
           </div>
           <button id="add-knowledge-btn" class="w-full md:w-auto flex items-center justify-center gap-2 bg-[#E5A000] hover:bg-[#D49000] text-white px-5 py-2.5 rounded-lg font-semibold transition-all text-[14px]">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M12 5v14M5 12h14"/>
             </svg>
             Add Knowledge
           </button>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
           <div class="relative flex-1">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search by Question, or Key words" class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[14px] placeholder-gray-400" id="kb-search">
           </div>
            <div class="relative" id="kb-sort-container">
               <button id="kb-sort-btn" class="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-[14px] font-medium transition-colors whitespace-nowrap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <line x1="21" y1="10" x2="3" y2="10"></line>
                     <line x1="21" y1="6" x2="3" y2="6"></line>
                     <line x1="21" y1="14" x2="3" y2="14"></line>
                     <line x1="21" y1="18" x2="3" y2="18"></line>
                  </svg>
                  <span>Filter: <span id="kb-sort-label" class="font-bold text-[#E5A000]">All</span></span>
               </button>
               
               <!-- Sort Dropdown Menu -->
               <div id="kb-sort-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 overflow-hidden">
                  <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors active-filter" data-sort="all">
                     <span class="w-2 h-2 rounded-full bg-gray-300"></span>
                     All Types
                  </button>
                  <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" data-sort="pdf">
                     <span class="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
                     PDF Files
                  </button>
                  <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" data-sort="csv">
                     <span class="w-2 h-2 rounded-full bg-[#10B981]"></span>
                     CSV Files
                  </button>
                  <button class="w-full px-4 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors" data-sort="manual">
                     <span class="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                     Manual Entries
                  </button>
               </div>
            </div>
         </div>

        <div class="bg-white border border-gray-200 rounded-2xl overflow-x-auto mb-6 shadow-sm pb-32 min-h-[400px]">
           <table class="w-full min-w-[800px]">
              <thead class="bg-gray-50/50 border-b border-gray-100">
                 <tr>
                    <th class="w-16 p-5 text-center">
                       <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer">
                    </th>
                    <th class="text-left py-5 px-2 text-[13px] font-semibold text-gray-500">Question</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Answer</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Type</th>
                    <th class="text-left py-5 px-4 text-[13px] font-semibold text-gray-500">Last Updated</th>
                    <th class="w-16 p-5"></th>
                 </tr>
              </thead>
              <tbody class="divide-y divide-gray-100" id="kb-table-body">
                 <tr>
                    <td colspan="6" class="p-4 text-center text-gray-400 text-sm">Loading...</td>
                 </tr>
              </tbody>
           </table>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-medium text-gray-600 px-2 mt-4">
           <div class="flex items-center gap-3">
              <span id="kb-page-info">Page 1 of 1</span>
              <div class="relative">
                 <select class="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-gray-300 cursor-pointer text-gray-700 text-[13px]" id="kb-items-per-page">
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
              <span id="kb-page-info2" class="hidden md:inline">Page 1 of 1</span>
              <div class="flex items-center gap-1">
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" id="kb-first-page" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" id="kb-prev-page" disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors" id="kb-next-page">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                 </button>
                 <button class="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors" id="kb-last-page">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                 </button>
              </div>
           </div>
        </div>

        ${this.renderModalPlaceholder()}
      </div>
    `;
   }

   static renderRows(data = []) {
      if (data.length === 0) {
         return '<tr><td colspan="6" class="p-4 text-center text-gray-400 text-sm">No knowledge items found</td></tr>';
      }

      return data.map(row => `
      <tr class="group hover:bg-gray-50/50 transition-colors" data-id="${this.escapeHtml(row.id)}">
        <td class="p-5 text-center">
           <input type="checkbox" class="w-5 h-5 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity">
        </td>
        <td class="py-5 px-2">
           <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E5A000] to-[#D49000] flex items-center justify-center text-white text-[14px] font-bold shrink-0">
                Q
             </div>
             <span class="text-[15px] font-semibold text-gray-700 max-w-[200px] truncate">${this.escapeHtml(row.question)}</span>
           </div>
        </td>
        <td class="py-5 px-4 text-[14px] text-gray-600 font-medium max-w-[300px] truncate">${this.escapeHtml(row.answer)}</td>
        <td class="py-5 px-4">
           <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${this.getTypeBadgeClass(row.type)}">
              ${this.formatType(row.type)}
           </span>
        </td>
        <td class="py-5 px-4 text-[14px] text-gray-500 whitespace-nowrap">${this.formatDate(row.updatedAt)}</td>
        <td class="p-5 text-center">
           <div class="relative inline-block">
              <button class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all kb-row-menu" data-id="${this.escapeHtml(row.id)}">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                 </svg>
              </button>
           </div>
        </td>
      </tr>
`).join('');
   }
   static getTypeBadgeClass(type) {
      const classes = {
         'manual': 'bg-blue-100 text-blue-700',
         'csv': 'bg-green-100 text-green-700',
         'pdf': 'bg-purple-100 text-purple-700',
      };
      return classes[type] || 'bg-gray-100 text-gray-700';
   }

   static formatType(type) {
      const types = {
         'manual': 'Manual',
         'csv': 'CSV',
         'pdf': 'PDF'
      };
      return types[type] || type;
   }

   static escapeHtml(text) {
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
      } catch (error) {
         return dateStr;
      }
   }

   static renderModalPlaceholder() {
      return ``;
   }

   static async loadDocuments() {
      try {
         console.log('Loading knowledge items...');
         const response = await fetch('/api/knowledge');

         if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
         }

         const result = await response.json();

         if (result.success) {
            this.allDocuments = result.data || [];
            this.currentData = this.allDocuments;

            // Clear search when reloading
            const searchInput = document.getElementById('kb-search');
            if (searchInput) searchInput.value = '';

            this.applyFilters();
         } else {
            throw new Error(result.error || 'Failed to load knowledge items');
         }
      } catch (error) {
         console.error('Failed to load documents:', error);
         const tableBody = document.getElementById('kb-table-body');
         if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500 text-sm">Failed to load knowledge items. Please try again later.</td></tr>';
         }
      }
   }

   static updateTable() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      const pageData = this.currentData.slice(start, end);
      const totalPages = Math.ceil(this.currentData.length / this.itemsPerPage) || 1;

      // Update count
      const countEl = document.getElementById('kb-count');
      if (countEl) countEl.textContent = this.currentData.length;

      // Update rows
      const tableBody = document.getElementById('kb-table-body');
      if (tableBody) {
         tableBody.innerHTML = this.renderRows(pageData);
      }

      // Update page info
      const info1 = document.getElementById('kb-page-info');
      const info2 = document.getElementById('kb-page-info2');
      const pageStr = `Page ${this.currentPage} of ${totalPages}`;
      if (info1) info1.textContent = pageStr;
      if (info2) info2.textContent = pageStr;

      // Update buttons state
      const firstPageBtn = document.getElementById('kb-first-page');
      const prevPageBtn = document.getElementById('kb-prev-page');
      const nextPageBtn = document.getElementById('kb-next-page');
      const lastPageBtn = document.getElementById('kb-last-page');

      if (firstPageBtn) firstPageBtn.disabled = this.currentPage === 1;
      if (prevPageBtn) prevPageBtn.disabled = this.currentPage === 1;
      if (nextPageBtn) nextPageBtn.disabled = this.currentPage >= totalPages;
      if (lastPageBtn) lastPageBtn.disabled = this.currentPage >= totalPages;

      this.attachRowMenuListeners();
   }

   static attachRowMenuListeners() {
      const menuButtons = document.querySelectorAll('.kb-row-menu');
      menuButtons.forEach(btn => {
         btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            this.showRowMenu(btn, id);
         });
      });
   }

   static showRowMenu(button, itemId) {
      // Remove any existing menu
      const existingMenu = document.querySelector('.kb-context-menu');
      if (existingMenu) existingMenu.remove();

      // Find the item to check its type
      const item = this.allDocuments.find(k => String(k.id) === String(itemId));
      const isPdf = item && item.type === 'pdf';

      const menu = document.createElement('div');
      menu.className = 'kb-context-menu absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50';

      // Build menu HTML based on type
      let menuHtml = '';

      if (isPdf) {
         // For PDFs: show only delete (no edit or download)
         menuHtml = `
            <button class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" data-action="delete">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
               </svg>
               Delete
            </button>
         `;
      } else {
         // For Q&A: show edit and delete
         menuHtml = `
            <button class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" data-action="edit">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
               </svg>
               Edit
            </button>
            <button class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" data-action="delete">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
               </svg>
               Delete
            </button>
         `;
      }

      menu.innerHTML = menuHtml;

      button.parentElement.appendChild(menu);

      menu.querySelectorAll('button').forEach(btn => {
         btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            menu.remove();

            if (action === 'edit') {
               await this.editKnowledgeItem(itemId);
            } else if (action === 'delete') {
               this.triggerDeleteModal(itemId);
            }
         });
      });

      // Close menu when clicking elsewhere
      setTimeout(() => {
         document.addEventListener('click', () => {
            menu.remove();
         }, { once: true });
      }, 0);
   }

   static triggerDeleteModal(itemId) {
      this.pendingDeleteId = itemId;
      this.openDeleteModal();
   }

   static async editKnowledgeItem(itemId) {
      const item = this.allDocuments.find(k => String(k.id) === String(itemId));
      if (item) {
         this.openEditModal(item);
      }
   }

   static showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-[200] transition-all duration-300 transform translate-y-[-20px] opacity-0 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
         }`;
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

   static afterRender() {
      this.loadDocuments();
      this.setupPaginationListeners();
      this.setupSearchListener();
      this.setupSortListener();
      this.injectModal();
   }

   static setupPaginationListeners() {
      const firstPageBtn = document.getElementById('kb-first-page');
      const prevPageBtn = document.getElementById('kb-prev-page');
      const nextPageBtn = document.getElementById('kb-next-page');
      const lastPageBtn = document.getElementById('kb-last-page');
      const itemsPerPageSelect = document.getElementById('kb-items-per-page');

      if (firstPageBtn) {
         firstPageBtn.addEventListener('click', () => {
            this.currentPage = 1;
            this.updateTable();
         });
      }

      if (prevPageBtn) {
         prevPageBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
               this.currentPage--;
               this.updateTable();
            }
         });
      }

      if (nextPageBtn) {
         nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(this.currentData.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
               this.currentPage++;
               this.updateTable();
            }
         });
      }

      if (lastPageBtn) {
         lastPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(this.currentData.length / this.itemsPerPage);
            this.currentPage = totalPages;
            this.updateTable();
         });
      }

      if (itemsPerPageSelect) {
         itemsPerPageSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.updateTable();
         });
      }
   }

   static setupSearchListener() {
      const searchInput = document.getElementById('kb-search');
      if (!searchInput) return;

      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
         clearTimeout(searchTimeout);
         searchTimeout = setTimeout(() => {
            this.applyFilters();
         }, 300);
      });
   }

   static setupSortListener() {
      const sortBtn = document.getElementById('kb-sort-btn');
      const sortMenu = document.getElementById('kb-sort-menu');
      if (!sortBtn || !sortMenu) return;

      sortBtn.addEventListener('click', (e) => {
         e.stopPropagation();
         sortMenu.classList.toggle('hidden');
      });

      sortMenu.querySelectorAll('button').forEach(btn => {
         btn.addEventListener('click', (e) => {
            const sortType = btn.getAttribute('data-sort');
            this.handleSort(sortType);
            sortMenu.classList.add('hidden');
         });
      });

      document.addEventListener('click', (e) => {
         if (!sortMenu.contains(e.target) && e.target !== sortBtn) {
            sortMenu.classList.add('hidden');
         }
      });
   }

   static handleSort(type) {
      this.currentSortType = type;
      const labelEl = document.getElementById('kb-sort-label');
      if (labelEl) {
         const labels = {
            'all': 'All',
            'pdf': 'PDF',
            'csv': 'CSV',
            'manual': 'Manual'
         };
         labelEl.textContent = labels[type] || 'All';
      }
      this.currentPage = 1; // Reset to first page when filtering
      this.applyFilters();
   }

   static applyFilters() {
      const searchInput = document.getElementById('kb-search');
      const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

      let filtered = [...this.allDocuments];

      // Apply Type Filter
      if (this.currentSortType && this.currentSortType !== 'all') {
         filtered = filtered.filter(item => item.type === this.currentSortType);
      }

      // Apply Search Filter
      if (searchTerm) {
         filtered = filtered.filter(item =>
            (item.question && item.question.toLowerCase().includes(searchTerm)) ||
            (item.answer && item.answer.toLowerCase().includes(searchTerm))
         );
      }

      // Default sort by updatedAt desc for the resulting set
      filtered.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

      this.currentData = filtered;
      this.updateTable();
   }

   static injectModal() {
      const modalHtml = `
      <div id="add-modal" class="fixed inset-0 z-[100] hidden transition-opacity duration-300 opacity-0" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div id="modal-backdrop" class="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

        <div id="modal-container" class="absolute inset-0 z-10 overflow-y-auto flex items-center justify-center p-4">
            <div id="modal-panel" class="relative transform overflow-hidden rounded-[24px] bg-white text-left shadow-2xl transition-all w-full max-w-[600px] scale-95 opacity-0 duration-300 p-8">
              <button id="modal-close-btn" class="absolute right-8 top-8 text-gray-400 hover:text-gray-600 transition-colors z-20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div id="modal-view-selection">
                 <div class="mb-6">
                    <h3 class="text-[20px] font-bold text-gray-900 mb-1">Add knowledge</h3>
                    <p class="text-[14px] text-gray-500">Choose how you want to provide the AI with knowledge.</p>
                 </div>

                 <div class="space-y-3">
                    <button id="btn-add-manual" class="w-full flex items-center gap-4 p-4 rounded-xl border border-black hover:bg-gray-50 transition-all text-left group bg-white shadow-sm">
                       <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                             <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>
                       </div>
                       <div>
                          <p class="text-[14px] font-bold text-gray-900">Add manually</p>
                          <p class="text-[12px] text-gray-500">Manually write your own specific Q&A</p>
                       </div>
                    </button>

                    <button id="btn-add-csv" class="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group">
                       <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                             <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                             <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                             <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                          </svg>
                       </div>
                       <div>
                          <p class="text-[14px] font-bold text-gray-900">Import from .CSV file</p>
                          <p class="text-[12px] text-gray-500">Add multiple Q&As from .CSV file at once.</p>
                       </div>
                    </button>

                    <button id="btn-add-pdf" class="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group">
                       <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                             <polyline points="14 2 14 8 20 8"></polyline>
                             <line x1="16" y1="13" x2="8" y2="13"></line>
                             <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                       </div>
                       <div>
                          <p class="text-[14px] font-bold text-gray-900">Import .PDF files</p>
                          <p class="text-[12px] text-gray-500">Upload PDF documents for semantic search</p>
                       </div>
                    </button>
                 </div>
              </div>

              <div id="modal-view-pdf" class="hidden">
                 <div class="mb-6">
                    <div class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-gray-600">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                       </svg>
                    </div>
                    <h3 class="text-[20px] font-bold text-gray-900 mb-1">Import PDF Document</h3>
                    <p class="text-[14px] text-gray-500">Upload a PDF file. Any format is supported - no Q&A structure required.</p>
                 </div>

                 <div id="pdf-upload-area" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#E5A000] transition-colors cursor-pointer bg-gray-50">
                    <input type="file" id="pdf-file-input" accept=".pdf" class="hidden">
                    <div class="flex flex-col items-center">
                       <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-500">
                             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                             <polyline points="17 8 12 3 7 8"></polyline>
                             <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                       </div>
                       <p class="text-[15px] font-semibold text-gray-900 mb-1">Click to upload or drag and drop</p>
                       <p class="text-[13px] text-gray-500">PDF files only</p>
                    </div>
                 </div>

                 <div id="pdf-file-preview" class="hidden mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div class="flex items-center justify-between">
                       <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-600">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 9 20 9"></polyline>
                             </svg>
                          </div>
                          <div>
                             <p id="pdf-file-name" class="text-[14px] font-semibold text-gray-900 truncate max-w-[200px]"></p>
                             <p id="pdf-file-size" class="text-[12px] text-gray-500"></p>
                          </div>
                       </div>
                       <button id="pdf-file-remove" class="text-gray-400 hover:text-red-500 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                             <line x1="18" y1="6" x2="6" y2="18"></line>
                             <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                       </button>
                    </div>
                 </div>

                 <div class="mt-6 space-y-4">
                    <input type="text" id="pdf-title-input" placeholder="Document title (optional)" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] text-[14px]">
                    <textarea id="pdf-description-input" placeholder="Document description (optional)" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] text-[14px] resize-none h-24"></textarea>
                 </div>

                 <div id="pdf-upload-progress" class="hidden mt-4">
                    <div class="flex items-center justify-between mb-2">
                       <span class="text-[13px] font-semibold text-gray-700">Uploading...</span>
                       <span id="pdf-progress-percent" class="text-[13px] font-semibold text-[#E5A000]">0%</span>
                    </div>
                    <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                       <div id="pdf-progress-bar" class="h-full bg-[#E5A000] transition-all duration-300" style="width: 0%"></div>
                    </div>
                 </div>

                 <div class="mt-6 flex gap-3">
                    <button id="pdf-cancel-btn" class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors text-[14px]">Cancel</button>
                    <button id="btn-pdf-upload" disabled class="flex-1 px-4 py-2.5 bg-[#E5A000] hover:bg-[#D49000] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-[14px]">Upload PDF</button>
                 </div>
              </div>

              <div id="modal-view-csv" class="hidden">
                 <div class="mb-6">
                    <div class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-gray-600">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                       </svg>
                    </div>
                    <h3 class="text-[20px] font-bold text-gray-900 mb-1">Import from CSV</h3>
                    <p class="text-[14px] text-gray-500">Upload a .CSV file with 'question' and 'answer' columns.</p>
                 </div>

                 <div id="csv-upload-area" class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#E5A000] transition-colors cursor-pointer bg-gray-50">
                    <input type="file" id="csv-file-input" accept=".csv" class="hidden">
                    <div class="flex flex-col items-center">
                       <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-500">
                             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                             <polyline points="17 8 12 3 7 8"></polyline>
                             <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                       </div>
                       <p class="text-[15px] font-semibold text-gray-900 mb-1">Click to upload or drag and drop</p>
                       <p class="text-[13px] text-gray-500">CSV file format: question,answer</p>
                    </div>
                 </div>

                 <div id="csv-file-preview" class="hidden mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div class="flex items-center justify-between">
                       <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-600">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                             </svg>
                          </div>
                          <div>
                             <p id="csv-file-name" class="text-[14px] font-semibold text-gray-900 truncate max-w-[200px]"></p>
                             <p id="csv-file-info" class="text-[12px] text-gray-500"></p>
                          </div>
                       </div>
                       <button id="csv-file-remove" class="text-gray-400 hover:text-red-500 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                             <line x1="18" y1="6" x2="6" y2="18"></line>
                             <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                       </button>
                    </div>
                 </div>

                 <div id="csv-upload-progress" class="hidden mt-4">
                    <div class="flex items-center justify-between mb-2">
                       <span class="text-[13px] font-semibold text-gray-700">Uploading...</span>
                       <span id="csv-progress-percent" class="text-[13px] font-semibold text-[#E5A000]">0%</span>
                    </div>
                    <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                       <div id="csv-progress-bar" class="h-full bg-[#E5A000] transition-all duration-300" style="width: 0%"></div>
                    </div>
                 </div>

                 <div class="flex items-center gap-4 mt-8">
                    <button id="btn-csv-cancel" class="flex-1 py-3.5 rounded-full border border-gray-200 text-[15px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
                    <button id="btn-csv-upload" class="flex-1 py-3.5 rounded-full text-[15px] font-bold text-white bg-[#E5A000] hover:bg-[#D49000] shadow-sm transition-all shadow-[#E5A000]/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled>Upload CSV</button>
                 </div>
              </div>

              <div id="modal-view-manual" class="hidden">
                 <div class="mb-6">
                    <div class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-gray-600">
                       <img src="../image/flag-05.svg" alt="flag" width="24" height="24">
                    </div>
                    <h3 class="text-[20px] font-bold text-gray-900 mb-1">Add Knowledge Manually</h3>
                    <p class="text-[14px] text-gray-500">Add the question and answer in the provided text fields.</p>
                 </div>

                 <div class="space-y-5">
                    <div>
                       <label class="block text-[13px] font-semibold text-gray-700 mb-2">Question*</label>
                       <input id="manual-question-input" type="text" placeholder="What is your Question?" class="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[15px] placeholder-gray-400">
                    </div>
                    <div>
                       <label class="block text-[13px] font-semibold text-gray-700 mb-2">Answer*</label>
                       <textarea id="manual-answer-input" rows="5" placeholder="Write your answer for the question here...." class="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[15px] placeholder-gray-400 resize-none"></textarea>
                    </div>
                 </div>

                 <div class="flex items-center gap-4 mt-8">
                    <button id="btn-manual-cancel" class="flex-1 py-3.5 rounded-full border border-gray-200 text-[15px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
                    <button id="btn-manual-submit" class="flex-1 py-3.5 rounded-full text-[15px] font-bold text-white bg-[#E5A000] hover:bg-[#D49000] shadow-sm transition-all shadow-[#E5A000]/20">Confirm</button>
                 </div>
              </div>

              <div id="modal-view-edit" class="hidden">
                 <div class="mb-6">
                    <div class="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center mb-4 text-gray-600">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                       </svg>
                    </div>
                    <h3 class="text-[20px] font-bold text-gray-900 mb-1">Edit Knowledge</h3>
                    <p class="text-[14px] text-gray-500">Update the question and answer.</p>
                 </div>

                 <div class="space-y-5">
                    <div>
                       <label class="block text-[13px] font-semibold text-gray-700 mb-2">Question*</label>
                       <input id="edit-question-input" type="text" placeholder="What is your Question?" class="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[15px] placeholder-gray-400">
                    </div>
                    <div>
                       <label class="block text-[13px] font-semibold text-gray-700 mb-2">Answer*</label>
                       <textarea id="edit-answer-input" rows="5" placeholder="Write your answer for the question here...." class="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E5A000] focus:ring-1 focus:ring-[#E5A000] transition-all bg-white text-[15px] placeholder-gray-400 resize-none"></textarea>
                    </div>
                 </div>

                 <div class="flex items-center gap-4 mt-8">
                    <button id="btn-edit-cancel" class="flex-1 py-3.5 rounded-full border border-gray-200 text-[15px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
                    <button id="btn-edit-submit" class="flex-1 py-3.5 rounded-full text-[15px] font-bold text-white bg-[#E5A000] hover:bg-[#D49000] shadow-sm transition-all shadow-[#E5A000]/20">Save Changes</button>
                 </div>
              </div>

              <div id="modal-view-delete" class="hidden text-center">
                 <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <polyline points="3 6 5 6 21 6"></polyline>
                       <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                 </div>
                 <h3 class="text-[24px] font-bold text-gray-900 mb-2">Delete Knowledge?</h3>
                 <p class="text-[15px] text-gray-500 mb-8 px-4">This action cannot be undone. This item will be permanently removed from your knowledge base.</p>
                 <div class="flex items-center gap-4">
                    <button id="btn-delete-cancel" class="flex-1 py-4 rounded-full border border-gray-200 text-[15px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">No, keep it</button>
                    <button id="btn-delete-confirm" class="flex-1 py-4 rounded-full text-[15px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-all shadow-red-500/20">Yes, delete</button>
                 </div>
              </div>

            </div>
        </div>
      </div>
    `;

      // Remove existing if any
      const existingModal = document.getElementById('add-modal');
      if (existingModal) existingModal.remove();

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // DOM Elements
      const modal = document.getElementById('add-modal');
      const modalPanel = document.getElementById('modal-panel');
      const modalContainer = document.getElementById('modal-container');
      const openBtn = document.getElementById('add-knowledge-btn');
      const closeBtn = document.getElementById('modal-close-btn');
      const backdrop = document.getElementById('modal-backdrop');

      const viewSelection = document.getElementById('modal-view-selection');
      const viewManual = document.getElementById('modal-view-manual');
      const viewCsv = document.getElementById('modal-view-csv');
      const viewPdf = document.getElementById('modal-view-pdf');
      const viewEdit = document.getElementById('modal-view-edit');
      const viewDelete = document.getElementById('modal-view-delete');

      const btnAddManual = document.getElementById('btn-add-manual');
      const btnAddCsv = document.getElementById('btn-add-csv');
      const btnAddPdf = document.getElementById('btn-add-pdf');
      const btnManualCancel = document.getElementById('btn-manual-cancel');
      const btnManualSubmit = document.getElementById('btn-manual-submit');
      const btnCsvCancel = document.getElementById('btn-csv-cancel');
      const btnCsvUpload = document.getElementById('btn-csv-upload');
      const btnPdfCancel = document.getElementById('pdf-cancel-btn');
      const btnPdfUpload = document.getElementById('btn-pdf-upload');
      const btnEditCancel = document.getElementById('btn-edit-cancel');
      const btnEditSubmit = document.getElementById('btn-edit-submit');
      const btnDeleteCancel = document.getElementById('btn-delete-cancel');
      const btnDeleteConfirm = document.getElementById('btn-delete-confirm');

      const csvUploadArea = document.getElementById('csv-upload-area');
      const csvFileInput = document.getElementById('csv-file-input');
      const csvFilePreview = document.getElementById('csv-file-preview');
      const csvFileName = document.getElementById('csv-file-name');
      const csvFileInfo = document.getElementById('csv-file-info');
      const csvFileRemove = document.getElementById('csv-file-remove');
      const csvUploadProgress = document.getElementById('csv-upload-progress');
      const csvProgressBar = document.getElementById('csv-progress-bar');
      const csvProgressPercent = document.getElementById('csv-progress-percent');

      const pdfUploadArea = document.getElementById('pdf-upload-area');
      const pdfFileInput = document.getElementById('pdf-file-input');
      const pdfFilePreview = document.getElementById('pdf-file-preview');
      const pdfFileName = document.getElementById('pdf-file-name');
      const pdfFileSize = document.getElementById('pdf-file-size');
      const pdfFileRemove = document.getElementById('pdf-file-remove');
      const pdfUploadProgress = document.getElementById('pdf-upload-progress');
      const pdfProgressBar = document.getElementById('pdf-progress-bar');
      const pdfProgressPercent = document.getElementById('pdf-progress-percent');
      const pdfTitleInput = document.getElementById('pdf-title-input');
      const pdfDescriptionInput = document.getElementById('pdf-description-input');

      const manualQuestionInput = document.getElementById('manual-question-input');
      const manualAnswerInput = document.getElementById('manual-answer-input');
      const editQuestionInput = document.getElementById('edit-question-input');
      const editAnswerInput = document.getElementById('edit-answer-input');

      let selectedCsvFile = null;
      let selectedPdfFile = null;
      let editingItemId = null;

      const openModal = () => {
         modal.classList.remove('hidden');
         setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalPanel.classList.remove('scale-95', 'opacity-0');
            modalPanel.classList.add('scale-100', 'opacity-100');
         }, 10);
      };

      const closeModal = () => {
         modal.classList.add('opacity-0');
         modalPanel.classList.remove('scale-100', 'opacity-100');
         modalPanel.classList.add('scale-95', 'opacity-0');
         setTimeout(() => {
            modal.classList.add('hidden');
            [viewSelection, viewManual, viewCsv, viewPdf, viewEdit, viewDelete].forEach(v => v.classList.add('hidden'));
            viewSelection.classList.remove('hidden');

            // Reset fields
            if (manualQuestionInput) manualQuestionInput.value = '';
            if (manualAnswerInput) manualAnswerInput.value = '';
            if (editQuestionInput) editQuestionInput.value = '';
            if (editAnswerInput) editAnswerInput.value = '';
            if (pdfTitleInput) pdfTitleInput.value = '';
            if (pdfDescriptionInput) pdfDescriptionInput.value = '';

            selectedCsvFile = null;
            selectedPdfFile = null;
            if (csvFilePreview) csvFilePreview.classList.add('hidden');
            if (pdfFilePreview) pdfFilePreview.classList.add('hidden');
            if (btnCsvUpload) btnCsvUpload.disabled = true;
            if (btnPdfUpload) btnPdfUpload.disabled = true;
            editingItemId = null;
            this.pendingDeleteId = null;
         }, 300);
      };

      const showView = (viewToShow) => {
         [viewSelection, viewManual, viewCsv, viewPdf, viewEdit, viewDelete].forEach(v => v.classList.add('hidden'));
         viewToShow.classList.remove('hidden');
      };

      // Close when clicking blank area (container or backdrop)
      modalContainer.addEventListener('click', (e) => {
         if (e.target === modalContainer) closeModal();
      });
      backdrop.addEventListener('click', closeModal);

      const handleCsvFileSelect = (file) => {
         if (!file || !file.name.endsWith('.csv')) {
            this.showToast('Please select a valid CSV file', 'error');
            return;
         }

         selectedCsvFile = file;
         csvFileName.textContent = file.name;
         csvFileInfo.textContent = `${(file.size / 1024).toFixed(2)} KB`;
         csvFilePreview.classList.remove('hidden');
         btnCsvUpload.disabled = false;
      };

      const handlePdfFileSelect = (file) => {
         if (!file || !file.name.endsWith('.pdf')) {
            this.showToast('Please select a valid PDF file', 'error');
            return;
         }

         selectedPdfFile = file;
         pdfFileName.textContent = file.name;
         pdfFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
         pdfFilePreview.classList.remove('hidden');
         btnPdfUpload.disabled = false;
      };

      const parseCSVLine = (line) => {
         const result = [];
         let current = '';
         let insideQuotes = false;

         for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
               if (insideQuotes && nextChar === '"') {
                  current += '"';
                  i++;
               } else {
                  insideQuotes = !insideQuotes;
               }
            } else if (char === ',' && !insideQuotes) {
               result.push(current.trim());
               current = '';
            } else {
               current += char;
            }
         }
         result.push(current.trim());
         return result;
      };

      const parseCsvFile = (file) => {
         return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
               try {
                  const text = e.target.result;
                  const lines = text.split('\n').filter(line => line.trim());

                  if (lines.length < 2) {
                     reject(new Error('CSV file must contain headers and at least one data row'));
                     return;
                  }

                  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
                  const qIdx = headers.indexOf('question');
                  const aIdx = headers.indexOf('answer');

                  if (qIdx === -1 || aIdx === -1) {
                     reject(new Error('CSV must have "question" and "answer" columns'));
                     return;
                  }

                  const items = [];
                  for (let i = 1; i < lines.length; i++) {
                     const values = parseCSVLine(lines[i]);
                     if (values.length >= Math.max(qIdx, aIdx) + 1) {
                        let q = values[qIdx]?.trim();
                        let a = values[aIdx]?.trim();

                        // Clean quotes if wrapped
                        if (q?.startsWith('"') && q?.endsWith('"')) q = q.slice(1, -1);
                        if (a?.startsWith('"') && a?.endsWith('"')) a = a.slice(1, -1);

                        if (q && a) {
                           items.push({ question: q, answer: a });
                        }
                     }
                  }
                  resolve(items);
               } catch (err) {
                  reject(err);
               }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
         });
      };

      const uploadCsvFile = async () => {
         if (!selectedCsvFile) return;

         try {
            btnCsvUpload.disabled = true;
            btnCsvUpload.textContent = 'Processing...';
            csvUploadProgress.classList.remove('hidden');

            csvProgressBar.style.width = '30%';
            csvProgressPercent.textContent = '30%';

            const items = await parseCsvFile(selectedCsvFile);

            csvProgressBar.style.width = '60%';
            csvProgressPercent.textContent = '60%';

            const response = await fetch('/api/knowledge/upload/csv', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ items })
            });

            if (!response.ok) {
               const error = await response.json();
               throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            csvProgressBar.style.width = '100%';
            csvProgressPercent.textContent = '100%';

            setTimeout(() => {
               closeModal();
               this.showToast(result.data?.successful ? `Imported ${result.data.successful} items successfully` : 'Knowledge items uploaded successfully', 'success');
               this.loadDocuments();
            }, 500);

         } catch (error) {
            console.error('CSV upload failed:', error);
            this.showToast(error.message || 'Failed to upload CSV. Please check the file format.', 'error');
            btnCsvUpload.disabled = false;
            btnCsvUpload.textContent = 'Upload CSV';
            csvUploadProgress.classList.add('hidden');
         }
      };

      const uploadPdfFile = async () => {
         if (!selectedPdfFile) return;

         try {
            btnPdfUpload.disabled = true;
            btnPdfUpload.textContent = 'Uploading...';
            pdfUploadProgress.classList.remove('hidden');

            pdfProgressBar.style.width = '30%';
            pdfProgressPercent.textContent = '30%';

            // Read file as base64
            const reader = new FileReader();
            reader.onload = async () => {
               try {
                  const base64Content = reader.result.split(',')[1]; // Extract base64 part

                  pdfProgressBar.style.width = '60%';
                  pdfProgressPercent.textContent = '60%';

                  const response = await fetch('/api/knowledge/upload/pdf', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                        filename: selectedPdfFile.name,
                        content: base64Content,
                        title: pdfTitleInput.value || selectedPdfFile.name,
                        description: pdfDescriptionInput.value
                     })
                  });

                  if (!response.ok) {
                     const error = await response.json();
                     throw new Error(error.error || `HTTP error! status: ${response.status}`);
                  }

                  const result = await response.json();

                  pdfProgressBar.style.width = '100%';
                  pdfProgressPercent.textContent = '100%';

                  setTimeout(() => {
                     closeModal();
                     this.showToast('PDF uploaded successfully', 'success');
                     this.loadDocuments();
                  }, 500);

               } catch (error) {
                  console.error('PDF upload failed:', error);
                  this.showToast(error.message || 'Failed to upload PDF', 'error');
                  btnPdfUpload.disabled = false;
                  btnPdfUpload.textContent = 'Upload PDF';
                  pdfUploadProgress.classList.add('hidden');
               }
            };
            reader.readAsDataURL(selectedPdfFile);

         } catch (error) {
            console.error('PDF upload error:', error);
            this.showToast(error.message || 'Failed to upload PDF', 'error');
            btnPdfUpload.disabled = false;
            btnPdfUpload.textContent = 'Upload PDF';
            pdfUploadProgress.classList.add('hidden');
         }
      };

      const saveManualEntry = async () => {
         const question = manualQuestionInput.value.trim();
         const answer = manualAnswerInput.value.trim();

         if (!question || !answer) {
            this.showToast('Please fill in both question and answer', 'error');
            return;
         }

         try {
            btnManualSubmit.disabled = true;
            btnManualSubmit.textContent = 'Saving...';

            const response = await fetch('/api/knowledge', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  question,
                  answer,
                  type: 'manual'
               })
            });

            const result = await response.json();

            if (result.success) {
               closeModal();
               this.showToast('Knowledge item added successfully', 'success');
               await this.loadDocuments();
            } else {
               throw new Error(result.error || 'Failed to save');
            }
         } catch (error) {
            console.error('Manual save failed:', error);
            this.showToast(error.message || 'Failed to save knowledge item', 'error');
         } finally {
            btnManualSubmit.disabled = false;
            btnManualSubmit.textContent = 'Confirm';
         }
      };

      const saveEditEntry = async () => {
         const question = editQuestionInput.value.trim();
         const answer = editAnswerInput.value.trim();

         if (!question || !answer || !editingItemId) return;

         try {
            btnEditSubmit.disabled = true;
            btnEditSubmit.textContent = 'Saving...';

            const response = await fetch(`/api/knowledge/${editingItemId}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ question, answer })
            });

            const result = await response.json();

            if (result.success) {
               closeModal();
               this.showToast('Knowledge item updated successfully', 'success');
               await this.loadDocuments();
            } else {
               throw new Error(result.error || 'Failed to update');
            }
         } catch (error) {
            console.error('Edit save failed:', error);
            this.showToast('Failed to update knowledge item', 'error');
         } finally {
            btnEditSubmit.disabled = false;
            btnEditSubmit.textContent = 'Save Changes';
         }
      };

      const confirmDelete = async () => {
         if (!this.pendingDeleteId) return;

         try {
            btnDeleteConfirm.disabled = true;
            btnDeleteConfirm.textContent = 'Deleting...';

            const response = await fetch(`/api/knowledge/${this.pendingDeleteId}`, {
               method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
               closeModal();
               this.showToast('Knowledge item deleted successfully', 'success');
               await this.loadDocuments();
            } else {
               throw new Error(result.error || 'Failed to delete');
            }
         } catch (error) {
            console.error('Delete failed:', error);
            this.showToast('Failed to delete knowledge item', 'error');
         } finally {
            btnDeleteConfirm.disabled = false;
            btnDeleteConfirm.textContent = 'Delete';
         }
      };

      // Event Listeners
      if (openBtn) openBtn.addEventListener('click', openModal);
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (btnAddManual) btnAddManual.addEventListener('click', () => showView(viewManual));
      if (btnAddCsv) btnAddCsv.addEventListener('click', () => showView(viewCsv));
      if (btnAddPdf) btnAddPdf.addEventListener('click', () => showView(viewPdf));
      if (btnManualCancel) btnManualCancel.addEventListener('click', closeModal);
      if (btnCsvCancel) btnCsvCancel.addEventListener('click', closeModal);
      if (btnPdfCancel) btnPdfCancel.addEventListener('click', closeModal);
      if (btnEditCancel) btnEditCancel.addEventListener('click', closeModal);
      if (btnDeleteCancel) btnDeleteCancel.addEventListener('click', closeModal);
      if (btnManualSubmit) btnManualSubmit.addEventListener('click', saveManualEntry);
      if (btnCsvUpload) btnCsvUpload.addEventListener('click', uploadCsvFile);
      if (btnPdfUpload) btnPdfUpload.addEventListener('click', uploadPdfFile);
      if (btnEditSubmit) btnEditSubmit.addEventListener('click', saveEditEntry);
      if (btnDeleteConfirm) btnDeleteConfirm.addEventListener('click', confirmDelete);

      if (csvUploadArea) {
         csvUploadArea.addEventListener('click', () => csvFileInput.click());
         csvUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            csvUploadArea.classList.add('border-[#E5A000]', 'bg-orange-50');
         });
         csvUploadArea.addEventListener('dragleave', () => {
            csvUploadArea.classList.remove('border-[#E5A000]', 'bg-orange-50');
         });
         csvUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            csvUploadArea.classList.remove('border-[#E5A000]', 'bg-orange-50');
            if (e.dataTransfer.files.length > 0) {
               handleCsvFileSelect(e.dataTransfer.files[0]);
            }
         });
      }

      if (csvFileInput) {
         csvFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
               handleCsvFileSelect(e.target.files[0]);
            }
         });
      }

      if (csvFileRemove) {
         csvFileRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedCsvFile = null;
            csvFileInput.value = '';
            csvFilePreview.classList.add('hidden');
            btnCsvUpload.disabled = true;
         });
      }

      if (pdfUploadArea) {
         pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
         pdfUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            pdfUploadArea.classList.add('border-[#E5A000]', 'bg-orange-50');
         });
         pdfUploadArea.addEventListener('dragleave', () => {
            pdfUploadArea.classList.remove('border-[#E5A000]', 'bg-orange-50');
         });
         pdfUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            pdfUploadArea.classList.remove('border-[#E5A000]', 'bg-orange-50');
            if (e.dataTransfer.files.length > 0) {
               handlePdfFileSelect(e.dataTransfer.files[0]);
            }
         });
      }

      if (pdfFileInput) {
         pdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
               handlePdfFileSelect(e.target.files[0]);
            }
         });
      }

      if (pdfFileRemove) {
         pdfFileRemove.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedPdfFile = null;
            pdfFileInput.value = '';
            pdfFilePreview.classList.add('hidden');
            btnPdfUpload.disabled = true;
         });
      }

      // Helper methods exposed
      this.openEditModal = (item) => {
         editingItemId = item.id;
         editQuestionInput.value = item.question;
         editAnswerInput.value = item.answer;
         openModal();
         showView(viewEdit);
      };

      this.openDeleteModal = () => {
         openModal();
         showView(viewDelete);
      };
   }
}