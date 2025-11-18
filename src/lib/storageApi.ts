export interface Player {
  id: number;
  name: string;
  role?: string;
  task?: string;
  status?: string;
  score: number; // total across all campaigns
  gameCoins?: number; // coins earned (1 point = 1 gamecoin)
  teamId?: number;
  campaignScores?: { [campaignId: number]: number }; // points per campaign
}

export interface Team {
  id: number;
  campaignId: number; // team belongs to a specific campaign
  name: string;
  members: number[]; // player IDs
  totalScore?: number; // calculated sum of member scores in this campaign
  createdAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  status: 'planned' | 'in-progress' | 'completed';
  startDate: string; // ISO date
  endDate: string; // ISO date
  icon?: string;
  playerIds: number[]; // players enrolled in this campaign
  questionIds?: number[]; // associated questions (optional, can be derived)
  teamIds?: number[]; // associated teams (optional, can be derived)
  createdAt: string;
}

export interface Question {
  id: number;
  campaignId: number; // question belongs to a campaign (required)
  dayIndex: number; // which day of campaign (0-based, auto-assigned)
  text: string;
  choices: string[];
  answer: number;
  status: 'todo' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  pointsOnTime: number; // points if answered on time (08h-18h)
  pointsLate: number; // points if answered late
  scheduleTime?: string; // "08:00" opening time (Brasilia)
  deadlineTime?: string; // "18:00" closing time (Brasilia)
  isSpecial?: boolean; // special question (starred)
  specialStartAt?: string; // ISO datetime when special starts (max points window)
  specialWindowMinutes?: number; // duration in minutes for special max window (default 1)
}

export interface Answer {
  id: number;
  playerId: number;
  questionId: number;
  campaignId: number;
  answeredAt: string; // ISO timestamp
  selectedAnswer: number;
  pointsEarned: number; // calculated based on time
  isOnTime: boolean; // true if answered within schedule
  isCorrect?: boolean; // whether the selected answer was correct
}

export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  priceInGameCoins: number;
  quantity: number; // available stock
  campaignId: number;
  availableFrom: string; // ISO date when product becomes visible
  availableUntil: string; // ISO date when product is no longer available
  createdAt: string;
}

