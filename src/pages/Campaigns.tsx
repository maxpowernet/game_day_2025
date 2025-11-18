import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import UserProfile from '@/components/UserProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Play, Clock, HelpCircle, CheckCircle, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCampaigns, fetchPlayers, addCampaign as apiAddCampaign, updateCampaign as apiUpdateCampaign, deleteCampaign as apiDeleteCampaign, type Campaign } from "@/lib/storageApi";
import { toast } from '@/components/ui/sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const Campaigns = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: fetchPlayers });

  const [filter, setFilter] = useState<"all" | "planned" | "in-progress" | "completed">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", status: "planned" as "planned" | "in-progress" | "completed", playerIds: [] as number[] });

  const addMutation = useMutation({ 
    mutationFn: (c: Omit<Campaign, "id">) => apiAddCampaign(c), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: 'Campanha criada', description: 'A campanha foi criada com sucesso.' } as any);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar campanha', description: error.message, variant: 'destructive' } as any);
    }
  });
  
  const updateMutation = useMutation({ 
    mutationFn: (c: Campaign) => apiUpdateCampaign(c), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: 'Campanha atualizada', description: 'A campanha foi atualizada com sucesso.' } as any);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar campanha', description: error.message, variant: 'destructive' } as any);
    }
  });
  
  const deleteMutation = useMutation({ 
    mutationFn: async (id: number) => {
      try {
        await apiDeleteCampaign(id);
      } catch (error: any) {
        console.error('Delete error:', error);
        throw error;
      }
    }, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: 'Campanha removida', description: 'A campanha foi removida com sucesso.' } as any);
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({ title: 'Erro ao remover campanha', description: error?.message || 'Erro desconhecido', variant: 'destructive' } as any);
    }
  });

  const openDialog = (c?: Campaign) => {
    if (c) {
      setEditing(c);
      setForm({ name: c.name, startDate: c.startDate, endDate: c.endDate, status: c.status, playerIds: c.playerIds || [] });
    } else {
      setEditing(null);
      setForm({ name: "", startDate: "", endDate: "", status: "planned", playerIds: [] });
    }
    setIsDialogOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<null | { id: number; title: string; description?: string }>(null);

  const openConfirm = (id: number, title: string, description?: string) => {
    setConfirmData({ id, title, description });
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmData) return;
    deleteMutation.mutate(confirmData.id);
    setConfirmOpen(false);
    setConfirmData(null);
  };

  const save = () => {
    if (!form.name) return toast({ title: 'Erro', description: 'Nome obrigatório', variant: 'destructive' } as any);
    if (!form.startDate || !form.endDate) return toast({ title: 'Erro', description: 'Datas obrigatórias', variant: 'destructive' } as any);
    const payload: any = { 
      name: form.name, 
      startDate: form.startDate, 
      endDate: form.endDate, 
      status: form.status, 
      playerIds: form.playerIds,
      createdAt: new Date().toISOString(), 
      questionIds: [], 
      teamIds: [] 
    };
    if (editing) updateMutation.mutate({ ...editing, ...payload }); else addMutation.mutate(payload);
    setIsDialogOpen(false);
  };

  const remove = (id: number) => { openConfirm(id, 'Remover campanha?', 'Tem certeza que deseja remover esta campanha?'); };

  const filtered = campaigns.filter((c: any) => filter === "all" || c.status === filter);

  const stats = { total: campaigns.length, planned: campaigns.filter((c: any) => c.status === "planned").length, inProgress: campaigns.filter((c: any) => c.status === "in-progress").length, completed: campaigns.filter((c: any) => c.status === "completed").length };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Campanhas</h1>
              <p className="text-muted-foreground">Gerencie campanhas e associe perguntas/equipes.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button onClick={() => openDialog()}><Play className="h-4 w-4 mr-2" />Nova Campanha</Button>
              </div>
              <UserProfile />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard title="Total" value={String(stats.total)} icon={HelpCircle} variant="primary" />
            <StatCard title="Planejadas" value={String(stats.planned)} icon={Clock} />
            <StatCard title="Em Andamento" value={String(stats.inProgress)} icon={Play} />
            <StatCard title="Concluídas" value={String(stats.completed)} icon={CheckCircle} />
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Lista de Campanhas</h3>
              <div className="flex items-center gap-2">
                <Button variant={filter === "all" ? "default" : "ghost"} size="sm" onClick={() => setFilter("all")}>Todas</Button>
                <Button variant={filter === "planned" ? "default" : "ghost"} size="sm" onClick={() => setFilter("planned")}>Planejadas</Button>
                <Button variant={filter === "in-progress" ? "default" : "ghost"} size="sm" onClick={() => setFilter("in-progress")}>Em Andamento</Button>
                <Button variant={filter === "completed" ? "default" : "ghost"} size="sm" onClick={() => setFilter("completed")}>Concluídas</Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Jogadores</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma campanha cadastrada.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{new Date(c.startDate).toLocaleDateString('pt-BR')} - {new Date(c.endDate).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell><Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{(c.playerIds || []).length}</Badge></TableCell>
                        <TableCell><Badge variant={c.status === 'completed' ? 'default' : c.status === 'in-progress' ? 'secondary' : 'outline'}>{c.status === 'planned' ? 'Planejada' : c.status === 'in-progress' ? 'Em Andamento' : 'Concluída'}</Badge></TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openDialog(c)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome da Campanha</Label>
                <Input value={form.name} onChange={(e: any) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Campanha de Novembro" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Data Início</Label>
                  <Input type="date" value={form.startDate} onChange={(e: any) => setForm(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input type="date" value={form.endDate} onChange={(e: any) => setForm(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejada</SelectItem>
                    <SelectItem value="in-progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jogadores ({form.playerIds.length} selecionados)</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {players.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum jogador cadastrado</p>
                  ) : (
                    players.map((player: any) => (
                      <label key={player.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-accent rounded">
                        <Checkbox 
                          checked={form.playerIds.includes(player.id)} 
                          onCheckedChange={(checked) => {
                            setForm(prev => ({
                              ...prev,
                              playerIds: checked 
                                ? [...prev.playerIds, player.id]
                                : prev.playerIds.filter(id => id !== player.id)
                            }));
                          }}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {player.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{player.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{player.role || 'Jogador'}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={save}>{editing ? 'Salvar' : 'Criar'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Confirm dialog for deletions */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmData?.title}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className='py-2'>
              <p className='text-sm text-muted-foreground'>{confirmData?.description}</p>
              <div className='flex justify-end gap-2 mt-4'>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Campaigns;
