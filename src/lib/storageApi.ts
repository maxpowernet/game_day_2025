import { supabase } from './supabaseClient';

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
  authUid?: string;
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

// ============================================================================
// PLAYERS - Supabase CRUD
// ============================================================================


export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }
  
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    task: p.task,
    status: p.status,
    score: p.score || 0,
    gameCoins: p.game_coins || 0,
    teamId: p.team_id,
    authUid: p.auth_uid,
  }));
}

export async function setPlayers(players: Player[]): Promise<Player[]> {
  // Bulk upsert (usado para importação)
  const records = players.map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    task: p.task,
    status: p.status,
    score: p.score || 0,
    game_coins: p.gameCoins || 0,
    team_id: p.teamId,
  }));
  
  const { error } = await supabase.from('players').upsert(records);
  if (error) console.error('Error setting players:', error);
  
  return fetchPlayers();
}

export async function addPlayer(p: Omit<Player, 'id'>): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      name: p.name,
      role: p.role,
      task: p.task,
      status: p.status,
      score: p.score || 0,
      game_coins: p.gameCoins || 0,
      team_id: p.teamId,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding player:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    task: data.task,
    status: data.status,
    score: data.score || 0,
    gameCoins: data.game_coins || 0,
    teamId: data.team_id,
  };
}

export async function updatePlayer(updated: Player): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update({
      name: updated.name,
      role: updated.role,
      task: updated.task,
      status: updated.status,
      score: updated.score || 0,
      game_coins: updated.gameCoins || 0,
      team_id: updated.teamId,
    })
    .eq('id', updated.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating player:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    name: data.name,
    role: data.role,
    task: data.task,
    status: data.status,
    score: data.score || 0,
    gameCoins: data.game_coins || 0,
    teamId: data.team_id,
  };
}

export async function deletePlayer(id: number): Promise<void> {
  try {
    // Delete related records first
    await supabase.from('answers').delete().eq('player_id', id);
    await supabase.from('purchases').delete().eq('player_id', id);
    await supabase.from('player_campaign_scores').delete().eq('player_id', id);
    await supabase.from('campaign_players').delete().eq('player_id', id);
    await supabase.from('team_members').delete().eq('player_id', id);
    
    // Delete the player
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) {
      console.error('Error deleting player:', error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Error in deletePlayer:', error);
    throw error;
  }
}

// ============================================================================
// CAMPAIGNS - Supabase CRUD
// ============================================================================

export async function fetchCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, campaign_players(player_id)')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
  
  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    status: c.status as 'planned' | 'in-progress' | 'completed',
    startDate: c.start_date,
    endDate: c.end_date,
    icon: c.icon,
    playerIds: (c.campaign_players || []).map((cp: any) => cp.player_id),
    createdAt: c.created_at,
  }));
}

export async function setCampaigns(campaigns: Campaign[]): Promise<Campaign[]> {
  const records = campaigns.map(c => ({
    id: c.id,
    name: c.name,
    status: c.status,
    start_date: c.startDate,
    end_date: c.endDate,
    icon: c.icon,
  }));
  
  const { error } = await supabase.from('campaigns').upsert(records);
  if (error) console.error('Error setting campaigns:', error);
  
  return fetchCampaigns();
}

export async function addCampaign(c: Omit<Campaign, 'id'>): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name: c.name,
      status: c.status,
      start_date: c.startDate,
      end_date: c.endDate,
      icon: c.icon,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding campaign:', error);
    throw new Error(error.message);
  }
  
  // Insert campaign_players relationships
  if (c.playerIds && c.playerIds.length > 0) {
    const enrollments = c.playerIds.map(playerId => ({
      campaign_id: data.id,
      player_id: playerId,
    }));
    await supabase.from('campaign_players').insert(enrollments);
  }
  
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    icon: data.icon,
    playerIds: c.playerIds || [],
    createdAt: data.created_at,
  }
}

export async function updateCampaign(updated: Campaign): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .update({
      name: updated.name,
      status: updated.status,
      start_date: updated.startDate,
      end_date: updated.endDate,
      icon: updated.icon,
    })
    .eq('id', updated.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating campaign:', error);
    throw new Error(error.message);
  }
  
  // Update campaign_players relationships
  await supabase.from('campaign_players').delete().eq('campaign_id', updated.id);
  
  if (updated.playerIds && updated.playerIds.length > 0) {
    const enrollments = updated.playerIds.map(playerId => ({
      campaign_id: updated.id,
      player_id: playerId,
    }));
    await supabase.from('campaign_players').insert(enrollments);
  }
  
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    startDate: data.start_date,
    endDate: data.end_date,
    icon: data.icon,
    playerIds: updated.playerIds || [],
    createdAt: data.created_at,
  };
}

