import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Joystick,
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Play,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-card border-r border-border p-6 hidden md:block">
      <div className="flex items-center gap-2 mb-8">
        <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
          <Joystick className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold">Game Day</span>
      </div>

      <nav className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Menu</h3>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/game-day')}>
          <LayoutDashboard className="h-4 w-4" />
          Painel
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/campaigns')}>
          <CheckSquare className="h-4 w-4" />
          Campanhas
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/questions')}>
          <HelpCircle className="h-4 w-4" />
          Perguntas
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/teams')}>
          <Users className="h-4 w-4" />
          Equipes
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/players')}>
          <Users className="h-4 w-4" />
          Jogadores
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/tasks')}>
          <CheckSquare className="h-4 w-4" />
          Tarefas
          <Badge variant="secondary" className="ml-auto">0</Badge>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/calendar')}>
          <Calendar className="h-4 w-4" />
          Calendário
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => navigate('/scoreboard')}>
          <BarChart3 className="h-4 w-4" />
          Classificação
        </Button>

        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 mt-8">Geral</h3>
        <Button variant="ghost" className="w-full justify-start gap-3">
          <Settings className="h-4 w-4" />
          Configurações
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3">
          <HelpCircle className="h-4 w-4" />
          Ajuda
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </nav>

      <Card className="mt-8 p-4 bg-gradient-to-br from-primary to-accent text-white">
        <div className="mb-3">
          <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-2">
            <Play className="h-5 w-5" />
          </div>
        </div>
        <h4 className="font-semibold mb-1">Baixe nosso App Mobile</h4>
        <p className="text-xs text-white/80 mb-3">Obtenha agora em seu dispositivo</p>
        <Button size="sm" variant="secondary" className="w-full">Baixar</Button>
      </Card>
    </aside>
  );
};

export default Sidebar;
