import { AnswerDTO, ClarificationContext } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface LLMAdapter {
  ask(prompt: string, context?: ClarificationContext): Promise<AnswerDTO>;
}

// Мок-реализация LLM адаптера
export class MockLLMAdapter implements LLMAdapter {
  private mockAnswers: Record<string, Partial<AnswerDTO>> = {
    'ad_domain_issue': {
      type: 'checklist',
      steps: [
        'Проверьте подключение к сети и доступность контроллера домена',
        'Выполните команду `nltest /dclist:domain.local` для проверки DC',
        'Сбросьте кеш DNS: `ipconfig /flushdns`',
        'Перезапустите службу Netlogon: `net stop netlogon && net start netlogon`',
        'При необходимости выполните выход и повторный вход в домен'
      ],
      sources: [
        {
          title: 'Устранение проблем с доменом Active Directory',
          space: 'ITKB',
          url: 'https://confluence.local/pages/ad-troubleshooting',
          snippet: 'При сбоях AD проверьте сетевое подключение к контроллеру домена и состояние служб.',
          updatedAt: '2025-07-15T10:30:00Z',
          accessible: true
        }
      ],
      confidence: 0.85
    },
    'vpn_connection_issue': {
      type: 'steps',
      steps: [
        'Проверьте интернет-соединение на клиентском устройстве',
        'Убедитесь в правильности настроек VPN-клиента',
        'Проверьте учетные данные пользователя',
        'Перезапустите VPN-службу',
        'Проверьте логи VPN-сервера для диагностики'
      ],
      sources: [
        {
          title: 'Настройка VPN клиента',
          space: 'ITKB',
          url: 'https://confluence.local/pages/vpn-client-setup',
          snippet: 'Для подключения VPN из дома используйте следующие настройки: сервер vpn.company.com, протокол IKEv2.',
          updatedAt: '2025-08-01T14:20:00Z',
          accessible: true
        },
        {
          title: 'Диагностика VPN соединений',
          space: 'ITKB',
          url: 'https://confluence.local/pages/vpn-diagnostics',
          snippet: 'При проблемах с VPN проверьте статус служб и логи соединения.',
          updatedAt: '2025-07-28T09:15:00Z',
          accessible: true
        }
      ],
      confidence: 0.62,
      clarification_needed: true,
      clarification_options: ['ОС', 'Сегмент', 'Версия клиента VPN']
    },
    'zabbix_agent': {
      type: 'checklist',
      steps: [
        'Проверьте статус службы Zabbix Agent',
        'Убедитесь в корректности конфигурации /etc/zabbix/zabbix_agentd.conf',
        'Проверьте сетевую доступность между агентом и сервером',
        'Перезапустите службу агента'
      ],
      sources: [
        {
          title: 'Настройка агентов Zabbix',
          space: 'MON',
          url: 'https://confluence.local/pages/zabbix-agents',
          snippet: 'Для корректной работы агента Zabbix настройте параметры Server и ServerActive в конфигурации.',
          updatedAt: '2025-06-20T16:45:00Z',
          accessible: false // Для тестирования ACL
        }
      ],
      confidence: 0.78
    }
  };

  async ask(prompt: string, context?: ClarificationContext): Promise<AnswerDTO> {
    // Симуляция задержки 800-1200ms
    const latency = Math.floor(Math.random() * 400) + 800;
    await new Promise(resolve => setTimeout(resolve, latency));

    // Определение типа запроса по ключевым словам
    let mockKey = 'default';
    if (prompt.toLowerCase().includes('ad') || prompt.toLowerCase().includes('домен')) {
      mockKey = 'ad_domain_issue';
    } else if (prompt.toLowerCase().includes('vpn')) {
      mockKey = 'vpn_connection_issue';
    } else if (prompt.toLowerCase().includes('zabbix')) {
      mockKey = 'zabbix_agent';
    }

    // Учет контекста уточнения
    if (context?.selected_options.os === 'Windows 11' && mockKey === 'vpn_connection_issue') {
      return {
        answer_id: uuidv4(),
        type: 'steps',
        steps: [
          'Откройте "Параметры" → "Сеть и Интернет" → "VPN"',
          'Проверьте настройки подключения для Windows 11',
          'Убедитесь в наличии сертификата для IKEv2',
          'Перезапустите службу "Маршрутизация и удаленный доступ"',
          'Проверьте брандмауэр Windows на блокировку VPN-трафика'
        ],
        sources: [
          {
            title: 'VPN на Windows 11',
            space: 'ITKB',
            url: 'https://confluence.local/pages/vpn-windows11',
            snippet: 'В Windows 11 настройка VPN выполняется через новый интерфейс Параметров.',
            updatedAt: '2025-08-01T14:20:00Z',
            accessible: true
          }
        ],
        confidence: 0.92,
        latency_ms: latency
      };
    }

    const mockAnswer = this.mockAnswers[mockKey] || this.mockAnswers['ad_domain_issue'];
    
    return {
      answer_id: uuidv4(),
      type: mockAnswer.type || 'checklist',
      steps: mockAnswer.steps || ['Обратитесь к системному администратору'],
      sources: mockAnswer.sources || [],
      confidence: mockAnswer.confidence || 0.5,
      clarification_needed: mockAnswer.clarification_needed || false,
      clarification_options: mockAnswer.clarification_options || [],
      latency_ms: latency
    };
  }
}