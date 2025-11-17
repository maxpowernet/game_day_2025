import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize sample data if localStorage is empty
const initSampleData = () => {
  if (!localStorage.getItem('gd_players')) {
    localStorage.setItem('gd_players', JSON.stringify([
      { id: 1, name: 'João Silva', role: 'Desenvolvedor', task: 'Frontend', status: 'active', score: 850 },
      { id: 2, name: 'Maria Santos', role: 'Designer', task: 'UI/UX', status: 'active', score: 720 },
      { id: 3, name: 'Pedro Costa', role: 'Backend', task: 'API', status: 'active', score: 950 },
      { id: 4, name: 'Ana Paula', role: 'QA', task: 'Testes', status: 'active', score: 680 },
    ]));
  }

  if (!localStorage.getItem('gd_teams')) {
    localStorage.setItem('gd_teams', JSON.stringify([
      { id: 1, name: 'Equipe Alpha', members: [1, 2], createdAt: new Date().toISOString() },
      { id: 2, name: 'Equipe Beta', members: [3, 4], createdAt: new Date().toISOString() },
    ]));
  }

  if (!localStorage.getItem('gd_questions')) {
    localStorage.setItem('gd_questions', JSON.stringify([
      { 
        id: 1, 
        text: 'Qual é o principal benefício da gamificação?', 
        choices: ['Diversão', 'Engajamento', 'Competição', 'Recompensas'],
        answer: 1,
        status: 'todo',
        priority: 'high',
        pointsOnTime: 100,
        pointsLate: 50,
        dayIndex: 1
      },
      { 
        id: 2, 
        text: 'Como medir o sucesso de uma campanha?', 
        choices: ['Participação', 'Pontos', 'Feedback', 'Todas anteriores'],
        answer: 3,
        status: 'todo',
        priority: 'medium',
        pointsOnTime: 80,
        pointsLate: 40,
        dayIndex: 2
      },
    ]));
  }

  if (!localStorage.getItem('gd_campaigns')) {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    localStorage.setItem('gd_campaigns', JSON.stringify([
      { 
        id: 1, 
        name: 'Campanha de Engajamento', 
        status: 'in-progress',
        startDate: today.toISOString(),
        endDate: nextWeek.toISOString(),
        icon: '🎯',
        questionIds: [1, 2],
        teamIds: [1, 2],
        createdAt: today.toISOString()
      },
    ]));
  }
};

initSampleData();

createRoot(document.getElementById("root")!).render(<App />);
