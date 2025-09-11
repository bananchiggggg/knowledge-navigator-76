import { SourceDTO, UserRole } from '@/types';

export interface ConfluenceSearchAdapter {
  search(query: string, filters?: SearchFilters): Promise<SourceDTO[]>;
}

export interface SearchFilters {
  spaces?: string[];
  userRole?: UserRole;
}

// Мок-реализация поиска по Confluence
export class MockConfluenceSearchAdapter implements ConfluenceSearchAdapter {
  private mockSources: SourceDTO[] = [
    {
      title: 'Настройка VPN клиента',
      space: 'ITKB',
      url: 'https://confluence.local/display/ITKB/vpn-client-setup',
      anchor: 'setup-windows',
      snippet: 'Для подключения VPN из дома используйте следующие настройки: сервер vpn.company.com, протокол IKEv2, аутентификация по сертификату.',
      updatedAt: '2025-08-01T14:20:00Z',
      accessible: true
    },
    {
      title: 'Устранение проблем с доменом Active Directory',
      space: 'ITKB',
      url: 'https://confluence.local/display/ITKB/ad-troubleshooting',
      anchor: 'netlogon-service',
      snippet: 'При сбоях AD проверьте сетевое подключение к контроллеру домена и состояние служб Netlogon, DNS Client.',
      updatedAt: '2025-07-15T10:30:00Z',
      accessible: true
    },
    {
      title: 'Диагностика VPN соединений',
      space: 'ITKB',
      url: 'https://confluence.local/display/ITKB/vpn-diagnostics',
      snippet: 'При проблемах с VPN проверьте статус служб, логи соединения и сетевую доступность до VPN-сервера.',
      updatedAt: '2025-07-28T09:15:00Z',
      accessible: true
    },
    {
      title: 'Настройка агентов Zabbix',
      space: 'MON',
      url: 'https://confluence.local/display/MON/zabbix-agents',
      anchor: 'agent-config',
      snippet: 'Для корректной работы агента Zabbix настройте параметры Server=zabbix.company.com и ServerActive=zabbix.company.com в файле /etc/zabbix/zabbix_agentd.conf.',
      updatedAt: '2025-06-20T16:45:00Z',
      accessible: false // Доступно только для admin
    },
    {
      title: 'Мониторинг инфраструктуры',
      space: 'MON',
      url: 'https://confluence.local/display/MON/infrastructure-monitoring',
      snippet: 'Система мониторинга включает проверку доступности серверов, использования ресурсов и состояния сервисов.',
      updatedAt: '2025-06-15T11:30:00Z',
      accessible: false // Доступно только для admin
    },
    {
      title: 'Сброс пароля в Active Directory',
      space: 'ITKB',
      url: 'https://confluence.local/display/ITKB/ad-password-reset',
      anchor: 'powershell-reset',
      snippet: 'Используйте PowerShell команду Set-ADAccountPassword для сброса пароля пользователя в домене.',
      updatedAt: '2025-07-10T13:25:00Z',
      accessible: true
    }
  ];

  async search(query: string, filters?: SearchFilters): Promise<SourceDTO[]> {
    // Симуляция задержки поиска
    await new Promise(resolve => setTimeout(resolve, 200));

    let results = this.mockSources;

    // Фильтрация по ключевым словам
    const keywords = query.toLowerCase().split(' ');
    results = results.filter(source => {
      const searchText = (source.title + ' ' + source.snippet).toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });

    // Применение ACL фильтрации
    if (filters?.userRole) {
      results = this.applyAclFilter(results, filters.userRole);
    }

    // Фильтрация по пространствам
    if (filters?.spaces && filters.spaces.length > 0) {
      results = results.filter(source => filters.spaces!.includes(source.space));
    }

    // Ограничение результатов
    return results.slice(0, 5);
  }

  private applyAclFilter(sources: SourceDTO[], userRole: UserRole): SourceDTO[] {
    return sources.map(source => ({
      ...source,
      accessible: userRole === 'admin' || source.space === 'ITKB'
    }));
  }
}