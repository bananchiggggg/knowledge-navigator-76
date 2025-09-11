import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { EscalationDraftInput, EscalationDraftDTO } from '@/types';
import { useBotStore } from '@/state/store';
import { createEscalationDescription } from '@/lib/utils';
import { MockJiraAdapter } from '@/services/JiraAdapter';
import { toast } from '@/hooks/use-toast';

interface EscalationDialogProps {
  open: boolean;
  onClose: () => void;
  answerId?: string;
  originalQuery?: string;
  botAnswer?: string;
  sources?: string[];
}

export function EscalationDialog({
  open,
  onClose,
  answerId,
  originalQuery = '',
  botAnswer = '',
  sources = []
}: EscalationDialogProps) {
  const { addToEscalationQueue, logEvent } = useBotStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<EscalationDraftDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EscalationDraftInput>({
    project: 'ITSUP',
    issueType: 'Incident',
    priority: 'Medium',
    components: ['Support'],
    summary: originalQuery || 'Требуется помощь с техническим вопросом',
    description: createEscalationDescription(originalQuery, botAnswer, sources)
  });

  const jiraAdapter = new MockJiraAdapter();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const draft = await jiraAdapter.createDraft(formData);
      setResult(draft);
      
      logEvent({
        type: 'escalation_created',
        data: { 
          draft_id: draft.draft_id,
          answer_id: answerId,
          project: draft.project,
          priority: draft.priority
        }
      });

      toast({
        title: 'Эскалация создана',
        description: `Черновик тикета создан: ${draft.link}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(errorMessage);
      
      // Добавляем в очередь для повторной отправки
      addToEscalationQueue(formData);
      
      toast({
        title: 'Ошибка создания тикета',
        description: 'Эскалация сохранена в очереди для повторной отправки',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  if (result) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Эскалация создана
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg border border-success/20 bg-success/5 p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ID черновика:</span>
                  <code className="text-sm font-mono">{result.draft_id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Проект:</span>
                  <Badge variant="outline">{result.project}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Приоритет:</span>
                  <Badge variant="outline">{result.priority}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ссылка на черновик:</Label>
              <div className="flex items-center gap-2 rounded border bg-muted p-2">
                <code className="flex-1 text-sm">{result.link}</code>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Черновик тикета создан и готов к отправке в Jira. 
              Используйте ссылку выше для доступа к черновику.
            </p>

            <Button onClick={handleClose} className="w-full">
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создание эскалации в Jira</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium">Ошибка создания тикета</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <p className="mt-2 text-sm">
              Данные сохранены в очереди и будут отправлены автоматически при восстановлении соединения.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Основные поля */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Проект</Label>
              <Select 
                value={formData.project} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, project: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ITSUP">IT Support (ITSUP)</SelectItem>
                  <SelectItem value="INFRA">Infrastructure (INFRA)</SelectItem>
                  <SelectItem value="SECURITY">Security (SEC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueType">Тип задачи</Label>
              <Select 
                value={formData.issueType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, issueType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Incident">Инцидент</SelectItem>
                  <SelectItem value="Task">Задача</SelectItem>
                  <SelectItem value="Bug">Ошибка</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Приоритет</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: 'Low' | 'Medium' | 'High') => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Низкий</SelectItem>
                <SelectItem value="Medium">Средний</SelectItem>
                <SelectItem value="High">Высокий</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Краткое описание</Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Краткое описание проблемы"
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.summary.length}/200
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Подробное описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Подробное описание проблемы, шаги воспроизведения, ожидаемый результат"
              className="min-h-[200px]"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/2000
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.summary.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать эскалацию'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}