export async function deleteCampaign(id: number): Promise<void> {
  // Delete related records first to avoid foreign key constraints
  try {
    // Delete in order: child records first, then parent
    await supabase.from('answers').delete().eq('campaign_id', id);
    await supabase.from('purchases').delete().eq('campaign_id', id);
    await supabase.from('player_campaign_scores').delete().eq('campaign_id', id);
    await supabase.from('campaign_players').delete().eq('campaign_id', id);
    await supabase.from('products').delete().eq('campaign_id', id);
    await supabase.from('questions').delete().eq('campaign_id', id);
    await supabase.from('teams').delete().eq('campaign_id', id);
    
    // Finally, delete the campaign itself
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) {
      console.error('Error deleting campaign:', error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Error in deleteCampaign:', error);
    throw error;
  }
}

// ============================================================================
// QUESTIONS - Supabase CRUD
// ============================================================================

export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('campaign_id', { ascending: true })
    .order('day_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
  
  return (data || []).map(q => ({
    id: q.id,
    campaignId: q.campaign_id,
    dayIndex: q.day_index,
    text: q.text,
    choices: q.choices,
    answer: q.answer,
    status: q.status,
    priority: q.priority,
    pointsOnTime: q.points_on_time,
    pointsLate: q.points_late,
    scheduleTime: q.schedule_time,
    deadlineTime: q.deadline_time,
    isSpecial: q.is_special,
    specialStartAt: q.special_start_at,
    specialWindowMinutes: q.special_window_minutes,
  }));
}

export async function setQuestions(questions: Question[]): Promise<Question[]> {
  const records = questions.map(q => ({
    id: q.id,
    campaign_id: q.campaignId,
    day_index: q.dayIndex,
    text: q.text,
    choices: q.choices,
    answer: q.answer,
    status: q.status,
    priority: q.priority,
    points_on_time: q.pointsOnTime,
    points_late: q.pointsLate,
    schedule_time: q.scheduleTime,
    deadline_time: q.deadlineTime,
    is_special: q.isSpecial,
    special_start_at: q.specialStartAt,
    special_window_minutes: q.specialWindowMinutes,
  }));
  
  const { error } = await supabase.from('questions').upsert(records);
  if (error) console.error('Error setting questions:', error);
  
  return fetchQuestions();
}

export async function addQuestion(q: Omit<Question, 'id'>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      campaign_id: q.campaignId,
      day_index: q.dayIndex,
      text: q.text,
      choices: q.choices,
      answer: q.answer,
      status: q.status,
      priority: q.priority,
      points_on_time: q.pointsOnTime,
      points_late: q.pointsLate,
      schedule_time: q.scheduleTime,
      deadline_time: q.deadlineTime,
      is_special: q.isSpecial,
      special_start_at: q.specialStartAt,
      special_window_minutes: q.specialWindowMinutes,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding question:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    campaignId: data.campaign_id,
    dayIndex: data.day_index,
    text: data.text,
    choices: data.choices,
    answer: data.answer,
    status: data.status,
    priority: data.priority,
    pointsOnTime: data.points_on_time,
    pointsLate: data.points_late,
    scheduleTime: data.schedule_time,
    deadlineTime: data.deadline_time,
    isSpecial: data.is_special,
    specialStartAt: data.special_start_at,
    specialWindowMinutes: data.special_window_minutes,
  };
}

export async function updateQuestion(updated: Question): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update({
      campaign_id: updated.campaignId,
      day_index: updated.dayIndex,
      text: updated.text,
      choices: updated.choices,
      answer: updated.answer,
      status: updated.status,
      priority: updated.priority,
      points_on_time: updated.pointsOnTime,
      points_late: updated.pointsLate,
      schedule_time: updated.scheduleTime,
      deadline_time: updated.deadlineTime,
      is_special: updated.isSpecial,
      special_start_at: updated.specialStartAt,
      special_window_minutes: updated.specialWindowMinutes,
    })
    .eq('id', updated.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating question:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    campaignId: data.campaign_id,
    dayIndex: data.day_index,
    text: data.text,
    choices: data.choices,
    answer: data.answer,
    status: data.status,
    priority: data.priority,
    pointsOnTime: data.points_on_time,
    pointsLate: data.points_late,
    scheduleTime: data.schedule_time,
    deadlineTime: data.deadline_time,
    isSpecial: data.is_special,
    specialStartAt: data.special_start_at,
    specialWindowMinutes: data.special_window_minutes,
  };
}

