import { IndexStatusDTO, SpaceStatusDTO } from '@/types';

export interface IndexStatusService {
  getStatus(): Promise<IndexStatusDTO>;
  reindex(spaceKey: string): Promise<void>;
}

// Мок-реализация службы статуса индекса
export class MockIndexStatusService implements IndexStatusService {
  private spaces: SpaceStatusDTO[] = [
    {
      key: 'ITKB',
      name: 'IT Knowledge Base',
      lastUpdatedAt: this.getRandomRecentTime(15),
      docs: 156,
      errors: 0
    },
    {
      key: 'MON',
      name: 'Monitoring',
      lastUpdatedAt: this.getRandomRecentTime(8),
      docs: 89,
      errors: 2
    }
  ];

  private reindexQueue: Set<string> = new Set();

  async getStatus(): Promise<IndexStatusDTO> {
    // Симуляция задержки
    await new Promise(resolve => setTimeout(resolve, 150));

    // Обновляем время последнего обновления для имитации "живого" индекса
    const globalLastUpdate = Math.min(
      ...this.spaces.map(space => new Date(space.lastUpdatedAt).getTime())
    );

    return {
      spaces: this.spaces.map(space => ({
        ...space,
        lastUpdatedAt: this.reindexQueue.has(space.key) 
          ? new Date().toISOString() 
          : space.lastUpdatedAt
      })),
      lastGlobalUpdateAt: new Date(globalLastUpdate).toISOString()
    };
  }

  async reindex(spaceKey: string): Promise<void> {
    // Симуляция задержки запуска переиндексации
    await new Promise(resolve => setTimeout(resolve, 300));

    this.reindexQueue.add(spaceKey);

    // Симулируем завершение переиндексации через некоторое время
    setTimeout(() => {
      this.reindexQueue.delete(spaceKey);
      const space = this.spaces.find(s => s.key === spaceKey);
      if (space) {
        space.lastUpdatedAt = new Date().toISOString();
        space.docs += Math.floor(Math.random() * 5); // Имитация новых документов
        space.errors = Math.random() < 0.2 ? Math.floor(Math.random() * 3) : 0;
      }
    }, 5000); // 5 секунд для демонстрации
  }

  private getRandomRecentTime(maxMinutesAgo: number): string {
    const minutesAgo = Math.floor(Math.random() * maxMinutesAgo) + 1;
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutesAgo);
    return date.toISOString();
  }

  // Вспомогательный метод для получения времени в человеко-читаемом формате
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'только что';
    if (diffMins === 1) return '1 минуту назад';
    if (diffMins < 5) return `${diffMins} минуты назад`;
    return `${diffMins} минут назад`;
  }
}