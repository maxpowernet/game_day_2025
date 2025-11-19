# 📧 Sistema de Envio de Convites - Guia Rápido

## ✅ O que foi implementado

1. **Servidor local de convites** (`server/send-invite-server.js`)
   - Cria usuários confirmados no Supabase via Admin API
   - Upserta linha na tabela `admins` com token de convite
   - Envia email via SMTP (nodemailer)
   - Logs detalhados para debug

2. **Interface melhorada** (`src/pages/Settings.tsx`)
   - Toast messages informativas
   - Detecção automática se email foi enviado
   - Fallback para storage local se servidor offline
   - Melhor tratamento de erros

3. **Script helper** (`scripts/start-invite-server.ps1`)
   - Configuração automática de variáveis de ambiente
   - Inicialização rápida do servidor

4. **Dependências instaladas**
   - ✅ `nodemailer` (envio SMTP)
   - ✅ `@supabase/supabase-js` (cliente Supabase)

## 🚀 Como usar

### 1. Iniciar o servidor de convites

```powershell
.\scripts\start-invite-server.ps1
```

Você verá:
```
Iniciando servidor de convites local...

Variáveis de ambiente configuradas:
  SUPABASE_URL: https://vhphsaodwurjnwrnxflm.supabase.co
  SMTP_HOST: smtp.gmail.com
  SMTP_PORT: 587
  SMTP_USER: max.senai.ti@gmail.com
  PORT: 3002
  FRONTEND_ORIGIN: http://localhost:8080

Servidor disponível em: http://localhost:3002/send-invite
Pressione Ctrl+C para parar o servidor.

Invite server listening on http://localhost:3002/send-invite
```

### 2. Iniciar o frontend

Em outro terminal PowerShell:
```powershell
npm run dev
```

Acesse: `http://localhost:8080`

### 3. Enviar convite pela interface

1. Faça login como admin (`max.eldon@gmail.com` / `123456`)
2. Vá para **Configurações** → **Administradores**
3. Preencha:
   - **Nome**: Nome do novo admin
   - **Email**: Email válido
4. Clique em **Enviar Convite**
5. Aguarde o toast de confirmação:
   - ✅ **Email enviado**: "✅ Convite enviado por email" (SMTP configurado)
   - ⚠️ **Usuário criado**: "Convite criado - SMTP não configurado" (sem SMTP)
   - ❌ **Servidor offline**: "Convite armazenado - servidor não disponível" (fallback)

### 4. Ver logs do servidor

No terminal onde o servidor está rodando, você verá:
```
== invite result ==
authResult: {"user":{"id":"...","email":"..."},"password":"..."}
upsert: {"data":[{...}]}
mailResult: {"sent":true,"info":{...}}
```

ou em caso de erro:
```
mailResult: {"sent":false,"error":"Invalid login: 535-5.7.8 Username and Password not accepted..."}
```

## ⚠️ Problema conhecido: Gmail bloqueia senha simples

**Sintoma:** Email não é enviado, log mostra:
```
mailResult: {"sent":false,"error":"Invalid login: 535-5.7.8 Username and Password not accepted"}
```

**Causa:** Gmail bloqueia autenticação com usuário/senha desde 2022 (requer 2FA + App Password)

**Solução:**

### Opção 1: Usar Senha de App do Gmail (recomendado para produção)

1. Acesse: https://myaccount.google.com/security
2. Ative **Verificação em duas etapas**
3. Vá em **Senhas de app**: https://myaccount.google.com/apppasswords
4. Crie uma senha de app (selecione "Outro" e digite "Game Day")
5. Copie a senha gerada (16 caracteres, sem espaços)
6. Edite `scripts/start-invite-server.ps1`:
   ```powershell
   $env:SMTP_PASS='abcd efgh ijkl mnop'  # Substitua pela senha de app
   ```
7. Reinicie o servidor: `.\scripts\start-invite-server.ps1`

### Opção 2: Usar Mailtrap para desenvolvimento (mais fácil)

Mailtrap é um serviço gratuito que simula SMTP sem enviar emails reais (ideal para dev).

