import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCampaigns } from "@/lib/storageApi";
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
    const campaignEvents = campaigns
      .filter((c: any) => {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate);
        const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return currentDay >= start && currentDay <= end &&
               start.getMonth() === currentDate.getMonth() && start.getFullYear() === currentDate.getFullYear() ||
               end.getMonth() === currentDate.getMonth() && end.getFullYear() === currentDate.getFullYear() ||
               (currentDay.getMonth() === currentDate.getMonth() && currentDay.getFullYear() === currentDate.getFullYear() &&
                start <= currentDay && end >= currentDay);
      })
      .map((c: any) => ({
        id: `campaign-${c.id}-${day}`,
        name: c.name,
        color: c.status === 'completed' ? 'bg-green-600' : c.status === 'in-progress' ? 'bg-blue-600' : 'bg-purple-600',
        day,
        icon: 'flag',
        completed: c.status === 'completed',
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
      days.push(<div key={`empty-${i}`} className="h-16 sm:h-20 md:h-24 bg-muted/30 rounded-lg" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = day === todayInBrasilia.day && currentDate.getMonth() === todayInBrasilia.month && currentDate.getFullYear() === todayInBrasilia.year;
      const outerClass = `h-16 sm:h-20 md:h-24 bg-card rounded-lg p-1 sm:p-2 cursor-pointer hover:bg-accent/50 transition-colors ${isToday ? 'border-2 border-primary' : 'border border-border'}`;

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={outerClass}
        >
          <div className="text-sm font-semibold mb-1">{day}</div>
          <div className="flex flex-col gap-1">
            {dayEvents.map(event => {
              const IconComponent = iconOptions.find(opt => opt.value === event.icon)?.icon || Star;
              return (
                <div
                  key={event.id}
                  className={`${event.color} rounded px-2 py-1 text-white flex items-center gap-1.5 text-xs font-medium`}
                  title={event.name}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => toggleEventCompleted(event.id)} className="flex items-center justify-center">
                    <IconComponent className={`h-3 w-3 flex-shrink-0 ${event.completed ? 'opacity-60' : ''}`} />
                  </button>
                  <span className={`truncate ${event.completed ? 'line-through opacity-60' : ''}`}>{event.name}</span>
                  {!event.isCampaign && (
                    <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} className="ml-auto">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
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
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">TM</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold">Totok Michael</p>
                  <p className="text-xs text-muted-foreground">tmichael20@mail.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Calendar Content */}
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-1">Calendário</h1>
            <p className="text-muted-foreground">Gerencie seus eventos e compromissos</p>
          </div>

          <Card className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-1 sm:p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
              {renderCalendar()}
            </div>
          </Card>

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
