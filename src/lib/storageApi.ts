export interface Player {
  id: number;
  name: string;
  role?: string;
  task?: string;
  status?: string;
  score: number;
  teamId?: number;
}

export interface Team {
  id: number;
  name: string;
  members: number[]; // player IDs
  createdAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  status: 'todo' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
  icon?: string;
  questionIds: number[]; // associated questions
  teamIds: number[]; // associated teams
  createdAt: string;
}

export interface Question {
  id: number;
  text: string;
  choices: string[];
  answer: number;
  status: 'todo' | 'in-progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  pointsOnTime: number; // points if answered on time
  pointsLate: number; // points if answered late
  dayIndex?: number; // which day of campaign (0-based)
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

export default null;
