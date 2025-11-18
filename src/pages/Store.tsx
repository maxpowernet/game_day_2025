import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import UserProfile from '@/components/UserProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, ShoppingBag, Package, Coins, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchProducts, 
  fetchCampaigns, 
  fetchPurchases,
  addProduct as apiAddProduct, 
  updateProduct as apiUpdateProduct, 
  deleteProduct as apiDeleteProduct,
  type Product,
  type Campaign
} from "@/lib/storageApi";
import { toast } from '@/components/ui/sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const Store = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: campaigns = [] } = useQuery({ queryKey: ["campaigns"], queryFn: fetchCampaigns });
  const { data: purchases = [] } = useQuery({ queryKey: ["purchases"], queryFn: fetchPurchases });

  const [filterCampaign, setFilterCampaign] = useState<number | "all">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ 
    name: "", 
    description: "", 
    imageUrl: "", 
    priceInGameCoins: 0, 
    quantity: 0, 
    campaignId: 0, 
    availableFrom: "", 
    availableUntil: "" 
  });

  const addMutation = useMutation({ 
    mutationFn: (p: Omit<Product, "id" | "createdAt">) => apiAddProduct(p), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: 'Produto criado', description: 'O produto foi criado com sucesso.' } as any);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar produto', description: error.message, variant: 'destructive' } as any);
    }
  });
  
  const updateMutation = useMutation({ 
    mutationFn: (p: Product) => apiUpdateProduct(p), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: 'Produto atualizado', description: 'O produto foi atualizado com sucesso.' } as any);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar produto', description: error.message, variant: 'destructive' } as any);
    }
  });
  
  const deleteMutation = useMutation({ 
    mutationFn: (id: number) => apiDeleteProduct(id), 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: 'Produto removido', description: 'O produto foi removido com sucesso.' } as any);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover produto', description: error.message, variant: 'destructive' } as any);
    }
  });

  const openDialog = (p?: Product) => {
    if (p) {
      setEditing(p);
      setForm({ 
        name: p.name, 
        description: p.description, 
        imageUrl: p.imageUrl, 
        priceInGameCoins: p.priceInGameCoins, 
        quantity: p.quantity, 
        campaignId: p.campaignId, 
        availableFrom: p.availableFrom, 
        availableUntil: p.availableUntil 
      });
    } else {
      setEditing(null);
      setForm({ 
        name: "", 
        description: "", 
        imageUrl: "", 
        priceInGameCoins: 0, 
        quantity: 0, 
        campaignId: campaigns[0]?.id || 0, 
        availableFrom: "", 
        availableUntil: "" 
      });
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
    deleteMutation.mutate(confirmData.id, {
      onSuccess: () => toast({ title: 'Produto removido', description: 'O produto foi removido com sucesso.' } as any)
    });
    setConfirmOpen(false);
    setConfirmData(null);
  };

  const save = () => {
    if (!form.name) return toast({ title: 'Erro', description: 'Nome obrigatório', variant: 'destructive' } as any);
    if (!form.description) return toast({ title: 'Erro', description: 'Descrição obrigatória', variant: 'destructive' } as any);
    if (!form.imageUrl) return toast({ title: 'Erro', description: 'URL da imagem obrigatória', variant: 'destructive' } as any);
    if (form.priceInGameCoins <= 0) return toast({ title: 'Erro', description: 'Preço deve ser maior que zero', variant: 'destructive' } as any);
    if (form.quantity <= 0) return toast({ title: 'Erro', description: 'Quantidade deve ser maior que zero', variant: 'destructive' } as any);
    if (!form.campaignId) return toast({ title: 'Erro', description: 'Campanha obrigatória', variant: 'destructive' } as any);
    if (!form.availableFrom || !form.availableUntil) return toast({ title: 'Erro', description: 'Datas de disponibilidade obrigatórias', variant: 'destructive' } as any);

    const payload: any = { 
      name: form.name, 
      description: form.description, 
      imageUrl: form.imageUrl, 
      priceInGameCoins: form.priceInGameCoins, 
      quantity: form.quantity, 
      campaignId: form.campaignId, 
      availableFrom: form.availableFrom, 
      availableUntil: form.availableUntil 
    };
    if (editing) {
      updateMutation.mutate({ ...editing, ...payload }, {
        onSuccess: () => toast({ title: 'Produto atualizado', description: 'Produto atualizado com sucesso.' } as any)
      });
    } else {
      addMutation.mutate(payload, {
        onSuccess: () => toast({ title: 'Produto criado', description: 'Produto criado com sucesso.' } as any)
      });
    }
    setIsDialogOpen(false);
  };

  const filteredProducts = filterCampaign === "all" 
    ? products 
    : products.filter(p => p.campaignId === filterCampaign);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalSales = purchases.length;
  const totalRevenue = purchases.reduce((sum, p) => sum + p.priceInGameCoins, 0);

  const getCampaignName = (id: number) => campaigns.find(c => c.id === id)?.name || "N/A";
  const getProductPurchaseCount = (productId: number) => purchases.filter(p => p.productId === productId).length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Lojinha</h1>
            <p className="text-muted-foreground">Gerencie produtos e recompensas do jogo</p>
          </div>
          <UserProfile />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Produtos"
            value={totalProducts.toString()}
            icon={Package}
            trend={{ value: 0, label: "produtos cadastrados" }}
          />
          <StatCard
            title="Estoque Total"
            value={totalStock.toString()}
            icon={ShoppingBag}
            trend={{ value: 0, label: "unidades disponíveis" }}
          />
          <StatCard
            title="Vendas Realizadas"
            value={totalSales.toString()}
            icon={TrendingUp}
            trend={{ value: 0, label: "compras efetuadas" }}
          />
          <StatCard
            title="Receita (GameCoins)"
            value={totalRevenue.toString()}
            icon={Coins}
            trend={{ value: 0, label: "gamecoins arrecadados" }}
          />
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-4 items-center">
              <h2 className="text-xl font-semibold">Produtos Cadastrados</h2>
              <Select value={filterCampaign.toString()} onValueChange={(v) => setFilterCampaign(v === "all" ? "all" : Number(v))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por campanha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Campanhas</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => openDialog()}>Novo Produto</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Campanha</TableHead>
                <TableHead>Preço (GameCoins)</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Vendido</TableHead>
                <TableHead>Disponibilidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum produto cadastrado
                  </TableCell>
                </TableRow>
              )}
              {filteredProducts.map(p => {
                const purchased = getProductPurchaseCount(p.id);
                const remaining = p.quantity - purchased;
                const isAvailable = new Date(p.availableFrom) <= new Date() && new Date() <= new Date(p.availableUntil);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded" />
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{getCampaignName(p.campaignId)}</TableCell>
                    <TableCell>{p.priceInGameCoins}</TableCell>
                    <TableCell>
                      <Badge variant={remaining > 0 ? "default" : "destructive"}>
                        {remaining}/{p.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>{purchased}</TableCell>
                    <TableCell>
                      <Badge variant={isAvailable ? "default" : "secondary"}>
                        {isAvailable ? "Disponível" : "Indisponível"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openConfirm(p.id, `Remover produto "${p.name}"?`, 'Esta ação não pode ser desfeita.')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Caneca Game Day"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva o produto..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Preço (GameCoins)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={form.priceInGameCoins}
                    onChange={(e) => setForm({ ...form, priceInGameCoins: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campanha</Label>
                <Select 
                  value={form.campaignId.toString()} 
                  onValueChange={(v) => setForm({ ...form, campaignId: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="availableFrom">Disponível a partir de</Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    value={form.availableFrom}
                    onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="availableUntil">Disponível até</Label>
                  <Input
                    id="availableUntil"
                    type="date"
                    value={form.availableUntil}
                    onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={save}>{editing ? "Atualizar" : "Criar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmData?.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmData?.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Store;
