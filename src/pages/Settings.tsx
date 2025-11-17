import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UserProfile from '@/components/UserProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdmins, addAdmin, updateAdmin, fetchMessages, updateMessage, deleteMessage, Admin, MessageItem } from '@/lib/storageApi';

const Settings = () => {
  const queryClient = useQueryClient();

  const { data: admins = [] } = useQuery({ queryKey: ['admins'], queryFn: fetchAdmins });
  const { data: messages = [] } = useQuery({ queryKey: ['messages'], queryFn: fetchMessages });

  const addAdminMutation = useMutation({ mutationFn: (a: Omit<Admin, 'id' | 'createdAt'>) => addAdmin(a), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }) });
  const updateAdminMutation = useMutation({ mutationFn: (a: Admin) => updateAdmin(a), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }) });
  const updateMessageMutation = useMutation({ mutationFn: (m: MessageItem) => updateMessage(m), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }) });
  const deleteMessageMutation = useMutation({ mutationFn: (id: number) => deleteMessage(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }) });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Theme handled by UserProfile component

  const generateToken = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

  const sendInvite = () => {
    if (!inviteEmail || !inviteName) return alert('Preencha nome e email');
    const token = generateToken();
    addAdminMutation.mutate({ name: inviteName, email: inviteEmail, invited: true, inviteToken: token });
    setInviteEmail(''); setInviteName('');
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    alert(`Convite enviado (simulado). Link de ativação:\n${link}`);
  };

  const activateAdmin = (a: Admin) => {
    const updated = { ...a, invited: false };
    // use updateAdmin via storageApi update function
    // storageApi doesn't export updateAdmin specifically here, but we can reuse addAdmin for creation; however updateAdmin exists as updateAdmin
  };

  const markHandled = (m: MessageItem) => {
    updateMessageMutation.mutate({ ...m, handled: true });
  };

  const removeMessage = (id: number) => {
    if (!confirm('Remover mensagem?')) return;
    deleteMessageMutation.mutate(id);
  };

  return (
    <div className='flex min-h-screen bg-background'>
      <Sidebar />
      <main className='flex-1 overflow-auto'>
        <header className='bg-card border-b border-border p-4 md:p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold'>Configurações</h1>
              <p className='text-muted-foreground'>Configurações da plataforma</p>
            </div>
            <UserProfile />
          </div>
        </header>

        <div className='p-4 md:p-6 space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <Card className='p-6'>
              <h3 className='text-lg font-semibold mb-2'>Administradores</h3>
              <p className='text-sm text-muted-foreground mb-4'>Gerencie os administradores da plataforma. Envie convites por email (simulado).</p>

              {admins.length === 0 ? (
                <div className='mb-4'>
                  <p className='text-sm mb-2'>Nenhum administrador encontrado. Crie o administrador inicial:</p>
                </div>
              ) : (
                <div className='mb-4'>
                  <p className='text-sm mb-2'>Administradores cadastrados:</p>
                  <div className='space-y-2'>
                    {admins.map((a: Admin) => (
                      <div key={a.id} className='flex items-center justify-between p-2 border rounded'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'><AvatarFallback className='bg-primary text-white'>{a.name.split(' ').map(n => n[0]).join('').slice(0,2)}</AvatarFallback></Avatar>
                          <div>
                            <div className='font-medium'>{a.name}</div>
                            <div className='text-xs text-muted-foreground'>{a.email}</div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant={a.invited ? 'outline' : 'default'}>{a.invited ? 'Convidado' : 'Ativo'}</Badge>
                          {a.invited && (
                            <Button size='sm' variant='ghost' onClick={() => {
                              const newToken = generateToken();
                              updateAdminMutation.mutate({ ...a, inviteToken: newToken, invited: true });
                              const link = `${window.location.origin}/accept-invite?token=${newToken}`;
                              alert(`Convite reenviado (simulado). Link de ativação:\n${link}`);
                            }}>Reenviar</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='mt-4 space-y-2'>
                <div>
                  <Label>Nome</Label>
                  <Input value={inviteName} onChange={(e:any) => setInviteName(e.target.value)} placeholder='Nome do admin' />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={inviteEmail} onChange={(e:any) => setInviteEmail(e.target.value)} placeholder='email@dominio.com' />
                </div>
                <div className='flex gap-2'>
                  <Button onClick={sendInvite}>Enviar Convite</Button>
                </div>
              </div>
            </Card>

            

            <Card className='p-6 col-span-1 lg:col-span-3'>
              <h3 className='text-lg font-semibold mb-2'>Caixa de Mensagens</h3>
              <p className='text-sm text-muted-foreground mb-4'>Mensagens recebidas de jogadores ou de outras plataformas. Use para receber reports de erros e enviar soluções.</p>

              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Remetente</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Recebido</TableHead>
                      <TableHead className='w-[120px] text-center'>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className='text-center text-muted-foreground py-8'>Nenhuma mensagem recebida.</TableCell></TableRow>
                    ) : (
                      messages.map((m: MessageItem) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='font-medium'>{m.from}</div>
                              <div className='text-xs text-muted-foreground'>{m.handled ? <Badge variant='default'>Respondida</Badge> : <Badge variant='outline'>Pendente</Badge>}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='font-medium'>{m.subject}</div>
                            <div className='text-xs text-muted-foreground line-clamp-2'>{m.body}</div>
                          </TableCell>
                          <TableCell><span className='text-sm text-muted-foreground'>{new Date(m.receivedAt).toLocaleString('pt-BR')}</span></TableCell>
                          <TableCell className='text-center'>
                            <div className='flex items-center justify-center gap-2'>
                              <Button size='sm' onClick={() => markHandled(m)}>Marcar como tratada</Button>
                              <Button variant='ghost' size='sm' onClick={() => removeMessage(m.id)}>Remover</Button>
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
        </div>
      </main>
    </div>
  );
};

export default Settings;
