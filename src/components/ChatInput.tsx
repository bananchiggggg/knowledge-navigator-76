import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2 } from 'lucide-react';
import { useBotStore } from '@/state/store';

interface ChatInputProps {
  onSubmit: (query: string) => void;
  onClarificationSelect: (key: string, value: string) => void;
}

export function ChatInput({ onSubmit, onClarificationSelect }: ChatInputProps) {
  const [query, setQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    isLoading, 
    awaitingClarification, 
    clarificationOptions,
    selectedClarifications 
  } = useBotStore();

  const placeholder = awaitingClarification 
    ? 'Выберите уточнение из предложенных вариантов или задайте новый вопрос...'
    : 'Опишите проблему... Пример: "После сбоя AD не пускает в домен"';

  const ghostText = !awaitingClarification 
    ? 'Советы: уточните ОС, сегмент, версию клиента VPN'
    : '';

  // Обработка горячих клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K - фокус на инпут
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      
      // /jira - быстрая эскалация
      if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          e.preventDefault();
          setQuery('/jira ');
          textareaRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoading) return;

    // Проверка команды /jira
    if (trimmedQuery.startsWith('/jira')) {
      // Здесь можно добавить логику открытия формы эскалации
      setQuery('');
      return;
    }

    onSubmit(trimmedQuery);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClarificationClick = (option: string) => {
    const value = `${option}: необходимо уточнить`;
    onClarificationSelect(option, value);
  };

  const getRemainingClarifications = () => {
    return clarificationOptions.filter(option => !selectedClarifications[option]);
  };

  return (
    <div className="space-y-4">
      {/* Уточняющие вопросы */}
      {awaitingClarification && (
        <div className="space-y-3">
          <div className="text-sm font-medium">
            Для более точного ответа выберите подходящие варианты:
          </div>
          <div className="flex flex-wrap gap-2">
            {getRemainingClarifications().map((option) => (
              <Badge
                key={option}
                variant="outline"
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleClarificationClick(option)}
              >
                {option}
              </Badge>
            ))}
          </div>
          {Object.keys(selectedClarifications).length > 0 && (
            <div className="text-sm text-muted-foreground">
              Выбрано: {Object.keys(selectedClarifications).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Поле ввода */}
      <div className="relative space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[100px] resize-none pr-12"
            maxLength={1000}
          />
          
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="absolute bottom-3 right-3 h-8 w-8 p-0"
            variant="copper"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Подсказки и счетчик символов */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{ghostText}</span>
          <span>{query.length}/1000</span>
        </div>

        {/* Горячие клавиши */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><kbd className="rounded border px-1">Ctrl+K</kbd> - фокус</span>
          <span><kbd className="rounded border px-1">/jira</kbd> - эскалация</span>
          <span><kbd className="rounded border px-1">Enter</kbd> - отправить</span>
        </div>
      </div>
    </div>
  );
}