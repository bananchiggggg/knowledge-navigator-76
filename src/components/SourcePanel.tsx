import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Copy, AlertCircle, Clock } from 'lucide-react';
import { useBotStore } from '@/state/store';
import { timeAgo, copyToClipboard } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export function SourcePanel() {
  const { currentSources, userRole } = useBotStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const accessibleSources = currentSources.filter(source => source.accessible);
  const inaccessibleCount = currentSources.length - accessibleSources.length;

  const handleCopySource = async (source: any, index: number) => {
    const text = `**${source.title}**\n\n${source.snippet}\n\nИсточник: ${source.url}`;
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: 'Скопировано',
        description: 'Информация об источнике скопирована',
      });
    }
  };

  const clarificationChips = [
    { key: 'os', label: 'ОС', description: 'Windows, Linux, macOS' },
    { key: 'segment', label: 'Сегмент', description: 'Корпоративный, удаленный, гостевой' },
    { key: 'vpn_version', label: 'Версия клиента VPN', description: 'Cisco AnyConnect, OpenVPN' }
  ];

  return (
    <div className="space-y-6">
      {/* Панель источников */}
      {accessibleSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ExternalLink className="h-5 w-5" />
              Источники
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {accessibleSources.map((source, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{source.title}</h4>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {source.space}
                      </Badge>
                      {source.anchor && (
                        <span className="text-xs text-muted-foreground">
                          #{source.anchor}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopySource(source, index)}
                    >
                      <Copy className={`h-4 w-4 ${copiedIndex === index ? 'text-success' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {source.snippet}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Обновлено {timeAgo(source.updatedAt)}</span>
                </div>
              </div>
            ))}

            {/* Предупреждение о недоступных источниках */}
            {inaccessibleCount > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
                <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
                <div className="text-sm">
                  <p className="font-medium">Есть недоступные страницы</p>
                  <p className="text-muted-foreground">
                    Найдено {inaccessibleCount} дополнительных источников, но у вас нет прав доступа.
                    Обратитесь к администратору для получения доступа.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Блок уточнений */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Уточнить контекст</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Для более точных ответов укажите дополнительную информацию:
          </p>
          
          <div className="space-y-3">
            {clarificationChips.map((chip) => (
              <div key={chip.key} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{chip.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {chip.description}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Выбрать
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Статистика сессии */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Статистика</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Источников найдено:</span>
            <span className="font-medium">{accessibleSources.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Недоступных:</span>
            <span className="font-medium">{inaccessibleCount}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Роль:</span>
            <Badge variant="outline" className="text-xs">
              {userRole === 'admin' ? 'Администратор' : 'Пользователь'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}