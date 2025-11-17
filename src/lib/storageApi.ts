export interface Player {
  id: number;
  name: string;
  role?: string;
  task?: string;
  status?: string;
  score: number; // total across all campaigns
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

export async function getPlayerAnswersForCampaign(playerId: number, campaignId: number): Promise<Answer[]> {
  const all = read<Answer[]>('gd_answers', []);
  return Promise.resolve(all.filter(a => a.playerId === playerId && a.campaignId === campaignId));
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

export default null;
