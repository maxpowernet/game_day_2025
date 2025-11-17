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
import Sidebar from "@/components/Sidebar";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuestions,
  fetchCampaigns,
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
  const { data: campaigns = [] } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });

  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "todo" | "in-progress" | "completed">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [form, setForm] = useState({
    campaignId: 0,
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
        campaignId: q.campaignId,
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
      });
    } else {
      setEditingQuestion(null);
      setForm({
        campaignId: selectedCampaignId || 0,
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
      });
    }
    setIsDialogOpen(true);
  };

  const saveQuestion = () => {
    if (!form.campaignId) return alert("Selecione uma campanha primeiro");
    if (!form.text || !form.choice0) return alert("Preencha enunciado e pelo menos uma alternativa");

    const choices = [form.choice0, form.choice1, form.choice2, form.choice3].filter(Boolean);
    
    // Auto-calculate dayIndex: count existing questions in this campaign
    const existingQuestionsInCampaign = questions.filter((q: Question) => q.campaignId === form.campaignId);
    const dayIndex = editingQuestion 
      ? editingQuestion.dayIndex 
      : existingQuestionsInCampaign.length; // next available day

    const payload = {
      campaignId: form.campaignId,
      dayIndex,
      text: form.text,
      choices,
      answer: Math.min(form.answer, choices.length - 1),
      pointsOnTime: form.pointsOnTime,
      pointsLate: form.pointsLate,
      status: form.status,
      priority: form.priority,
      scheduleTime: "08:00",
      deadlineTime: "18:00",
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

  const filtered = questions.filter(q => {
    const matchesFilter = filter === 'all' || q.status === filter;
    const matchesCampaign = !selectedCampaignId || q.campaignId === selectedCampaignId;
    return matchesFilter && matchesCampaign;
  });

  const stats = {
    total: selectedCampaignId ? questions.filter(q => q.campaignId === selectedCampaignId).length : questions.length,
    todo: selectedCampaignId ? questions.filter(q => q.campaignId === selectedCampaignId && q.status === 'todo').length : questions.filter(q => q.status === 'todo').length,
    inProgress: selectedCampaignId ? questions.filter(q => q.campaignId === selectedCampaignId && q.status === 'in-progress').length : questions.filter(q => q.status === 'in-progress').length,
    completed: selectedCampaignId ? questions.filter(q => q.campaignId === selectedCampaignId && q.status === 'completed').length : questions.filter(q => q.status === 'completed').length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

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
              <p className='text-muted-foreground'>Selecione uma campanha e crie perguntas que serão distribuídas automaticamente por dia.</p>
            </div>
            <div className='flex gap-2'>
              <Button onClick={() => openDialog()} disabled={!selectedCampaignId}>
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

          <Card className='p-4 bg-muted/50'>
            <div className='flex items-center gap-4'>
              <Label className='text-sm font-medium'>Campanha Ativa:</Label>
              <Select 
                value={selectedCampaignId ? String(selectedCampaignId) : ''} 
                onValueChange={(v: string) => setSelectedCampaignId(parseInt(v, 10))}
              >
                <SelectTrigger className='w-[300px]'>
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.filter((c: any) => c.status === 'planned' || c.status === 'in-progress').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({new Date(c.startDate).toLocaleDateString('pt-BR')} - {new Date(c.endDate).toLocaleDateString('pt-BR')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCampaignId && (
                <Badge variant='secondary'>
                  {questions.filter((q: Question) => q.campaignId === selectedCampaignId).length} perguntas cadastradas
                </Badge>
              )}
            </div>
          </Card>

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
                    <TableHead>Campanha / Dia</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Pontuação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='w-[120px] text-center'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center text-muted-foreground py-8'>
                        {selectedCampaignId 
                          ? 'Nenhuma pergunta cadastrada para esta campanha.' 
                          : 'Selecione uma campanha para ver as perguntas.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((question) => {
                      const campaign = campaigns.find((c: any) => c.id === question.campaignId);
                      const campaignStartDate = campaign ? new Date(campaign.startDate) : null;
                      const questionDate = campaignStartDate ? new Date(campaignStartDate.getTime() + question.dayIndex * 24 * 60 * 60 * 1000) : null;
                      
                      return (
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
                            <div className='flex flex-col gap-1'>
                              <Badge variant='outline' className='w-fit'>{campaign?.name || 'Campanha não encontrada'}</Badge>
                              <span className='text-xs text-muted-foreground'>
                                Dia {question.dayIndex + 1} {questionDate ? `(${questionDate.toLocaleDateString('pt-BR')})` : ''}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1 text-sm'>
                              <Clock className='h-3 w-3 text-muted-foreground' />
                              <span>{question.scheduleTime || '08:00'} - {question.deadlineTime || '18:00'}</span>
                            </div>
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
            <DialogTitle>{editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>Campanha *</Label>
              <Select 
                value={String(form.campaignId)} 
                onValueChange={(v: string) => setForm({ ...form, campaignId: parseInt(v, 10) })}
                disabled={!!editingQuestion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.filter((c: any) => c.status === 'planned' || c.status === 'in-progress').map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({new Date(c.startDate).toLocaleDateString('pt-BR')} - {new Date(c.endDate).toLocaleDateString('pt-BR')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.campaignId > 0 && !editingQuestion && (
                <p className='text-xs text-muted-foreground'>
                  Esta pergunta será automaticamente atribuída ao Dia {questions.filter((q: Question) => q.campaignId === form.campaignId).length + 1} (08h-18h)
                </p>
              )}
            </div>
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
