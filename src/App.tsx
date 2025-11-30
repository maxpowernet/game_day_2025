import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import GameDay from "./pages/GameDay";
import Calendar from "./pages/Calendar";
import Players from "./pages/Players";
import Campaigns from "./pages/Campaigns";
import Questions from "./pages/Questions";
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

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Login Route Component - redirects to dashboard if already authenticated
function LoginRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/game-day" replace />;
  }
  
  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginRoute />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/game-day" element={<ProtectedRoute><GameDay /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
            <Route path="/questions" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
            <Route path="/lojinha" element={<ProtectedRoute><Store /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
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
