import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Keyboard } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 px-4 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Дисклеймер */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span>
            Проверяйте изменения на тестовом стенде. 
            Ответ сформирован автоматически.
          </span>
        </div>

        {/* Горячие клавиши */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Keyboard className="h-3 w-3" />
            <span>Горячие клавиши:</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Ctrl+K - фокус ввода
          </Badge>
          <Badge variant="outline" className="text-xs">
            /jira - эскалация
          </Badge>
          <Badge variant="outline" className="text-xs">
            Enter - отправить
          </Badge>
        </div>
      </div>
    </footer>
  );
}