class Conversations {
   static allConversations = [];
   static selectedIds = new Set();
   static currentConversationId = null;

   // Pagination State
   static currentPage = 1;
   static itemsPerPage = 20;
   static totalItems = 0;
   static totalPages = 1;

   static render() {
      return `
      <div class="flex h-[calc(100vh-70px)] bg-white responsive-conversations-container">
        <!-- Messages Sidebar (Left) -->
        <div class="w-[380px] flex flex-col border-r border-gray-100 flex-shrink-0 responsive-conversations-list relative z-10">
          <div class="p-6 pb-2">
            <h2 class="text-[20px] font-bold text-gray-900 tracking-tight mb-4">Messages</h2>
            
            <!-- Filter Controls -->
            <div class="flex flex-col gap-3 mb-2">
               <div class="relative">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <circle cx="11" cy="11" r="8"></circle>
                     <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input type="text" id="conv-search" placeholder="Search current page..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#E5A000] transition-all">
               </div>
               
               <div class="flex items-center gap-2">
                  <button id="conv-delete-selected" class="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                     Delete
                  </button>
                  <button id="conv-delete-all" class="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Delete All</button>
               </div>
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto pl-0 space-y-0" id="conversations-list">
            <!-- Conversations will be loaded here by JavaScript -->
            <div class="p-8 text-center">
               <div class="animate-spin inline-block w-6 h-6 border-2 border-gray-200 border-t-[#E5A000] rounded-full mb-2"></div>
               <p class="text-gray-400 text-sm">Loading conversations...</p>
            </div>
          </div>

          <!-- Pagination Footer -->
          <div class="p-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
             <div class="flex justify-between items-center text-[11px] font-medium text-gray-500">
                <span id="conv-page-info">Page 1 of 1</span>
                
                <div class="relative">
                   <select id="conv-limit-select" class="appearance-none bg-white border border-gray-200 rounded px-2 py-1 pr-6 focus:outline-none focus:border-gray-300 cursor-pointer text-gray-700 text-[11px]">
                      <option value="10">10 / page</option>
                      <option value="20" selected>20 / page</option>
                      <option value="50">50 / page</option>
                   </select>
                   <svg class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                   </svg>
                </div>
             </div>
             
             <div class="flex items-center justify-between gap-1">
                <button id="conv-first-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
                </button>
                <button id="conv-prev-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button id="conv-next-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
                <button id="conv-last-btn" class="flex-1 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white/50" disabled>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
                </button>
             </div>
          </div>
        </div>

        <!-- Chat Area (Right) -->
            <div class="flex-1 flex flex-col min-w-0 bg-white responsive-conversation-chat relative z-0">
               <!-- Mobile header (Back button + Title) -->
               <div class="conversation-mobile-header" style="display:none; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #E2E8F0; background: #fff; position: sticky; top: 0; z-index: 20;">
                  <button class="back-to-list-btn" aria-label="Back to list" style="background:transparent;border:none;font-size:18px;cursor:pointer;padding:6px;">&larr;</button>
                  <h3 class="conversation-title" style="margin:0;font-size:16px;font-weight:600;">Select a conversation</h3>
                  <div style="width:32px;"></div>
               </div>
               
               <!-- Messages Feed (Empty State Initially) -->
               <div class="flex-1 overflow-y-auto p-8 space-y-8" id="conversation-messages">
                  <div class="flex items-center justify-center h-full text-center">
                     <div>
                        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p class="text-gray-400 text-[14px]">Select a conversation to view messages</p>
                     </div>
                  </div>
               </div>

               <!-- Bottom Action -->
               <div id="join-bar-container" class="join-conversation-bar p-8 border-t border-gray-100 hidden">
                   <button class="w-full bg-[#E5A000] hover:bg-[#D49000] text-white font-bold py-4 rounded-xl shadow-sm transition-all text-[15px]" id="join-conversation-btn" style="display: none;">
                      Join Conversation
                   </button>
               </div>
        </div>
        
        <style>
           .conversation-item.active {
               background-color: #f3f4f6 !important;
               border-left: 4px solid #E5A000 !important;
           }
           @media (max-width: 768px) {
              .responsive-conversation-chat {
                 max-height: 100vh !important;
                 height: calc(100vh - 70px) !important;
                 position: fixed !important;
                 top: 70px !important;
                 left: 0 !important;
                 right: 0 !important;
                 bottom: 0 !important;
                 z-index: 50 !important;
              }
              .responsive-conversations-list {
                 max-height: none !important;
                 width: 100% !important;
              }
           }
        </style>
      </div>
    `;
   }

