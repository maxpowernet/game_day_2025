import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Joystick,
  CheckSquare,
  Calendar,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  Mail,
  Bell,
  Play,
  Filter,
  Clock,
  AlertCircle,
  TrendingUp,
  ListTodo,
  Trash2,
} from "lucide-react";
import Sidebar from '@/components/Sidebar';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "completed";
  dueDate: string;
  assignee: string;
  tags: string[];
}

const Tasks = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "todo" | "in-progress" | "completed">("all");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    status: "todo" as "todo" | "in-progress" | "completed",
    dueDate: "",
    assignee: "",
    tags: [] as string[],
  });
  const [filterOptions, setFilterOptions] = useState({
    priority: "all",
    assignee: "all",
  });
  const [taskList, setTaskList] = useState<Task[]>([
    {
      id: 1,
      title: "Desenvolver Endpoints da API",
      description: "Criar endpoints REST para autenticação de usuários",
      priority: "high",
      status: "in-progress",
      dueDate: "26 de nov, 2024",
      assignee: "Alexandra Deff",
      tags: ["Backend", "API"],
    },
    {
      id: 2,
      title: "Design do Sistema",
      description: "Criar wireframes e protótipos de alta fidelidade",
      priority: "medium",
      status: "todo",
      dueDate: "28 de nov, 2024",
      assignee: "Edwin Adenike",
      tags: ["Design", "UI/UX"],
    },
    {
      id: 3,
      title: "Otimizar Performance",
      description: "Melhorar tempo de carregamento das páginas",
      priority: "high",
      status: "in-progress",
      dueDate: "30 de nov, 2024",
      assignee: "Isaac Oluwatemilorun",
      tags: ["Frontend", "Performance"],
    },
    {
      id: 4,
      title: "Documentação Técnica",
      description: "Escrever documentação completa da API",
      priority: "low",
      status: "completed",
      dueDate: "25 de nov, 2024",
      assignee: "David Oshodi",
      tags: ["Documentação"],
    },
    {
      id: 5,
      title: "Testes de Integração",
      description: "Implementar testes automatizados",
      priority: "medium",
      status: "todo",
      dueDate: "2 de dez, 2024",
      assignee: "Alexandra Deff",
      tags: ["Testes", "QA"],
    },
  ]);

  const handleDeleteTask = (taskId: number) => {
    setTaskList(taskList.filter(task => task.id !== taskId));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskOpen(true);
  };

  const handleUpdateTask = () => {
    if (editingTask) {
      setTaskList(taskList.map(task => 
        task.id === editingTask.id ? editingTask : task
      ));
      setIsEditTaskOpen(false);
      setEditingTask(null);
    }
  };

  const handleToggleTaskStatus = (taskId: number) => {
    setTaskList(taskList.map(task => {
      if (task.id === taskId) {
        if (task.status === "todo") {
          return { ...task, status: "in-progress" as const };
        } else if (task.status === "in-progress") {
          return { ...task, status: "completed" as const };
        }
      }
      return task;
    }));
  };

  const filteredTasks = taskList.filter((task) => {
    const statusMatch = filter === "all" || task.status === filter;
    const priorityMatch = filterOptions.priority === "all" || task.priority === filterOptions.priority;
    const assigneeMatch = filterOptions.assignee === "all" || task.assignee === filterOptions.assignee;
    return statusMatch && priorityMatch && assigneeMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive";
      case "medium":
        return "bg-warning";
      case "low":
        return "bg-success";
      default:
        return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return { variant: "default" as const, label: "Concluído", color: "bg-success" };
      case "in-progress":
        return { variant: "secondary" as const, label: "Em Andamento", color: "bg-warning" };
      case "todo":
        return { variant: "outline" as const, label: "A Fazer", color: "bg-muted" };
      default:
        return { variant: "outline" as const, label: "Desconhecido", color: "bg-muted" };
    }
  };

  const taskStats = {
    total: taskList.length,
    todo: taskList.filter((t) => t.status === "todo").length,
    inProgress: taskList.filter((t) => t.status === "in-progress").length,
    completed: taskList.filter((t) => t.status === "completed").length,
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
                  placeholder="Buscar tarefa"
                  className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🎮</span>
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-muted rounded">
                  ⌘ F
                </kbd>
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

        {/* Tasks Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Title and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Tarefas</h1>
              <p className="text-muted-foreground">Gerencie suas tarefas e acompanhe o progresso.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsNewTaskOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
              <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total de Tarefas"
              value={taskStats.total.toString()}
              icon={ListTodo}
              variant="primary"
            />
            <StatCard
              title="A Fazer"
              value={taskStats.todo.toString()}
              icon={Clock}
            />
            <StatCard
              title="Em Andamento"
              value={taskStats.inProgress.toString()}
              icon={TrendingUp}
            />
            <StatCard
              title="Concluídas"
              value={taskStats.completed.toString()}
              icon={CheckSquare}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              Todas ({taskList.length})
            </Button>
            <Button
              variant={filter === "todo" ? "default" : "outline"}
              onClick={() => setFilter("todo")}
            >
              A Fazer ({taskStats.todo})
            </Button>
            <Button
              variant={filter === "in-progress" ? "default" : "outline"}
              onClick={() => setFilter("in-progress")}
            >
              Em Andamento ({taskStats.inProgress})
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              onClick={() => setFilter("completed")}
            >
              Concluídas ({taskStats.completed})
            </Button>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const statusBadge = getStatusBadge(task.status);
              return (
                <Card key={task.id} className="p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    {task.status !== "completed" && (
                      <Checkbox 
                        className="mt-1" 
                        checked={false}
                        onCheckedChange={() => handleToggleTaskStatus(task.id)}
                      />
                    )}
                    <div className="flex-1 cursor-pointer" onClick={() => handleEditTask(task)}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${getPriorityColor(task.priority)}`} title={`Prioridade: ${task.priority}`} />
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {task.dueDate}
                        </div>

                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {task.assignee.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{task.assignee}</span>
                        </div>

                        <div className="flex gap-2 ml-auto">
                          {task.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* New Task Dialog */}
          <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Digite o título da tarefa"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Digite a descrição da tarefa"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newTask.status} onValueChange={(value: any) => setNewTask({ ...newTask, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in-progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Data de Vencimento</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignee">Responsável</Label>
                    <Input
                      id="assignee"
                      placeholder="Nome do responsável"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    />
                  </div>
                </div>

                <Button className="w-full" onClick={() => {
                  const newTaskWithId = {
                    ...newTask,
                    id: Math.max(...taskList.map(t => t.id), 0) + 1,
                  };
                  setTaskList([...taskList, newTaskWithId]);
                  setIsNewTaskOpen(false);
                  setNewTask({
                    title: "",
                    description: "",
                    priority: "medium",
                    status: "todo",
                    dueDate: "",
                    assignee: "",
                    tags: [],
                  });
                }}>
                  Criar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Task Dialog */}
          <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Tarefa</DialogTitle>
              </DialogHeader>
              {editingTask && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Título</Label>
                    <Input
                      id="edit-title"
                      placeholder="Digite o título da tarefa"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Digite a descrição da tarefa"
                      value={editingTask.description}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-priority">Prioridade</Label>
                      <Select value={editingTask.priority} onValueChange={(value: any) => setEditingTask({ ...editingTask, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editingTask.status} onValueChange={(value: any) => setEditingTask({ ...editingTask, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">A Fazer</SelectItem>
                          <SelectItem value="in-progress">Em Andamento</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-dueDate">Data de Vencimento</Label>
                      <Input
                        id="edit-dueDate"
                        type="date"
                        value={editingTask.dueDate}
                        onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-assignee">Responsável</Label>
                      <Input
                        id="edit-assignee"
                        placeholder="Nome do responsável"
                        value={editingTask.assignee}
                        onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleUpdateTask}>
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Filter Sheet */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtrar Tarefas</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="filter-priority">Prioridade</Label>
                  <Select value={filterOptions.priority} onValueChange={(value) => setFilterOptions({ ...filterOptions, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-assignee">Responsável</Label>
                  <Select value={filterOptions.assignee} onValueChange={(value) => setFilterOptions({ ...filterOptions, assignee: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Alexandra Deff">Alexandra Deff</SelectItem>
                      <SelectItem value="Edwin Adenike">Edwin Adenike</SelectItem>
                      <SelectItem value="Isaac Oluwatemilorun">Isaac Oluwatemilorun</SelectItem>
                      <SelectItem value="David Oshodi">David Oshodi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setFilterOptions({ priority: "all", assignee: "all" });
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  );
};

export default Tasks;
