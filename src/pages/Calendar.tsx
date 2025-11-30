import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns, fetchQuestions } from "@/lib/storageApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LayoutDashboard, 
  Joystick,
  CheckSquare, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  Play,
  Star,
  Heart,
  Zap,
  Flag,
  Circle,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Sidebar from '@/components/Sidebar';
import UserProfile from '@/components/UserProfile';

interface Event {
  id: string;
  name: string;
  color: string;
  day: number;
  icon: string;
  completed?: boolean;
  isCampaign?: boolean;
}

const iconOptions = [
  { name: "Star", icon: Star, value: "star" },
  { name: "Heart", icon: Heart, value: "heart" },
  { name: "Zap", icon: Zap, value: "zap" },
  { name: "Flag", icon: Flag, value: "flag" },
  { name: "Circle", icon: Circle, value: "circle" },
];

const colorOptions = [
  { name: "Azul", value: "bg-blue-500" },
  { name: "Verde", value: "bg-green-500" },
  { name: "Vermelho", value: "bg-red-500" },
  { name: "Amarelo", value: "bg-yellow-500" },
  { name: "Roxo", value: "bg-purple-500" },
  { name: "Rosa", value: "bg-pink-500" },
  { name: "Laranja", value: "bg-orange-500" },
  { name: "Cyan", value: "bg-cyan-500" },
];

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [eventName, setEventName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-500");
  const [selectedIcon, setSelectedIcon] = useState("star");

  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: fetchCampaigns });
  const { data: questions = [] } = useQuery({ queryKey: ['questions'], queryFn: fetchQuestions });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Today's date in Brasília timezone (UTC-3)
  const todayInBrasilia = (() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const brTime = new Date(utc + (-3) * 60 * 60000);
    return { day: brTime.getDate(), month: brTime.getMonth(), year: brTime.getFullYear() };
  })();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  const handleAddEvent = () => {
    if (eventName && selectedDay) {
      const newEvent: Event = {
        id: Date.now().toString(),
        name: eventName,
        color: selectedColor,
        day: selectedDay,
        icon: selectedIcon,
        completed: false,
      };
      setEvents([...events, newEvent]);
      setEventName("");
      setSelectedColor("bg-blue-500");
      setSelectedIcon("star");
      setIsDialogOpen(false);
    }
  };

  const toggleEventCompleted = (id: string) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, completed: !ev.completed } : ev));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
  };

  const getEventsForDay = (day: number) => {
    const userEvents = events.filter(event => event.day === day);
    
    // Add campaign events for days within campaign date range
    // Compute displayed month bounds
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const displayedStart = new Date(year, month, 1);
    const displayedEnd = new Date(year, month, daysInMonth, 23, 59, 59, 999);

    // Helper: parse date-only strings (YYYY-MM-DD) as local dates to avoid timezone shifts
    const parseLocalDate = (v: any) => {
      if (!v) return null;
      // If already a Date
      if (v instanceof Date) return v;
      // If contains 'T' or timezone info, let Date parse it
      if (typeof v === 'string' && v.includes('T')) return new Date(v);
      // If string like 'YYYY-MM-DD', parse parts as local date
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y, m, d] = v.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      // Fallback
      return new Date(v);
    };

    const campaignEvents = campaigns
      .map((c: any) => {
        const start = parseLocalDate(c.startDate);
        const end = parseLocalDate(c.endDate);
        return { raw: c, start, end };
      })
      .filter(({ start, end }) => {
        if (!start || !end) return false;
        // campaign entirely before or after displayed month -> skip
        if (end < displayedStart) return false;
        if (start > displayedEnd) return false;
        return true;
      })
      .filter(({ raw, start, end }) => {
        const currentDay = new Date(year, month, day);
        return start && end && currentDay >= start && currentDay <= end;
      })
      .map(({ raw }) => ({
        id: `campaign-${raw.id}-${day}`,
        name: raw.name,
        color: raw.status === 'completed' ? 'bg-green-600' : raw.status === 'in-progress' ? 'bg-blue-600' : 'bg-purple-600',
        day,
        icon: 'flag',
        completed: raw.status === 'completed',
        isCampaign: true,
      }));

    return [...userEvents, ...campaignEvents];
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/20 rounded-lg" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = day === todayInBrasilia.day && currentDate.getMonth() === todayInBrasilia.month && currentDate.getFullYear() === todayInBrasilia.year;
      const outerClass = `h-24 bg-card rounded-lg p-2 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 ${
        isToday 
          ? 'ring-2 ring-primary bg-gradient-to-br from-primary/10 to-accent/10' 
          : 'border border-border hover:border-primary/50'
      }`;

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={outerClass}
        >
          <div className={`text-sm font-bold mb-1 ${isToday ? 'text-primary' : ''}`}>
            {day}
          </div>
          <div className="flex flex-col gap-1 overflow-hidden">
            {dayEvents.slice(0, 2).map(event => {
              const IconComponent = iconOptions.find(opt => opt.value === event.icon)?.icon || Star;
              return (
                <div
                  key={event.id}
                  className={`${event.color} rounded px-1.5 py-0.5 text-white flex items-center gap-1 text-xs font-medium shadow-sm`}
                  title={event.name}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => toggleEventCompleted(event.id)} className="flex items-center justify-center">
                    <IconComponent className={`h-3 w-3 flex-shrink-0 ${event.completed ? 'opacity-60' : ''}`} />
                  </button>
                  <span className={`truncate flex-1 ${event.completed ? 'line-through opacity-60' : ''}`}>
                    {event.name}
                  </span>
                  {!event.isCampaign && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} 
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded p-0.5 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground text-center bg-muted/30 rounded py-0.5">
                +{dayEvents.length - 2} mais
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Buscar evento"
                  className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🎮</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Mail className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <UserProfile />
            </div>
          </div>
        </header>

        {/* Calendar Content */}
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">Calendário</h1>
            <p className="text-muted-foreground">Gerencie seus eventos e acompanhe suas campanhas</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar - 2/3 width */}
            <div className="lg:col-span-2">
              <Card className="p-6 shadow-lg">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={previousMonth} className="hover:bg-primary hover:text-white transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="hover:bg-primary hover:text-white transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-bold text-primary p-2 bg-primary/5 rounded-md">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </Card>
            </div>

            {/* Campaigns List - 1/3 width */}
            <div className="lg:col-span-1">
              <Card className="p-6 shadow-lg h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold">Campanhas Ativas</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'} cadastrada{campaigns.length !== 1 ? 's' : ''}
                </p>

                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {campaigns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Flag className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Nenhuma campanha cadastrada</p>
                    </div>
                  ) : (
                    campaigns.map((campaign: any) => {
                      const startDate = new Date(campaign.startDate);
                      const endDate = new Date(campaign.endDate);
                      const playerCount = campaign.playerIds?.length || 0;
                      
                      const statusColors = {
                        'planned': 'bg-purple-500/10 text-purple-700 border-purple-200',
                        'in-progress': 'bg-blue-500/10 text-blue-700 border-blue-200',
                        'completed': 'bg-green-500/10 text-green-700 border-green-200'
                      };
                      
                      const statusLabels = {
                        'planned': 'Planejada',
                        'in-progress': 'Em Andamento',
                        'completed': 'Concluída'
                      };

                      const questionCount = questions.filter((q: any) => q.campaignId === campaign.id).length;
                      
                      return (
                        <Card key={campaign.id} className="p-3 border-2 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-start gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                              {campaign.icon || '🎯'}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs mb-1 truncate" title={campaign.name}>
                                {campaign.name}
                              </h4>
                              
                              <Badge className={`${statusColors[campaign.status as keyof typeof statusColors]} mb-2 text-[10px] px-1.5 py-0`}>
                                {statusLabels[campaign.status as keyof typeof statusLabels]}
                              </Badge>
                              
                              <div className="space-y-1 text-[11px] text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Users className="h-3 w-3 text-primary" />
                                  <span className="font-medium">{playerCount}</span>
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  <HelpCircle className="h-3 w-3 text-primary" />
                                  <span className="font-medium">{questionCount} {questionCount === 1 ? 'pergunta' : 'perguntas'}</span>
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  <CalendarIcon className="h-3 w-3 text-primary" />
                                  <span className="text-[10px]">{startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → {endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Event Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Evento - Dia {selectedDay}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event-name">Nome do Evento</Label>
                  <Input
                    id="event-name"
                    placeholder="Digite o nome do evento"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="flex gap-2">
                    {iconOptions.map(({ name, icon: Icon, value }) => (
                      <Button
                        key={value}
                        variant={selectedIcon === value ? "default" : "outline"}
                        size="icon"
                        onClick={() => setSelectedIcon(value)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map(({ name, value }) => (
                      <Button
                        key={value}
                        variant="outline"
                        className={`${value} ${selectedColor === value ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                        onClick={() => setSelectedColor(value)}
                      >
                        <span className="text-white text-xs">{name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={handleAddEvent}>
                  Adicionar Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Calendar;