export interface Purchase {
  id: number;
  playerId: number;
  productId: number;
  campaignId: number;
  purchasedAt: string; // ISO timestamp
  priceInGameCoins: number; // price paid at purchase time
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch (e) {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

// Players
export async function fetchPlayers(): Promise<Player[]> {
  return Promise.resolve(read<Player[]>('gd_players', []));
}

export async function setPlayers(players: Player[]): Promise<Player[]> {
  write('gd_players', players);
  return Promise.resolve(players);
}

export async function addPlayer(p: Omit<Player, 'id'>): Promise<Player> {
  const list = read<Player[]>('gd_players', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next: Player = { id, ...p } as Player;
  list.push(next);
  write('gd_players', list);
  return Promise.resolve(next);
}

export async function updatePlayer(updated: Player): Promise<Player> {
  const list = read<Player[]>('gd_players', []);
  const next = list.map(p => p.id === updated.id ? updated : p);
  write('gd_players', next);
  return Promise.resolve(updated);
}

export async function deletePlayer(id: number): Promise<void> {
  const list = read<Player[]>('gd_players', []);
  const next = list.filter(p => p.id !== id);
  write('gd_players', next);
  return Promise.resolve();
}

// Campaigns
export async function fetchCampaigns(): Promise<Campaign[]> {
  return Promise.resolve(read<Campaign[]>('gd_campaigns', []));
}

export async function setCampaigns(campaigns: Campaign[]): Promise<Campaign[]> {
  write('gd_campaigns', campaigns);
  return Promise.resolve(campaigns);
}

export async function addCampaign(c: Omit<Campaign, 'id'>): Promise<Campaign> {
  const list = read<Campaign[]>('gd_campaigns', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next = { id, ...c } as Campaign;
  list.push(next);
  write('gd_campaigns', list);
  return Promise.resolve(next);
}

// Questions
export async function fetchQuestions(): Promise<Question[]> {
  return Promise.resolve(read<Question[]>('gd_questions', []));
}

export async function setQuestions(questions: Question[]): Promise<Question[]> {
  write('gd_questions', questions);
  return Promise.resolve(questions);
}

export async function addQuestion(q: Omit<Question, 'id'>): Promise<Question> {
  const list = read<Question[]>('gd_questions', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next = { id, ...q } as Question;
  list.push(next);
  write('gd_questions', list);
  return Promise.resolve(next);
}

export async function updateQuestion(updated: Question): Promise<Question> {
  const list = read<Question[]>('gd_questions', []);
  const next = list.map(q => q.id === updated.id ? updated : q);
  write('gd_questions', next);
  return Promise.resolve(updated);
}

export async function deleteQuestion(id: number): Promise<void> {
  const list = read<Question[]>('gd_questions', []);
  const next = list.filter(q => q.id !== id);
  write('gd_questions', next);
  return Promise.resolve();
}

// Teams
export async function fetchTeams(): Promise<Team[]> {
  return Promise.resolve(read<Team[]>('gd_teams', []));
}

export async function setTeams(teams: Team[]): Promise<Team[]> {
  write('gd_teams', teams);
  return Promise.resolve(teams);
}

export async function addTeam(t: Omit<Team, 'id'>): Promise<Team> {
  const list = read<Team[]>('gd_teams', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next: Team = { id, ...t } as Team;
  list.push(next);
  write('gd_teams', list);
  return Promise.resolve(next);
}

export async function updateTeam(updated: Team): Promise<Team> {
  const list = read<Team[]>('gd_teams', []);
  const next = list.map(t => t.id === updated.id ? updated : t);
  write('gd_teams', next);
  return Promise.resolve(updated);
}

export async function deleteTeam(id: number): Promise<void> {
  const list = read<Team[]>('gd_teams', []);
  const next = list.filter(t => t.id !== id);
  write('gd_teams', next);
  return Promise.resolve();
}

// Enhanced Campaigns
export async function updateCampaign(updated: Campaign): Promise<Campaign> {
  const list = read<Campaign[]>('gd_campaigns', []);
  const next = list.map(c => c.id === updated.id ? updated : c);
  write('gd_campaigns', next);
  return Promise.resolve(updated);
}

export async function deleteCampaign(id: number): Promise<void> {
  const list = read<Campaign[]>('gd_campaigns', []);
  const next = list.filter(c => c.id !== id);
  write('gd_campaigns', next);
  return Promise.resolve();
}

// Answers
export async function fetchAnswers(): Promise<Answer[]> {
  return Promise.resolve(read<Answer[]>('gd_answers', []));
}

export async function addAnswer(a: Omit<Answer, 'id'>): Promise<Answer> {
  const list = read<Answer[]>('gd_answers', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next: Answer = { id, ...a } as Answer;
  list.push(next);
  write('gd_answers', list);
  return Promise.resolve(next);
}

// Add answer with validation: only one answer per player per question, compute points
export async function submitAnswer(a: Omit<Answer, 'id' | 'answeredAt' | 'pointsEarned' | 'isOnTime'>): Promise<Answer> {
  const allAnswers = read<Answer[]>('gd_answers', []);
  // prevent duplicate answer by same player for same question
  const already = allAnswers.find(x => x.playerId === a.playerId && x.questionId === a.questionId);
  if (already) return Promise.reject(new Error('Player has already answered this question'));

  // fetch question
  const questions = read<Question[]>('gd_questions', []);
  const question = questions.find(q => q.id === a.questionId);
  if (!question) return Promise.reject(new Error('Question not found'));

  const now = new Date();
  const answeredAt = now.toISOString();

  // compute onTime for special questions
  let isOnTime = false;
  let points = 0;

  if (question.isSpecial && question.specialStartAt) {
    const start = new Date(question.specialStartAt);
    const windowMin = question.specialWindowMinutes ?? 1;
    const end = new Date(start.getTime() + windowMin * 60 * 1000);
    if (now >= start && now <= end) {
      isOnTime = true;
    } else {
      isOnTime = false;
    }
  } else {
    // regular question: determine the date for this question based on campaign start + dayIndex
    const campaigns = read<Campaign[]>('gd_campaigns', []);
    const campaign = campaigns.find(c => c.id === question.campaignId);
    if (!campaign) return Promise.reject(new Error('Campaign not found'));
    const campaignStart = new Date(campaign.startDate);
    const questionDate = new Date(campaignStart.getTime() + question.dayIndex * 24 * 60 * 60 * 1000);

    // build opening and closing datetimes using scheduleTime and deadlineTime
    const scheduleParts = (question.scheduleTime || '08:00').split(':').map(Number);
    const deadlineParts = (question.deadlineTime || '18:00').split(':').map(Number);
    const openAt = new Date(questionDate);
    openAt.setHours(scheduleParts[0] ?? 8, scheduleParts[1] ?? 0, 0, 0);
    const closeAt = new Date(questionDate);
    closeAt.setHours(deadlineParts[0] ?? 18, deadlineParts[1] ?? 0, 0, 0);

    if (now >= openAt && now <= closeAt) {
      isOnTime = true;
    } else {
      isOnTime = false;
    }
  }

  // determine correctness and points (wrong answers also receive points according to rules)
  const isCorrect = a.selectedAnswer === question.answer;
  if (isCorrect) {
    // correct points come from question's configured values
    points = isOnTime ? (question.pointsOnTime ?? 0) : (question.pointsLate ?? 0);
  } else {
    // wrong answer points per your rules
    if (question.isSpecial) {
      points = isOnTime ? 600 : 300;
    } else {
      points = isOnTime ? 300 : 150;
    }
  }

  // persist answer
  const id = Math.max(0, ...allAnswers.map(x => x.id)) + 1;
  const next: Answer = { id, ...a, answeredAt, pointsEarned: points, isOnTime, isCorrect } as Answer;
  allAnswers.push(next);
  write('gd_answers', allAnswers);

  // update player's score and gameCoins
  const players = read<Player[]>('gd_players', []);
  const player = players.find(p => p.id === a.playerId);
  if (player) {
    player.score = (player.score || 0) + points;
    player.gameCoins = (player.gameCoins || 0) + points; // 1 point = 1 gamecoin
    // update campaignScores
    player.campaignScores = player.campaignScores || {};
    player.campaignScores[a.campaignId] = (player.campaignScores[a.campaignId] || 0) + points;
    write('gd_players', players);
  }

  return Promise.resolve(next);
}

export async function getPlayerAnswersForCampaign(playerId: number, campaignId: number): Promise<Answer[]> {
  const all = read<Answer[]>('gd_answers', []);
  return Promise.resolve(all.filter(a => a.playerId === playerId && a.campaignId === campaignId));
}

// Return visible questions for a player in a campaign.
// Rules:
// - One regular question per day: the earliest unanswered question with dayIndex <= todayIndex
// - Special questions are visible when their specialStartAt <= now (and unanswered)
export async function getVisibleQuestionsForPlayer(playerId: number, campaignId: number): Promise<Question[]> {
  const questions = read<Question[]>('gd_questions', []).filter(q => q.campaignId === campaignId);
  const answers = read<Answer[]>('gd_answers', []).filter(a => a.playerId === playerId && a.campaignId === campaignId);
  const campaigns = read<Campaign[]>('gd_campaigns', []);
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) return Promise.resolve([]);

  const now = new Date();
  const campaignStart = new Date(campaign.startDate);
  const dayIndexNow = Math.floor((now.getTime() - campaignStart.getTime()) / (24 * 60 * 60 * 1000));

  // regular questions: earliest unanswered with dayIndex <= dayIndexNow
  const regularCandidates = questions.filter(q => !q.isSpecial).sort((a, b) => a.dayIndex - b.dayIndex);
  let visibleRegular: Question | null = null;
  for (const q of regularCandidates) {
    if (q.dayIndex <= dayIndexNow) {
      const answered = answers.find(a => a.questionId === q.id);
      if (!answered) { visibleRegular = q; break; }
    }
  }

  // special questions: those with specialStartAt <= now and unanswered
  const specialVisible = questions.filter(q => q.isSpecial && q.specialStartAt).filter(q => {
    const start = new Date(q.specialStartAt!);
    return start <= now && !answers.find(a => a.questionId === q.id);
  });

  const result: Question[] = [];
  if (visibleRegular) result.push(visibleRegular);
  if (specialVisible.length) result.push(...specialVisible);
  return Promise.resolve(result);
}

// Admins
export interface Admin {
  id: number;
  name: string;
  email: string;
  invited?: boolean; // true when invitation sent but not yet activated
  inviteToken?: string; // token used in invite acceptance link
  createdAt: string;
}

export async function fetchAdmins(): Promise<Admin[]> {
  return Promise.resolve(read<Admin[]>('gd_admins', []));
}

export async function addAdmin(a: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
  const list = read<Admin[]>('gd_admins', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next: Admin = { id, ...a, createdAt: new Date().toISOString() } as Admin;
  list.push(next);
  write('gd_admins', list);
  return Promise.resolve(next);
}

export async function updateAdmin(updated: Admin): Promise<Admin> {
  const list = read<Admin[]>('gd_admins', []);
  const next = list.map(a => a.id === updated.id ? updated : a);
  write('gd_admins', next);
  return Promise.resolve(updated);
}

export async function deleteAdmin(id: number): Promise<void> {
  const list = read<Admin[]>('gd_admins', []);
  const next = list.filter(a => a.id !== id);
  write('gd_admins', next);
  return Promise.resolve();
}

// Messages (reports from players / other platforms)
export interface MessageItem {
  id: number;
  from: string; // player email or source
  subject: string;
  body: string;
  receivedAt: string;
  handled?: boolean;
}

export async function fetchMessages(): Promise<MessageItem[]> {
  return Promise.resolve(read<MessageItem[]>('gd_messages', []));
}

export async function addMessage(m: Omit<MessageItem, 'id' | 'receivedAt'>): Promise<MessageItem> {
  const list = read<MessageItem[]>('gd_messages', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next: MessageItem = { id, ...m, receivedAt: new Date().toISOString() } as MessageItem;
  list.push(next);
  write('gd_messages', list);
  return Promise.resolve(next);
}

export async function updateMessage(updated: MessageItem): Promise<MessageItem> {
  const list = read<MessageItem[]>('gd_messages', []);
  const next = list.map(m => m.id === updated.id ? updated : m);
  write('gd_messages', next);
  return Promise.resolve(updated);
}

export async function deleteMessage(id: number): Promise<void> {
  const list = read<MessageItem[]>('gd_messages', []);
  const next = list.filter(m => m.id !== id);
  write('gd_messages', next);
  return Promise.resolve();
}

// Products
export async function fetchProducts(): Promise<Product[]> {
  return Promise.resolve(read<Product[]>('gd_products', []));
}

export async function addProduct(p: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const list = read<Product[]>('gd_products', []);
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next: Product = { id, ...p, createdAt: new Date().toISOString() } as Product;
  list.push(next);
  write('gd_products', list);
  return Promise.resolve(next);
}

export async function updateProduct(updated: Product): Promise<Product> {
  const list = read<Product[]>('gd_products', []);
  const next = list.map(p => p.id === updated.id ? updated : p);
  write('gd_products', next);
  return Promise.resolve(updated);
}

export async function deleteProduct(id: number): Promise<void> {
  const list = read<Product[]>('gd_products', []);
  const next = list.filter(p => p.id !== id);
  write('gd_products', next);
  return Promise.resolve();
}

// Purchases
export async function fetchPurchases(): Promise<Purchase[]> {
  return Promise.resolve(read<Purchase[]>('gd_purchases', []));
}

export async function addPurchase(p: Omit<Purchase, 'id' | 'purchasedAt'>): Promise<Purchase> {
  const list = read<Purchase[]>('gd_purchases', []);
  // prevent duplicate purchase of same product by same player
  const already = list.find(x => x.playerId === p.playerId && x.productId === p.productId);
  if (already) return Promise.reject(new Error('Player has already purchased this product'));

  // check player has enough gameCoins
  const players = read<Player[]>('gd_players', []);
  const player = players.find(pl => pl.id === p.playerId);
  if (!player) return Promise.reject(new Error('Player not found'));

  const products = read<Product[]>('gd_products', []);
  const product = products.find(pr => pr.id === p.productId);
  if (!product) return Promise.reject(new Error('Product not found'));

  const purchasedCount = list.filter(x => x.productId === p.productId).length;
  const remaining = product.quantity - purchasedCount;
  if (remaining <= 0) return Promise.reject(new Error('Product out of stock'));

  if ((player.gameCoins || 0) < p.priceInGameCoins) return Promise.reject(new Error('Insufficient gameCoins'));

  // create purchase
  const id = Math.max(0, ...list.map(x => x.id)) + 1;
  const next: Purchase = { id, ...p, purchasedAt: new Date().toISOString() } as Purchase;
  list.push(next);
  write('gd_purchases', list);

  // deduct coins
  player.gameCoins = (player.gameCoins || 0) - p.priceInGameCoins;
  write('gd_players', players);

  return Promise.resolve(next);
}

export async function getPlayerPurchases(playerId: number): Promise<Purchase[]> {
  const all = read<Purchase[]>('gd_purchases', []);
  return Promise.resolve(all.filter(p => p.playerId === playerId));
}

export async function getProductPurchases(productId: number): Promise<Purchase[]> {
  const all = read<Purchase[]>('gd_purchases', []);
  return Promise.resolve(all.filter(p => p.productId === productId));
}

export default null;
