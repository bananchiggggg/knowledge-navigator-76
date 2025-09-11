import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { ChatPanel } from '@/components/ChatPanel';
import { SourcePanel } from '@/components/SourcePanel';
import { Footer } from '@/components/Footer';
import { useBotStore } from '@/state/store';
import { MockIndexStatusService } from '@/services/IndexStatusService';

const Index = () => {
  const { 
    session, 
    initSession, 
    setIndexStatus,
    currentUser,
    userRole,
    environment 
  } = useBotStore();

  const indexService = new MockIndexStatusService();

  // Инициализация при загрузке
  useEffect(() => {
    // Инициализируем сессию если её нет
    if (!session) {
      initSession(currentUser, userRole, environment);
    }

    // Загружаем статус индекса
    const loadIndexStatus = async () => {
      try {
        const status = await indexService.getStatus();
        setIndexStatus(status);
      } catch (error) {
        console.error('Ошибка загрузки статуса индекса:', error);
      }
    };

    loadIndexStatus();

    // Обновляем статус индекса каждые 30 секунд
    const interval = setInterval(loadIndexStatus, 30000);
    return () => clearInterval(interval);
  }, [session, initSession, setIndexStatus, currentUser, userRole, environment]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Основная область чата - 70% */}
        <div className="flex w-full flex-col lg:w-[70%]">
          <ChatPanel />
        </div>

        {/* Панель источников - 30% на десктопе, скрыта на мобильных */}
        <div className="hidden border-l lg:block lg:w-[30%]">
          <div className="h-full overflow-y-auto p-4">
            <SourcePanel />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
