(function () {
  'use strict';

  const CONFIG = {
    widgetId: 'ai-chatbot-widget',
    // Auto-detect the correct API base URL
    apiBaseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'  
      : 'https://chat-bot-service-767432724134.us-west1.run.app'
  };

  async function loadWidgetSettings() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/api/widget-settings`);
      const { success, data } = await response.json();
      
      if (success && data) {
        // Update greeting message
        const greetingText = document.getElementById('greeting-text');
        if (greetingText) {
          greetingText.textContent = data.greetingMessage;
        }

        // Update suggestion chips
        const suggestionsContainer = document.getElementById('initial-suggestions');
        if (suggestionsContainer && data.suggestions && data.suggestions.length > 0) {
          suggestionsContainer.innerHTML = '';
          data.suggestions.forEach((suggestion, index) => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = `${index + 1}. ${suggestion}`;
            chip.onclick = () => window.sendSuggestion(suggestion);
            suggestionsContainer.appendChild(chip);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load widget settings:', error);
      // Keep default values if loading fails
    }
  }

  function initChatbot() {
    if (document.getElementById(CONFIG.widgetId)) return;

    const widgetContainer = document.createElement('div');
    widgetContainer.id = CONFIG.widgetId;
    widgetContainer.innerHTML = getWidgetHTML();
    document.body.appendChild(widgetContainer);

    injectStyles();
    loadWidgetSettings();
    attachEventListeners();

    // Expose sendSuggestion globally
    window.sendSuggestion = (text) => {
      const input = document.getElementById('chatbot-input');
      const sendBtn = document.getElementById('chatbot-send');
      if (input && sendBtn) {
        input.value = text;
        sendBtn.click();
      }
    };
  }

  function getWidgetHTML() {
    return `
      <div class="chatbot-window" id="chatbot-window" style="display: none;">
        <div class="chatbot-header">
          <div class="header-left">
            <div>
              <img src="${CONFIG.apiBaseUrl}/image/image copy.png" alt="Logo" style="width: 100px; height: 100px; object-fit: contain;">
            </div>
      
          </div>
          <div class="header-right">
            <button class="icon-btn" id="chatbot-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div class="chatbot-messages" id="chatbot-messages">
          <div class="chat-intro-text">Welcome to our website! Ask us anything.</div>
          <div class="chatbot-message bot-message" id="initial-greeting">
            <div class="message-content">
              <p id="greeting-text">Hi! How can I support you today?</p>
            </div>
          </div>
          <div class="suggestion-chips" id="initial-suggestions">
            <!-- Suggestions will be loaded dynamically -->
          </div>
        </div>

        <div class="chatbot-input-container">
          <div class="chatbot-input-wrapper">
            <input type="text" class="chatbot-input" placeholder="Message here..." id="chatbot-input" />
            <button class="chatbot-send-btn" id="chatbot-send">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_18_398)">
                  <path d="M11.25 10H6.25" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3.78835 17.2876C3.7444 17.4076 3.73831 17.5382 3.77089 17.6618C3.80347 17.7854 3.87316 17.896 3.97056 17.9787C4.06796 18.0615 4.18839 18.1124 4.31562 18.1246C4.44284 18.1368 4.57075 18.1097 4.6821 18.0469L17.8071 10.5399C17.9048 10.4859 17.9862 10.4066 18.0429 10.3105C18.0996 10.2143 18.1295 10.1047 18.1295 9.99303C18.1295 9.88139 18.0996 9.77178 18.0429 9.67561C17.9862 9.57944 17.9048 9.50021 17.8071 9.44616L4.6821 1.95788C4.57109 1.89579 4.44378 1.86905 4.31717 1.88123C4.19056 1.89341 4.07068 1.94393 3.97354 2.02604C3.87641 2.10814 3.80663 2.21794 3.77354 2.34075C3.74045 2.46356 3.74561 2.59355 3.78835 2.71334L6.25007 10.0001L3.78835 17.2876Z" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_18_398">
                    <rect width="20" height="20" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="chatbot-toggle-container">
        <button class="chatbot-toggle" id="chatbot-toggle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 18.4301H13L8.54999 21.39C7.88999 21.83 7 21.3601 7 20.5601V18.4301C4 18.4301 2 16.4301 2 13.4301V7.42999C2 4.42999 4 2.42999 7 2.42999H17C20 2.42999 22 4.42999 22 7.42999V13.4301C22 16.4301 20 18.4301 17 18.4301Z" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12.0001 11.36V11.15C12.0001 10.47 12.4201 10.11 12.8401 9.82001C13.2501 9.54001 13.66 9.18002 13.66 8.52002C13.66 7.60002 12.9201 6.85999 12.0001 6.85999C11.0801 6.85999 10.3401 7.60002 10.3401 8.52002" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.9955 13.75H12.0045" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  function injectStyles() {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const style = document.createElement('style');
    style.textContent = `
      /* Force light mode - override any dark mode from parent site */
      #ai-chatbot-widget,
      #ai-chatbot-widget * {
        color-scheme: light !important;
      }

      #ai-chatbot-widget {
        position: fixed;
        bottom: 32px;
        right: 32px;
        z-index: 10000;
        font-family: 'Outfit', sans-serif;
      }

      .chatbot-window {
        width: 410px;
        height: 705px;
        max-height: calc(100vh - 120px);
        background: #FFFFFF !important;
        box-shadow: 0 12px 48px rgba(0,0,0,0.12);
        border-radius: 24px 24px 32px 32px;
        position: absolute; 
        bottom: 72px; 
        right: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #333 !important;
      }

      .chatbot-header {
        height: 72px;
        padding: 0 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #F0F0F0;
        background: #FFFFFF !important;
      }

      .header-left, .header-right { display: flex; align-items: center; gap: 12px; }
      .header-title { font-weight: 700; font-size: 18px; color: #111 !important; }

      .header-logo {
        width: 36px;
        height: 36px;
        background: #D59800 !important;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-btn { 
        background: none !important; 
        border: none !important; 
        cursor: pointer !important; 
        color: #333 !important; 
        display: flex !important; 
        align-items: center !important; 
        padding: 4px !important;
        box-shadow: none !important;
        outline: none !important;
        min-width: auto !important;
        width: auto !important;
        height: auto !important;
      }
      .icon-btn:hover,
      .icon-btn:focus,
      .icon-btn:active {
        background: none !important;
        color: #666 !important;
        box-shadow: none !important;
        outline: none !important;
        border: none !important;
      }
      .icon-btn svg { 
        width: 18px !important; 
        height: 18px !important;
        stroke: currentColor !important;
        fill: none !important;
      }

      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: none;
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .chatbot-messages::-webkit-scrollbar { display: none; }

      .chat-intro-text {
        font-size: 16px;
        color: #757575 !important;
        text-align: center;
        margin: 8px 0 16px 0;
      }

      .chatbot-message { max-width: 85%; }
      .chatbot-message p {
        font-size: 17px;
        line-height: 1.6;
        padding: 12px 18px;
        margin: 0;
        white-space: pre-wrap;
        color: inherit !important;
      }

      /* Markdown styling for bot messages */
      .bot-message .message-content {
        background: #F3F3F3 !important;
        color: #1a1a1a !important;
        border-radius: 20px 20px 20px 4px;
        padding: 12px 18px;
        font-size: 17px;
        line-height: 1.6;
        word-wrap: break-word;
        overflow-wrap: break-word;
        max-width: 100%;
      }

      .bot-message .message-content h1,
      .bot-message .message-content h2,
      .bot-message .message-content h3 {
        margin: 12px 0 8px 0;
        font-weight: 700;
        color: #111 !important;
      }

      .bot-message .message-content h1 { font-size: 21px; }
      .bot-message .message-content h2 { font-size: 19px; }
      .bot-message .message-content h3 { font-size: 18px; }

      .bot-message .message-content p {
        margin: 8px 0;
        padding: 0;
        background: transparent !important;
        color: #1a1a1a !important;
        line-height: 1.6;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .bot-message .message-content ul,
      .bot-message .message-content ol {
        margin: 6px 0;
        padding-left: 24px;
        line-height: 1.3;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .bot-message .message-content li {
        margin: 0;
        padding: 0;
        line-height: 1.6;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      .bot-message .message-content li + li {
        margin-top: 2px;
      }

      .bot-message .message-content strong {
        font-weight: 700;
        color: #111 !important;
      }

      .bot-message .message-content em {
        font-style: italic;
        color: inherit !important;
      }

      .bot-message .message-content code {
        background: #e0e0e0 !important;
        color: #1a1a1a !important;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }

      .bot-message .message-content pre {
        background: #e0e0e0 !important;
        color: #1a1a1a !important;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 8px 0;
      }

      .bot-message .message-content pre code {
        background: transparent !important;
        padding: 0;
      }

      .bot-message .message-content a {
        color: #1a73e8 !important;
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid #1a73e8;
        cursor: pointer;
        word-break: break-all;
        overflow-wrap: break-word;
      }

      .bot-message .message-content a:hover {
        background: #e8f0fe !important;
        text-decoration: underline;
      }

      .bot-message .message-content blockquote {
        border-left: 3px solid #D59800;
        padding-left: 12px;
        margin: 8px 0;
        color: #555 !important;
      }

      .bot-message { align-self: flex-start; }
      .user-message { align-self: flex-end; }
      .user-message p { background: #D59800 !important; color: white !important; border-radius: 20px 20px 4px 20px; }
      .message-metadata {
        font-size: 12px;
        color: #8E8E8E !important;
        margin-top: 6px;
        padding-left: 4px;
      }

      /* Typing indicator animation */
      .typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        background: #666 !important;
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }

      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% {
          opacity: 0.3;
          transform: scale(0.8);
        }
        30% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .chatbot-input-container {
        padding-top: 10px;
      }

      .chatbot-input-wrapper {
        display: flex !important;
        align-items: center !important;
        background: #FFFFFF !important;
        border: 1px solid #E5E5E5 !important;
        border-radius: 32px !important;
        padding: 6px 6px 6px 24px !important;
        height: 56px !important;
        margin: 0 20px 24px 20px !important;
        box-shadow: none !important;
      }

      .chatbot-input {
        flex: 1 !important;
        border: none !important;
        outline: none !important;
        font-family: 'Outfit', sans-serif !important;
        font-size: 14.5px !important;
        color: #333 !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        line-height: normal !important;
        min-height: auto !important;
        max-height: none !important;
        -webkit-text-fill-color: #333 !important;
      }
      
      #chatbot-input {
        flex: 1 !important;
        border: none !important;
        outline: none !important;
        font-family: 'Outfit', sans-serif !important;
        font-size: 14.5px !important;
        color: #333 !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        line-height: normal !important;
        min-height: auto !important;
        max-height: none !important;
        -webkit-text-fill-color: #333 !important;
      }

      .chatbot-input::placeholder {
        color: #999 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #999 !important;
      }
      
      #chatbot-input::placeholder {
        color: #999 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #999 !important;
      }
      
      .chatbot-input::-webkit-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #999 !important;
      }
      
      #chatbot-input::-webkit-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #999 !important;
      }
      
      .chatbot-input::-moz-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      
      #chatbot-input::-moz-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      
      .chatbot-input:-ms-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      
      #chatbot-input:-ms-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      
      .chatbot-input::-ms-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      
      #chatbot-input::-ms-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }

      .chatbot-input:focus {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
        color: #333 !important;
        -webkit-text-fill-color: #333 !important;
      }
      
      #chatbot-input:focus {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
        color: #333 !important;
        -webkit-text-fill-color: #333 !important;
      }

      .chatbot-send-btn {
        width: 44px !important;
        height: 44px !important;
        min-width: 44px !important;
        min-height: 44px !important;
        background: #D59800 !important;
        border-radius: 50% !important;
        border: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: opacity 0.2s !important;
        padding: 0 !important;
        box-shadow: none !important;
        outline: none !important;
      }
      .chatbot-send-btn:hover,
      .chatbot-send-btn:focus {
        background: #D59800 !important;
        box-shadow: none !important;
        outline: none !important;
        border: none !important;
        opacity: 0.9 !important;
      }
      .chatbot-send-btn:disabled { 
        opacity: 0.5 !important; 
        cursor: not-allowed !important;
        background: #D59800 !important;
      }
      .chatbot-send-btn svg {
        width: 20px !important;
        height: 20px !important;
        fill: none !important;
      }
      .chatbot-send-btn svg path {
        stroke: white !important;
        fill: none !important;
      }

      .chatbot-toggle-container {
        display: flex !important;
        justify-content: flex-end !important;
      }

      .chatbot-toggle {
        width: 56px !important;
        height: 56px !important;
        min-width: 56px !important;
        min-height: 56px !important;
        background: #D59800 !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
        cursor: pointer !important;
        border: none !important;
        padding: 0 !important;
        outline: none !important;
      }
      .chatbot-toggle:hover,
      .chatbot-toggle:focus {
        background: #D59800 !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
        outline: none !important;
        border: none !important;
        opacity: 0.95 !important;
      }
      .chatbot-toggle svg {
        width: 24px !important;
        height: 24px !important;
        fill: none !important;
      }
      .chatbot-toggle svg path {
        stroke: white !important;
        fill: none !important;
      }

      .suggestion-chips {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 20px 0 20px;
        margin-bottom: 0px;
      }

      .suggestion-chip {
        background: #FFFFFF !important;
        border: 1px solid #D59800;
        color: #D59800 !important;
        padding: 10px 16px;
        border-radius: 12px;
        font-family: 'Outfit', sans-serif;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        width: 100%;
      }

      .suggestion-chip:hover {
        background: #FFF8E1 !important;
      }

      .bot-followup-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
        width: 100%;
      }
      
      .followup-chip {
        background: #ffffff !important;
        border: 1px solid #D59800;
        color: #D59800 !important;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
        font-family: 'Outfit', sans-serif;
      }
      
      .followup-chip:hover {
        background: #FFF8E1 !important;
      }

      /* Mobile Responsive Styles */
      @media (max-width: 768px) {
        #ai-chatbot-widget { bottom: 16px !important; right: 16px !important; }
        .chatbot-window {
          width: calc(100vw - 32px) !important;
          max-width: 410px !important;
          height: calc(100vh - 100px) !important;
          max-height: 705px !important;
          bottom: 64px !important;
        }
        .chatbot-messages { padding: 16px 16px !important; gap: 10px !important; }
        .chatbot-input-wrapper { 
          margin: 0 16px 16px 16px !important; 
          height: 48px !important; 
        }
        .chatbot-input {
          font-size: 14.5px !important;
        }
        .chatbot-send-btn {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          min-height: 40px !important;
        }
        .chatbot-message { max-width: 90% !important; }
        .chatbot-message p { 
          font-size: 16px !important; 
          padding: 10px 14px !important; 
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .bot-message .message-content { 
          font-size: 16px !important; 
          padding: 10px 14px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          max-width: 100% !important;
        }
        .bot-message .message-content h1 { font-size: 19px !important; }
        .bot-message .message-content h2 { font-size: 17px !important; }
        .bot-message .message-content h3 { font-size: 16px !important; }
        .bot-message .message-content p,
        .bot-message .message-content ul,
        .bot-message .message-content ol,
        .bot-message .message-content li {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .bot-message .message-content a {
          word-break: break-all !important;
          overflow-wrap: break-word !important;
        }
        .followup-chip { font-size: 12px !important; padding: 7px 10px !important; }
        .suggestion-chip { font-size: 13px !important; padding: 9px 14px !important; }
      }

      @media (max-width: 480px) {
        #ai-chatbot-widget { bottom: 12px !important; right: 12px !important; }
        .chatbot-window { 
          width: calc(100vw - 24px) !important; 
          height: calc(100vh - 80px) !important;
          bottom: 60px !important; 
        }
        .chatbot-toggle { 
          width: 48px !important; 
          height: 48px !important;
          min-width: 48px !important;
          min-height: 48px !important;
        }
        .chatbot-toggle svg {
          width: 22px !important;
          height: 22px !important;
        }
        .chatbot-send-btn {
          width: 38px !important;
          height: 38px !important;
          min-width: 38px !important;
          min-height: 38px !important;
        }
        .chatbot-send-btn svg {
          width: 18px !important;
          height: 18px !important;
        }
        .chatbot-message { max-width: 92% !important; }
        .chatbot-message p { 
          font-size: 15px !important; 
          padding: 9px 12px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .bot-message .message-content { 
          font-size: 15px !important; 
          padding: 9px 12px !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          max-width: 100% !important;
        }
        .bot-message .message-content h1 { font-size: 18px !important; }
        .bot-message .message-content h2 { font-size: 16px !important; }
        .bot-message .message-content h3 { font-size: 15px !important; }
        .bot-message .message-content p,
        .bot-message .message-content ul,
        .bot-message .message-content ol,
        .bot-message .message-content li {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .bot-message .message-content a {
          word-break: break-all !important;
          overflow-wrap: break-word !important;
        }
        .header-left img { width: 80px !important; height: 80px !important; }
        .followup-chip { 
          font-size: 11px !important; 
          padding: 6px 10px !important;
          word-break: break-word !important;
        }
        .suggestion-chip { 
          font-size: 12px !important; 
          padding: 8px 12px !important;
        }
        .chatbot-input { font-size: 16px !important; } /* Prevents zoom on iOS */
        .chatbot-input-wrapper { height: 50px !important; } /* Better tap target */
        .icon-btn {
          padding: 6px !important;
        }
        .icon-btn svg {
          width: 16px !important;
          height: 16px !important;
        }
      }

      /* iPhone 13 and similar devices (390x844) */
      @media (max-width: 430px) and (min-height: 800px) {
        .chatbot-window {
          width: calc(100vw - 20px) !important;
          height: calc(100vh - 100px) !important;
          max-height: none !important;
          bottom: 70px !important;
        }
        .chatbot-messages {
          padding: 12px !important;
        }
        .chatbot-header {
          padding: 12px 16px !important;
        }
        .header-left img {
          width: 70px !important;
          height: 70px !important;
        }
        .chatbot-input-wrapper {
          margin: 0 12px 12px 12px !important;
          height: 52px !important;
        }
        .chatbot-send-btn {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function attachEventListeners() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const window_ = document.getElementById('chatbot-window');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');

    const sessionId = getOrCreateSessionId();

    toggleBtn.addEventListener('click', () => {
      window_.style.display = window_.style.display === 'none' ? 'flex' : 'none';
      if (window_.style.display === 'flex') input.focus();
    });

    closeBtn.addEventListener('click', () => { window_.style.display = 'none'; });

    const handleSend = async () => {
      const message = input.value.trim();
      if (!message) return;

      addMessage(message, 'user');
      input.value = '';
      sendBtn.disabled = true;

      // Remove initial suggestions if present
      const initialSuggestions = document.getElementById('initial-suggestions');
      if (initialSuggestions) {
        initialSuggestions.remove();
      }

      // Add typing indicator
      const typingIndicator = addTypingIndicator();
      let fullResponse = "";
      let botMessageElement = null;

      try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId }),
        });

        if (!response.ok) throw new Error('Failed to send message');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.chunk) {
                // Remove typing indicator on first chunk
                if (typingIndicator && typingIndicator.parentNode) {
                  typingIndicator.remove();
                }

                fullResponse += parsed.chunk;

                // Create or update bot message element
                if (!botMessageElement) {
                  botMessageElement = addStreamingBotMessage();
                }

                // Update the message content with markdown rendering
                updateMessageContent(botMessageElement, fullResponse);
                
                // Auto-scroll
                const messagesContainer = document.getElementById('chatbot-messages');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }

              if (parsed.error) {
                if (typingIndicator && typingIndicator.parentNode) {
                  typingIndicator.remove();
                }
                if (botMessageElement) {
                  updateMessageContent(botMessageElement, parsed.error);
                } else {
                  addMessage(parsed.error, 'bot');
                }
              }
            } catch (e) {
              console.debug('Parse error:', e);
            }
          }
        }

        // Final processing
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.remove();
        }

        if (!botMessageElement && !fullResponse) {
          addMessage('Sorry, I could not generate a response.', 'bot');
        }

        // Parse Follow-up Questions
        if (fullResponse && botMessageElement) {
          const followupMatch = fullResponse.match(/<<<FOLLOWUP: (.*?)>>>/);
          if (followupMatch) {
            fullResponse = fullResponse.replace(followupMatch[0], '').trim();
            updateMessageContent(botMessageElement, fullResponse);

            const questions = followupMatch[1].split('|').map(q => q.trim()).filter(q => q);
            // Show up to 3 follow-up questions
            if (questions.length > 0) {
              const followupContainer = document.createElement('div');
              followupContainer.className = 'bot-followup-container';

              const questionsToShow = questions.slice(0, 3);
              questionsToShow.forEach(q => {
                const btn = document.createElement('button');
                btn.className = 'followup-chip';
                btn.innerText = q;
                btn.onclick = () => window.sendSuggestion(q);
                followupContainer.appendChild(btn);
              });

              botMessageElement.appendChild(followupContainer);
              const messagesContainer = document.getElementById('chatbot-messages');
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          }

          // Update metadata with timestamp
          const metadataNode = botMessageElement.querySelector('.message-metadata');
          if (metadataNode) {
            metadataNode.innerText = `Cashflow AI Agent • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          }
        }

      } catch (error) {
        console.error('Error sending message:', error);
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.remove();
        }
        addMessage("Sorry, I'm having trouble connecting. Please try again later.", 'bot');
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !sendBtn.disabled) handleSend();
    });
  }

  function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('chatbot_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('chatbot_session_id', sessionId);
    }
    return sessionId;
  }

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chatbot-message ${sender}-message`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (sender === 'bot') {
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.innerHTML = parseMarkdown(text);
      
      const metadata = document.createElement('div');
      metadata.className = 'message-metadata';
      metadata.innerText = `AI Agent • ${time}`;

      msgDiv.appendChild(contentDiv);
      msgDiv.appendChild(metadata);
    } else {
      const p = document.createElement('p');
      p.innerText = text;
      msgDiv.appendChild(p);
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return msgDiv;
  }

  function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chatbot-message bot-message';
    msgDiv.id = 'typing-indicator';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';

    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return msgDiv;
  }

  function addStreamingBotMessage() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chatbot-message bot-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '';

    const metadata = document.createElement('div');
    metadata.className = 'message-metadata';
    metadata.innerText = 'AI Agent • typing...';

    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(metadata);
    messagesContainer.appendChild(msgDiv);

    return msgDiv;
  }

  function updateMessageContent(messageElement, text) {
    const contentDiv = messageElement.querySelector('.message-content');
    if (contentDiv) {
      contentDiv.innerHTML = parseMarkdown(text);
    }
  }

  /**
   * Simple markdown parser for common patterns
   */
  function parseMarkdown(text) {
    // Step 1: Extract and store all URLs BEFORE any other processing
    const urlStore = [];
    let urlCounter = 0;
    
    // Extract markdown links first [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, linkText, url) {
      const placeholder = `<<<URLTOKEN${urlCounter}>>>`;
      urlStore[urlCounter] = { url: url, linkText: linkText, isMarkdown: true };
      urlCounter++;
      return placeholder;
    });
    
    // Extract URLs with protocol (http:// or https://)
    text = text.replace(/(https?:\/\/[^\s<>"'\[\]()]+)/g, function(url) {
      // Clean trailing punctuation
      url = url.replace(/[.,;!?]+$/, '');
      const placeholder = `<<<URLTOKEN${urlCounter}>>>`;
      urlStore[urlCounter] = { url: url, hasProtocol: true };
      urlCounter++;
      return placeholder;
    });
    
    // Extract URLs without protocol (domain.tld/path)
    text = text.replace(/\b([a-zA-Z0-9][-a-zA-Z0-9]{0,62}\.(?:com|io|net|org|edu|gov|co|ai|app|dev|uk|us|ca|info|biz)(?:\/[a-zA-Z0-9\-._~:/?#@!$&'()*+,;=%]*)?)\b/g, function(url) {
      // Clean trailing punctuation
      url = url.replace(/[.,;!?]+$/, '');
      const placeholder = `<<<URLTOKEN${urlCounter}>>>`;
      urlStore[urlCounter] = { url: url, hasProtocol: false };
      urlCounter++;
      return placeholder;
    });

    // Step 2: Escape HTML to prevent XSS
    text = text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Step 3: Process markdown formatting
    // Headers
    text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');

    // Code blocks
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');

    // Unordered lists
    text = text.replace(/^\* (.*?)$/gm, '<<<ULSTART>>>$1<<<ULEND>>>');
    text = text.replace(/^- (.*?)$/gm, '<<<ULSTART>>>$1<<<ULEND>>>');
    
    text = text.replace(/(<<<ULSTART>>>[\s\S]+?<<<ULEND>>>(\n|$))+/g, function(match) {
      const items = match.replace(/<<<ULSTART>>>(.*?)<<<ULEND>>>\n?/g, '&lt;li&gt;$1&lt;/li&gt;').trim();
      return '&lt;ul&gt;' + items + '&lt;/ul&gt;';
    });

    // Ordered lists
    text = text.replace(/^\d+\. (.*?)$/gm, '<<<OLSTART>>>$1<<<OLEND>>>');
    
    text = text.replace(/(<<<OLSTART>>>[\s\S]+?<<<OLEND>>>(\n|$))+/g, function(match) {
      const items = match.replace(/<<<OLSTART>>>(.*?)<<<OLEND>>>\n?/g, '&lt;li&gt;$1&lt;/li&gt;').trim();
      return '&lt;ol&gt;' + items + '&lt;/ol&gt;';
    });

    // Blockquotes
    text = text.replace(/^&gt; (.*?)$/gm, '&lt;blockquote&gt;$1&lt;/blockquote&gt;');

    // Step 4: Unescape markdown-generated HTML tags only
    text = text.replace(/&lt;(\/?)([hH][123]|strong|em|code|pre|ul|ol|li|blockquote)&gt;/g, '<$1$2>');

    // Step 5: Restore URLs as clickable links (handle escaped angle brackets)
    for (let i = 0; i < urlCounter; i++) {
      const urlData = urlStore[i];
      let linkHtml;
      
      if (urlData.isMarkdown) {
        // Markdown link [text](url)
        linkHtml = `<a href="${urlData.url}" target="_blank">${urlData.linkText}</a>`;
      } else if (urlData.hasProtocol) {
        // URL with protocol
        linkHtml = `<a href="${urlData.url}" target="_blank">${urlData.url}</a>`;
      } else {
        // URL without protocol - add https://
        linkHtml = `<a href="https://${urlData.url}" target="_blank">${urlData.url}</a>`;
      }
      
      // Replace both regular and escaped versions of the placeholder
      const escapedPlaceholder = `&lt;&lt;&lt;URLTOKEN${i}&gt;&gt;&gt;`;
      text = text.replace(escapedPlaceholder, linkHtml);
      text = text.replace(`<<<URLTOKEN${i}>>>`, linkHtml);
    }

    // Step 6: Line breaks and paragraphs
    text = text.replace(/\n\n/g, '</p><p>');
    
    // Remove line breaks between list items
    text = text.replace(/(<\/li>)\s*<br>\s*(<li>)/g, '$1$2');
    text = text.replace(/(<ul>)\s*<br>\s*/g, '$1');
    text = text.replace(/\s*<br>\s*(<\/ul>)/g, '$1');
    text = text.replace(/(<ol>)\s*<br>\s*/g, '$1');
    text = text.replace(/\s*<br>\s*(<\/ol>)/g, '$1');
    
    text = text.replace(/\n/g, '<br>');

    // Wrap in paragraphs if not already in block element
    if (!text.match(/^<(h[1-6]|ul|ol|pre|blockquote)/)) {
      text = '<p>' + text + '</p>';
    }

    return text;
  }

  initChatbot();
})();