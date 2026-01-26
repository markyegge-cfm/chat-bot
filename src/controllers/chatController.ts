import { MemorySaver, StateGraph } from '@langchain/langgraph';
import type { Request, Response } from 'express';
import conversationService from '../services/conversationService';
import firebaseService from '../services/firebaseService';
import { vertexAIRag } from '../services/vertexAIRagService';

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
      
      // Save to cache for future use
      try {
        await firebaseService.saveToCache(message, answer);
        console.log('Saved answer to Firebase cache');
      } catch (cacheError) {
        console.warn('Failed to save to cache:', cacheError);
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
        finalAnswer = `${answer}\n\n*(Answer retrieved from cache)*`;
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

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream the response in chunks
      const chunkSize = 100;
      for (let i = 0; i < answer.length; i += chunkSize) {
        const chunk = answer.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ 
          chunk,
          isCached,
          sessionId 
        })}\n\n`);
        
        // Add a small delay for streaming effect
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      res.write('data: [DONE]\n\n');
      res.end();

      // Save user message and bot response to conversation session (async, non-blocking)
      // This is optional - if it fails, chat still works
      try {
        // Create conversation session if it doesn't exist
        const existingSession = await conversationService.getSession(sessionId);
        if (!existingSession) {
          await conversationService.createSession('anonymous', sessionId);
          console.log(`[Conversation] New session created: ${sessionId}`);
        }

        await conversationService.addMessage(sessionId, 'user', message);
        await conversationService.addMessage(sessionId, 'bot', answer);
        console.log(`[Conversation] Messages saved for session ${sessionId}`);
      } catch (convError: any) {
        // Gracefully skip conversation saving if Firestore has issues
        // The chat experience isn't affected
        if (convError.code === 5 || convError.message?.includes('NOT_FOUND')) {
          console.warn('[Conversation] Skipping - Firestore conversations collection not available');
        } else {
          console.warn('Failed to save conversation messages:', convError.message);
        }
      }

    } catch (error: any) {
      console.error('Error in chat controller:', error);
      
      // Send error as SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const errorMessage = error.message || 'An error occurred. Please try again later.';
      res.write(`data: ${JSON.stringify({ 
        error: errorMessage,
        sessionId 
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}