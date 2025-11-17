import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Trash2,
  Edit,
  UserPlus,
  UserMinus,
} from 'lucide-react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTeams,
  fetchPlayers,
  addTeam as apiAddTeam,
  updateTeam as apiUpdateTeam,
  deleteTeam as apiDeleteTeam,
  setTeams as apiSetTeams,
  type Team,
} from '@/lib/storageApi';

const Teams = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });
  const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: fetchPlayers });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    members: [] as number[],
  });

  const addMutation = useMutation({
    mutationFn: (t: Omit<Team, 'id'>) => apiAddTeam(t),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] })
  });

  const updateMutation = useMutation({
    mutationFn: (t: Team) => apiUpdateTeam(t),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteTeam(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] })
  });

  const openDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setForm({
        name: team.name,
        members: team.members || [],
      });
    } else {
      setEditingTeam(null);
      setForm({
        name: '',
        members: [],
      });
    }
    setIsDialogOpen(true);
  };

  const saveTeam = () => {
    if (!form.name) {
      alert('Preencha o nome da equipe');
      return;
    }

    const payload = {
      name: form.name,
      members: form.members,
      createdAt: new Date().toISOString(),
    };

    if (editingTeam) {
      updateMutation.mutate({ ...editingTeam, ...payload });
    } else {
      addMutation.mutate(payload);
    }
    setIsDialogOpen(false);
  };

  const removeTeam = (id: number) => {
    if (confirm('Remover equipe?')) {
      deleteMutation.mutate(id);
    }
  };

  const exportTeams = () => {
    const blob = new Blob([JSON.stringify(teams || [], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-day-teams.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTeamsFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result));
        await apiSetTeams(data);
        queryClient.invalidateQueries(['teams']);
      } catch (e) {
        alert('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  };

  const toggleMember = (playerId: number) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.includes(playerId)
        ? prev.members.filter(id => id !== playerId)
        : [...prev.members, playerId],
    }));
  };

  const stats = {
    total: teams.length,
    totalMembers: teams.reduce((sum, t) => sum + (t.members?.length || 0), 0),
    avgMembers: teams.length > 0 ? Math.round(teams.reduce((sum, t) => sum + (t.members?.length || 0), 0) / teams.length) : 0,
  };

  return (
    <div className='flex min-h-screen bg-background'>
      <aside className='w-64 bg-card border-r border-border p-6 hidden md:block'>
        <div className='flex items-center gap-2 mb-8'>
          <div className='h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center'>
            <Joystick className='h-5 w-5 text-white' />
          </div>
          <span className='text-xl font-bold'>Game Day</span>
        </div>
        <nav className='space-y-2'>
          <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-3'>Menu</h3>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/game-day')}>
            <LayoutDashboard className='h-4 w-4' />
            Painel
          </Button>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/campaigns')}>
            <CheckSquare className='h-4 w-4' />
            Campanhas
          </Button>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/questions')}>
            <CheckSquare className='h-4 w-4' />
            Perguntas
          </Button>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/tasks')}>
            <CheckSquare className='h-4 w-4' />
            Tarefas
          </Button>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/calendar')}>
            <Calendar className='h-4 w-4' />
            Calendário
          </Button>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/players')}>
            <Users className='h-4 w-4' />
            Jogadores
          </Button>
          <Button variant='default' className='w-full justify-start gap-3'>
            <Users className='h-4 w-4' />
            Equipes
          </Button>
          <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-3 mt-8'>Geral</h3>
          <Button variant='ghost' className='w-full justify-start gap-3'>
            <Settings className='h-4 w-4' />
            Configurações
          </Button>
        </nav>
        <Card className='mt-8 p-4 bg-gradient-to-br from-primary to-accent text-white'>
          <div className='mb-3'>
            <div className='h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-2'>
              <Play className='h-5 w-5' />
            </div>
          </div>
          <h4 className='font-semibold mb-1'>Baixe nosso App Mobile</h4>
          <p className='text-xs text-white/80 mb-3'>Obtenha agora em seu dispositivo</p>
          <Button size='sm' variant='secondary' className='w-full'>Baixar</Button>
        </Card>
      </aside>

      <main className='flex-1 overflow-auto'>
        <header className='bg-card border-b border-border p-4 md:p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex-1 max-w-md'>
              <div className='relative'>
                <input type='search' placeholder='Buscar equipe' className='w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' />
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
              <h1 className='text-3xl font-bold mb-1'>Equipes</h1>
              <p className='text-muted-foreground'>Gerencie equipes, adicione membros e associe a campanhas.</p>
            </div>
            <div className='flex gap-2'>
              <Button onClick={() => openDialog()}>
                <Plus className='h-4 w-4 mr-2' />
                Nova Equipe
              </Button>
              <Button variant='outline' onClick={exportTeams}>Exportar</Button>
              <input id='import-teams' type='file' accept='application/json' className='hidden' onChange={(e) => importTeamsFile(e.target.files ? e.target.files[0] : null)} />
              <Button variant='ghost' onClick={() => document.getElementById('import-teams')?.click()}>Importar</Button>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <StatCard title='Total de Equipes' value={String(stats.total)} icon={Users} variant='primary' />
            <StatCard title='Total de Membros' value={String(stats.totalMembers)} icon={UserPlus} />
            <StatCard title='Média por Equipe' value={String(stats.avgMembers)} icon={Users} />
          </div>

          <Card className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Equipes</h3>
            </div>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[250px]'>Nome</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className='w-[120px] text-center'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center text-muted-foreground py-8'>
                        Nenhuma equipe cadastrada. Clique em "Nova Equipe" para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    teams.map((team) => {
                      const teamPlayers = players.filter((p: any) => team.members?.includes(p.id));
                      return (
                        <TableRow key={team.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center'>
                                <Users className='h-5 w-5 text-primary' />
                              </div>
                              <span className='font-medium'>{team.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-wrap gap-1'>
                              {teamPlayers.length === 0 ? (
                                <span className='text-sm text-muted-foreground'>Sem membros</span>
                              ) : (
                                teamPlayers.map((p: any) => (
                                  <Badge key={p.id} variant='secondary'>{p.name}</Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className='text-sm text-muted-foreground'>
                              {new Date(team.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </TableCell>
                          <TableCell className='text-center'>
                            <div className='flex items-center justify-center gap-2'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => openDialog(team)}
                              >
                                <Edit className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                                onClick={() => removeTeam(team.id)}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Nome da Equipe</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='Ex: Equipe Alpha' />
            </div>
            <div className='space-y-2'>
              <Label>Membros (Jogadores)</Label>
              <div className='border rounded-lg p-3 max-h-60 overflow-y-auto'>
                {players.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>Nenhum jogador cadastrado</p>
                ) : (
                  <div className='space-y-2'>
                    {players.map((player: any) => (
                      <label key={player.id} className='flex items-center gap-2 cursor-pointer p-2 hover:bg-accent rounded'>
                        <input
                          type='checkbox'
                          checked={form.members.includes(player.id)}
                          onChange={() => toggleMember(player.id)}
                          className='rounded'
                        />
                        <Avatar className='h-6 w-6'>
                          <AvatarFallback className='bg-primary text-white text-xs'>
                            {player.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                          <span className='text-sm font-medium'>{player.name}</span>
                          <span className='text-xs text-muted-foreground ml-2'>{player.role}</span>
                        </div>
                        <Badge variant='secondary' className='text-xs'>{player.score} pts</Badge>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button className='w-full' onClick={saveTeam}>
              {editingTeam ? 'Salvar Alterações' : 'Criar Equipe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