export async function deleteQuestion(id: number): Promise<void> {
  try {
    // Delete answers for this question first
    await supabase.from('answers').delete().eq('question_id', id);
    
    // Delete the question
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      console.error('Error deleting question:', error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Error in deleteQuestion:', error);
    throw error;
  }
}

// ============================================================================
// TEAMS - Supabase CRUD
// ============================================================================

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members(player_id)')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
  
  return (data || []).map(t => ({
    id: t.id,
    campaignId: t.campaign_id,
    name: t.name,
    members: (t.team_members || []).map((tm: any) => tm.player_id),
    totalScore: t.total_score,
    createdAt: t.created_at,
  }));
}

export async function setTeams(teams: Team[]): Promise<Team[]> {
  const records = teams.map(t => ({
    id: t.id,
    campaign_id: t.campaignId,
    name: t.name,
    total_score: t.totalScore,
  }));
  
  const { error } = await supabase.from('teams').upsert(records);
  if (error) console.error('Error setting teams:', error);
  
  return fetchTeams();
}

export async function addTeam(t: Omit<Team, 'id'>): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      campaign_id: t.campaignId,
      name: t.name,
      total_score: t.totalScore || 0,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding team:', error);
    throw new Error(error.message);
  }
  
  // Insert team_members relationships
  if (t.members && t.members.length > 0) {
    const memberships = t.members.map(playerId => ({
      team_id: data.id,
      player_id: playerId,
    }));
    await supabase.from('team_members').insert(memberships);
  }
  
  return {
    id: data.id,
    campaignId: data.campaign_id,
    name: data.name,
    members: t.members || [],
    totalScore: data.total_score,
    createdAt: data.created_at,
  };
}

export async function updateTeam(updated: Team): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update({
      campaign_id: updated.campaignId,
      name: updated.name,
      total_score: updated.totalScore || 0,
    })
    .eq('id', updated.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating team:', error);
    throw new Error(error.message);
  }
  
  // Update team_members relationships
  await supabase.from('team_members').delete().eq('team_id', updated.id);
  
  if (updated.members && updated.members.length > 0) {
    const memberships = updated.members.map(playerId => ({
      team_id: updated.id,
      player_id: playerId,
    }));
    await supabase.from('team_members').insert(memberships);
  }
  
  return {
    id: data.id,
    campaignId: data.campaign_id,
    name: data.name,
    members: updated.members || [],
    totalScore: data.total_score,
    createdAt: data.created_at,
  };
}

export async function deleteTeam(id: number): Promise<void> {
  try {
    // Delete team members first
    await supabase.from('team_members').delete().eq('team_id', id);
    
    // Delete the team
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) {
      console.error('Error deleting team:', error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Error in deleteTeam:', error);
    throw error;
  }
}



// ============================================================================
// PRODUCTS - Supabase CRUD
// ============================================================================

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.image_url,
    priceInGameCoins: p.price_in_game_coins,
    quantity: p.quantity,
    campaignId: p.campaign_id,
    availableFrom: p.available_from,
    availableUntil: p.available_until,
    createdAt: p.created_at,
  }));
}

export async function addProduct(p: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: p.name,
      description: p.description,
      image_url: p.imageUrl,
      price_in_game_coins: p.priceInGameCoins,
      quantity: p.quantity,
      campaign_id: p.campaignId,
      available_from: p.availableFrom,
      available_until: p.availableUntil,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding product:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url,
    priceInGameCoins: data.price_in_game_coins,
    quantity: data.quantity,
    campaignId: data.campaign_id,
    availableFrom: data.available_from,
    availableUntil: data.available_until,
    createdAt: data.created_at,
  };
}

export async function updateProduct(updated: Product): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: updated.name,
      description: updated.description,
      image_url: updated.imageUrl,
      price_in_game_coins: updated.priceInGameCoins,
      quantity: updated.quantity,
      campaign_id: updated.campaignId,
      available_from: updated.availableFrom,
      available_until: updated.availableUntil,
    })
    .eq('id', updated.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating product:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url,
    priceInGameCoins: data.price_in_game_coins,
    quantity: data.quantity,
    campaignId: data.campaign_id,
    availableFrom: data.available_from,
    availableUntil: data.available_until,
    createdAt: data.created_at,
  };
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error('Error deleting product:', error);
    throw new Error(error.message);
  }
}

// ============================================================================
// PURCHASES - Supabase CRUD
// ============================================================================

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('purchased_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
  
  return (data || []).map(p => ({
    id: p.id,
    playerId: p.player_id,
    productId: p.product_id,
    campaignId: p.campaign_id,
    purchasedAt: p.purchased_at,
    priceInGameCoins: p.price_in_game_coins,
  }));
}

