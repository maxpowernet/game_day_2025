# Game Day 2025 - Documentação Completa

> Sistema de gamificação educacional para gerenciamento de campanhas, perguntas diárias e loja de recompensas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Modelo de Dados](#modelo-de-dados)
- [Funcionalidades](#funcionalidades)
- [Fluxo do Jogo](#fluxo-do-jogo)
- [Schemas de Tabelas](#schemas-de-tabelas)
- [API Reference](#api-reference)
- [Instalação e Configuração](#instalação-e-configuração)
- [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

**Game Day 2025** é uma plataforma de gamificação educacional que permite:

- **Campanhas**: Criar e gerenciar campanhas com datas de início e fim
- **Jogadores**: Cadastrar jogadores e vinculá-los a campanhas
- **Perguntas Diárias**: Lançar perguntas com horários específicos e pontuação diferenciada
- **Sistema de Pontos**: Acumular pontos e GameCoins baseados em respostas corretas e pontualidade
- **Loja Virtual**: Trocar GameCoins por produtos/recompensas
- **Dashboard**: Visualizar estatísticas e progresso em tempo real

### ✨ Características Principais

- ✅ Relacionamento direto **Campaign ↔ Players** (sem times/equipes)
- ✅ Perguntas com **janelas de tempo** (horário de abertura e deadline)
- ✅ **Perguntas especiais** com pontuação máxima em janela curta
- ✅ Sistema de **pontuação automática** (on-time vs late)
- ✅ **GameCoins** acumulados (1 ponto = 1 GameCoin)
- ✅ Loja com **disponibilidade por data** e **estoque limitado**
- ✅ **Scoreboard** por campanha
- ✅ **RLS (Row Level Security)** para controle de acesso

---

## 🗂️ Modelo de Dados

### Arquitetura Simplificada

```
┌─────────────┐
│  Campaigns  │
└──────┬──────┘
       │
       │ (Many-to-Many via campaign_players)
       │
       ▼
┌─────────────┐         ┌──────────────┐
│   Players   │◄────────┤   Questions  │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌──────────────┐
│   Answers   │         │   Products   │
└─────────────┘         └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Purchases   │
                        └──────────────┘
```

### Relacionamentos

1. **Campaign ↔ Players**: Relação N:N via `campaign_players`
2. **Campaign → Questions**: 1:N (uma campanha tem várias perguntas)
3. **Campaign → Products**: 1:N (produtos vinculados a campanhas)
4. **Player → Answers**: 1:N (um jogador responde várias perguntas)
5. **Player → Purchases**: 1:N (um jogador faz várias compras)
6. **Question → Answers**: 1:N (uma pergunta recebe várias respostas)
7. **Product → Purchases**: 1:N (um produto é comprado várias vezes)

---

## 🚀 Funcionalidades

### 1. **Gestão de Campanhas**

- Criar campanhas com nome, data de início/fim e status
- Status: `planned`, `in-progress`, `completed`
- Vincular jogadores à campanha via interface de seleção
- Visualizar progresso e estatísticas

**Interface**: `src/pages/Campaigns.tsx`

### 2. **Cadastro de Jogadores**

- Pré-cadastro de jogadores com nome, role, task, status
- Vinculação automática de `auth_uid` (Supabase Auth)
- Pontuação total e GameCoins acumulados
- Scores por campanha (via `player_campaign_scores`)

**Interface**: `src/pages/Players.tsx`

### 3. **Perguntas Diárias**

#### Tipos de Perguntas

**Perguntas Normais**:
- `schedule_time`: Horário de abertura (ex: 08:00)
- `deadline_time`: Horário limite (ex: 18:00)
- `points_on_time`: Pontos se respondida no horário
- `points_late`: Pontos se respondida após deadline

**Perguntas Especiais**:
- `is_special`: true
- `special_start_at`: Data/hora de início da janela especial
- `special_window_minutes`: Duração da janela (padrão: 1 minuto)
- Pontuação máxima dentro da janela, pontuação reduzida após

#### Características

- Múltipla escolha (array de choices)
- Índice de resposta correta (0-based)
- Status: `todo`, `in-progress`, `completed`
- Prioridade: `low`, `medium`, `high`
- `day_index`: Índice do dia na campanha (auto-atribuído)

**Interface**: `src/pages/Questions.tsx`

### 4. **Sistema de Respostas**

- Jogador seleciona uma resposta
- Sistema calcula automaticamente:
  - Se a resposta está correta
  - Se foi respondida no prazo
  - Quantos pontos foram ganhos
- **Regra**: 1 jogador só pode responder 1 vez cada pergunta
- Atualiza automaticamente:
  - `players.score` (total geral)
  - `players.game_coins` (1:1 com pontos)
  - `player_campaign_scores` (pontos por campanha)

**RPC Function**: `submit_answer()` em SQL.sql

### 5. **Loja Virtual (Lojinha)**

- Produtos com nome, descrição, imagem, preço em GameCoins
- Disponibilidade por data (`available_from`, `available_until`)
- Controle de estoque (`quantity`)
- Compra deduz GameCoins e reduz estoque
- Histórico de compras

**Interface**: `src/pages/Store.tsx`  
**RPC Function**: `purchase_product()` em SQL.sql

### 6. **Dashboard (Painel)**

Estatísticas em tempo real:
- Campanhas ativas
- Perguntas pendentes
- Total de jogadores

Cards visuais com ícones e cores

**Interface**: `src/pages/GameDay.tsx`

### 7. **Autenticação e Permissões**

- Login via Supabase Auth
- RLS (Row Level Security):
  - Admins: Acesso total
  - Players: Acesso apenas aos próprios dados (via `auth_uid`)
- Políticas detalhadas por tabela

**Auth Provider**: `src/lib/auth.tsx`

---

## 📊 Schemas de Tabelas

### 🏆 `campaigns`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `name` | TEXT NOT NULL | Nome da campanha |
| `status` | TEXT NOT NULL | `planned`, `in-progress`, `completed` |
| `start_date` | DATE NOT NULL | Data de início |
| `end_date` | DATE NOT NULL | Data de término |
| `icon` | TEXT | Emoji/ícone (opcional) |
| `created_at` | TIMESTAMP | Data de criação |

**Índices**: `idx_campaigns_status`

---

### 👥 `players`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `name` | TEXT NOT NULL | Nome do jogador |
| `role` | TEXT | Função/papel (opcional) |
| `task` | TEXT | Tarefa atribuída (opcional) |
| `status` | TEXT | Status do jogador |
| `score` | BIGINT DEFAULT 0 | Pontuação total (todas campanhas) |
| `game_coins` | BIGINT DEFAULT 0 | GameCoins acumulados |
| `auth_uid` | TEXT | UUID do Supabase Auth |

**RLS**: Admins veem tudo, players veem apenas próprio registro

---

### 🔗 `campaign_players`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `campaign_id` | INTEGER NOT NULL FK | ID da campanha |
| `player_id` | INTEGER NOT NULL FK | ID do jogador |
| `enrolled_at` | TIMESTAMP | Data de inscrição |

**PK**: `(campaign_id, player_id)`  
**Índices**: `idx_campaign_players_player`

---

### ❓ `questions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `campaign_id` | INTEGER NOT NULL FK | Campanha vinculada |
| `day_index` | INTEGER DEFAULT 0 | Dia da campanha (0-based) |
| `text` | TEXT NOT NULL | Texto da pergunta |
| `choices` | JSONB NOT NULL | Array de alternativas |
| `answer` | INTEGER NOT NULL | Índice da resposta correta |
| `status` | TEXT NOT NULL | `todo`, `in-progress`, `completed` |
| `priority` | TEXT | `low`, `medium`, `high` |
| `points_on_time` | INTEGER DEFAULT 0 | Pontos se no prazo |
| `points_late` | INTEGER DEFAULT 0 | Pontos se atrasado |
| `schedule_time` | TIME | Horário de abertura (ex: 08:00) |
| `deadline_time` | TIME | Horário limite (ex: 18:00) |
| `is_special` | BOOLEAN DEFAULT false | Pergunta especial? |
| `special_start_at` | TIMESTAMP | Início da janela especial |
| `special_window_minutes` | INTEGER | Duração da janela (minutos) |
| `created_at` | TIMESTAMP | Data de criação |

**Índices**: 
- `idx_questions_campaign`
- `idx_questions_day_index`
- `idx_questions_special_start`

---

### 💬 `answers`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `player_id` | INTEGER NOT NULL FK | Jogador que respondeu |
| `question_id` | INTEGER NOT NULL FK | Pergunta respondida |
| `campaign_id` | INTEGER NOT NULL FK | Campanha vinculada |
| `answered_at` | TIMESTAMP | Data/hora da resposta |
| `selected_answer` | INTEGER NOT NULL | Índice da alternativa escolhida |
| `points_earned` | INTEGER DEFAULT 0 | Pontos ganhos |
| `is_on_time` | BOOLEAN DEFAULT false | Respondeu no prazo? |
| `is_correct` | BOOLEAN | Resposta correta? |

**Constraint**: `UNIQUE (player_id, question_id)` (1 resposta por jogador/pergunta)  
**Índices**: `idx_answers_player`, `idx_answers_question`

---

### 🛒 `products`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `name` | TEXT NOT NULL | Nome do produto |
| `description` | TEXT | Descrição |
| `image_url` | TEXT | URL da imagem |
| `price_in_game_coins` | BIGINT DEFAULT 0 | Preço em GameCoins |
| `quantity` | INTEGER DEFAULT 0 | Estoque disponível |
| `campaign_id` | INTEGER FK | Campanha vinculada (opcional) |
| `available_from` | DATE | Data inicial de disponibilidade |
| `available_until` | DATE | Data final de disponibilidade |
| `created_at` | TIMESTAMP | Data de criação |

**Índices**: `idx_products_campaign`, `idx_products_availability`

---

### 🛍️ `purchases`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `player_id` | INTEGER NOT NULL FK | Jogador que comprou |
| `product_id` | INTEGER NOT NULL FK | Produto comprado |
| `campaign_id` | INTEGER NOT NULL FK | Campanha vinculada |
| `purchased_at` | TIMESTAMP | Data/hora da compra |
| `price_in_game_coins` | BIGINT | Preço pago (snapshot) |

**Índices**: `idx_purchases_player`, `idx_purchases_product`

---

### 📈 `player_campaign_scores`

Tabela auxiliar para armazenar pontuação por jogador/campanha.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `player_id` | INTEGER NOT NULL FK | ID do jogador |
| `campaign_id` | INTEGER NOT NULL FK | ID da campanha |
| `score` | BIGINT DEFAULT 0 | Pontos nesta campanha |

**PK**: `(player_id, campaign_id)`

---

### 👮 `admins`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | SERIAL PRIMARY KEY | ID único |
| `name` | TEXT NOT NULL | Nome do admin |
| `email` | TEXT UNIQUE NOT NULL | Email do admin |
| `auth_uid` | TEXT | UUID do Supabase Auth |
| `created_at` | TIMESTAMP | Data de criação |

---

## 📡 API Reference

### Interfaces TypeScript

```typescript
// src/lib/storageApi.ts

export interface Player {
  id: number;
  name: string;
  role?: string;
  task?: string;
  status?: string;
  score: number; // total across all campaigns
  gameCoins?: number; // coins earned (1 point = 1 gamecoin)
  campaignScores?: { [campaignId: number]: number }; // points per campaign
  authUid?: string;
}

export interface Campaign {
  id: number;
  name: string;
  status: 'planned' | 'in-progress' | 'completed';
  startDate: string; // ISO date
  endDate: string; // ISO date
  icon?: string;
  playerIds: number[]; // players enrolled
  questionIds?: number[]; // associated questions
  createdAt: string;
}

export interface Question {
  id: number;
  campaignId: number;
  dayIndex: number;
  text: string;
  choices: string[];
  answer: number; // correct choice index
  status: 'todo' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  pointsOnTime: number;
  pointsLate: number;
  scheduleTime?: string; // "08:00"
  deadlineTime?: string; // "18:00"
  isSpecial?: boolean;
  specialStartAt?: string; // ISO datetime
  specialWindowMinutes?: number;
}

export interface Answer {
  id: number;
  playerId: number;
  questionId: number;
  campaignId: number;
  answeredAt: string;
  selectedAnswer: number;
  pointsEarned: number;
  isOnTime: boolean;
  isCorrect?: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  priceInGameCoins: number;
  quantity: number;
  campaignId: number;
  availableFrom: string; // ISO date
  availableUntil: string; // ISO date
  createdAt: string;
}

export interface Purchase {
  id: number;
  playerId: number;
  productId: number;
  campaignId: number;
  purchasedAt: string;
  priceInGameCoins: number;
}
```

### Funções CRUD

#### Players

```typescript
fetchPlayers(): Promise<Player[]>
addPlayer(p: Omit<Player, 'id'>): Promise<Player>
updatePlayer(updated: Player): Promise<Player>
deletePlayer(id: number): Promise<void>
```

#### Campaigns

```typescript
fetchCampaigns(): Promise<Campaign[]>
addCampaign(c: Omit<Campaign, 'id'>): Promise<Campaign>
updateCampaign(updated: Campaign): Promise<Campaign>
deleteCampaign(id: number): Promise<void>
```

#### Questions

```typescript
fetchQuestions(): Promise<Question[]>
addQuestion(q: Omit<Question, 'id'>): Promise<Question>
updateQuestion(updated: Question): Promise<Question>
deleteQuestion(id: number): Promise<void>
```

#### Products

```typescript
fetchProducts(): Promise<Product[]>
addProduct(p: Omit<Product, 'id' | 'createdAt'>): Promise<Product>
updateProduct(updated: Product): Promise<Product>
deleteProduct(id: number): Promise<void>
```

#### Answers

```typescript
fetchAnswers(): Promise<Answer[]>
```

#### Purchases

```typescript
fetchPurchases(): Promise<Purchase[]>
```

---

## 🎮 Fluxo do Jogo

### 1️⃣ Preparação

1. **Admin cria uma Campanha**
   - Nome: "Campanha Educacional 2025"
   - Data: 01/12/2025 - 15/12/2025
   - Status: `planned`

2. **Admin cadastra Jogadores**
   - Nome, role, etc.
   - Opcionalmente já vincula à campanha

3. **Admin cria Perguntas**
   - Associa à campanha
   - Define horários e pontuação
   - Exemplo:
     - Pergunta 1: Abre 08:00, fecha 18:00, 10 pontos on-time, 5 late
     - Pergunta 2 (especial): Abre 14:00 exato, janela de 1 min, 50 pontos

4. **Admin configura Produtos na Loja**
   - Produto 1: "Adesivo" - 10 GameCoins
   - Produto 2: "Caneta" - 25 GameCoins
   - Disponibilidade: 01/12 - 15/12

### 2️⃣ Execução

1. **Campanha inicia** (status → `in-progress`)

2. **Jogadores recebem perguntas diárias**
   - Pergunta abre no `schedule_time`
   - Jogador responde via interface

3. **Sistema avalia automaticamente**
   - Chama RPC `submit_answer(player_id, question_id, campaign_id, selected_answer)`
   - Calcula pontos baseado em horário e correção
   - Atualiza `players.score`, `players.game_coins`, `player_campaign_scores`

4. **Jogadores acumulam GameCoins**
   - 1 ponto = 1 GameCoin

5. **Jogadores compram produtos**
   - Chama RPC `purchase_product(player_id, product_id, campaign_id)`
   - Deduz GameCoins
   - Reduz estoque

### 3️⃣ Finalização

1. **Campanha termina** (status → `completed`)

2. **Admin visualiza Scoreboard**
   - Ranking por pontos
   - Filtrado por campanha

3. **Análise de resultados**
   - Dashboard com estatísticas
   - Respostas corretas/incorretas
   - Produtos mais vendidos

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL (via Supabase)
- Conta no Supabase

### 1. Clone o repositório

```bash
git clone https://github.com/maxpowernet/game_day_2025.git
cd game_day_2025
```

### 2. Instale dependências

```bash
npm install
```

### 3. Configure variáveis de ambiente

Crie um arquivo `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Service Role Key (para scripts admin)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

**Como obter as chaves:**
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRETO!)

### 4. Execute o schema SQL

No Supabase Dashboard > SQL Editor, execute:

```bash
# Conteúdo do arquivo SQL.sql
```

Ou via terminal:

```bash
psql -h seu-host.supabase.co -U postgres -d postgres -f SQL.sql
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:8080` (ou porta indicada)

### 6. (Opcional) Execute migration para remover Teams

Se houver dados legados de teams:

```bash
node scripts/apply_migration_remove_teams.cjs
```

Ou execute manualmente no SQL Editor:

```sql
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
ALTER TABLE players DROP COLUMN IF EXISTS team_id;
```

---

## 💡 Exemplos de Uso

### Criar uma Campanha

```typescript
import { addCampaign } from '@/lib/storageApi';

const novaCampanha = await addCampaign({
  name: "Desafio de Matemática",
  status: "planned",
  startDate: "2025-12-01",
  endDate: "2025-12-15",
  icon: "🧮",
  playerIds: [1, 2, 3], // IDs dos jogadores
  questionIds: [],
  createdAt: new Date().toISOString()
});
```

### Adicionar uma Pergunta

```typescript
import { addQuestion } from '@/lib/storageApi';

const pergunta = await addQuestion({
  campaignId: 1,
  dayIndex: 0,
  text: "Quanto é 2 + 2?",
  choices: ["3", "4", "5", "6"],
  answer: 1, // índice da resposta correta ("4")
  status: "todo",
  priority: "medium",
  pointsOnTime: 10,
  pointsLate: 5,
  scheduleTime: "08:00",
  deadlineTime: "18:00",
  isSpecial: false
});
```

### Criar Pergunta Especial

```typescript
const perguntaEspecial = await addQuestion({
  campaignId: 1,
  dayIndex: 1,
  text: "PERGUNTA RELÂMPAGO: Capital do Brasil?",
  choices: ["Rio de Janeiro", "Brasília", "São Paulo"],
  answer: 1,
  status: "todo",
  pointsOnTime: 50,
  pointsLate: 10,
  isSpecial: true,
  specialStartAt: "2025-12-02T14:00:00Z",
  specialWindowMinutes: 1 // 1 minuto para responder com pontuação máxima
});
```

### Responder uma Pergunta (via RPC)

No backend (Supabase RPC):

```sql
SELECT * FROM submit_answer(
  p_player_id := 1,
  p_question_id := 5,
  p_campaign_id := 1,
  p_selected_answer := 2
);
```

Retorna:

```json
{
  "answer_id": 123,
  "points_earned": 10,
  "is_correct": true,
  "is_on_time": true,
  "new_total_score": 50,
  "new_game_coins": 50
}
```

### Comprar um Produto (via RPC)

```sql
SELECT * FROM purchase_product(
  p_player_id := 1,
  p_product_id := 3,
  p_campaign_id := 1
);
```

Retorna:

```json
{
  "purchase_id": 45,
  "remaining_coins": 25,
  "remaining_stock": 9
}
```

### Vincular Jogador a Campanha

```typescript
import { supabase } from '@/lib/supabaseClient';

await supabase.from('campaign_players').insert({
  campaign_id: 1,
  player_id: 5
});
```

### Buscar Scoreboard de uma Campanha

```typescript
import { supabase } from '@/lib/supabaseClient';

const { data } = await supabase
  .from('player_campaign_scores')
  .select('player_id, score, players(name)')
  .eq('campaign_id', 1)
  .order('score', { ascending: false });

// Resultado:
// [
//   { player_id: 3, score: 150, players: { name: "João" } },
//   { player_id: 1, score: 120, players: { name: "Maria" } },
//   ...
// ]
```

---

## 🔐 Segurança e RLS

### Políticas Implementadas

#### Players
- **Admins**: Acesso total (CRUD)
- **Players**: Acesso apenas ao próprio registro (via `auth_uid`)

#### Campaigns, Questions, Products
- **Admins**: Acesso total
- **Players**: Apenas leitura (SELECT)

#### Answers, Purchases
- **Admins**: Acesso total
- **Players**: Podem inserir (com validação), ver apenas próprios registros

#### Admins
- **Admins**: Leitura de todos
- **Self**: Pode atualizar próprio registro

### Funções RPC com Segurança

- `submit_answer()`: Valida duplicatas, calcula pontos, atualiza scores
- `purchase_product()`: Valida saldo, estoque, disponibilidade

---

## 📦 Estrutura de Arquivos

```
game_day_2025/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn/ui
│   │   ├── Sidebar.tsx
│   │   ├── UserProfile.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/
│   │   ├── use-invalidate-related.ts
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── auth.tsx         # AuthProvider
│   │   ├── supabaseClient.ts
│   │   ├── storageApi.ts    # CRUD functions
│   │   └── utils.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── GameDay.tsx      # Dashboard
│   │   ├── Campaigns.tsx
│   │   ├── Players.tsx
│   │   ├── Questions.tsx
│   │   ├── Store.tsx        # Lojinha
│   │   ├── Calendar.tsx
│   │   ├── Settings.tsx
│   │   └── AcceptInvite.tsx
│   ├── App.tsx              # Router
│   └── main.tsx
├── scripts/
│   ├── create_admin_user.cjs
│   ├── reset_user_password.cjs
│   ├── apply_migration_remove_teams.cjs
│   └── migration_remove_teams.sql
├── SQL.sql                  # Schema completo
├── supabase_rls_and_seed.sql
├── .env                     # Variáveis de ambiente
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README2.md               # Este arquivo
```

---

## 🛠️ Scripts Úteis

### Desenvolvimento

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Lint do código
npm test             # Executa testes
```

### Administração

```bash
# Criar usuário admin
node scripts/create_admin_user.cjs

# Resetar senha de usuário
node scripts/reset_user_password.cjs

# Aplicar migration (remover teams)
node scripts/apply_migration_remove_teams.cjs
```

---

## 📞 Suporte e Contribuição

### Problemas Comuns

**Erro: "Failed to fetch"**
- Verifique conectividade com Supabase
- Confirme URL e keys no `.env`
- Teste DNS: `nslookup seu-projeto.supabase.co`

**Erro: "SUPABASE_SERVICE_ROLE_KEY is required"**
- Configure a service role key no `.env`
- Obtenha em Settings > API no Supabase Dashboard

**Erro de RLS: "new row violates row-level security policy"**
- Verifique se está autenticado
- Confirme que `auth_uid` está correto
- Revise políticas RLS no SQL Editor

### Contato

- **Repositório**: [github.com/maxpowernet/game_day_2025](https://github.com/maxpowernet/game_day_2025)
- **Issues**: [github.com/maxpowernet/game_day_2025/issues](https://github.com/maxpowernet/game_day_2025/issues)

---

## 📝 Changelog

### v2.0.0 (2025-11-30)

**Mudanças Estruturais:**
- ❌ Removido sistema de Teams/Equipes
- ✅ Relacionamento direto Campaign ↔ Players via `campaign_players`
- ✅ Simplificação do modelo de dados
- ✅ Remoção de tabelas `teams` e `team_members`
- ✅ Remoção de coluna `players.team_id`

**Frontend:**
- Removida página `/teams`
- Removido link "Equipes" do Sidebar
- Atualizada interface de Campanhas
- Atualizado Dashboard (sem stat "Total de Equipes")

**Backend:**
- Removidas funções: `fetchTeams`, `addTeam`, `updateTeam`, `deleteTeam`
- Removida interface TypeScript `Team`
- Atualizadas políticas RLS
- Migration SQL criada

**Documentação:**
- Criado README2.md completo
- Schemas atualizados
- Exemplos de uso
- Guia de instalação

---

## 📄 Licença

Este projeto é de propriedade de **Max Eldon** e destinado para fins educacionais.

---

**Game Day 2025** - Transformando aprendizado em diversão! 🎮🎓
