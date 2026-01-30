import { MemorySaver, StateGraph } from '@langchain/langgraph';
import type { Request, Response } from 'express';
import firebaseService from '../services/firebaseService';
import { FALLBACK_MESSAGE, vertexAIRag } from '../services/vertexAIRagService';

// Define the state interface
interface ChatState {
  message: string;
  answer: string;
  sessionId: string;
  cached: boolean;
}

// Create the workflow with proper __root__ channel
const workflow = new StateGraph<{ __root__: any }>({
  channels: {
    __root__: {
      value: (x: ChatState) => x,
      default: () => ({
        message: '',
        answer: '',
        sessionId: '',
        cached: false
      }),
      reducer: (current: ChatState, update: Partial<ChatState>) => ({
        ...current,
        ...update
      })
    }
  }
})
  .addNode("check_cache", async (state: any) => {
    try {
      const currentState = state.__root__.value as ChatState;
      const { message, sessionId } = currentState;

      if (!message) {
        return {
          __root__: {
            value: {
              message: '',
              answer: "No message provided",
              sessionId,
              cached: false
            }
          }
        };
      }

      // Check cache first
      console.log(`Checking cache for: ${message.substring(0, 50)}...`);
      const cachedAnswer = await firebaseService.getCachedAnswer(message);

      if (cachedAnswer) {
        console.log(`Cache hit for message: ${message.substring(0, 50)}...`);
        return {
          __root__: {
            value: {
              ...currentState,
              answer: cachedAnswer,
              cached: true
            }
          }
        };
      }

      // No cache hit
      console.log('No cache hit');
      return {
        __root__: {
          value: {
            ...currentState,
            cached: false
          }
        }
      };
    } catch (error) {
      console.error('Error in check_cache node:', error);
      return {
        __root__: {
          value: {
            message: '',
            answer: "Error checking cache",
            sessionId: '',
            cached: false
          }
        }
      };
    }
  })
  .addNode("rag_retrieval", async (state: any) => {
    try {
      const currentState = state.__root__.value as ChatState;
      const { message, sessionId } = currentState;

      if (!message) {
        return {
          __root__: {
            value: {
              message: '',
              answer: "No message provided",
              sessionId,
              cached: false
            }
          }
        };
      }

      console.log(`RAG retrieval for: ${message.substring(0, 50)}...`);
      const answer = await vertexAIRag.retrieveContextsWithRAG(message, 5);

      // Save to cache for future use (ONLY if it's not a fallback message)
      if (answer !== FALLBACK_MESSAGE) {
        try {
          await firebaseService.saveToCache(message, answer);
          console.log('Saved answer to Firebase cache');
        } catch (cacheError) {
          console.warn('Failed to save to cache:', cacheError);
        }
      }

      return {
        __root__: {
          value: {
            ...currentState,
            answer,
            cached: false
          }
        }
      };
    } catch (error) {
      console.error('Error in rag_retrieval node:', error);
      return {
        __root__: {
          value: {
            ...state.__root__.value,
            answer: "Sorry, I encountered an error while processing your request.",
            cached: false
          }
        }
      };
    }
  })
  .addNode("format_response", async (state: any) => {
    try {
      const currentState = state.__root__.value as ChatState;
      const { answer, cached } = currentState;

      let finalAnswer = answer;
      if (cached && answer) {
        finalAnswer = `${answer}`;
      }

      return {
        __root__: {
          value: {
            ...currentState,
            answer: finalAnswer
          }
        }
      };
    } catch (error) {
      console.error('Error in format_response node:', error);
      return {
        __root__: {
          value: state.__root__.value
        }
      };
    }
  });

// Set up the graph with conditional routing
workflow
  .addEdge("__start__", "check_cache")
  .addConditionalEdges("check_cache", (state: any) => {
    const currentState = state.__root__.value as ChatState;
    return currentState.cached ? "format_response" : "rag_retrieval";
  })
  .addEdge("rag_retrieval", "format_response")
  .addEdge("format_response", "__end__");

// Add memory for session persistence
const memory = new MemorySaver();
const graph = workflow.compile({ checkpointer: memory });

/**
 * Utility to detect emails in strings
 */
function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

/**
 * Stream text with realistic typing speed
 * Sends chunks character by character with slight delays for smooth animation
 */
