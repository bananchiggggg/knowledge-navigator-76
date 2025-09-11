// DTO типы для RAG бота согласно ТЗ

export type UserRole = 'user' | 'admin';

export type Environment = 'dev' | 'stg' | 'prod';

// Ответ бота
export interface AnswerDTO {
  answer_id: string;
  type: 'checklist' | 'steps' | 'brief';
  steps: string[]; // 3–5 шагов
  sources: SourceDTO[];
  confidence: number; // 0..1
  latency_ms: number;
  clarification_needed?: boolean;
  clarification_options?: string[];
}

// Источник из Confluence
export interface SourceDTO {
  title: string;
  space: string;
  url: string;
  anchor?: string;
  snippet: string;
  updatedAt: string;
  accessible: boolean; // для ACL
}

// Оценка ответа
export interface FeedbackDTO {
  answer_id: string;
  helpful: boolean;
  comment?: string; // ≤ 200 символов
  session_id: string;
  user: string;
  ts: string;
}

// Эскалация (черновик)
export interface EscalationDraftDTO {
  draft_id: string;
  project: string; // пример: "ITSUP"
  issueType: string; // "Incident" | "Task"
  priority: 'Low' | 'Medium' | 'High';
  components?: string[];
  summary: string;
  description: string; // диалог + ссылки
  link: string; // jira://draft/{uuid} (заглушка)
}

export interface EscalationDraftInput {
  project: string;
  issueType: string;
  priority: 'Low' | 'Medium' | 'High';
  components?: string[];
  summary: string;
  description: string;
}

// Статус индекса
export interface IndexStatusDTO {
  spaces: SpaceStatusDTO[];
  lastGlobalUpdateAt: string;
}

export interface SpaceStatusDTO {
  key: string;
  name: string;
  lastUpdatedAt: string;
  docs: number;
  errors?: number;
}

// Сообщение в чате
export interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: string;
  answer?: AnswerDTO;
  feedback?: FeedbackDTO;
}

// Сессия пользователя
export interface UserSession {
  session_id: string;
  user: string;
  role: UserRole;
  environment: Environment;
  messages: ChatMessage[];
  created_at: string;
}

// Контекст для уточняющих вопросов
export interface ClarificationContext {
  original_query: string;
  selected_options: Record<string, string>;
  remaining_questions: number;
}

// События для логирования
export interface LogEvent {
  type: 'answer_generated' | 'feedback_submitted' | 'escalation_created' | 'clarification_selected';
  data: any;
  timestamp: string;
  session_id: string;
  user: string;
}

// Очередь эскалаций для оффлайн режима
export interface EscalationQueue {
  items: EscalationDraftInput[];
  last_attempt: string;
}