1. Crie conta grátis: https://mailtrap.io/register/signup
2. Acesse: **Email Testing** → **Inboxes** → **My Inbox**
3. Copie as credenciais SMTP
4. Edite `scripts/start-invite-server.ps1`:
   ```powershell
   $env:SMTP_HOST='sandbox.smtp.mailtrap.io'
   $env:SMTP_PORT='2525'
   $env:SMTP_USER='seu-user-mailtrap'
   $env:SMTP_PASS='seu-pass-mailtrap'
   $env:SMTP_FROM='Game Day <noreply@gameday.local>'
   ```
5. Reinicie: `.\scripts\start-invite-server.ps1`
6. Emails aparecerão na inbox do Mailtrap (não são enviados de verdade)

## 📊 Fluxo completo

```
[ UI: Enviar Convite ]
         ↓
[ POST http://localhost:3002/send-invite ]
         ↓
[ Servidor: createAuthUser() ]  ← Supabase Admin API (service role)
         ↓
[ Servidor: upsertAdminRow() ]  ← Tabela admins (service role)
         ↓
[ Servidor: trySendEmail() ]    ← SMTP (nodemailer)
         ↓
[ Resposta JSON { success, link, authResult, mailResult } ]
         ↓
[ UI: Toast com resultado ]
```

## 🔍 Debug

### Verificar se servidor está rodando

```powershell
netstat -ano | Select-String ":3002"
# Deve mostrar: TCP 127.0.0.1:3002 ... LISTENING
```

### Testar endpoint manualmente (PowerShell)

```powershell
$token = [System.Guid]::NewGuid().ToString('N')
$body = @{ name='Teste'; email='teste@example.com'; token=$token } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3002/send-invite' -Body $body -ContentType 'application/json'
```

Resposta esperada (sucesso):
```json
{
  "success": true,
  "link": "http://localhost:8080/accept-invite?token=...",
  "authResult": { "user": {...}, "password": "..." },
  "mailResult": { "sent": true, "info": {...} }
}
```

### Ver logs detalhados no servidor

O servidor exibe:
- `== invite result ==`
- `authResult: {...}`  ← Criação do usuário (ou erro)
- `upsert: {...}`      ← Insert na tabela admins
- `mailResult: {...}`  ← Envio SMTP (sent:true/false + info/error)

## 🛡️ Segurança

- ⚠️ **Service Role Key** está no script `start-invite-server.ps1`
- ⚠️ **Senha SMTP** está no mesmo arquivo
- ✅ Não commite este script com credenciais reais
- ✅ Use `.env` local ou variáveis de ambiente do sistema
- ✅ Adicione `scripts/start-invite-server.ps1` ao `.gitignore` se contiver secrets

**Alternativa segura:**

Crie `.env.local` (não commitado):
```env
SUPABASE_URL=https://vhphsaodwurjnwrnxflm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=max.senai.ti@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=Game Day <max.senai.ti@gmail.com>
PORT=3002
FRONTEND_ORIGIN=http://localhost:8080
```

E inicie com:
```powershell
Get-Content .env.local | ForEach-Object { if ($_ -match '^([^=]+)=(.*)$') { Set-Item -Path "env:$($matches[1])" -Value $matches[2] } }
node server/send-invite-server.js
```

## ✅ Checklist final

- [x] Servidor de convites implementado
- [x] SMTP (nodemailer) configurado
- [x] UI atualizada com toast messages
- [x] Script helper criado
- [x] Dependências instaladas
- [x] README atualizado
- [ ] **Você**: Configure App Password do Gmail ou Mailtrap
- [ ] **Você**: Teste envio de convite pela UI
- [ ] **Você**: Verifique email recebido (Gmail ou Mailtrap inbox)

## 📞 Próximos passos (opcional)

1. **Produção**: migrar para Edge Function (Supabase Functions) para não expor service role
2. **Email template**: criar HTML bonito para o email de convite
3. **Rate limiting**: adicionar proteção contra spam
4. **Logs persistentes**: salvar histórico de convites enviados
5. **Notificações**: webhook para avisar admin quando convite é aceito
