// Словарь для русской локализации
export const ru = {
  common: {
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    copy: 'Скопировать',
    close: 'Закрыть',
    cancel: 'Отмена',
    submit: 'Отправить',
    clear: 'Очистить'
  },
  chat: {
    placeholder: 'Опишите проблему... Пример: "После сбоя AD не пускает в домен"',
    sendMessage: 'Отправить сообщение',
    clearHistory: 'Очистить историю',
    exportHistory: 'Экспорт истории'
  },
  bot: {
    confidence: 'уверенность',
    sources: 'Источники',
    steps: 'Пошаговое решение',
    helpful: 'Помогло',
    notHelpful: 'Не помогло',
    escalate: 'Эскалировать'
  },
  index: {
    lastUpdate: 'Обновлён',
    reindex: 'Переиндексировать',
    documents: 'документов',
    errors: 'ошибок'
  }
};

export type Locale = typeof ru;