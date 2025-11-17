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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FileUp,
  HelpCircle,
  Clock,
  Trophy,
} from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuestions,
  addQuestion as apiAddQuestion,
  updateQuestion as apiUpdateQuestion,
  deleteQuestion as apiDeleteQuestion,
  setQuestions as apiSetQuestions,
  type Question,
} from "@/lib/storageApi";

interface LocalQuestion extends Question {}

const Questions = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: questions = [] } = useQuery({ queryKey: ["questions"], queryFn: fetchQuestions });

  const [filter, setFilter] = useState<"all" | "todo" | "in-progress" | "completed">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [form, setForm] = useState({
    text: "",
    choice0: "",
    choice1: "",
    choice2: "",
    choice3: "",
    answer: 0,
    pointsOnTime: 10,
    pointsLate: 5,
    status: "todo" as "todo" | "in-progress" | "completed",
    priority: "medium" as "low" | "medium" | "high",
    dayIndex: 0,
  });

  const addMutation = useMutation({
    mutationFn: (q: Omit<Question, "id">) => apiAddQuestion(q),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  const updateMutation = useMutation({
    mutationFn: (q: Question) => apiUpdateQuestion(q),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteQuestion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });

  const openDialog = (q?: Question) => {
    if (q) {
      setEditingQuestion(q);
      setForm({
        text: q.text,
        choice0: q.choices[0] || "",
        choice1: q.choices[1] || "",
        choice2: q.choices[2] || "",
        choice3: q.choices[3] || "",
        answer: q.answer,
        pointsOnTime: q.pointsOnTime ?? 10,
        pointsLate: q.pointsLate ?? 5,
        status: q.status,
        priority: q.priority ?? "medium",
        dayIndex: (q as any).dayIndex ?? 0,
      });
    } else {
      setEditingQuestion(null);
      setForm({
        text: "",
        choice0: "",
        choice1: "",
        choice2: "",
        choice3: "",
        answer: 0,
        pointsOnTime: 10,
        pointsLate: 5,
        status: "todo",
        priority: "medium",
        dayIndex: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const saveQuestion = () => {
    if (!form.text || !form.choice0) return alert("Preencha enunciado e pelo menos uma alternativa");

    const choices = [form.choice0, form.choice1, form.choice2, form.choice3].filter(Boolean);
    const payload = {
      text: form.text,
      choices,
      answer: Math.min(form.answer, choices.length - 1),
      pointsOnTime: form.pointsOnTime,
      pointsLate: form.pointsLate,
      status: form.status,
      priority: form.priority,
    } as Omit<Question, "id">;

    if (editingQuestion) {
      updateMutation.mutate({ ...editingQuestion, ...payload });
    } else {
      addMutation.mutate(payload);
    }
    setIsDialogOpen(false);
  };

  const removeQuestion = (id: number) => {
    if (confirm("Remover pergunta?")) deleteMutation.mutate(id);
  };

  const exportQuestions = () => {
    const blob = new Blob([JSON.stringify(questions || [], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "game-day-questions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importQuestionsFile = (file: File | null) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        let data: any[] = [];
        if (ext === 'json') {
          data = JSON.parse(String(reader.result));
        } else if (ext === 'csv') {
          const lines = String(reader.result).split('\n').filter(Boolean);
          lines.slice(1).forEach(line => {
            const parts = line.split(',').map(s => s.trim());
            if (parts.length >= 6) {
              data.push({
                text: parts[0],
                choices: [parts[1], parts[2], parts[3], parts[4]].filter(Boolean),
                answer: parseInt(parts[5], 10) || 0,
                pointsOnTime: parseInt(parts[6], 10) || 10,
                pointsLate: parseInt(parts[7], 10) || 5,
                status: 'todo',
                priority: 'medium',
              });
            }
          });
        }
        if (data.length > 0) {
          await apiSetQuestions(data as any);
          queryClient.invalidateQueries({ queryKey: ['questions'] });
        } else {
          alert('Nenhuma pergunta válida encontrada no arquivo');
        }
      } catch (e) {
        alert('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  };

  const filtered = questions.filter(q => filter === 'all' || q.status === filter);

  const stats = {
    total: questions.length,
    todo: questions.filter(q => q.status === 'todo').length,
    inProgress: questions.filter(q => q.status === 'in-progress').length,
    completed: questions.filter(q => q.status === 'completed').length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-card border-r border-border p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Joystick className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">Game Day</span>
        </div>
        <nav className="space-y-2">
          <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-3'>Menu</h3>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/game-day')}>
            <LayoutDashboard className='h-4 w-4' />
            Painel
          </Button>
          <Button variant='ghost' className='w-full justify-start gap-3' onClick={() => navigate('/campaigns')}>
            <CheckSquare className='h-4 w-4' />
            Campanhas
          </Button>
          <Button variant='default' className='w-full justify-start gap-3'>
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
                <input type='search' placeholder='Buscar pergunta' className='w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary' />
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
              <h1 className='text-3xl font-bold mb-1'>Perguntas</h1>
              <p className='text-muted-foreground'>Crie e gerencie perguntas, defina pontuações e importe em lote.</p>
            </div>
            <div className='flex gap-2'>
              <Button onClick={() => openDialog()}>
                <Plus className='h-4 w-4 mr-2' />
                Nova Pergunta
              </Button>
              <Button variant='outline' onClick={exportQuestions}>Exportar</Button>
              <input id='import-questions' type='file' accept='.json,.csv' className='hidden' onChange={(e) => importQuestionsFile(e.target.files ? e.target.files[0] : null)} />
              <Button variant='ghost' onClick={() => document.getElementById('import-questions')?.click()}>
                <FileUp className='h-4 w-4 mr-2' />
                Importar CSV/JSON
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <StatCard title='Total de Perguntas' value={String(stats.total)} icon={HelpCircle} variant='primary' />
            <StatCard title='Pendentes' value={String(stats.todo)} icon={Clock} />
            <StatCard title='Concluídas' value={String(stats.completed)} icon={Trophy} />
          </div>

          <div className='flex items-center gap-2 mb-4'>
            <span className='text-sm font-medium'>Filtrar:</span>
            <Button variant={filter === 'all' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('all')}>Todas</Button>
            <Button variant={filter === 'todo' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('todo')}>A Fazer</Button>
            <Button variant={filter === 'in-progress' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('in-progress')}>Em Andamento</Button>
            <Button variant={filter === 'completed' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('completed')}>Concluídas</Button>
          </div>

          <Card className='p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-lg font-semibold'>Perguntas</h3>
            </div>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[300px]'>Enunciado</TableHead>
                    <TableHead>Alternativas</TableHead>
                    <TableHead>Pontuação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className='w-[120px] text-center'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center text-muted-foreground py-8'>
                        Nenhuma pergunta cadastrada. Clique em "Nova Pergunta" ou importe um arquivo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell>
                          <div className='flex items-start gap-3'>
                            <div className='h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0'>
                              <HelpCircle className='h-5 w-5 text-primary' />
                            </div>
                            <span className='font-medium line-clamp-2'>{question.text}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>{question.choices.length} opções</Badge>
                        </TableCell>
                        <TableCell>
                          <div className='text-sm'>
                            <div className='flex items-center gap-1'>
                              <Trophy className='h-3 w-3 text-green-600' />
                              <span>{question.pointsOnTime} pts (no prazo)</span>
                            </div>
                            <div className='flex items-center gap-1 text-muted-foreground'>
                              <Trophy className='h-3 w-3' />
                              <span>{question.pointsLate} pts (atrasado)</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={question.status === 'completed' ? 'default' : question.status === 'in-progress' ? 'secondary' : 'outline'}>
                            {question.status === 'todo' ? 'A Fazer' : question.status === 'in-progress' ? 'Em Andamento' : 'Concluída'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={question.priority === 'high' ? 'destructive' : question.priority === 'low' ? 'secondary' : 'outline'}>
                            {question.priority === 'high' ? 'Alta' : question.priority === 'low' ? 'Baixa' : 'Média'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-center'>
                          <div className='flex items-center justify-center gap-2'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => openDialog(question)}
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                              onClick={() => removeQuestion(question.id)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Enunciado</Label>
              <Textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder='Digite o enunciado da pergunta'
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Label>Alternativas</Label>
              <Input value={form.choice0} onChange={(e) => setForm({ ...form, choice0: e.target.value })} placeholder='Alternativa 1' />
              <Input value={form.choice1} onChange={(e) => setForm({ ...form, choice1: e.target.value })} placeholder='Alternativa 2' />
              <Input value={form.choice2} onChange={(e) => setForm({ ...form, choice2: e.target.value })} placeholder='Alternativa 3' />
              <Input value={form.choice3} onChange={(e) => setForm({ ...form, choice3: e.target.value })} placeholder='Alternativa 4' />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Resposta Correta (índice 0-3)</Label>
                <Input
                  type='number'
                  min={0}
                  max={3}
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Dia da Campanha</Label>
                <Input
                  type='number'
                  min={0}
                  value={form.dayIndex}
                  onChange={(e) => setForm({ ...form, dayIndex: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Pontos no Prazo</Label>
                <Input
                  type='number'
                  min={0}
                  value={form.pointsOnTime}
                  onChange={(e) => setForm({ ...form, pointsOnTime: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className='space-y-2'>
                <Label>Pontos Atrasado</Label>
                <Input
                  type='number'
                  min={0}
                  value={form.pointsLate}
                  onChange={(e) => setForm({ ...form, pointsLate: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='todo'>A Fazer</SelectItem>
                    <SelectItem value='in-progress'>Em Andamento</SelectItem>
                    <SelectItem value='completed'>Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='low'>Baixa</SelectItem>
                    <SelectItem value='medium'>Média</SelectItem>
                    <SelectItem value='high'>Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className='w-full' onClick={saveQuestion}>
              {editingQuestion ? 'Salvar Alterações' : 'Criar Pergunta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Questions;
