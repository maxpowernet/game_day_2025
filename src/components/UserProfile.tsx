import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem('gd_theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gd_theme', dark ? 'dark' : 'light');
      if (dark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    } catch (e) { /* ignore */ }
  }, [dark]);

  // Compute initials from user metadata or email
  const getInitials = () => {
    if (!user) return 'GM';
    const fullName = user.user_metadata?.full_name;
    if (fullName) {
      const names = fullName.split(' ');
      return names.length >= 2 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0].substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'GM';
  };

  const displayName = user?.user_metadata?.full_name || 'Game Master';
  const displayEmail = user?.email || 'gm@game-day.io';

  return (
    <div className='flex items-center gap-3'>
      <Button variant='ghost' size='icon' onClick={() => setDark(prev => !prev)} aria-label='Alternar tema'>
        {dark ? <Moon className='h-4 w-4' /> : <Sun className='h-4 w-4' />}
      </Button>
      <Avatar>
        <AvatarFallback className='bg-primary text-white'>{getInitials()}</AvatarFallback>
      </Avatar>
      <div className='hidden md:block'>
        <p className='text-sm font-semibold'>{displayName}</p>
        <p className='text-xs text-muted-foreground'>{displayEmail}</p>
      </div>
    </div>
  );
};

export default UserProfile;
