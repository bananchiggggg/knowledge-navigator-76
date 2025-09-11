import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, User, Clock, Database } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useBotStore } from '@/state/store';
import { getEnvironmentIndicator, timeAgo } from '@/lib/utils';
import { Environment } from '@/types';
import { MockIndexStatusService } from '@/services/IndexStatusService';
import { toast } from '@/hooks/use-toast';

export function Header() {
  const {
    currentUser,
    userRole,
    environment,
    indexStatus,
    setIndexStatus,
    switchEnvironment
  } = useBotStore();

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [reindexingSpaces, setReindexingSpaces] = useState<Set<string>>(new Set());
  
  const envIndicator = getEnvironmentIndicator(environment);
  const indexService = new MockIndexStatusService();

  // Вычисляем время последнего обновления индекса
  const lastUpdateText = indexStatus 
    ? timeAgo(indexStatus.lastGlobalUpdateAt)
    : 'Неизвестно';

  const handleReindex = async (spaceKey: string) => {
    setReindexingSpaces(prev => new Set(prev).add(spaceKey));
    
    try {
      await indexService.reindex(spaceKey);
      
      toast({
        title: 'Переиндексация запущена',
        description: `Пространство ${spaceKey} добавлено в очередь переиндексации`,
      });

      // Обновляем статус через 1 секунду
      setTimeout(async () => {
        const newStatus = await indexService.getStatus();
        setIndexStatus(newStatus);
      }, 1000);
      
    } catch (error) {
      toast({
        title: 'Ошибка переиндексации',
        description: 'Не удалось запустить переиндексацию',
        variant: 'destructive'
      });
    } finally {
      setReindexingSpaces(prev => {
        const newSet = new Set(prev);
        newSet.delete(spaceKey);
        return newSet;
      });
    }
  };

  return (
    <header className="border-b bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            RAG Бот
          </h1>
          
          {/* Переключатель среды */}
          <Select 
            value={environment} 
            onValueChange={(value: Environment) => switchEnvironment(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">DEV</SelectItem>
              <SelectItem value="stg">STG</SelectItem>
              <SelectItem value="prod">PROD</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge 
            variant="copper"
            className="text-xs font-medium"
          >
            {envIndicator.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Индикатор индекса */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Обновлён {lastUpdateText}</span>
          </div>

          {/* Админская панель */}
          {userRole === 'admin' && (
            <Button
              variant="copper-ghost"
              size="sm"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Индекс
            </Button>
          )}

          {/* Переключатель темы */}
          <ThemeToggle />

          {/* Профиль пользователя */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{currentUser}</span>
                <Badge variant="outline" className="text-xs">
                  {userRole === 'admin' ? 'Админ' : 'Пользователь'}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Админская панель индекса */}
      {showAdminPanel && userRole === 'admin' && (
        <div className="mt-4 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-3 font-medium">Статус индекса</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {indexStatus?.spaces.map((space) => (
              <div key={space.key} className="flex items-center justify-between rounded border bg-card p-3">
                <div>
                  <div className="font-medium">{space.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {space.docs} документов • {timeAgo(space.lastUpdatedAt)}
                    {space.errors && space.errors > 0 && (
                      <span className="ml-1 text-destructive">
                        • {space.errors} ошибок
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="copper-outline"
                  onClick={() => handleReindex(space.key)}
                  disabled={reindexingSpaces.has(space.key)}
                  className="min-w-[140px]"
                >
                  {reindexingSpaces.has(space.key) ? 'В очереди...' : 'Переиндексировать'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}