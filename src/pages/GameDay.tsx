import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns, fetchQuestions, fetchPlayers } from "@/lib/storageApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import UserProfile from '@/components/UserProfile';
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  TrendingUp,
  CheckSquare,
  Calendar,
  Users,
  HelpCircle,
  Play
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const GameDay = () => {
  const navigate = useNavigate();

  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: fetchCampaigns });
  const { data: questions = [] } = useQuery({ queryKey: ['questions'], queryFn: fetchQuestions });
  const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: fetchPlayers });

  const stats = {
    activeCampaigns: campaigns.filter((c: any) => c.status === 'in-progress').length,
    pendingQuestions: questions.filter((q: any) => q.status === 'todo').length,
    totalPlayers: players.length,
  };

  // Prepare pie chart data for campaign status
  const campaignStatusData = [
    { 
      name: 'Em Progresso', 
      value: campaigns.filter((c: any) => c.status === 'in-progress').length,
      color: '#3b82f6' // blue
    },
    { 
      name: 'Planejando', 
      value: campaigns.filter((c: any) => c.status === 'planning').length,
      color: '#eab308' // yellow
    },
    { 
      name: 'Concluída', 
      value: campaigns.filter((c: any) => c.status === 'completed').length,
      color: '#22c55e' // green
    },
    { 
      name: 'Cancelada', 
      value: campaigns.filter((c: any) => c.status === 'cancelled').length,
      color: '#ef4444' // red
    },
  ].filter(item => item.value > 0);

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in-progress': return 'default';
      case 'planning': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-progress': return 'Em Progresso';
      case 'planning': return 'Planejando';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

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
              <UserProfile />
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
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign Status Pie Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Status das Campanhas</h3>
              </div>
              {campaignStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={campaignStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {campaignStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Nenhuma campanha cadastrada
                </div>
              )}
            </Card>

            {/* Campaigns List */}
            <Card className="lg:col-span-2 p-6 max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Campanhas</h3>
                <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Campanha
                </Button>
              </div>
              <div className="space-y-3">
                {campaigns.length > 0 ? (
                  campaigns.map((campaign: any) => (
                    <div 
                      key={campaign.id} 
                      className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => navigate('/campaigns')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">{campaign.name}</h4>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {campaign.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusVariant(campaign.status) as any} className="ml-2">
                          {getStatusLabel(campaign.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('pt-BR') : 'N/A'}
                            {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{campaign.player_count || 0} jogadores</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="h-4 w-4" />
                          <span>{campaign.question_count || 0} perguntas</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma campanha cadastrada. Clique em "Nova Campanha" para começar.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GameDay;
