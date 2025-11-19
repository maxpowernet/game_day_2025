# Script PowerShell para iniciar o servidor de convites local com env vars
# Usage: .\scripts\start-invite-server.ps1

Write-Host "Iniciando servidor de convites local..." -ForegroundColor Green

# Configurações do Supabase e SMTP
# IMPORTANT: Do NOT store secrets in the repo. Set these as environment variables
# in your shell or use a local `.env` file and load them before running this script.

if (-not $env:SUPABASE_URL) { $env:SUPABASE_URL = 'https://vhphsaodwurjnwrnxflm.supabase.co' }
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) { Write-Host "Warning: SUPABASE_SERVICE_ROLE_KEY not set. Set it in environment for user creation to work." -ForegroundColor Yellow }

# SMTP defaults - provide credentials via env vars if you want emails sent
if (-not $env:SMTP_HOST) { $env:SMTP_HOST = 'smtp.gmail.com' }
if (-not $env:SMTP_PORT) { $env:SMTP_PORT = '587' }
if (-not $env:SMTP_USER) { Write-Host "Notice: SMTP_USER not set; emails will be skipped unless configured." -ForegroundColor Yellow }
if (-not $env:SMTP_PASS) { Write-Host "Notice: SMTP_PASS not set; emails will be skipped unless configured." -ForegroundColor Yellow }
if (-not $env:SMTP_FROM) { $env:SMTP_FROM = 'Game Day <no-reply@localhost>' }

# Porta do servidor (padrão 3002)
$env:PORT='3002'

# Origin do frontend (opcional - usado para gerar links de convite corretos)
$env:FRONTEND_ORIGIN='http://localhost:8080'

Write-Host "`nVariáveis de ambiente configuradas:" -ForegroundColor Cyan
Write-Host "  SUPABASE_URL: $env:SUPABASE_URL"
Write-Host "  SMTP_HOST: $env:SMTP_HOST"
Write-Host "  SMTP_PORT: $env:SMTP_PORT"
Write-Host "  SMTP_USER: $env:SMTP_USER"
Write-Host "  PORT: $env:PORT"
Write-Host "  FRONTEND_ORIGIN: $env:FRONTEND_ORIGIN"
Write-Host "`n"

Write-Host "Servidor disponível em: http://localhost:$env:PORT/send-invite" -ForegroundColor Yellow
Write-Host "Pressione Ctrl+C para parar o servidor.`n" -ForegroundColor Yellow

# Iniciar o servidor
node server/send-invite-server.js
