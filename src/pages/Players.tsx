import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LayoutDashboard,
  Joystick,
  CheckSquare,
  Calendar,
  Users,
  Settings,
  Mail,
  Bell,
  Play,
  UserPlus,
  Trash2,
} from 'lucide-react';

import Sidebar from '@/components/Sidebar';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlayers,
  addPlayer as apiAddPlayer,
  updatePlayer as apiUpdatePlayer,
  deletePlayer as apiDeletePlayer,
  setPlayers as apiSetPlayers,
} from '@/lib/storageApi';

interface Player {
  id: number;
  name: string;
  role?: string;
  task?: string;
  status?: string;
  score: number;
}

const Players = () => {
  const navigate = useNavigate();
  const [isNewPlayerOpen, setIsNewPlayerOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', role: '' });
  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: fetchPlayers });

  const addMutation = useMutation({
    mutationFn: (p: { name: string; role?: string }) => apiAddPlayer({ name: p.name, role: p.role || 'Jogador', task: '', status: 'Pendente', score: 0 } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] })
  });

  const deleteMutation = useMutation({ mutationFn: (id: number) => apiDeletePlayer(id) as any, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }) });
  const updateMutation = useMutation({ mutationFn: (p: Player) => apiUpdatePlayer(p) as any, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['players'] }) });

  const stats = {
    total: (players || []).length,
    active: (players || []).filter((m: any) => m.status === 'Em Andamento').length,
    done: (players || []).filter((m: any) => m.status === 'Concluído').length,
  };

  const addPlayer = () => {
    if (!newPlayer.name) return;
    addMutation.mutate({ name: newPlayer.name, role: newPlayer.role });
    setNewPlayer({ name: '', role: '' });
    setIsNewPlayerOpen(false);
  };

  const removePlayer = (id: number) => deleteMutation.mutate(id);

  const awardPoints = (id: number, points: number) => {
    const p: any = (players || []).find((x: any) => x.id === id);
    if (!p) return;
    updateMutation.mutate({ ...p, score: (p.score || 0) + points });
  };

  // export / import
  const exportPlayers = () => {
    const blob = new Blob([JSON.stringify(players || [], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-day-players.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPlayersFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result));
        await apiSetPlayers(data as any);
        queryClient.invalidateQueries(['players']);
      } catch (e) {
        alert('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className='flex min-h-screen bg-background'>
      <Sidebar />

      <main className='flex-1 overflow-auto'>
        <header className='bg-card border-b border-border p-4 md:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex-1 max-w-md'>
              <div className='relative'>
                <input type='search' placeholder='Buscar jogador' className='w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' />
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='icon'><Mail className='h-5 w-5' /></Button>
              <Button variant='ghost' size='icon'><Bell className='h-5 w-5' /></Button>
              <div className='flex items-center gap-3'>
                <Avatar><AvatarFallback className='bg-primary text-white'>GM</AvatarFallback></Avatar>
                <div className='hidden md:block'>
                  <p className='text-sm font-semibold'>Game Master</p>
                  <p className='text-xs text-muted-foreground'>gm@game-day.io</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className='p-4 md:p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-1'>Jogadores</h1>
              <p className='text-muted-foreground'>Gerencie jogadores, atribua pontuações e acompanhe resultados.</p>
            </div>
            <div className='flex gap-2'>
              <Button onClick={() => setIsNewPlayerOpen(true)}>
                <UserPlus className='h-4 w-4 mr-2' />
                Novo Jogador
              </Button>
              <Button variant='outline' onClick={exportPlayers}>Exportar</Button>
              <input id='import-players' type='file' accept='application/json' className='hidden' onChange={(e) => importPlayersFile(e.target.files ? e.target.files[0] : null)} />
              <Button variant='ghost' onClick={() => document.getElementById('import-players')?.click()}>Importar</Button>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <StatCard title='Total de Jogadores' value={String(stats.total)} icon={Users} variant='primary' />
            <StatCard title='Ativos' value={String(stats.active)} icon={Play} />
            <StatCard title='Concluídos' value={String(stats.done)} icon={CheckSquare} />
          </div>

          <Card className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Jogadores</h3>
            </div>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[250px]'>Jogador</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className='hidden md:table-cell'>Campanha</TableHead>
                    <TableHead className='text-center'>Pontuação</TableHead>
                    <TableHead className='w-[120px] text-center'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(players || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center text-muted-foreground py-8'>
                        Nenhum jogador cadastrado. Clique em "Novo Jogador" para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (players || []).map((player: any) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-9 w-9'>
                              <AvatarFallback className='bg-primary text-white text-xs'>
                                {player.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>{player.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{player.role}</TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <span className='text-muted-foreground'>{player.task || '-'}</span>
                        </TableCell>
                        <TableCell className='text-center'>
                          <span className='font-semibold'>{player.score}</span>
                        </TableCell>
                        <TableCell className='text-center'>
                          <div className='flex items-center justify-center gap-2'>
                            <Button size='sm' onClick={() => awardPoints(player.id, 10)}>+10</Button>
                            <Button size='sm' variant='ghost' onClick={() => awardPoints(player.id, -5)}>-5</Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                              onClick={() => removePlayer(player.id)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>
      <Dialog open={isNewPlayerOpen} onOpenChange={setIsNewPlayerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Jogador</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Nome</Label>
              <Input value={newPlayer.name} onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} />
            </div>
            <div className='space-y-2'>
              <Label>Função</Label>
              <Input value={newPlayer.role} onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })} />
            </div>
            <Button className='w-full' onClick={addPlayer}>Adicionar Jogador</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Players;
