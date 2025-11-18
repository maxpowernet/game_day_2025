import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import Login from "./pages/Login";
import GameDay from "./pages/GameDay";
import Calendar from "./pages/Calendar";
import Players from "./pages/Players";
import Campaigns from "./pages/Campaigns";
import Questions from "./pages/Questions";
import Teams from "./pages/Teams";
import Settings from "./pages/Settings";
import AcceptInvite from "./pages/AcceptInvite";
import Store from "./pages/Store";
// Tasks and Scoreboard removed
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Refetch quando a janela volta ao foco
      refetchOnReconnect: true, // Refetch quando reconectar à internet
      retry: 1,
      staleTime: 30 * 1000, // Dados ficam frescos por 30 segundos
      gcTime: 5 * 60 * 1000, // Cache por 5 minutos (anteriormente cacheTime)
    },
    mutations: {
      onError: (error: any) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/game-day" element={<GameDay />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/players" element={<Players />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/lojinha" element={<Store />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            {/* /tasks and /scoreboard routes removed */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
