import { EscalationDraftDTO, EscalationDraftInput } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface JiraAdapter {
  createDraft(payload: EscalationDraftInput): Promise<EscalationDraftDTO>;
  isAvailable(): Promise<boolean>;
}

// Мок-реализация Jira адаптера
export class MockJiraAdapter implements JiraAdapter {
  private isJiraDown = Math.random() < 0.1; // 10% вероятность "недоступности"

  async createDraft(payload: EscalationDraftInput): Promise<EscalationDraftDTO> {
    // Симуляция задержки
    await new Promise(resolve => setTimeout(resolve, 500));

    if (this.isJiraDown) {
      throw new Error('Jira временно недоступна');
    }

    const draft_id = uuidv4();
    
    return {
      draft_id,
      project: payload.project,
      issueType: payload.issueType,
      priority: payload.priority,
      components: payload.components,
      summary: payload.summary,
      description: payload.description,
      link: `jira://draft/${draft_id}`
    };
  }

  async isAvailable(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return !this.isJiraDown;
  }

  // Метод для изменения состояния доступности (для тестирования)
  setAvailable(available: boolean): void {
    this.isJiraDown = !available;
  }
}