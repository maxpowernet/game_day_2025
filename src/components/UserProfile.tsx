import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

const UserProfile: React.FC = () => {
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem('gd_theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gd_theme', dark ? 'dark' : 'light');
      if (dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    } catch (e) { /* ignore */ }
  }, [dark]);

  return (
    <div className='flex items-center gap-3'>
      <Button variant='ghost' size='icon' onClick={() => setDark(prev => !prev)} aria-label='Alternar tema'>
        {dark ? <Moon className='h-4 w-4' /> : <Sun className='h-4 w-4' />}
      </Button>
      <Avatar>
        <AvatarFallback className='bg-primary text-white'>GM</AvatarFallback>
      </Avatar>
      <div className='hidden md:block'>
        <p className='text-sm font-semibold'>Game Master</p>
        <p className='text-xs text-muted-foreground'>gm@game-day.io</p>
      </div>
    </div>
  );
};

export default UserProfile;
