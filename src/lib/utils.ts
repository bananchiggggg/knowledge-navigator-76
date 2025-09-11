import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Утилиты для RAG бота

// Копирование в буфер обмена
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Фолбэк для старых браузеров
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Не удалось скопировать в буфер обмена:', fallbackError);
      return false;
    }
  }
}

// Форматирование чек-листа в Markdown
export function formatChecklistAsMarkdown(steps: string[], title: string = 'Инструкция'): string {
  const header = `# ${title}\n\n`;
  const checklist = steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');
  
  return header + checklist;
}

// Форматирование времени "назад"
export function timeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'только что';
  if (diffMins === 1) return '1 минуту назад';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours === 1) return '1 час назад';
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return '1 день назад';
  return `${diffDays} дн. назад`;
}

// Валидация длины комментария
export function validateCommentLength(comment: string): boolean {
  return comment.length <= 200;
}

// Извлечение ключевых слов из запроса
export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\sа-яё]/gi, '') // Убираем знаки препинания, оставляем русские буквы
    .split(/\s+/)
    .filter(word => word.length > 2) // Убираем слишком короткие слова
    .slice(0, 10); // Ограничиваем количество ключевых слов
}

// Симуляция задержки для демонстрации
export function simulateLatency(min: number = 500, max: number = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Получение индикатора среды
export function getEnvironmentIndicator(env: string): { 
  label: string; 
  color: string; 
  bgColor: string; 
} {
  switch (env) {
    case 'prod':
      return { 
        label: 'PROD', 
        color: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30'
      };
    case 'stg':
      return { 
        label: 'STG', 
        color: 'text-yellow-700 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
      };
    case 'dev':
    default:
      return { 
        label: 'DEV', 
        color: 'text-green-700 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30'
      };
  }
}

// Создание описания для эскалации
export function createEscalationDescription(
  originalQuery: string, 
  botAnswer?: string, 
  sources?: string[]
): string {
  let description = `**Исходный запрос пользователя:**\n${originalQuery}\n\n`;
  
  if (botAnswer) {
    description += `**Ответ бота:**\n${botAnswer}\n\n`;
  }
  
  if (sources && sources.length > 0) {
    description += `**Использованные источники:**\n`;
    sources.forEach(source => {
      description += `- ${source}\n`;
    });
    description += '\n';
  }
  
  description += `**Дополнительная информация:**\n`;
  description += `Пожалуйста, предоставьте решение или дополнительную помощь по данному вопросу.`;
  
  return description;
}

// Фильтрация источников по ACL
export function filterSourcesByAccess<T extends { accessible: boolean }>(
  sources: T[], 
  showInaccessible: boolean = false
): T[] {
  if (showInaccessible) {
    return sources;
  }
  return sources.filter(source => source.accessible);
}

// Склонение числительных для русского языка
export function declension(number: number, forms: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  const index = (number % 100 > 4 && number % 100 < 20) 
    ? 2 
    : cases[(number % 10 < 5) ? number % 10 : 5];
  return forms[index];
}