export async function addPurchase(p: Omit<Purchase, 'id' | 'purchasedAt'>): Promise<Purchase> {
  // Use RPC function for atomic purchase
  const { data, error } = await supabase.rpc('purchase_product', {
    p_player_id: p.playerId,
    p_product_id: p.productId,
    p_campaign_id: p.campaignId,
  }).single();
  
  if (error) {
    console.error('Error making purchase:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    playerId: data.player_id,
    productId: data.product_id,
    campaignId: data.campaign_id,
    purchasedAt: data.purchased_at,
    priceInGameCoins: data.price_in_game_coins,
  };
}

// ============================================================================
// ANSWERS - Supabase CRUD
// ============================================================================

export async function fetchAnswers(): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .order('answered_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching answers:', error);
    return [];
  }
  
  return (data || []).map(a => ({
    id: a.id,
    playerId: a.player_id,
    questionId: a.question_id,
    campaignId: a.campaign_id,
    answeredAt: a.answered_at,
    selectedAnswer: a.selected_answer,
    pointsEarned: a.points_earned,
    isOnTime: a.is_on_time,
    isCorrect: a.is_correct,
  }));
}

export async function addAnswer(a: Omit<Answer, 'id'>): Promise<Answer> {
  const { data, error } = await supabase
    .from('answers')
    .insert({
      player_id: a.playerId,
      question_id: a.questionId,
      campaign_id: a.campaignId,
      answered_at: a.answeredAt,
      selected_answer: a.selectedAnswer,
      points_earned: a.pointsEarned,
      is_on_time: a.isOnTime,
      is_correct: a.isCorrect,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding answer:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    playerId: data.player_id,
    questionId: data.question_id,
    campaignId: data.campaign_id,
    answeredAt: data.answered_at,
    selectedAnswer: data.selected_answer,
    pointsEarned: data.points_earned,
    isOnTime: data.is_on_time,
    isCorrect: data.is_correct,
  };
}

// Submit answer using RPC for atomic operation
export async function submitAnswer(a: Omit<Answer, 'id' | 'answeredAt' | 'pointsEarned' | 'isOnTime' | 'isCorrect'>): Promise<Answer> {
  const { data, error } = await supabase.rpc('submit_answer', {
    p_player_id: a.playerId,
    p_question_id: a.questionId,
    p_campaign_id: a.campaignId,
    p_selected_answer: a.selectedAnswer,
  }).single();
  
  if (error) {
    console.error('Error submitting answer:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    playerId: data.player_id,
    questionId: data.question_id,
    campaignId: data.campaign_id,
    answeredAt: data.answered_at,
    selectedAnswer: data.selected_answer,
    pointsEarned: data.points_earned,
    isOnTime: data.is_on_time,
    isCorrect: data.is_correct,
  };
}

export async function getPlayerAnswersForCampaign(playerId: number, campaignId: number): Promise<Answer[]> {
  const { data, error} = await supabase
    .from('answers')
    .select('*')
    .eq('player_id', playerId)
    .eq('campaign_id', campaignId)
    .order('answered_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching player answers:', error);
    return [];
  }
  
  return (data || []).map(a => ({
    id: a.id,
    playerId: a.player_id,
    questionId: a.question_id,
    campaignId: a.campaign_id,
    answeredAt: a.answered_at,
    selectedAnswer: a.selected_answer,
    pointsEarned: a.points_earned,
    isOnTime: a.is_on_time,
    isCorrect: a.is_correct,
  }));
}

export async function getVisibleQuestionsForPlayer(playerId: number, campaignId: number): Promise<Question[]> {
  const questions = await fetchQuestions();
  const campaignQuestions = questions.filter(q => q.campaignId === campaignId);
  const answers = await getPlayerAnswersForCampaign(playerId, campaignId);
  const campaigns = await fetchCampaigns();
  const campaign = campaigns.find(c => c.id === campaignId);
  
  if (!campaign) return [];

  const now = new Date();
  const campaignStart = new Date(campaign.startDate);
  const dayIndexNow = Math.floor((now.getTime() - campaignStart.getTime()) / (24 * 60 * 60 * 1000));

  // regular questions: earliest unanswered with dayIndex <= dayIndexNow
  const regularCandidates = campaignQuestions.filter(q => !q.isSpecial).sort((a, b) => a.dayIndex - b.dayIndex);
  let visibleRegular: Question | null = null;
  for (const q of regularCandidates) {
    if (q.dayIndex <= dayIndexNow) {
      const answered = answers.find(a => a.questionId === q.id);
      if (!answered) { visibleRegular = q; break; }
    }
  }

  // special questions: those with specialStartAt <= now and unanswered
  const specialVisible = campaignQuestions.filter(q => q.isSpecial && q.specialStartAt).filter(q => {
    const start = new Date(q.specialStartAt!);
    return start <= now && !answers.find(a => a.questionId === q.id);
  });

  const result: Question[] = [];
  if (visibleRegular) result.push(visibleRegular);
  if (specialVisible.length) result.push(...specialVisible);
  return result;
}

// ============================================================================
// ADMINS - Supabase CRUD (Read-only for now, managed via scripts)
// ============================================================================

export interface Admin {
  id: number;
  name: string;
  email: string;
  invited?: boolean;
  inviteToken?: string;
  createdAt: string;
  authUid?: string;
}

export async function fetchAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
  
  return (data || []).map(a => ({
    id: a.id,
    name: a.name,
    email: a.email,
    invited: a.invited,
    inviteToken: a.invite_token,
    createdAt: a.created_at,
    authUid: a.auth_uid,
  }));
}

