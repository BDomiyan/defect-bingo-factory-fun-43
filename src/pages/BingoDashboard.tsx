import { BingoDashboard } from '@/components/BingoDashboard';
import Header from '@/components/Header';

const BingoDashboardPage = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4">
        <BingoDashboard />
      </main>
    </div>
  );
};

export default BingoDashboardPage; 