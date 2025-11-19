@echo off
REM Simple batch script to start the invite server
REM This script intentionally does NOT contain secrets. Set required values
REM in environment variables or create a `.env` file (see start-invite-server.env.example).

REM Default values (will be used only if the corresponding env var is not set)
if "%SUPABASE_URL%"=="" set "SUPABASE_URL=https://vhphsaodwurjnwrnxflm.supabase.co"
if "%SMTP_HOST%"=="" set "SMTP_HOST=smtp.gmail.com"
if "%SMTP_PORT%"=="" set "SMTP_PORT=587"
if "%SMTP_FROM%"=="" set "SMTP_FROM=Game Day ^<no-reply@localhost^>"
if "%PORT%"=="" set "PORT=3002"
if "%FRONTEND_ORIGIN%"=="" set "FRONTEND_ORIGIN=http://localhost:8080"

echo Starting invite server on port %PORT%...
if "%SMTP_USER%"=="" (
	echo WARNING: SMTP_USER not set; emails will be skipped unless configured.
)
if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
	echo WARNING: SUPABASE_SERVICE_ROLE_KEY not set; the server will fail to create users without it.
)
echo.

node server\send-invite-server.js
