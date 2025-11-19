# Game Day — Documentação Completa

Este documento reúne a especificação funcional, instruções de desenvolvimento, arquitetura e regras do jogo para o projeto Game Day (aplicação de administração). Ele destina-se a desenvolvedores e administradores do sistema.

## Sumário
- Visão geral
- Arquitetura e separação (Admin x Player)
- Recursos e fluxos
- Modelos de dados principais
- Regras de pontuação e jogo
- Loja (Lojinha)
- Persistência e MCP/Postgres
- Execução local (dev, build)
- Testes e validação
- Contribuição e continuidade

---

## Visão geral

- Objetivo: fornecer uma aplicação administrativa para criar, agendar e monitorar campanhas gamificadas compostas por perguntas diárias e eventos especiais. O frontend atual é a interface de administração; a experiência do jogador é prevista como uma aplicação separada que consome os mesmos modelos/serviços.
- Público-alvo desta aplicação: administradores (criação de campanhas, perguntas, produtos da lojinha, gestão de jogadores e equipes).

---

## Arquitetura e separação (Admin x Player)

- Este repositório implementa a parte administrativa.
- A interação de jogadores (responder perguntas, comprar na lojinha) foi inicialmente prototipada aqui, mas foi removida para ser extraída como uma aplicação distinta (frontend leve ou PWA). Mantemos `src/lib/storageApi.ts` como biblioteca utilitária que pode ser extraída/reutilizada.
- Comunicação/integração com armazenamento persistente pode ser feita por um servidor PostgreSQL local (MCP server-postgres) para uso em desenvolvimento.

---

## Recursos e fluxos (Admin)

- Painel: visão geral com cards e estatísticas.
- Campanhas: CRUD completo (nome, datas, status, jogadores/teams associados).
- Perguntas (Tarefas): CRUD de perguntas, cada pergunta com 4 alternativas, uma correta; suporte a import CSV/JSON.
- Agendamento automático: perguntas recebem um `dayIndex` e são liberadas conforme a campanha (1 por dia por padrão; múltiplas perguntas por dia permitidas).
- Perguntas Especiais: marcação "estrela" com `specialStartAt` (data+hora) e janela curta (ex.: 1 minuto) para pontuação máxima.
- Lojinha (Store): CRUD de produtos, associação de produtos a campanhas, estoque, disponibilidade por datas.
- Admins & Settings: gerenciamento de administradores, mensagens/relatos e configurações gerais.

---

## Modelos de dados principais (resumo)

- Player
    - id, name, role?, teamId?, score (number), gameCoins (number), campaignScores (map)

- Team
    - id, campaignId, name, members: number[]

- Campaign
    - id, name, status ('planned'|'in-progress'|'completed'), startDate, endDate, playerIds, questionIds, teamIds

- Question
    - id, campaignId, dayIndex (0-based), text, choices[], answer (index), status, priority
    - pointsOnTime (number), pointsLate (number)
    - scheduleTime (e.g. '08:00'), deadlineTime (e.g. '18:00')
    - isSpecial? (boolean), specialStartAt? (ISO datetime), specialWindowMinutes? (number)

- Answer
    - id, playerId, questionId, campaignId, answeredAt, selectedAnswer, pointsEarned, isOnTime, isCorrect?

- Product
    - id, name, description, imageUrl, priceInGameCoins, quantity, campaignId, availableFrom, availableUntil

- Purchase
    - id, playerId, productId, campaignId, purchasedAt, priceInGameCoins

Observação: os modelos estão definidos e manipulados em `src/lib/storageApi.ts` (implementação por localStorage em dev). Para produção, converta essas operações para chamadas a um backend persistente (Postgres / API REST/GraphQL).

---

## Regras de jogo e pontuação (resumo completo)

1. Exibição de perguntas
     - Cada campanha tem perguntas indexadas por `dayIndex` (0 = primeiro dia).
     - A cada dia da campanha, a pergunta com `dayIndex === diaAtual` fica disponível para jogadores daquela campanha.
     - Se o jogador não respondeu a pergunta do dia anterior, ela permanece visível até ser respondida — sempre será apresentada a pergunta mais antiga não respondida com `dayIndex <= diaAtual`.
     - Perguntas especiais (`isSpecial`) têm `specialStartAt` (datetime). Quando `now >= specialStartAt` e `now <= specialStartAt + specialWindowMinutes`, a pergunta especial fica visível para todos (além da pergunta do dia regular).

