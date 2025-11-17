import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate("/game-day");
    }, 1000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate signup
    setTimeout(() => {
      setIsLoading(false);
      navigate("/game-day");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
  <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-accent px-12 py-8 flex-col items-center justify-center relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        <div className="relative max-w-[520px] flex flex-col items-center" style={{ transform: "translateY(2%)" }}>
          <div className="mb-12">
            <h1 className="text-7xl font-bold text-white">
              Game Day
            </h1>
            <h2 className="text-lg font-medium mt-2 whitespace-nowrap text-white">
              Planeje, priorize e realize suas tarefas com facilidade.
            </h2>
          </div>
          
          <iframe
            src="https://lottie.host/embed/5f4c5bc1-93d4-49f4-8d3d-139434240361/GwJak1Hx0b.lottie"
            title="Game Day animation"
            className="w-[36rem] h-[36rem] mx-auto block"
            style={{ transform: "translateY(-15%)" }}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </div>

      {/* Right side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <img src={logo} alt="Logo do Game Day" className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-white">Game Day</h1>
          </div>

          <Card className="p-8 shadow-xl">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail ou Usuário</Label>
                    <Input
                      id="login-email"
                      type="text"
                      placeholder="Digite seu e-mail ou usuário"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Digite sua senha"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Crie uma senha"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Cadastrar"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
