(function () {
  "use strict";

  const CONFIG = {
    widgetId: "ai-chatbot-widget",
    // Auto-detect the correct API base URL
    apiBaseUrl:
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://chat-bot-service-767432724134.us-west1.run.app",
  };

  async function loadWidgetSettings() {
    try {
      const response = await fetch(`${CONFIG.apiBaseUrl}/api/widget-settings`);
      const { success, data } = await response.json();

      if (success && data) {
        // Update greeting message in header
        const headerGreeting = document.querySelector(".header-greeting");
        if (headerGreeting && data.greetingMessage) {
          headerGreeting.textContent = data.greetingMessage;
        }

        // Update suggestion chips
        const suggestionsContainer = document.getElementById(
          "initial-suggestions",
        );
        if (
          suggestionsContainer &&
          data.suggestions &&
          data.suggestions.length > 0
        ) {
          suggestionsContainer.innerHTML = "";
          data.suggestions.forEach((suggestion, index) => {
            const chip = document.createElement("button");
            chip.className = "suggestion-chip";
            chip.innerHTML = `${suggestion} <span class="chip-arrow">›</span>`;
            chip.onclick = () => window.sendSuggestion(suggestion);
            suggestionsContainer.appendChild(chip);
          });
        }
      }
    } catch (error) {
      console.error("Failed to load widget settings:", error);
      // Keep default values if loading fails
    }
  }

  function initChatbot() {
    if (document.getElementById(CONFIG.widgetId)) return;

    const widgetContainer = document.createElement("div");
    widgetContainer.id = CONFIG.widgetId;
    widgetContainer.innerHTML = getWidgetHTML();
    document.body.appendChild(widgetContainer);

    injectStyles();
    loadWidgetSettings();
    attachEventListeners();

    // Expose sendSuggestion globally
    window.sendSuggestion = (text) => {
      const input = document.getElementById("chatbot-input");
      const sendBtn = document.getElementById("chatbot-send");
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
          <div class="header-content">
            <img src="${CONFIG.apiBaseUrl}/image/image copy.png" alt="Logo" class="header-logo">
            <div class="header-text">
              <div class="header-greeting">Hi there</div>
              <div class="header-subtitle">Welcome to our website. Ask us anything</div>
            </div>
          </div>
        </div>

        <div class="chatbot-messages" id="chatbot-messages">
          <div class="suggestion-chips" id="initial-suggestions">
            <!-- Suggestions will be loaded dynamically from admin settings -->
          </div>
        </div>

        <div class="chatbot-input-container">
          <div class="chatbot-input-wrapper">
            <input type="text" class="chatbot-input" placeholder="Enter your message..." id="chatbot-input" />
            <button class="chatbot-send-btn" id="chatbot-send">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 10L2.5 10M17.5 10L11.25 3.75M17.5 10L11.25 16.25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="chatbot-footer">
            <span class="footer-text">We typically reply within a few minutes.</span>
          </div>
        </div>
      </div>

      <div class="chatbot-toggle-container">
        <button class="chatbot-toggle-label" id="chatbot-toggle-label" type="button" aria-label="Open chat">
          <span class="chatbot-toggle-label-text">Chat with us</span>
          <span class="chatbot-toggle-label-emoji" aria-hidden="true">👋</span>
        </button>
        <button class="chatbot-toggle" id="chatbot-toggle" type="button" aria-label="Open chat">
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
    const fontLink = document.createElement("link");
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);

    const style = document.createElement("style");
    style.textContent = `
      /* Force light mode - override any dark mode from parent site */
      #ai-chatbot-widget,
      #ai-chatbot-widget * {
        color-scheme: light !important;
      }

      #ai-chatbot-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10000;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .chatbot-window {
        width: 420px;
        height: 740px;
        max-height: calc(100vh - 100px);
        background: #FFFFFF !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border-radius: 20px;
        position: absolute; 
        bottom: 80px; 
        right: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #1F2937 !important;
      }

      /* NEW PREMIUM HEADER */
      .chatbot-header {
        background: linear-gradient(135deg, #4F46E5 0%, #5B52D9 100%) !important;
        padding: 24px 24px;
        position: relative;
        color: white !important;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .header-logo {
        width: 60px;
        height: 60px;
        object-fit: contain;
        flex-shrink: 0;
      }

      .header-text {
        flex: 1;
      }

      .header-greeting {
        font-size: 18px;
        font-weight: 600;
        color: white !important;
        line-height: 1.4;
      }

      .header-subtitle {
        font-size: 14px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.95) !important;
        line-height: 1.4;
        margin-top: 2px;
      }

      .chatbot-messages {
        flex: 1;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #E5E7EB #FFFFFF;
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #FFFFFF !important;
      }
      .chatbot-messages::-webkit-scrollbar { 
        width: 6px;
      }
      .chatbot-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      .chatbot-messages::-webkit-scrollbar-thumb {
        background: #E5E7EB;
        border-radius: 3px;
      }

      .chatbot-message { max-width: 85%; }
      .chatbot-message p {
        font-size: 15px;
        line-height: 1.5;
        padding: 12px 16px;
        margin: 0;
        white-space: pre-wrap;
        color: inherit !important;
      }

      /* Bot message styling */
      .bot-message .message-content {
        background: #F3F4F6 !important;
        color: #1F2937 !important;
        border-radius: 16px 16px 16px 4px;
        padding: 12px 16px;
        font-size: 15px;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
        max-width: 100%;
      }

      .bot-message .message-content h1,
      .bot-message .message-content h2,
      .bot-message .message-content h3 {
        margin: 12px 0 8px 0;
        font-weight: 700;
        color: #111827 !important;
      }

      .bot-message .message-content h1 { font-size: 20px; }
      .bot-message .message-content h2 { font-size: 18px; }
      .bot-message .message-content h3 { font-size: 16px; }

      .bot-message .message-content p {
        margin: 0;
        padding: 0;
        background: transparent !important;
        color: #1F2937 !important;
        line-height: 1.6;
      }
      
      .bot-message .message-content p + p {
        margin-top: 12px;
      }

      .bot-message .message-content ul,
      .bot-message .message-content ol {
        margin: 6px 0;
        padding-left: 20px;
        line-height: 1.5;
      }

      .bot-message .message-content li {
        margin: 4px 0;
        line-height: 1.5;
      }

      .bot-message .message-content strong {
        font-weight: 600;
        color: #111827 !important;
      }

      .bot-message .message-content code {
        background: #E5E7EB !important;
        color: #1F2937 !important;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
      }

      .bot-message .message-content a {
        color: #4F46E5 !important;
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid #4F46E5;
      }

      .bot-message .message-content a:hover {
        background: #EEF2FF !important;
      }

      .bot-message { align-self: flex-start; }
      .user-message { align-self: flex-end; }
      .user-message p { 
        background: #4F46E5 !important; 
        color: white !important; 
        border-radius: 16px 16px 4px 16px;
      }

      .message-metadata {
        font-size: 11px;
        color: #9CA3AF !important;
        margin-top: 4px;
        padding-left: 4px;
        font-weight: 500;
      }

      /* Typing indicator */
      .typing-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 12px 16px;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        background: #9CA3AF !important;
        border-radius: 50%;
        animation: typing 1.4s infinite;
      }

      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }

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

      /* NEW PREMIUM SUGGESTION CHIPS */
      .suggestion-chips {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 8px;
      }

      .suggestion-chip {
        background: #FFFFFF !important;
        border: none !important;
        color: #1F2937 !important;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: 'Inter', sans-serif;
        font-size: 15px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        width: 100%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
      }

      .suggestion-chip:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
      }

      .chip-arrow {
        color: #9CA3AF !important;
        font-size: 20px;
        font-weight: 400;
        line-height: 1;
      }

      .bot-followup-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
        width: 100%;
      }
      
      .followup-chip {
        background: #FFFFFF !important;
        border: none !important;
        color: #1F2937 !important;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: all 0.2s ease;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .followup-chip:hover {
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
      }

      .followup-chip::after {
        content: '›';
        color: #9CA3AF;
        font-size: 18px;
        font-weight: 400;
      }

      /* INPUT AREA */
      .chatbot-input-container {
        padding: 20px 20px 20px 20px;
        background: #FFFFFF !important;
        border-top: 1px solid #E5E7EB;
      }

      .chatbot-input-wrapper {
        display: flex !important;
        align-items: center !important;
        background: #FFFFFF !important;
        background-color: #FFFFFF !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        height: auto !important;
        transition: none !important;
      }

      .chatbot-input-wrapper:focus-within {
        background: #FFFFFF !important;
        background-color: #FFFFFF !important;
        border: none !important;
        box-shadow: none !important;
      }

      .chatbot-input {
        flex: 1 !important;
        border: none !important;
        outline: none !important;
        font-family: 'Inter', sans-serif !important;
        font-size: 15px !important;
        color: #1F2937 !important;
        background: #FFFFFF !important;
        background-color: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 12px 0 0 !important;
        -webkit-text-fill-color: #1F2937 !important;
      }

      .chatbot-input::placeholder {
        color: #9CA3AF !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #9CA3AF !important;
      }
      
      .chatbot-input:focus,
      .chatbot-input:active {
        color: #1F2937 !important;
        background: #FFFFFF !important;
        background-color: #FFFFFF !important;
        -webkit-text-fill-color: #1F2937 !important;
      }

      .chatbot-send-btn {
        width: 44px !important;
        height: 44px !important;
        background: #4F46E5 !important;
        background-color: #4F46E5 !important;
        border-radius: 12px !important;
        border: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        flex-shrink: 0 !important;
      }

      .chatbot-send-btn:hover {
        background: #4338CA !important;
        background-color: #4338CA !important;
        transform: scale(1.05);
      }

      .chatbot-send-btn:disabled { 
        opacity: 0.5 !important; 
        cursor: not-allowed !important;
        transform: none !important;
        background: #4F46E5 !important;
        background-color: #4F46E5 !important;
      }

      .chatbot-send-btn svg {
        width: 18px !important;
        height: 18px !important;
      }

      .chatbot-send-btn svg path {
        stroke: white !important;
        stroke: #FFFFFF !important;
        fill: none !important;
      }

      /* FOOTER */
      .chatbot-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
        padding: 0 4px;
      }

      .footer-text {
        font-size: 12px;
        color: #6B7280 !important;
        font-weight: 400;
        text-align: center;
      }

      /* TOGGLE BUTTONS */
      .chatbot-toggle-container {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: 12px !important;
      }

      .chatbot-toggle-label {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        background: #FFFFFF !important;
        color: #111827 !important;
        border: none !important;
        border-radius: 24px !important;
        padding: 12px 20px !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        font-family: 'Inter', sans-serif;
      }

      .chatbot-toggle-label:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
        transform: translateY(-2px);
      }

      .chatbot-toggle {
        width: 64px !important;
        height: 64px !important;
        background: #4F46E5 !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35) !important;
        cursor: pointer !important;
        border: none !important;
        transition: all 0.2s ease !important;
      }

      .chatbot-toggle:hover {
        background: #4338CA !important;
        box-shadow: 0 10px 24px rgba(79, 70, 229, 0.4) !important;
        transform: translateY(-2px) scale(1.05);
      }
      
      .chatbot-toggle svg {
        width: 26px !important;
        height: 26px !important;
        fill: none !important;
      }
      
      .chatbot-toggle svg path,
      .chatbot-toggle svg line {
        stroke: white !important;
        stroke-width: 2.5 !important;
        fill: none !important;
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        #ai-chatbot-widget { bottom: 16px !important; right: 16px !important; }
        .chatbot-window {
          width: calc(100vw - 32px) !important;
          max-width: 420px !important;
          height: calc(100vh - 100px) !important;
          max-height: 740px !important;
          bottom: 72px !important;
        }
        .chatbot-header {
          padding: 20px 20px;
        }
        .header-greeting {
          font-size: 17px;
        }
        .header-subtitle {
          font-size: 13px;
        }
        .header-logo {
          width: 54px !important;
          height: 54px !important;
        }
      }

      @media (max-width: 480px) {
        #ai-chatbot-widget { bottom: 12px !important; right: 12px !important; }
        .chatbot-window { 
          width: calc(100vw - 24px) !important; 
          height: calc(100vh - 80px) !important;
          bottom: 68px !important; 
        }
        .chatbot-toggle { 
          width: 56px !important; 
          height: 56px !important;
        }
        .chatbot-header {
          padding: 18px 20px;
        }
        .header-greeting {
          font-size: 16px;
        }
        .header-subtitle {
          font-size: 12px;
        }
        .header-logo {
          width: 48px !important;
          height: 48px !important;
        }
        .suggestion-chip {
          padding: 14px 16px;
          font-size: 14px;
        }
        .chatbot-input {
          font-size: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function attachEventListeners() {
    const toggleBtn = document.getElementById("chatbot-toggle");
    const toggleLabel = document.getElementById("chatbot-toggle-label");
    const window_ = document.getElementById("chatbot-window");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");

    const sessionId = getOrCreateSessionId();

    const toggleWidget = () => {
      const isOpen = window_.style.display === "none";
      window_.style.display = isOpen ? "flex" : "none";
      
      // Change toggle button icon and label visibility
      if (isOpen) {
        // Widget is opening - hide label, show X
        if (toggleLabel) {
          toggleLabel.style.display = "none !important";
          toggleLabel.style.visibility = "hidden";
          toggleLabel.style.opacity = "0";
        }
        toggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
        toggleBtn.setAttribute('aria-label', 'Close chat');
        input.focus();
      } else {
        // Widget is closing - show label, show chat icon
        if (toggleLabel) {
          toggleLabel.style.display = "inline-flex";
          toggleLabel.style.visibility = "visible";
          toggleLabel.style.opacity = "1";
        }
        toggleBtn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 18.4301H13L8.54999 21.39C7.88999 21.83 7 21.3601 7 20.5601V18.4301C4 18.4301 2 16.4301 2 13.4301V7.42999C2 4.42999 4 2.42999 7 2.42999H17C20 2.42999 22 4.42999 22 7.42999V13.4301C22 16.4301 20 18.4301 17 18.4301Z" stroke="white" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12.0001 11.36V11.15C12.0001 10.47 12.4201 10.11 12.8401 9.82001C13.2501 9.54001 13.66 9.18002 13.66 8.52002C13.66 7.60002 12.9201 6.85999 12.0001 6.85999C11.0801 6.85999 10.3401 7.60002 10.3401 8.52002" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.9955 13.75H12.0045" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        toggleBtn.setAttribute('aria-label', 'Open chat');
      }
    };

    toggleBtn.addEventListener("click", toggleWidget);
    if (toggleLabel) {
      toggleLabel.addEventListener("click", toggleWidget);
    }

    const handleSend = async () => {
      const message = input.value.trim();
      if (!message) return;

      addMessage(message, "user");
      input.value = "";
      sendBtn.disabled = true;

      // Remove initial suggestions if present
      const initialSuggestions = document.getElementById("initial-suggestions");
      if (initialSuggestions) {
        initialSuggestions.remove();
      }

      // Add typing indicator
      const typingIndicator = addTypingIndicator();
      let fullResponse = "";
      let botMessageElement = null;

      try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, sessionId }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || !line.startsWith("data: ")) continue;

            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr || dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.chunk) {
                if (typingIndicator && typingIndicator.parentNode) {
                  typingIndicator.remove();
                }

                fullResponse += parsed.chunk;

                if (!botMessageElement) {
                  botMessageElement = addStreamingBotMessage();
                }

                updateMessageContent(botMessageElement, fullResponse);

                const messagesContainer =
                  document.getElementById("chatbot-messages");
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }

              if (parsed.error) {
                if (typingIndicator && typingIndicator.parentNode) {
                  typingIndicator.remove();
                }
                if (botMessageElement) {
                  updateMessageContent(botMessageElement, parsed.error);
                } else {
                  addMessage(parsed.error, "bot");
                }
              }
            } catch (e) {
              console.debug("Parse error:", e);
            }
          }
        }

        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.remove();
        }

        if (!botMessageElement && !fullResponse) {
          addMessage("Sorry, I could not generate a response.", "bot");
        }

        // Parse Follow-up Questions
        if (fullResponse && botMessageElement) {
          const followupMatch = fullResponse.match(/<<<FOLLOWUP: (.*?)>>>/);
          if (followupMatch) {
            fullResponse = fullResponse.replace(followupMatch[0], "").trim();
            updateMessageContent(botMessageElement, fullResponse);

            const questions = followupMatch[1]
              .split("|")
              .map((q) => q.trim())
              .filter((q) => q);
            
            if (questions.length > 0) {
              const followupContainer = document.createElement("div");
              followupContainer.className = "bot-followup-container";

              const questionsToShow = questions.slice(0, 3);
              questionsToShow.forEach((q) => {
                const btn = document.createElement("button");
                btn.className = "followup-chip";
                btn.innerText = q;
                btn.onclick = () => window.sendSuggestion(q);
                followupContainer.appendChild(btn);
              });

              botMessageElement.appendChild(followupContainer);
              const messagesContainer =
                document.getElementById("chatbot-messages");
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          }

          const metadataNode =
            botMessageElement.querySelector(".message-metadata");
          if (metadataNode) {
            metadataNode.innerText = `AI Agent • ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.remove();
        }
        addMessage(
          "Sorry, I'm having trouble connecting. Please try again later.",
          "bot",
        );
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    };

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !sendBtn.disabled) handleSend();
    });
  }

  function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem("chatbot_session_id");
    if (!sessionId) {
      sessionId =
        "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("chatbot_session_id", sessionId);
    }
    return sessionId;
  }

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById("chatbot-messages");
    const msgDiv = document.createElement("div");
    msgDiv.className = `chatbot-message ${sender}-message`;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (sender === "bot") {
      const contentDiv = document.createElement("div");
      contentDiv.className = "message-content";
      contentDiv.innerHTML = parseMarkdown(text);

      const metadata = document.createElement("div");
      metadata.className = "message-metadata";
      metadata.innerText = `AI Agent • ${time}`;

      msgDiv.appendChild(contentDiv);
      msgDiv.appendChild(metadata);
    } else {
      const p = document.createElement("p");
      p.innerText = text;
      msgDiv.appendChild(p);
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return msgDiv;
  }

  function addTypingIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    const msgDiv = document.createElement("div");
    msgDiv.className = "chatbot-message bot-message";
    msgDiv.id = "typing-indicator";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML =
      '<div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';

    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return msgDiv;
  }

  function addStreamingBotMessage() {
    const messagesContainer = document.getElementById("chatbot-messages");
    const msgDiv = document.createElement("div");
    msgDiv.className = "chatbot-message bot-message";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.innerHTML = "";

    const metadata = document.createElement("div");
    metadata.className = "message-metadata";
    metadata.innerText = "AI Agent • typing...";

    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(metadata);
    messagesContainer.appendChild(msgDiv);

    return msgDiv;
  }

  function updateMessageContent(messageElement, text) {
    const contentDiv = messageElement.querySelector(".message-content");
    if (contentDiv) {
      contentDiv.innerHTML = parseMarkdown(text);
    }
  }

  function parseMarkdown(text) {
    const urlStore = [];
    let urlCounter = 0;

    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      function (match, linkText, url) {
        const placeholder = `<<<URLTOKEN${urlCounter}>>>`;
        urlStore[urlCounter] = {
          url: url,
          linkText: linkText,
          isMarkdown: true,
        };
        urlCounter++;
        return placeholder;
      },
    );

    text = text.replace(/(https?:\/\/[^\s<>"'\[\]()]+)/g, function (url) {
      url = url.replace(/[.,;!?]+$/, "");
      const placeholder = `<<<URLTOKEN${urlCounter}>>>`;
      urlStore[urlCounter] = { url: url, hasProtocol: true };
      urlCounter++;
      return placeholder;
    });

    text = text.replace(
      /\b([a-zA-Z0-9][-a-zA-Z0-9]{0,62}\.(?:com|io|net|org|edu|gov|co|ai|app|dev|uk|us|ca|info|biz)(?:\/[a-zA-Z0-9\-._~:/?#@!$&'()*+,;=%]*)?)\b/g,
      function (url) {
        url = url.replace(/[.,;!?]+$/, "");
        const placeholder = `<<<URLTOKEN${urlCounter}>>>`;
        urlStore[urlCounter] = { url: url, hasProtocol: false };
        urlCounter++;
        return placeholder;
      },
    );

    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    text = text.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    text = text.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    text = text.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.*?)__/g, "<strong>$1</strong>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    text = text.replace(/_(.*?)_/g, "<em>$1</em>");
    text = text.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    text = text.replace(/`(.*?)`/g, "<code>$1</code>");
    text = text.replace(/^\* (.*?)$/gm, "<<<ULSTART>>>$1<<<ULEND>>>");
    text = text.replace(/^- (.*?)$/gm, "<<<ULSTART>>>$1<<<ULEND>>>");
    text = text.replace(
      /(<<<ULSTART>>>[\s\S]+?<<<ULEND>>>(\n|$))+/g,
      function (match) {
        const items = match
          .replace(
            /<<<ULSTART>>>(.*?)<<<ULEND>>>\n?/g,
            "&lt;li&gt;$1&lt;/li&gt;",
          )
          .trim();
        return "&lt;ul&gt;" + items + "&lt;/ul&gt;";
      },
    );
    text = text.replace(/^\d+\. (.*?)$/gm, "<<<OLSTART>>>$1<<<OLEND>>>");
    text = text.replace(
      /(<<<OLSTART>>>[\s\S]+?<<<OLEND>>>(\n|$))+/g,
      function (match) {
        const items = match
          .replace(
            /<<<OLSTART>>>(.*?)<<<OLEND>>>\n?/g,
            "&lt;li&gt;$1&lt;/li&gt;",
          )
          .trim();
        return "&lt;ol&gt;" + items + "&lt;/ol&gt;";
      },
    );
    text = text.replace(
      /^&gt; (.*?)$/gm,
      "&lt;blockquote&gt;$1&lt;/blockquote&gt;",
    );
    text = text.replace(
      /&lt;(\/?)([hH][123]|strong|em|code|pre|ul|ol|li|blockquote)&gt;/g,
      "<$1$2>",
    );

    for (let i = 0; i < urlCounter; i++) {
      const urlData = urlStore[i];
      let linkHtml;

      if (urlData.isMarkdown) {
        linkHtml = `<a href="${urlData.url}" target="_blank">${urlData.linkText}</a>`;
      } else if (urlData.hasProtocol) {
        linkHtml = `<a href="${urlData.url}" target="_blank">${urlData.url}</a>`;
      } else {
        linkHtml = `<a href="https://${urlData.url}" target="_blank">${urlData.url}</a>`;
      }

      const escapedPlaceholder = `&lt;&lt;&lt;URLTOKEN${i}&gt;&gt;&gt;`;
      text = text.replace(escapedPlaceholder, linkHtml);
      text = text.replace(`<<<URLTOKEN${i}>>>`, linkHtml);
    }

    text = text.replace(/\n\n/g, "</p><p>");
    text = text.replace(/(<\/li>)\s*<br>\s*(<li>)/g, "$1$2");
    text = text.replace(/(<ul>)\s*<br>\s*/g, "$1");
    text = text.replace(/\s*<br>\s*(<\/ul>)/g, "$1");
    text = text.replace(/(<ol>)\s*<br>\s*/g, "$1");
    text = text.replace(/\s*<br>\s*(<\/ol>)/g, "$1");
    text = text.replace(/\n/g, "<br>");

    if (!text.match(/^<(h[1-6]|ul|ol|pre|blockquote)/)) {
      text = "<p>" + text + "</p>";
    }

    return text;
  }

  initChatbot();
})();