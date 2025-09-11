import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Download } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EscalationDialog } from './EscalationDialog';
import { useBotStore } from '@/state/store';
import { MockLLMAdapter } from '@/services/LLMAdapter';
import { MockConfluenceSearchAdapter } from '@/services/ConfluenceSearchAdapter';
import { ClarificationContext } from '@/types';

export function ChatPanel() {
  const {
    session,
    isLoading,
    awaitingClarification,
    selectedClarifications,
    userRole,
    addMessage,
    setLoading,
    setSources,
    startClarification,
    finishClarification,
    addClarification,
    logEvent,
    clearHistory
  } = useBotStore();

  const [escalationDialog, setEscalationDialog] = useState<{
    open: boolean;
    answerId?: string;
    originalQuery?: string;
    botAnswer?: string;
    sources?: string[];
  }>({
    open: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const llmAdapter = new MockLLMAdapter();
  const confluenceAdapter = new MockConfluenceSearchAdapter();

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const handleQuery = async (query: string) => {
    if (isLoading) return;

    // Добавляем сообщение пользователя
    addMessage({
      type: 'user',
      content: query
    });

    setLoading(true);

    try {
      // Подготавливаем контекст для уточнений
      const context: ClarificationContext | undefined = awaitingClarification ? {
        original_query: query,
        selected_options: selectedClarifications,
        remaining_questions: Math.max(0, 2 - Object.keys(selectedClarifications).length)
      } : undefined;

      // Параллельно запускаем поиск источников и получение ответа
      const [answer, sources] = await Promise.all([
        llmAdapter.ask(query, context),
        confluenceAdapter.search(query, { userRole })
      ]);

      // Сохраняем источники в стор
      setSources(sources);

      // Если нужны уточнения и их еще можно задать
      if (answer.clarification_needed && answer.clarification_options && !context) {
        startClarification(answer.clarification_options);
        
        addMessage({
          type: 'bot',
          content: 'Для более точного ответа выберите подходящие варианты уточнения.',
          answer
        });
      } else {
        // Завершаем режим уточнений если он был активен
        if (awaitingClarification) {
          finishClarification();
        }

        // Добавляем ответ бота
        addMessage({
          type: 'bot',
          content: 'Вот пошаговое решение для вашей проблемы:',
          answer
        });
      }

      // Логируем событие
      logEvent({
        type: 'answer_generated',
        data: {
          query,
          answer_id: answer.answer_id,
          confidence: answer.confidence,
          latency_ms: answer.latency_ms,
          sources_count: sources.length,
          accessible_sources: sources.filter(s => s.accessible).length
        }
      });

    } catch (error) {
      console.error('Ошибка получения ответа:', error);
      
      addMessage({
        type: 'system',
        content: 'Произошла ошибка при получении ответа. Попробуйте переформулировать вопрос или обратитесь к администратору.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClarificationSelect = (key: string, value: string) => {
    addClarification(key, value);
    
    // Если выбраны все доступные уточнения, запускаем новый запрос
    const currentSelections = { ...selectedClarifications, [key]: value };
    if (Object.keys(currentSelections).length >= 2) {
      const userMessages = session?.messages.filter(m => m.type === 'user') || [];
      const lastMessage = userMessages[userMessages.length - 1];
      if (lastMessage) {
        handleQuery(lastMessage.content);
      }
    }
  };

  const handleEscalation = (answerId: string) => {
    const userMessages = session?.messages.filter(m => m.type === 'user') || [];
    const lastUserMessage = userMessages[userMessages.length - 1];
    const answerMessage = session?.messages.find(m => m.answer?.answer_id === answerId);
    
    const sources = answerMessage?.answer?.sources
      ?.filter(s => s.accessible)
      ?.map(s => s.url) || [];

    setEscalationDialog({
      open: true,
      answerId,
      originalQuery: lastUserMessage?.content || '',
      botAnswer: answerMessage?.answer?.steps.join('\n') || '',
      sources
    });
  };

  const exportChatHistory = () => {
    if (!session?.messages) return;

    const history = session.messages
      .map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleString('ru-RU');
        
        if (msg.type === 'user') {
          return `[${timestamp}] Пользователь: ${msg.content}`;
        } else if (msg.type === 'bot' && msg.answer) {
          const steps = msg.answer.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
          const sources = msg.answer.sources
            .filter(s => s.accessible)
            .map(s => `- ${s.title}: ${s.url}`)
            .join('\n');
          
          return `[${timestamp}] Бот:\n${steps}\n\nИсточники:\n${sources}`;
        } else {
          return `[${timestamp}] Система: ${msg.content}`;
        }
      })
      .join('\n\n---\n\n');

    const blob = new Blob([history], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Заголовок панели чата */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Чат с ботом</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportChatHistory}
            disabled={!session?.messages.length}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearHistory}
            disabled={!session?.messages.length}
            className="flex items-center gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Очистить
          </Button>
        </div>
      </div>

      {/* Область сообщений */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {!session?.messages.length ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="text-center">
                <h3 className="mb-2 text-lg font-medium">Добро пожаловать в RAG Бот!</h3>
                <p className="text-muted-foreground">
                  Задайте вопрос для получения пошаговой инструкции с источниками
                </p>
              </div>
            </div>
          ) : (
            session.messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onEscalate={handleEscalation}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Поле ввода */}
      <div className="p-4">
        <ChatInput
          onSubmit={handleQuery}
          onClarificationSelect={handleClarificationSelect}
        />
      </div>

      {/* Диалог эскалации */}
      <EscalationDialog
        open={escalationDialog.open}
        onClose={() => setEscalationDialog({ open: false })}
        answerId={escalationDialog.answerId}
        originalQuery={escalationDialog.originalQuery}
        botAnswer={escalationDialog.botAnswer}
        sources={escalationDialog.sources}
      />
    </div>
  );
}