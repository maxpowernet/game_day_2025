# Game Day — Funcionalidades

## Visão Geral
- **Descrição:** Dashboard de gestão para a criação, agendamento e acompanhamento de campanhas gamificadas de perguntas e respostas (`Quiz`).
- **Objetivo:** Planejar, associar equipes e questões, e monitorar o desempenho dos jogadores (`Game Coins` e pontuações) de forma simples e visual.

## Navegação
- **Menu lateral:** Acesso rápido a Painel, **Campanhas**, Tarefas (Questionários), Calendário e Equipe (Jogadores).
- **Rota principal:** `/game-day` (painel principal).

## Autenticação
- **Login/Cadastro:** Formulários de entrada e criação de conta (simulados).
- **Sessão:** Exibe usuário e e-mail no cabeçalho.

## Gestão de Projetos (Listagem Rápida)
- **Criar/Editar Projetos:** Adicionar nova campanha com nome, data início, data término e ícone (detalhamento feito na seção 'Campanhas').
- **Listagem:** Visualizar campanhas com status e data de entrega.

## Campanhas (Central de Gestão)
- **CRUD de Campanhas:** Criar, editar, concluir e remover campanhas.
- **Associação de Elementos:** **Associação obrigatória** de:
    - **Perguntas:** Seleção das Tarefas (Questionários) que farão parte da campanha.
    - **Equipes:** Associação das equipes pré-cadastradas que participarão da campanha.
    - **Período:** Definição da data de início e fim que será marcada no Calendário.
- **Regra de Acesso:** A equipe só terá acesso à campanha se o cadastro de todos os membros estiver concluído **até o dia anterior ao início do evento**.
- **Filtros:** Filtro por status (todo, in-progress, completed) e prioridade.

## Tarefas (Questionários)
- **CRUD de Questionários:** Criar, editar, e remover tarefas, que são as perguntas do jogo.
- **Estrutura da Pergunta:** Cada tarefa é uma pergunta com **4 alternativas**, sendo **uma única correta**.
- **Importação:** Opção para **importar perguntas e alternativas** em massa através de um arquivo (ex.: Word, CSV ou JSON).
- **Pontuação e Prazos:** Associação da pontuação para cada pergunta, definindo:
    - **Pontuação Máxima:** Ganhos por resposta correta **no prazo**.
    - **Pontuação Reduzida:** Ganhos por resposta correta **fora do prazo**.
- **Regra de Exibição:** A quantidade de perguntas liberadas por dia será igual à quantidade de dias da campanha (ex: Campanha de 10 dias = 10 dias de perguntas). É possível **cadastrar mais de uma pergunta para o mesmo dia**.
- **Filtros:** Filtro por status (todo, in-progress, completed) e prioridade.
- **Atribuição:** Atribuir questionários a campanhas e, consequentemente, às equipes associadas.

## Calendário
- **Eventos:** Adicionar eventos por dia com cor e ícone.
- **Período da Campanha:** **Lista as campanhas cadastradas por dia**, destacando o período de início e fim com cores e ícones específicos.
- **Navegação mensal:** Avançar/voltar por mês.

## Equipe (Jogadores)
- **Gestão de Equipes:** Criação e gerenciamento de equipes pré-cadastradas (para futura associação nas campanhas).
- **Gestão de Membros:** Adicionar/remover membros e papéis.
- **Colaboração:** Ver tarefas atribuídas e status por membro.
- **Associar:** Associar equipes nas Campanhas.
- **Game Coins:** Associar membro com resultados das pontuações (visão consolidada de ganhos).

## Estatísticas
- **Cards de estatísticas:** Totais de campanhas ativas, questionários pendentes, total de jogadores e total de equipes.
- **Gráficos simples:** Visualização de atividade (respostas submetidas) por dia.

## Rastreador de Tempo
- **Iniciar/Pausar/Parar:** Timer para rastrear tempo de trabalho por sessão.
- **Resumo:** Exibe tempo formatado (HH:MM:SS).

## Notificações
- **Ícones de notificação:** Acesso a mensagens e alertas no cabeçalho (ex.: novos cadastros, término de campanha).
- **Badge:** Indicadores de contagem (ex.: tarefas pendentes de agendamento).

## Busca
- **Barra de busca:** Pesquisa rápida por tarefas/eventos/campanhas (ícone de busca no cabeçalho).

## Importar/Exportar
- **Importar dados:** Opção para importar dados (CSV/JSON/DOCX adaptado) — placeholder.
- **Exportar Relatórios:** Opção para exportar resultados de campanhas.

## Configurações
- **Preferências:** Tema, idioma e ajustes de conta (simples placeholder).

## Integrações
- **APIs:** Preparado para integrar com serviços externos (ex.: autenticação, armazenamento de arquivos de importação).

## Tecnologias Principais
- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS, shadcn-ui, lucide-react
- **Gestão de estado/requests:** React Query

## Scripts úteis
- `npm i` — instalar dependências
- `npm run dev` — rodar aplicação em desenvolvimento
- `npm run build` — gerar build de produção

## Como contribuir
- Fork, criar branch com mudanças, abrir PR com descrição curta.

## Licença
- Inserir licença do projeto conforme necessidade (ex.: MIT).