async function streamTextToResponse(res: Response, text: string, metadata: { isCached: boolean; sessionId: string }) {
  // Stream in smaller chunks for smoother animation
  const words = text.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const chunk = i === words.length - 1 ? word : word + ' ';
    
    res.write(`data: ${JSON.stringify({
      chunk,
      ...metadata
    })}\n\n`);

    // Add small delay between words for realistic typing effect
    // Faster for cached responses, slower for generated ones
    const delay = metadata.isCached ? 15 : 30;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export class ChatController {

  static async handleMessage(req: Request, res: Response): Promise<void> {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      res.status(400).json({ error: 'Missing message or sessionId' });
      return;
    }

    console.log(`\n=== New Chat Request ===`);
    console.log(`Session: ${sessionId}`);
    console.log(`Message: ${message.substring(0, 100)}...`);

    // Set up SSE headers immediately
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders(); // Flush headers to establish connection

    try {
      // Initialize services if needed
      if (!firebaseService.isInitialized()) {
        try {
          await firebaseService.initialize();
        } catch (firebaseError) {
          console.warn('Firebase initialization warning:', firebaseError);
        }
      }

      if (!vertexAIRag.isInitialized()) {
        try {
          await vertexAIRag.initialize();
        } catch (ragError) {
          console.error('Failed to initialize Vertex AI RAG:', ragError);
          throw new Error('RAG service unavailable');
        }
      }

      // ==========================================
      // ESCALATION LOGIC (Check for Email Response)
      // ==========================================
      const email = extractEmail(message);
      if (email) {
        console.log(`📧 Detected email in user message: ${email}`);

        // Fetch recent conversation history to see if the bot asked for it
        const history = await firebaseService.getConversationMessages(sessionId);

        if (history.length >= 2) {
          const lastBotMsg = history[history.length - 1];
          const prevUserMsg = history[history.length - 2];

          // Check if the last bot message was the fallback prompt
          if (lastBotMsg.sender === 'assistant' &&
            (lastBotMsg.content.includes("share your email") || lastBotMsg.content === FALLBACK_MESSAGE)) {

            const questionToEscalate = prevUserMsg.content;
            console.log(`📝 Creating escalation for question: "${questionToEscalate}"`);

            await firebaseService.createEscalation({
              user: email,
              question: questionToEscalate,
              sessionId: sessionId,
              status: 'open'
            });

            // Send Email Notification to Admin
            try {
              const emailService = await import('../services/emailService').then(m => m.default);
              await emailService.sendEscalationNotification({
                userEmail: email,
                question: questionToEscalate,
                sessionId: sessionId,
                conversationHistory: [
                  ...history,
                  { sender: 'user', content: message, timestamp: new Date().toISOString() }
                ]
              });
            } catch (mailError) {
              console.error('📧 Failed to trigger email notification:', mailError);
            }

            // Send confirmation response with streaming
            const confirmationMsg = "Thank you! We've created a support ticket for your issue. Our team will review it and contact you shortly via email.";

            // Ensure session exists before adding messages
            try {
              const existingSession = await firebaseService.getConversation(sessionId);
              if (!existingSession) {
                await firebaseService.startConversation(sessionId, 'anonymous');
                console.log(`[Conversation] New session created: ${sessionId}`);
              }
            } catch (sessionError) {
              console.warn('Could not verify/create session:', sessionError);
            }

            // Save to history
            await firebaseService.addMessage(sessionId, 'user', message);
            await firebaseService.addMessage(sessionId, 'assistant', confirmationMsg);

            // Stream the response
            await streamTextToResponse(res, confirmationMsg, { isCached: false, sessionId });
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
        }
      }

      // ==========================================
      // NORMAL FLOW (LangGraph)
      // ==========================================

      // Set up config with thread_id for memory
      const config = {
        configurable: {
          thread_id: sessionId
        }
      };

      // Create initial state
      const initialState: ChatState = {
        message: message.trim(),
        sessionId,
        answer: '',
        cached: false
      };

      console.log('Invoking LangGraph...');

      const result = await graph.invoke(
        { __root__: { value: initialState } },
        config
      );

      // Type assertion to access the result
      const resultState = (result as any).__root__?.value as ChatState;
      const answer = resultState?.answer || 'Sorry, I could not generate a response.';
      const isCached = resultState?.cached || false;

      console.log(`Generated answer (cached: ${isCached}): ${answer.substring(0, 100)}...`);

      // Stream the response with realistic typing animation
      await streamTextToResponse(res, answer, { isCached, sessionId });

      res.write('data: [DONE]\n\n');
      res.end();

      // Save user message and bot response to conversation session (async, non-blocking)
      try {
        // Create conversation session if it doesn't exist
        const existingSession = await firebaseService.getConversation(sessionId);
        if (!existingSession) {
          await firebaseService.startConversation(sessionId, 'anonymous');
          console.log(`[Conversation] New session created: ${sessionId}`);
        }

        await firebaseService.addMessage(sessionId, 'user', message);
        await firebaseService.addMessage(sessionId, 'assistant', answer);
        console.log(`[Conversation] Messages saved for session ${sessionId}`);
      } catch (convError: any) {
        if (convError.code === 5 || convError.message?.includes('NOT_FOUND')) {
          console.warn('[Conversation] Skipping - Firestore conversations collection not available');
        } else {
          console.warn('Failed to save conversation messages:', convError.message);
        }
      }

    } catch (error: any) {
      console.error('Error in chat controller:', error);

      const errorMessage = error.message || 'An error occurred. Please try again later.';
      
      // Stream error message
      await streamTextToResponse(res, errorMessage, { isCached: false, sessionId });
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}