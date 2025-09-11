import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Copy, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ChatMessage as ChatMessageType, FeedbackDTO } from '@/types';
import { copyToClipboard, formatChecklistAsMarkdown, timeAgo } from '@/lib/utils';
import { useBotStore } from '@/state/store';
import { toast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
  onEscalate?: (answer_id: string) => void;
}

export function ChatMessage({ message, onEscalate }: ChatMessageProps) {
  const { logEvent } = useBotStore();
  const [feedbackState, setFeedbackState] = useState<'none' | 'helpful' | 'not_helpful'>('none');
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);

  const handleCopyChecklist = async () => {
    if (!message.answer) return;
    
    const markdown = formatChecklistAsMarkdown(
      message.answer.steps,
      'Инструкция по решению проблемы'
    );
    
    const success = await copyToClipboard(markdown);
    if (success) {
      toast({
        title: 'Скопировано',
        description: 'Чек-лист скопирован в буфер обмена',
      });
      logEvent({
        type: 'answer_generated',
        data: { action: 'copy_checklist', answer_id: message.answer.answer_id }
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось скопировать в буфер обмена',
        variant: 'destructive'
      });
    }
  };

  const handleFeedback = (helpful: boolean) => {
    if (!message.answer) return;

    const feedback: FeedbackDTO = {
      answer_id: message.answer.answer_id,
      helpful,
      comment: comment.trim() || undefined,
      session_id: '',
      user: '',
      ts: new Date().toISOString()
    };

    setFeedbackState(helpful ? 'helpful' : 'not_helpful');
    setShowComment(false);

    logEvent({
      type: 'feedback_submitted',
      data: feedback
    });

    toast({
      title: helpful ? 'Спасибо за оценку!' : 'Спасибо за отзыв',
      description: helpful 
        ? 'Ваша оценка поможет улучшить ответы бота'
        : 'Мы учтём ваш отзыв для улучшения базы знаний',
    });
  };

  const handleEscalate = () => {
    if (!message.answer || !onEscalate) return;
    onEscalate(message.answer.answer_id);
  };

  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] rounded-lg bg-chat-user px-4 py-3">
          <p className="text-foreground">{message.content}</p>
          <div className="mt-1 text-xs text-muted-foreground">
            {timeAgo(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="mb-4 flex justify-center">
        <div className="rounded-lg bg-chat-system px-3 py-2 text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  // Ответ бота
  return (
    <div className="mb-6">
      <Card className="bg-chat-bot">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Ответ бота</CardTitle>
            <div className="flex items-center gap-2">
              {message.answer && (
                <>
                  <Badge variant="copper-outline" className="text-xs">
                    {Math.round(message.answer.confidence * 100)}% уверенность
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {message.answer.latency_ms}мс
                  </Badge>
                </>
              )}
              <span className="text-xs text-muted-foreground">
                {timeAgo(message.timestamp)}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Шаги решения */}
          {message.answer && message.answer.steps.length > 0 && (
            <div>
              <h4 className="mb-3 font-medium">Пошаговое решение:</h4>
              <ol className="space-y-2">
                {message.answer.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Источники и цитаты */}
          {message.answer && message.answer.sources.length > 0 && (
            <div>
              <h4 className="mb-3 font-medium">Источники:</h4>
              <div className="space-y-2">
                {message.answer.sources
                  .filter(source => source.accessible)
                  .map((source, index) => (
                  <div key={index} className="rounded border bg-source-highlight/20 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium">{source.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {source.space}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <blockquote className="border-l-2 border-source-border pl-3 text-sm text-muted-foreground">
                      "{source.snippet}"
                    </blockquote>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Обновлено: {timeAgo(source.updatedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="copper"
              onClick={handleCopyChecklist}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Скопировать чек-лист
            </Button>

            <Button
              size="sm"
              variant="copper-outline"
              onClick={handleEscalate}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Эскалировать
            </Button>

            {/* Кнопки оценки */}
            {feedbackState === 'none' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedback(true)}
                  className="flex items-center gap-2 text-success hover:bg-success/10"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Помогло
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowComment(true)}
                  className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Не помогло
                </Button>
              </>
            )}

            {feedbackState === 'helpful' && (
              <Badge className="flex items-center gap-1 bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3" />
                Отмечено как полезное
              </Badge>
            )}

            {feedbackState === 'not_helpful' && (
              <Badge className="flex items-center gap-1 bg-destructive text-destructive-foreground">
                <XCircle className="h-3 w-3" />
                Отмечено как неполезное
              </Badge>
            )}
          </div>

          {/* Форма комментария */}
          {showComment && (
            <div className="space-y-3 border-t pt-4">
              <h5 className="font-medium">Расскажите, что можно улучшить:</h5>
              <Textarea
                placeholder="Необязательный комментарий (до 200 символов)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={200}
                className="min-h-[80px]"
              />
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {comment.length}/200
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowComment(false);
                      setComment('');
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleFeedback(false)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Отправить отзыв
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}