   static afterRender() {
      this.allConversations = [];
      // Initialize pagination defaults
      this.currentPage = 1;
      this.itemsPerPage = 20;

      this.setupListeners();
      this.loadConversations();
   }

   static setupListeners() {
      // Search listener
      const searchInput = document.getElementById('conv-search');
      if (searchInput) {
         searchInput.addEventListener('input', () => this.filterConversations());
      }

      // Pagination listeners
      const limitSelect = document.getElementById('conv-limit-select');
      if (limitSelect) {
         limitSelect.value = this.itemsPerPage;
         limitSelect.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadConversations();
         });
      }

      document.getElementById('conv-first-btn')?.addEventListener('click', () => { this.currentPage = 1; this.loadConversations(); });
      document.getElementById('conv-prev-btn')?.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; this.loadConversations(); } });
      document.getElementById('conv-next-btn')?.addEventListener('click', () => { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadConversations(); } });
      document.getElementById('conv-last-btn')?.addEventListener('click', () => { this.currentPage = this.totalPages; this.loadConversations(); });
   }

   static async loadConversations() {
      try {
         // Show loading overlay or spinner logic could go here
         const list = document.getElementById('conversations-list');
         if (list) {
            // Only show spinner if we don't have existing content to avoid flash, or show small loading indicator
            // For now, simple spinner if empty
            if (this.allConversations.length === 0) {
               list.innerHTML = `
                  <div class="h-full flex items-center justify-center p-8">
                     <div class="animate-spin inline-block w-6 h-6 border-2 border-gray-200 border-t-[#E5A000] rounded-full"></div>
                  </div>
               `;
            }
         }

         console.log(`📊 Fetching conversations page ${this.currentPage}, limit ${this.itemsPerPage}...`);
         const data = await window.apiService.adminGetConversations(this.currentPage, this.itemsPerPage);

         if (data && (data.success || Array.isArray(data.conversations))) {
            this.allConversations = data.conversations || [];
            this.totalItems = data.total || 0;
            this.totalPages = data.totalPages || Math.ceil(this.totalItems / this.itemsPerPage) || 1;

            this.selectedIds.clear();
            this.renderConversationList(this.allConversations);
            this.updatePaginationControls();

            // Handle deep linking to a specific session
            if (window.app && window.app.currentParams && window.app.currentParams[0]) {
               const sessionId = window.app.currentParams[0];
               // ... deep link logic ...
            }
         } else {
            if (list) list.innerHTML = '<div class="p-8 text-center text-gray-400 text-sm">No conversations found</div>';
         }
      } catch (error) {
         console.error('❌ Failed to load conversations:', error);
         this.showToast('Failed to load conversations', 'error');
         const list = document.getElementById('conversations-list');
         if (list) list.innerHTML = '<div class="p-8 text-center text-red-400 text-sm">Error loading data</div>';
      }
   }

   static updatePaginationControls() {
      const pageInfo = document.getElementById('conv-page-info');
      const firstBtn = document.getElementById('conv-first-btn');
      const prevBtn = document.getElementById('conv-prev-btn');
      const nextBtn = document.getElementById('conv-next-btn');
      const lastBtn = document.getElementById('conv-last-btn');
      const deleteSelectedBtn = document.getElementById('conv-delete-selected');
      const deleteAllBtn = document.getElementById('conv-delete-all');

      if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;

      if (firstBtn) firstBtn.disabled = this.currentPage <= 1;
      if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
      if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
      if (lastBtn) lastBtn.disabled = this.currentPage >= this.totalPages;

      // Update delete buttons state based on availability of data
      if (deleteAllBtn) deleteAllBtn.disabled = this.totalItems === 0;
      if (deleteSelectedBtn) {
         deleteSelectedBtn.disabled = this.selectedIds.size === 0;
         deleteSelectedBtn.innerHTML = this.selectedIds.size > 0
            ? `<span class="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold mr-1">${this.selectedIds.size}</span> Delete`
            : `Delete`;
      }
   }

   static filterConversations() {
      // Client-side search within the current page
      const searchInput = document.getElementById('conv-search');
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

      const filtered = this.allConversations.filter(conv => {
         return conv.title?.toLowerCase().includes(searchTerm) ||
            conv.id.toLowerCase().includes(searchTerm) ||
            (conv.lastMessage && conv.lastMessage.toLowerCase().includes(searchTerm));
      });

      this.renderConversationList(filtered);
   }

   static renderConversationList(conversations) {
      const container = document.getElementById('conversations-list');
      if (!container) return;

      if (conversations.length === 0) {
         container.innerHTML = '<div class="p-8 text-center text-gray-400 text-sm">No conversations on this page</div>';
         return;
      }

      const html = conversations.map((conv) => {
         let startTime;
         if (conv.startedAt && typeof conv.startedAt === 'object' && conv.startedAt._seconds) {
            startTime = new Date(conv.startedAt._seconds * 1000);
         } else if (conv.startedAt && typeof conv.startedAt === 'string') {
            startTime = new Date(conv.startedAt);
         } else {
            startTime = new Date();
         }

         const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         const dateShort = startTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
         const statusIndicator = conv.status === 'active' ? 'bg-[#27ae60]' : conv.status === 'escalated' ? 'bg-[#E5A000]' : 'bg-gray-300';

         let title = conv.title;
         if (!title || title.startsWith('Visitor')) {
            // Fallback for better display
            title = conv.topic || `Chat ${dateShort}`;
         }
         if (!title) title = `Visitor ${conv.id.substring(0, 4)}`;

         const avatarUrl = conv.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`;

         return `
            <div class="group flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-all relative overflow-hidden conversation-item" data-conversation-id="${conv.id}">
               <div class="pt-1" onclick="event.stopPropagation()">
                  <input type="checkbox" class="conv-row-checkbox w-4 h-4 rounded border-gray-300 text-[#E5A000] focus:ring-[#E5A000] cursor-pointer" data-id="${conv.id}" ${this.selectedIds.has(String(conv.id)) ? 'checked' : ''}>
               </div>
               <div class="relative flex-shrink-0">
                 <div class="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                    <img src="${avatarUrl}" alt="${title}" class="w-full h-full object-cover">
                 </div>
                 <div class="absolute bottom-0 right-0 w-2.5 h-2.5 ${statusIndicator} rounded-full border-2 border-white"></div>
               </div>
               <div class="flex-1 min-w-0">
                 <div class="flex justify-between items-baseline mb-0.5">
                   <h3 class="text-[13px] font-bold text-gray-900 truncate pr-2">${this.escapeHtml(title)}</h3>
                   <span class="text-[10px] text-gray-400 font-medium shrink-0">${dateShort}</span>
                 </div>
                 <p class="text-[12px] text-gray-500 truncate leading-relaxed">${this.escapeHtml(conv.lastMessage || 'No messages')}</p>
                 <div class="mt-1 flex items-center gap-2">
                    <span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">${conv.id.substring(0, 6)}...</span>
                 </div>
               </div>
            </div>
         `;
      }).join('');

      container.innerHTML = html;
      this.setupConversationListeners();
   }

   static setupConversationListeners() {
      const conversationItems = document.querySelectorAll('.conversation-item');
      const conversationList = document.querySelector('.responsive-conversations-list');
      const conversationChat = document.querySelector('.responsive-conversation-chat');
      const mobileHeader = document.querySelector('.conversation-mobile-header');
      const sidebar = document.querySelector('.sidebar');
      const backBtn = mobileHeader && mobileHeader.querySelector('.back-to-list-btn');

      const isMobile = () => window.innerWidth <= 768;

      conversationItems.forEach(item => {
         item.addEventListener('click', async () => {
            conversationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const conversationId = item.dataset.conversationId;
            const h3 = item.querySelector('h3');
            const titleText = h3 ? h3.textContent : 'Conversation';

            if (document.querySelector('.conversation-title')) {
               document.querySelector('.conversation-title').textContent = titleText;
            }

            this.currentConversationId = conversationId;
            await this.loadConversationMessages(conversationId);

            if (isMobile()) {
               conversationList.classList.add('hidden');
               conversationChat.classList.add('show');
               if (mobileHeader) mobileHeader.style.display = 'flex';
               if (sidebar) sidebar.style.display = 'none';
            }
         });

         // Context menu for delete
         item.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            const sessionId = item.dataset.conversationId;
            const ok = await this.showConfirm('Delete this conversation?');
            if (ok) {
               await this.deleteConversation(sessionId);
            }
         });
      });

      if (backBtn) {
         backBtn.addEventListener('click', () => {
            if (isMobile()) {
               conversationList.classList.remove('hidden');
               conversationChat.classList.remove('show');
               if (mobileHeader) mobileHeader.style.display = 'none';
               if (sidebar) sidebar.style.display = 'flex';
            }
         });
      }

      // Checkbox listeners
      document.querySelectorAll('.conv-row-checkbox').forEach(cb => {
         cb.addEventListener('change', (e) => {
            const id = cb.dataset.id;
            if (cb.checked) this.selectedIds.add(String(id));
            else this.selectedIds.delete(String(id));

            this.updatePaginationControls(); // Update delete button counts
         });
      });

      // Global delete buttons
      const deleteSelectedBtn = document.getElementById('conv-delete-selected');
      const deleteAllBtn = document.getElementById('conv-delete-all');

      // Remove old listeners to avoid duplicates if re-rendering (though we re-render list not whole container typically)
      // Actually here we are inside setupConversationListeners called by renderConversationList.
      // The buttons are outside the list, so we might want to attach them in setupListeners or ensure we don't duplicate.
      // Better to attach them in setupListeners? 
      // setupListeners is called ONCE in afterRender. 
      // However, deleteSelectedBtn is in the HTML returned by render().
      // WAIT using replaceWith cloneNode logic is safer or just checking if listener attached.

      // Let's attach them in setupListeners (static method)
   }

   static async loadConversationMessages(conversationId) {
      const messagesContainer = document.getElementById('conversation-messages');

      try {
         messagesContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
               <div class="text-center">
                  <div class="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-[#E5A000] rounded-full mb-2"></div>
                  <p class="text-gray-400 text-[14px]">Loading messages...</p>
               </div>
            </div>
         `;

         // Use apiService
         const messages = await window.apiService.getConversationMessages(conversationId);

         if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = `
               <div class="flex items-center justify-center h-full">
                  <p class="text-gray-400 text-[14px]">No messages in this conversation</p>
               </div>
            `;
            return;
         }

         this.renderMessages(messages);
      } catch (error) {
         console.error('Failed to load messages:', error);
         messagesContainer.innerHTML = `
            <div class="flex items-center justify-center h-full text-center">
               <div>
                  <p class="text-red-500 text-[14px]">Failed to load messages</p>
               </div>
            </div>
         `;
      }
   }

   static renderMessages(messages) {
      const messagesContainer = document.getElementById('conversation-messages');
      // ... existing message rendering logic ...
      // Can reuse what was there or simplify

      const html = messages.map(msg => {
         const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         const isUser = msg.sender === 'user';

         if (isUser) {
            return `
               <div class="flex justify-end gap-3 mb-6">
                  <div class="flex flex-col items-end max-w-[85%]">
                     <div class="bg-gray-100 rounded-2xl rounded-tr-sm px-5 py-3">
                        <p class="text-[14px] text-gray-800 leading-relaxed">${this.escapeHtml(msg.content)}</p>
                     </div>
                     <span class="text-[10px] text-gray-400 mt-1 mr-1">${timestamp}</span>
                  </div>
               </div>
             `;
         } else {
            return `
               <div class="flex gap-3 mb-6 max-w-[85%]">
                  <div class="w-8 h-8 rounded-full bg-[#E5A000] flex items-center justify-center flex-shrink-0 text-white shadow-sm overflow-hidden">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                  </div>
                  <div class="flex flex-col">
                     <div class="border border-gray-100 rounded-2xl rounded-tl-sm p-5 shadow-sm bg-white">
                        <p class="text-[14px] text-gray-700 leading-relaxed">${this.escapeHtml(msg.content)}</p>
                     </div>
                     <span class="text-[10px] text-gray-400 mt-1 ml-1">${timestamp}</span>
                  </div>
               </div>
             `;
         }
      }).join('');

      messagesContainer.innerHTML = html;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
   }

   // ... CRUD methods (deleteConversation, deleteSelected, deleteAll, showConfirm, showToast, escapeHtml) ...
   // Re-implementing them to ensure they are present and correct

   static async deleteConversation(sessionId) {
      try {
         const res = await fetch(`/api/conversations/${sessionId}`, { method: 'DELETE' });
         const result = await res.json();
         if (result.success) {
            this.showToast('Conversation deleted', 'success');
            await this.loadConversations();

            // Clear view if deleted currently viewed
            if (this.currentConversationId === sessionId) {
               document.getElementById('conversation-messages').innerHTML = '<div class="flex items-center justify-center h-full"><p class="text-gray-400 text-sm">Select a conversation</p></div>';
            }
         } else {
            this.showToast('Failed to delete', 'error');
         }
      } catch (err) {
         console.error(err);
         this.showToast('Error deleting conversation', 'error');
      }
   }

   static async deleteSelected() {
      if (this.selectedIds.size === 0) return;
      const ok = await this.showConfirm(`Delete ${this.selectedIds.size} conversations?`);
      if (!ok) return;

      try {
         const ids = Array.from(this.selectedIds);
         const res = await fetch('/api/conversations/batch-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
         });
         const result = await res.json();
         if (result.success) {
            this.showToast(`Deleted ${ids.length} conversations`, 'success');
            this.selectedIds.clear();
            await this.loadConversations();
         } else {
            this.showToast('Batch delete failed', 'error');
         }
      } catch (err) {
         console.error(err);
         this.showToast('Error in batch delete', 'error');
      }
   }

   static async deleteAll() {
      const ok = await this.showConfirm('Delete ALL conversations? This cannot be undone.');
      if (!ok) return;

      try {
         const res = await fetch('/api/conversations', { method: 'DELETE' });
         const result = await res.json();
         if (result.success) {
            this.showToast('All conversations deleted', 'success');
            this.selectedIds.clear();
            await this.loadConversations();
         } else {
            this.showToast('Delete all failed', 'error');
         }
      } catch (err) {
         console.error(err);
         this.showToast('Error deleting all', 'error');
      }
   }

   static showConfirm(message) {
      return new Promise((resolve) => {
         const overlay = document.createElement('div');
         overlay.className = 'fixed inset-0 bg-black/40 z-[300] flex items-center justify-center backdrop-blur-sm';

         const modal = document.createElement('div');
         modal.className = 'bg-white rounded-xl p-6 w-[400px] shadow-2xl text-center transform scale-100 transition-all';
         modal.innerHTML = `
            <div class="mb-4 text-amber-500 flex justify-center">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Confirm Action</h3>
            <p class="text-gray-600 mb-6 text-sm">${this.escapeHtml(message)}</p>
            <div class="flex gap-3 justify-center">
               <button class="px-4 py-2 rounded-lg bg-gray-100 font-medium text-gray-700 hover:bg-gray-200 transition-colors" id="confirm-cancel">Cancel</button>
               <button class="px-4 py-2 rounded-lg bg-red-600 font-medium text-white hover:bg-red-700 transition-colors shadow-sm" id="confirm-ok">Delete</button>
            </div>
         `;

         overlay.appendChild(modal);
         document.body.appendChild(overlay);

         const cleanup = (val) => {
            overlay.remove();
            resolve(val);
         };

         overlay.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
         overlay.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
         overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
      });
   }

   static showToast(message, type = 'info') {
      const toast = document.createElement('div');
      const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
      toast.className = `fixed top-6 right-6 px-4 py-3 rounded-lg shadow-xl text-white z-[400] transition-all duration-300 transform translate-y-[-20px] opacity-0 ${colors[type] || colors.info} flex items-center gap-3 font-medium text-sm`;
      toast.innerHTML = `<span>${message}</span>`;
      document.body.appendChild(toast);

      requestAnimationFrame(() => {
         toast.classList.remove('translate-y-[-20px]', 'opacity-0');
      });

      setTimeout(() => {
         toast.classList.add('translate-y-[-10px]', 'opacity-0');
         setTimeout(() => toast.remove(), 300);
      }, 3000);
   }

   static escapeHtml(text) {
      if (!text) return '';
      return text.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
   }
}
