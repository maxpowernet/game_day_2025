import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import UserProfile from '@/components/UserProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlayers, fetchCampaigns, getVisibleQuestionsForPlayer, submitAnswer, fetchQuestions, Answer as AnswerType } from '@/lib/storageApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Trophy, Clock, Star } from 'lucide-react';

const Play: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: fetchPlayers });
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: fetchCampaigns });
  const { data: allQuestions = [] } = useQuery({ queryKey: ['questions'], queryFn: fetchQuestions });

  const [playerId, setPlayerId] = useState<number | null>(players[0]?.id || null);
  const [campaignId, setCampaignId] = useState<number | null>(campaigns[0]?.id || null);
  const [visibleQuestions, setVisibleQuestions] = useState<any[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [countdowns, setCountdowns] = useState<{ [qId: number]: number }>({});
  const [answeredResults, setAnsweredResults] = useState<Record<number, AnswerType | null>>({});

  const answerMutation = useMutation({
    mutationFn: (payload: any) => submitAnswer(payload),
    onSuccess: (data: AnswerType, variables: any) => {
      // immediate feedback: store the returned answer for the question
      setAnsweredResults(prev => ({ ...prev, [variables.questionId]: data }));
      toast({ title: 'Resposta registrada' } as any);
      queryClient.invalidateQueries({ queryKey: ['answers'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });

      // after a short delay, refresh visible questions to remove answered one
      setTimeout(() => loadVisible(), 1500);
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err?.message || String(err), variant: 'destructive' } as any);
    }
  });

  useEffect(() => {
    if (players.length && !playerId) setPlayerId(players[0].id);
    if (campaigns.length && !campaignId) setCampaignId(campaigns[0].id);
  }, [players, campaigns]);

  const loadVisible = async () => {
    if (!playerId || !campaignId) return setVisibleQuestions([]);
    const qs = await getVisibleQuestionsForPlayer(playerId, campaignId);
    setVisibleQuestions(qs);
    // setup countdowns for special questions
    const newCounts: { [k: number]: number } = {};
    qs.forEach((q: any) => {
      if (q.isSpecial && q.specialStartAt) {
        const start = new Date(q.specialStartAt).getTime();
        const windowMin = q.specialWindowMinutes ?? 1;
        const end = start + windowMin * 60 * 1000;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((end - now) / 1000));
        newCounts[q.id] = remaining;
      }
    });
    setCountdowns(newCounts);
  };

  useEffect(() => {
    loadVisible();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, campaignId, allQuestions]);

  // countdown interval
  useEffect(() => {
    const iv = setInterval(() => {
      setCountdowns(prev => {
        const next: any = { ...prev };
        Object.keys(next).forEach(k => {
          next[+k] = Math.max(0, next[+k] - 1);
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleSubmit = (q: any) => {
    if (!playerId) return toast({ title: 'Selecione um jogador', variant: 'destructive' } as any);
    if (selectedChoice === null) return toast({ title: 'Selecione uma alternativa', variant: 'destructive' } as any);
    answerMutation.mutate({ playerId, questionId: q.id, campaignId: q.campaignId, selectedAnswer: selectedChoice });
    setSelectedChoice(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Jogar</h1>
            <p className="text-muted-foreground">Responda a pergunta do dia e participe das campanhas</p>
          </div>
          <UserProfile />
        </div>

        <Card className="p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-60">
              <Select value={playerId ? String(playerId) : ''} onValueChange={(v:any) => setPlayerId(parseInt(v,10))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione jogador" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-72">
              <Select value={campaignId ? String(campaignId) : ''} onValueChange={(v:any) => setCampaignId(parseInt(v,10))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.filter((c:any) => c.status === 'planned' || c.status === 'in-progress').map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadVisible}>Atualizar</Button>
          </div>
        </Card>

        {visibleQuestions.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">Nenhuma pergunta disponível no momento.</Card>
        )}

        {visibleQuestions.map((q: any) => (
          <Card key={q.id} className="p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{q.text}</h3>
                  {q.isSpecial && <Badge variant="destructive" className="flex items-center gap-2"><Star className="h-4 w-4"/> Especial</Badge>}
                </div>

                <div className="mt-4 grid gap-2">
                  {q.choices.map((ch: string, idx: number) => (
                    <label key={idx} className="flex items-center gap-3 p-3 border rounded cursor-pointer">
                      <input type="radio" name={`q-${q.id}`} checked={selectedChoice === idx} onChange={() => setSelectedChoice(idx)} />
                      <span>{ch}</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <Button onClick={() => handleSubmit(q)}>Enviar Resposta</Button>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" /> <span>{q.pointsOnTime} pts (no prazo) / {q.pointsLate} pts (atrasado)</span>
                  </div>
                  {q.isSpecial && q.specialStartAt && (
                    <div className="ml-auto text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Tempo restante: {countdowns[q.id] != null ? `${countdowns[q.id]}s` : '—'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
};

export default Play;
