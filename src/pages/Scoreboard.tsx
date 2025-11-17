import { Joystick } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Scoreboard = () => {
  // Minimal placeholder; actual scores come from Players page/state
  return (
    <div className='flex min-h-screen bg-background'>
      <aside className='w-64 bg-card border-r border-border p-6 hidden md:block'>
        <div className='flex items-center gap-2 mb-8'>
          <div className='h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center'>
            <Joystick className='h-5 w-5 text-white' />
          </div>
          <span className='text-xl font-bold'>Game Day</span>
        </div>
      </aside>
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