// ============================================================================
// MESSAGES - Supabase CRUD
// ============================================================================

export interface MessageItem {
  id: number;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  handled?: boolean;
}

export async function fetchMessages(): Promise<MessageItem[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('received_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return (data || []).map(m => ({
    id: m.id,
    from: m.from,
    subject: m.subject,
    body: m.body,
    receivedAt: m.received_at,
    handled: m.handled,
  }));
}

export async function getPlayerPurchases(playerId: number): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('player_id', playerId)
    .order('purchased_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching player purchases:', error);
    return [];
  }
  
  return (data || []).map(p => ({
    id: p.id,
    playerId: p.player_id,
    productId: p.product_id,
    campaignId: p.campaign_id,
    purchasedAt: p.purchased_at,
    priceInGameCoins: p.price_in_game_coins,
  }));
}

export async function getProductPurchases(productId: number): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('product_id', productId)
    .order('purchased_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching product purchases:', error);
    return [];
  }
  
  return (data || []).map(p => ({
    id: p.id,
    playerId: p.player_id,
    productId: p.product_id,
    campaignId: p.campaign_id,
    purchasedAt: p.purchased_at,
    priceInGameCoins: p.price_in_game_coins,
  }));
}

// ============================================================================
// ADMINS - Supabase CRUD (Management functions)
// ============================================================================

export async function addAdmin(a: Omit<Admin, 'id' | 'createdAt'>): Promise<Admin> {
  const { data, error } = await supabase
    .from('admins')
    .insert({
      name: a.name,
      email: a.email,
      invited: a.invited,
      invite_token: a.inviteToken,
      auth_uid: a.authUid,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding admin:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    invited: data.invited,
    inviteToken: data.invite_token,
    createdAt: data.created_at,
    authUid: data.auth_uid,
  };
}

export async function updateAdmin(updated: Admin): Promise<Admin> {
  const { data, error } = await supabase
    .from('admins')
    .update({
      name: updated.name,
      email: updated.email,
      invited: updated.invited,
      invite_token: updated.inviteToken,
      auth_uid: updated.authUid,
    })
    .eq('id', updated.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating admin:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    invited: data.invited,
    inviteToken: data.invite_token,
    createdAt: data.created_at,
    authUid: data.auth_uid,
  };
}

export async function deleteAdmin(id: number): Promise<void> {
  const { error } = await supabase.from('admins').delete().eq('id', id);
  if (error) {
    console.error('Error deleting admin:', error);
    throw new Error(error.message);
  }
}

// ============================================================================
// MESSAGES - Supabase CRUD (Management functions)
// ============================================================================

export async function addMessage(m: Omit<MessageItem, 'id' | 'receivedAt'>): Promise<MessageItem> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      from: m.from,
      subject: m.subject,
      body: m.body,
      handled: m.handled,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding message:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    from: data.from,
    subject: data.subject,
    body: data.body,
    receivedAt: data.received_at,
    handled: data.handled,
  };
}

export async function updateMessage(updated: MessageItem): Promise<MessageItem> {
  const { data, error } = await supabase
    .from('messages')
    .update({
      from: updated.from,
      subject: updated.subject,
      body: updated.body,
      handled: updated.handled,
    })
    .eq('id', updated.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating message:', error);
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    from: data.from,
    subject: data.subject,
    body: data.body,
    receivedAt: data.received_at,
    handled: data.handled,
  };
}

export async function deleteMessage(id: number): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) {
    console.error('Error deleting message:', error);
    throw new Error(error.message);
  }
}

export default null;
