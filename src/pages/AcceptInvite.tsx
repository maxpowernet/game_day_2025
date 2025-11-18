import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdmins, updateAdmin } from '@/lib/storageApi';
import { toast } from '@/components/ui/sonner';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: admins = [] } = useQuery({ queryKey: ['admins'], queryFn: fetchAdmins });
  const updateAdminMutation = useMutation({ mutationFn: (a: any) => updateAdmin(a), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }) });

  const [admin, setAdmin] = useState<any | null>(null);

  useEffect(() => {
    if (token) {
      const found = admins.find((a: any) => a.inviteToken === token);
      setAdmin(found || null);
    }
  }, [token, admins]);

  const accept = () => {
    if (!admin) return;
    updateAdminMutation.mutate({ ...admin, invited: false, inviteToken: undefined });
    toast({ title: 'Convite aceito', description: 'Administrador ativado.' } as any);
    navigate('/login');
  };

  return (
    <div className='flex min-h-screen bg-background'>
      <Sidebar />
      <main className='flex-1 p-6'>
        <Card className='max-w-2xl mx-auto p-6'>
          <h2 className='text-xl font-semibold mb-4'>Aceitar Convite</h2>
          {!token && <p>Token de convite ausente.</p>}
          {token && !admin && <p>Link inválido ou expirado.</p>}
          {admin && (
            <div>
              <p className='mb-2'>Olá, <strong>{admin.name}</strong></p>
              <p className='text-sm text-muted-foreground mb-4'>Email: {admin.email}</p>
              <p className='mb-4'>Clique abaixo para aceitar o convite e ativar sua conta de administrador.</p>
              <div className='flex gap-2'>
                <Button onClick={accept}>Aceitar Convite</Button>
                <Button variant='ghost' onClick={() => navigate('/login')}>Ir para login</Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AcceptInvite;