2. Submissão de respostas (regra chave)
     - Cada jogador pode responder UMA ÚNICA vez por pergunta. Submissões duplicadas são rejeitadas.
     - A função utilitária `submitAnswer({ playerId, questionId, campaignId, selectedAnswer })` realiza validações, calcula pontuação e atualiza o estado do jogador.

3. Pontuação (valores aplicados automaticamente)
     - Perguntas comuns (não especiais):
         - Correta no prazo: valor configurado em `question.pointsOnTime` (sugerido 1000)
         - Correta fora do prazo: `question.pointsLate` (sugerido 500)
         - Incorreta no prazo: 300 pontos
         - Incorreta fora do prazo: 150 pontos

     - Perguntas especiais:
         - Correta na janela especial: valor configurado (sugestão 2000)
         - Correta fora da janela: `pointsLate` (sugestão 1000)
         - Incorreta na janela: 600 pontos
         - Incorreta fora da janela: 300 pontos

     - Observação: pontos ganhos (mesmo em caso de erro) são convertidos em `gameCoins` na razão 1 ponto = 1 gameCoin e somados ao `player.gameCoins` e `player.score`.

4. Perguntas especiais — janela curta
     - Ao marcar uma pergunta como especial, o admin define `specialStartAt` e `specialWindowMinutes` (default 1). Somente nessa janela curta os jogadores recebem a pontuação máxima por acerto.

---

## Lojinha (Store)

- Admin: cadastrar produtos (nome, descrição, imagem, preço em gameCoins, quantidade, campanha e datas de disponibilidade).
- Regras:
    - Produto associado a uma campanha e com período de disponibilidade (`availableFrom` / `availableUntil`).
    - Um jogador pode comprar no máximo 1 unidade do mesmo produto (por produto) — função `addPurchase` valida duplicatas.
    - A compra só é autorizada se o jogador tiver `gameCoins` suficientes; `gameCoins` são deduzidos automaticamente quando a compra é efetuada.

---

## Persistência e MCP / PostgreSQL (desenvolvimento)

- Em desenvolvimento o projeto usa `localStorage` via `src/lib/storageApi.ts` (para prototipagem rápida).
- Para persistência robusta, há suporte sugerido para PostgreSQL via o projeto MCP (Model Context Protocol) e `@modelcontextprotocol/server-postgres`.

Exemplo recomendado (modo dev) — rodar server-postgres via npx:

```powershell
npx -y @modelcontextprotocol/server-postgres "postgresql://postgres:root@localhost:5433/game-day"
```

- Alternativamente, o arquivo `.vscode/mcp.json` pode ser atualizado para iniciar um `toolbox`/MCP local, ou para usar a configuração `mcp.inputs/servers` com `npx` (ex.: solicitar `pg_url`).
- Ao migrar para Postgres/servidor real, converta as operações de `storageApi` para endpoints que leiam/gravam na base.

---

## Execução local

Instalação:

```bash
npm install
# ou bun install
```

Rodar em desenvolvimento:

```powershell
npm run dev
# abra http://localhost:5173 (ou porta informada pelo Vite)
```

Build de produção:

```bash
npm run build
```

---

## Testes e validação

- TypeScript: `npx tsc --noEmit` — garante tipagem correta.
- Testes unitários/integração: não incluídos neste repositório (adicionar Jest/Playwright conforme necessidade).

---

## Boas práticas para extrair a aplicação do jogador (Player App)

1. Copiar `src/lib/storageApi.ts` e os tipos relacionados para um novo repositório (ou transformar em pacote npm local/private).
2. Implementar a interface do jogador (`Play`) como PWA/SPA independente, com autenticação leve (cookie/token) e endpoint REST para gravação de respostas/purchases.
3. No player app, chamar `submitAnswer`/`addPurchase` expostos por um backend (ou adaptar `storageApi` para usar API calls em vez de localStorage).

---

## Como contribuir

