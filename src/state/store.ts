import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  UserSession, 
  ChatMessage, 
  UserRole, 
  Environment, 
  SourceDTO, 
  EscalationDraftInput,
  IndexStatusDTO,
  LogEvent,
  EscalationQueue
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface BotState {
  // Пользователь и сессия
  currentUser: string;
  userRole: UserRole;
  environment: Environment;
  session: UserSession | null;
  
  // Состояние чата
  isLoading: boolean;
  currentSources: SourceDTO[];
  
  // Уточняющие вопросы
  awaitingClarification: boolean;
  clarificationOptions: string[];
  selectedClarifications: Record<string, string>;
  
  // Статус индекса
  indexStatus: IndexStatusDTO | null;
  
  // Очередь эскалаций
  escalationQueue: EscalationQueue;
  
  // Логи событий
  events: LogEvent[];
  
  // Методы
  initSession: (user: string, role: UserRole, env: Environment) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setSources: (sources: SourceDTO[]) => void;
  startClarification: (options: string[]) => void;
  addClarification: (key: string, value: string) => void;
  finishClarification: () => void;
  setIndexStatus: (status: IndexStatusDTO) => void;
  addToEscalationQueue: (escalation: EscalationDraftInput) => void;
  clearEscalationQueue: () => void;
  logEvent: (event: Omit<LogEvent, 'timestamp' | 'session_id' | 'user'>) => void;
  clearHistory: () => void;
  switchEnvironment: (env: Environment) => void;
}

export const useBotStore = create<BotState>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      currentUser: 'Пользователь',
      userRole: 'user',
      environment: 'dev',
      session: null,
      isLoading: false,
      currentSources: [],
      awaitingClarification: false,
      clarificationOptions: [],
      selectedClarifications: {},
      indexStatus: null,
      escalationQueue: { items: [], last_attempt: '' },
      events: [],

      // Инициализация сессии
      initSession: (user: string, role: UserRole, env: Environment) => {
        const session_id = uuidv4();
        const session: UserSession = {
          session_id,
          user,
          role,
          environment: env,
          messages: [],
          created_at: new Date().toISOString()
        };
        
        set({ 
          currentUser: user, 
          userRole: role, 
          environment: env, 
          session 
        });
      },

      // Добавление сообщения
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          ...message
        };

        set((state) => {
          if (!state.session) return state;

          const updatedMessages = [...state.session.messages, newMessage];
          // Ограничиваем историю 20 сообщениями
          const limitedMessages = updatedMessages.slice(-20);

          return {
            session: {
              ...state.session,
              messages: limitedMessages
            }
          };
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setSources: (sources) => set({ currentSources: sources }),

      startClarification: (options) => set({ 
        awaitingClarification: true, 
        clarificationOptions: options,
        selectedClarifications: {}
      }),

      addClarification: (key, value) => set((state) => ({
        selectedClarifications: {
          ...state.selectedClarifications,
          [key]: value
        }
      })),

      finishClarification: () => set({ 
        awaitingClarification: false, 
        clarificationOptions: [],
        selectedClarifications: {}
      }),

      setIndexStatus: (status) => set({ indexStatus: status }),

      addToEscalationQueue: (escalation) => set((state) => ({
        escalationQueue: {
          items: [...state.escalationQueue.items, escalation],
          last_attempt: new Date().toISOString()
        }
      })),

      clearEscalationQueue: () => set({
        escalationQueue: { items: [], last_attempt: '' }
      }),

      logEvent: (event) => {
        const state = get();
        const logEvent: LogEvent = {
          ...event,
          timestamp: new Date().toISOString(),
          session_id: state.session?.session_id || 'unknown',
          user: state.currentUser
        };

        set((state) => ({
          events: [...state.events, logEvent].slice(-100) // Храним последние 100 событий
        }));

        // Логируем в консоль для отладки
        console.log('[RAG Bot Event]', logEvent);
      },

      clearHistory: () => set((state) => ({
        session: state.session ? {
          ...state.session,
          messages: []
        } : null,
        currentSources: [],
        awaitingClarification: false,
        clarificationOptions: [],
        selectedClarifications: {}
      })),

      switchEnvironment: (env) => set({ environment: env })
    }),
    {
      name: 'rag-bot-storage',
      partialize: (state) => ({
        // Сохраняем только необходимые данные
        currentUser: state.currentUser,
        userRole: state.userRole,
        environment: state.environment,
        session: state.session,
        escalationQueue: state.escalationQueue,
        events: state.events.slice(-50) // Сохраняем только последние 50 событий
      })
    }
  )
);