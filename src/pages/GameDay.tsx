import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns, fetchQuestions, fetchPlayers, fetchTeams } from "@/lib/storageApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Play,
  Pause,
  Square,
  Plus,
  TrendingUp,
  ArrowUpRight,
  CheckSquare
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

const GameDay = () => {
  const navigate = useNavigate();
  const [activeTimer, setActiveTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(5048);

  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: fetchCampaigns });
  const { data: questions = [] } = useQuery({ queryKey: ['questions'], queryFn: fetchQuestions });
  const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: fetchPlayers });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });

  const stats = {
    activeCampaigns: campaigns.filter((c: any) => c.status === 'in-progress').length,
    pendingQuestions: questions.filter((q: any) => q.status === 'todo').length,
    totalPlayers: players.length,
    totalTeams: teams.length,
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const projects = [
    { id: 1, name: "Desenvolver Endpoints da API", dueDate: "26 de nov, 2024", icon: "🎮", color: "bg-blue-500" },
    { id: 2, name: "Fluxo de Integração", dueDate: "28 de nov, 2024", icon: "🕹️", color: "bg-cyan-500" },
    { id: 3, name: "Construir Game Day", dueDate: "30 de nov, 2024", icon: "🎲", color: "bg-green-500" },
    { id: 4, name: "Otimizar Carregamento de Página", dueDate: "4 de dez, 2024", icon: "🏆", color: "bg-yellow-500" },
  ];

  const teamMembers = [
    { name: "Alexandra Deff", task: "Repositório do Projeto no GitHub", status: "Concluído", badge: "success" },
    { name: "Edwin Adenike", task: "Integrar Sistema de Autenticação de Usuário", status: "Em Andamento", badge: "warning" },
    { name: "Isaac Oluwatemilorun", task: "Desenvolver Funcionalidade de Busca e Filtro", status: "Pendente", badge: "destructive" },
    { name: "David Oshodi", task: "Layout Responsivo para Página Inicial", status: "Em Andamento", badge: "warning" },
  ];

  const chartDays = ["M", "T", "W", "T", "F", "S", "S"];
  const chartValues = [60, 85, 45, 95, 50, 70, 65];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Painel</h1>
              <p className="text-muted-foreground">Visão geral do Game Day</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">🔔</Button>
              <Button onClick={() => navigate('/campaigns')}>Ver Campanhas</Button>
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarFallback className='bg-primary text-white'>GM</AvatarFallback>
                </Avatar>
                <div className='hidden md:block'>
                  <p className='text-sm font-semibold'>Game Master</p>
                  <p className='text-xs text-muted-foreground'>gm@game-day.io</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Campanhas Ativas"
              value={stats.activeCampaigns.toString()}
              change="Em progresso"
              changeType="increase"
              icon={TrendingUp}
              variant="primary"
            />
            <StatCard
              title="Perguntas Pendentes"
              value={stats.pendingQuestions.toString()}
              change="A fazer"
              changeType="increase"
              icon={CheckSquare}
            />
            <StatCard
              title="Total de Jogadores"
              value={stats.totalPlayers.toString()}
              change="Cadastrados"
              changeType="increase"
              icon={Play}
            />
            <StatCard
              title="Total de Equipes"
              value={stats.totalTeams.toString()}
              change="Formadas"
              icon={ArrowUpRight}
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Analytics */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Análise de Projetos</h3>
              </div>
              <div className="flex items-end justify-between h-48 gap-2">
                {chartValues.map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '100%' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-accent rounded-t-lg transition-all"
                        style={{ height: `${value}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{chartDays[i]}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Reminders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Lembretes</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Reunião com Arc Company</h4>
                  <p className="text-sm text-muted-foreground mb-3">Horário: 14:00 - 16:00</p>
                  <Button className="w-full" size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Reunião
                  </Button>
                </div>
              </div>
            </Card>

            {/* Team Collaboration */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Colaboração da Equipe</h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </div>
              <div className="space-y-3">
                {teamMembers.map((member, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.task}</p>
                    </div>
                    <Badge variant={member.badge as any}>{member.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Projects List */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Projeto</h3>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </div>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center gap-3">
                    <div className={`h-10 w-10 ${project.color} rounded-lg flex items-center justify-center text-lg`}>
                      {project.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-muted-foreground">Data de entrega: {project.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Project Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Progresso dos Projetos</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-primary stroke-current"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${41 * 2 * Math.PI}`}
                      strokeDashoffset={`${41 * 2 * Math.PI * (1 - 0.41)}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">41%</span>
                    <span className="text-xs text-muted-foreground">Projetos Finalizados</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span>Concluído</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <span>Em Andamento</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted" />
                    <span>Pendente</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Time Tracker */}
            <Card className="p-6 bg-gradient-to-br from-primary to-accent text-white">
              <h3 className="text-lg font-semibold mb-4">Rastreador de Tempo</h3>
              <div className="flex items-center justify-center mb-6">
                <div className="text-5xl font-bold font-mono">
                  {formatTime(timerSeconds)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setActiveTimer(!activeTimer)}
                >
                  {activeTimer ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {activeTimer ? "Pausar" : "Iniciar"}
                </Button>
                <Button variant="secondary" className="flex-1">
                  <Square className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GameDay;
