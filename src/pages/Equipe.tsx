import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  BarChart3,
  Users,
  Settings,
  Plus,
  Mail,
  Bell,
  Play,
  UserPlus,
  Trash2,
} from 'lucide-react';

interface Member {
  id: number;
  name: string;
  role: string;
  task: string;
  status: 'Concluído' | 'Em Andamento' | 'Pendente';
}

const Equipe = () => {
  const navigate = useNavigate();
  const [isNewMemberOpen, setIsNewMemberOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: 'Alexandra Deff', role: 'Desenvolvedora', task: 'Repositório do Projeto no GitHub', status: 'Concluído' },
    { id: 2, name: 'Edwin Adenike', role: 'Engenheiro de Software', task: 'Integrar Sistema de Autenticação de Usuário', status: 'Em Andamento' },
    { id: 3, name: 'Isaac Oluwatemilorun', role: 'Frontend', task: 'Desenvolver Funcionalidade de Busca e Filtro', status: 'Pendente' },
    { id: 4, name: 'David Oshodi', role: 'UI/UX', task: 'Layout Responsivo para Página Inicial', status: 'Em Andamento' },
  ]);

  const [newMember, setNewMember] = useState({ name: '', role: '', task: '' });

  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'Em Andamento').length,
    done: members.filter(m => m.status === 'Concluído').length,
  };

  const addMember = () => {
    if (!newMember.name) return;
    const m: Member = {
      id: Math.max(0, ...members.map(x => x.id)) + 1,
      name: newMember.name,
      role: newMember.role || 'Membro',
      task: newMember.task || '',
      status: 'Pendente',
    };
    setMembers([...members, m]);
    setNewMember({ name: '', role: '', task: '' });
    setIsNewMemberOpen(false);
  };

  const removeMember = (id: number) => setMembers(prev => prev.filter(m => m.id !== id));

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
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/tasks')}>
            <CheckSquare className='h-4 w-4' />
            Tarefas
          </Button>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/calendar')}>
            <Calendar className='h-4 w-4' />
            Calendário
          </Button>
          <Button variant='default' className='w-full justify-start gap-3'>
            <Users className='h-4 w-4' />
            Players
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
                <input type='search' placeholder='Buscar membro' className='w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' />
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'></span>
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='icon'><Mail className='h-5 w-5' /></Button>
              <Button variant='ghost' size='icon'><Bell className='h-5 w-5' /></Button>
              <div className='flex items-center gap-3'>
                <Avatar><AvatarFallback className='bg-primary text-white'>TM</AvatarFallback></Avatar>
                <div className='hidden md:block'>
                  <p className='text-sm font-semibold'>Totok Michael</p>
                  <p className='text-xs text-muted-foreground'>tmichael20@mail.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className='p-4 md:p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-1'>Players</h1>
              <p className='text-muted-foreground'>Gerencie seus jogadores e pontuações</p>
            </div>
            <div className='flex gap-2'>
              <Button onClick={() => setIsNewMemberOpen(true)}>
                <UserPlus className='h-4 w-4 mr-2' />
                Novo Jogador
              </Button>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <StatCard title='Total de Membros' value={String(stats.total)} icon={Users} variant='primary' />
            <StatCard title='Tarefas Ativas' value={String(stats.active)} icon={Play} />
            <StatCard title='Tarefas Concluídas' value={String(stats.done)} icon={CheckSquare} />
          </div>

          <Card className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Jogadores</h3>
            </div>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[250px]'>Membro</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className='hidden md:table-cell'>Tarefa Atual</TableHead>
                    <TableHead className='text-center'>Status</TableHead>
                    <TableHead className='w-[80px] text-center'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center text-muted-foreground py-8'>
                        Nenhum membro cadastrado. Clique em "Novo Membro" para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-9 w-9'>
                              <AvatarFallback className='bg-primary text-white text-xs'>
                                {member.name.split(' ').map(n=>n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <span className='text-muted-foreground'>{member.task || '-'}</span>
                        </TableCell>
                        <TableCell className='text-center'>
                          <Badge 
                            variant={
                              member.status === 'Concluído' 
                                ? 'default' 
                                : member.status === 'Em Andamento' 
                                ? 'secondary' 
                                : 'outline'
                            }
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-center'>
                          <Button 
                            variant='ghost' 
                            size='icon' 
                            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10' 
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
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
      <Dialog open={isNewMemberOpen} onOpenChange={setIsNewMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Membro</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Nome</Label>
              <Input value={newMember.name} onChange={(e)=>setNewMember({...newMember, name: e.target.value})} />
            </div>
            <div className='space-y-2'>
              <Label>Função</Label>
              <Input value={newMember.role} onChange={(e)=>setNewMember({...newMember, role: e.target.value})} />
            </div>
            <div className='space-y-2'>
              <Label>Tarefa</Label>
              <Input value={newMember.task} onChange={(e)=>setNewMember({...newMember, task: e.target.value})} />
            </div>
            <Button className='w-full' onClick={addMember}>Adicionar Membro</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipe;
