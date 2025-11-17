import { Joystick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';

const Scoreboard = () => {
  // Minimal placeholder; actual scores come from Players page/state
  return (
    <div className='flex min-h-screen bg-background'>
      <Sidebar />

      <main className='flex-1 p-6'>
        <h1 className='text-2xl font-bold mb-4'>Placar</h1>
        <Card className='p-4'>
          <p className='text-sm text-muted-foreground'>Visão geral de pontuações (integra com Players)</p>
        </Card>
      </main>
    </div>
  );
};

export default Scoreboard;