1. Fork e branch com o prefixo `feature/` ou `fix/`.
2. Faça mudanças pequenas e testes locais.
3. Abra PR com descrição do que foi alterado e como testar.

---

## Checklist administrativo (operacional)

- [ ] Validar datas de campanha e fuso horário ao agendar perguntas.
- [ ] Definir valores padrão de pontos (padrão sugerido: comum 1000/500, especial 2000/1000) para consistência.
- [ ] Testar compra na lojinha com diferentes saldos de gameCoins.
- [ ] Preparar scripts de migração para persistência em Postgres.

---

## Licença

- Escolha uma licença (ex.: MIT) e adicione `LICENSE` na raiz.

---

Se quiser que eu gere um `README.md` de projeto na raiz (versão polida deste documento, com instruções de setup e exemplos de API), eu posso criar agora e incluir scripts de exemplo para iniciar o servidor Postgres via `npx` e um `Makefile`/`package.json` com comandos úteis.
# Game Day

## Project info

**URL**: https://lovable.dev/projects/34fe5e16-4a62-49c6-9944-80b4f4afd537

## How can I edit this code?

There are several ways of editing your application.

**Use o painel do Game Day**

Simplesmente visite o Game Day (link acima) e comece a editar.

As alterações feitas via o Game Day serão commitadas automaticamente neste repositório.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Local invite server (development)

O projeto inclui um servidor local de convites para desenvolvimento que cria usuários confirmados no Supabase e envia emails via SMTP.

**Início rápido:**

```powershell
# Executar o script helper (já configurado com suas credenciais)
.\scripts\start-invite-server.ps1
```

O servidor iniciará em `http://localhost:3002/send-invite` e:
- Criará usuários confirmados via Supabase Admin API (usando service role key)
- Upsertará a linha na tabela `admins` com o token de convite
- Enviará email via SMTP (Gmail) se as credenciais estiverem configuradas

**Configuração manual (opcional):**

Se preferir configurar manualmente ou usar outras credenciais, defina as variáveis de ambiente:

```powershell
$env:SUPABASE_URL='https://vhphsaodwurjnwrnxflm.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY='<sua-service-role-key>'
$env:SMTP_HOST='smtp.gmail.com'
$env:SMTP_PORT='587'
$env:SMTP_USER='seu-email@gmail.com'
$env:SMTP_PASS='sua-senha-ou-app-password'
$env:SMTP_FROM='Game Day <seu-email@gmail.com>'
$env:PORT='3002'
node server/send-invite-server.js
```

**Uso na interface:**

1. Inicie o servidor de convites (comando acima)
2. Inicie o frontend: `npm run dev`
3. Acesse `http://localhost:8080`
4. Vá para **Configurações → Administradores**
5. Preencha nome e email e clique em **Enviar Convite**
6. A UI tentará usar o servidor local (porta 3002):
   - ✅ Se SMTP configurado: email enviado + usuário criado
   - ⚠️ Se SMTP não configurado: apenas usuário criado (link copiável)
   - ❌ Se servidor offline: fallback para armazenamento local

**⚠️ Importante - Gmail:**

Gmail bloqueia login com usuário/senha simples. Para enviar emails via Gmail:
- Ative a verificação em duas etapas na sua Conta Google
- Gere uma **Senha de app** em: Conta Google → Segurança → Senhas de app
- Use a senha de app (16 caracteres) em `$env:SMTP_PASS`

**Alternativa recomendada (desenvolvimento):**

Use [Mailtrap](https://mailtrap.io/) (grátis) para testar envio de emails sem configurar Gmail:
```powershell
$env:SMTP_HOST='sandbox.smtp.mailtrap.io'
$env:SMTP_PORT='2525'
$env:SMTP_USER='<seu-mailtrap-user>'
$env:SMTP_PASS='<seu-mailtrap-pass>'
```

**Segurança:**

- O servidor local é **apenas para desenvolvimento**
- Não exponha a Service Role Key publicamente
- Não commite o script `start-invite-server.ps1` com credenciais reais (use `.env` ou variáveis locais)


**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Use your normal deployment flow or Game Day and click Share -> Publish.

## Can I connect a custom domain to my project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
