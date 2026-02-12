import { MemorySaver, StateGraph } from '@langchain/langgraph';
import type { Request, Response } from 'express';
import firebaseService from '../services/firebaseService';
import { FALLBACK_MESSAGE, vertexAIRag } from '../services/vertexAIRagService';

interface ChatState {
  message: string;
  answer: string;
  sessionId: string;
  cached: boolean;
}

// @ts-ignore - LangGraph typing complexity
const workflow = new StateGraph<ChatState>({
  channels: {
    message: {
      value: (x?: string, y?: string) => y ?? x ?? '',
      default: () => ''
    },
    answer: {
      value: (x?: string, y?: string) => y ?? x ?? '',
      default: () => ''
    },
    sessionId: {
      value: (x?: string, y?: string) => y ?? x ?? '',
      default: () => ''
    },
    cached: {
      value: (x?: boolean, y?: boolean) => y ?? x ?? false,
      default: () => false
    }
  }
})
  // @ts-ignore - LangGraph typing complexity
  .addNode("check_cache", async (state: ChatState) => {
    try {
      const { message, sessionId } = state;

      if (!message) {
        return { answer: "No message provided", cached: false };
      }

      console.log(`Checking cache for: ${message.substring(0, 50)}...`);
      const cachedAnswer = await firebaseService.getCachedAnswer(message);

      if (cachedAnswer) {
        console.log(`Cache hit for message: ${message.substring(0, 50)}...`);
        return { answer: cachedAnswer, cached: true };
      }

      console.log('No cache hit');
      return { cached: false };
    } catch (error) {
      console.error('Error in check_cache node:', error);
      return { answer: "Error checking cache", cached: false };
    }
  })
  .addNode("rag_retrieval", async (state: ChatState) => {
    try {
      const { message, sessionId } = state;

      if (!message) {
        return { answer: "No message provided", cached: false };
      }

      console.log(`RAG retrieval for: ${message.substring(0, 50)}...`);

      // Fetch conversation history for context
      let conversationHistory: Array<{sender: string, content: string}> = [];
      try {
        conversationHistory = await firebaseService.getConversationMessages(sessionId);
        console.log(`📜 Retrieved ${conversationHistory.length} previous messages for context`);
      } catch (historyError) {
        console.warn('Could not fetch conversation history:', historyError);
      }
      const answer = await vertexAIRag.retrieveContextsWithRAG(message, 5, conversationHistory);

      console.log(`RAG returned answer (length: ${answer.length}): ${answer.substring(0, 100)}...`);

      if (answer !== FALLBACK_MESSAGE) {
        try {
          await firebaseService.saveToCache(message, answer);
          console.log('Saved answer to Firebase cache');
        } catch (cacheError) {
          console.warn('Failed to save to cache:', cacheError);
        }
      }

      return { answer, cached: false };
    } catch (error) {
      console.error('Error in rag_retrieval node:', error);
      return { answer: "Sorry, I encountered an error while processing your request.", cached: false };
    }
  })
  .addNode("format_response", async (state: ChatState) => {
    try {
      const { answer, cached } = state;
      let finalAnswer = answer;
      
      if (cached && answer) {
        finalAnswer = `${answer}`;
      }

      return { answer: finalAnswer };
    } catch (error) {
      console.error('Error in format_response node:', error);
      return {};
    }
  });

workflow
  .addEdge("__start__", "check_cache")
  .addConditionalEdges("check_cache", (state: ChatState) => {
    return state.cached ? "format_response" : "rag_retrieval";
  })
  .addEdge("rag_retrieval", "format_response")
  .addEdge("format_response", "__end__");

const memory = new MemorySaver();
const graph = workflow.compile({ checkpointer: memory });
function extractEmail(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

const TYPING_DELAY_CACHED = 15;
const TYPING_DELAY_GENERATED = 30;

async function streamTextToResponse(res: Response, text: string, metadata: { isCached: boolean; sessionId: string }) {
  const words = text.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const chunk = i === words.length - 1 ? word : word + ' ';
    
    res.write(`data: ${JSON.stringify({
      chunk,
      ...metadata
    })}\n\n`);

    const delay = metadata.isCached ? TYPING_DELAY_CACHED : TYPING_DELAY_GENERATED;
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
                await firebaseService.startConversation(sessionId);
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

      const config = {
        configurable: {
          thread_id: sessionId
        }
      };

      const initialState: ChatState = {
        message: message.trim(),
        sessionId,
        answer: '',
        cached: false
      };

      console.log('Invoking LangGraph...');

      // @ts-ignore - LangGraph typing complexity
      const result = await graph.invoke(initialState, config) as unknown as ChatState;

      let answer = result.answer || 'Sorry, I could not generate a response.';
      const isCached = result.cached || false;

      let followupQuestions: string[] = [];
      const followupMatch = answer.match(/<<<FOLLOWUP: (.*?)>>>/);
      if (followupMatch) {
        followupQuestions = followupMatch[1].split('|').map((q: string) => q.trim()).filter((q: string) => q);
        answer = answer.replace(followupMatch[0], '').trim();
      }

      console.log(`Generated answer (cached: ${isCached}): ${answer.substring(0, 100)}...`);

      // Stream the response with realistic typing animation
      await streamTextToResponse(res, answer, { isCached, sessionId });

      // After streaming the main answer, send follow-up questions if any
      if (followupQuestions.length > 0) {
        const followupData = `<<<FOLLOWUP: ${followupQuestions.join(' | ')}>>>`;
        res.write(`data: ${JSON.stringify({
          chunk: followupData,
          isCached,
          sessionId
        })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();

      // Save user message and bot response to conversation session (async, non-blocking)
      try {
        // Create conversation session if it doesn't exist
        const existingSession = await firebaseService.getConversation(sessionId);
        if (!existingSession) {
          await firebaseService.startConversation(sessionId);
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