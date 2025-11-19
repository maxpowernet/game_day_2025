# Como Testar o Envio de Email de Convites

## Configuração Completa ✅

O sistema está configurado com:
- **SMTP Gmail**: smtp.gmail.com:587
- **Email**: max.senai.ti@gmail.com
- **Senha de App**: jysr ieyt ruvy edxn
- **Porta do Servidor**: 3002

## Opção 1: Testar via Interface (Recomendado)

1. **Inicie o servidor de convites**:
   ```cmd
   start-invite-server.bat
   ```
   
2. **Acesse a aplicação**: http://localhost:8080

3. **Vá para Configurações** → seção "Administradores"

4. **Crie um novo admin** preenchendo:
   - Nome
   - Email (pode ser max.senai.ti@gmail.com para testar)
   
5. **Clique em "Enviar Convite"**

6. **Verifique**:
   - Toast de sucesso na tela
   - Email na caixa de entrada de max.senai.ti@gmail.com

## Opção 2: Testar via Terminal (PowerShell)

### Inicie o servidor em uma janela separada:
```powershell
# Terminal 1 - Servidor
cd C:\Code\game-day
.\start-invite-server.bat
```

### Em outro terminal, envie uma requisição de teste:
```powershell
# Terminal 2 - Teste
$body = @{
    name = "Admin Teste"
    email = "max.senai.ti@gmail.com"
    token = "test-$(Get-Random)"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
    -Uri "http://localhost:3002/send-invite" `
    -Body $body `
    -ContentType "application/json"
```

### Ou com curl:
```cmd
curl -X POST http://localhost:3002/send-invite ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Admin Teste\",\"email\":\"max.senai.ti@gmail.com\",\"token\":\"test-123\"}"
```

## O que o Sistema Faz

Quando você envia um convite, o servidor:

1. ✅ **Cria usuário no Supabase Auth** com senha temporária
2. ✅ **Insere registro na tabela `admins`** com token de convite
3. ✅ **Envia email via Gmail** contendo:
   - Link de convite: `http://localhost:8080/accept-invite?token=...`
   - Senha temporária gerada
   
## Logs do Servidor

O terminal do servidor mostrará:
```json
== invite result ==
authResult: {"user":{"id":"...","email":"..."},"password":"xyz123X!"}
upsert: {"data":[{"id":...,"email":"...","invite_token":"..."}]}
mailResult: {"sent":true,"info":{...}}
```

Se `mailResult.sent` for `true`, o email foi enviado com sucesso! 🎉

## Troubleshooting

### Servidor não inicia
- Verifique se a porta 3002 não está em uso
- Execute: `netstat -ano | findstr "3002"`
- Se estiver em uso, mate o processo ou mude a porta

### Email não chega
- Verifique SPAM/Lixeira
- Confirme que a senha de app está correta no Gmail
- Veja os logs do servidor para mensagens de erro

### Erro de autenticação SMTP
- Gmail requer senha de app (não a senha normal)
- Ative verificação em 2 etapas no Gmail
- Gere uma nova senha de app em: https://myaccount.google.com/apppasswords

## Arquivos Importantes

- `server/send-invite-server.js` - Servidor Node.js
- `start-invite-server.bat` - Script de inicialização
- `src/pages/Settings.tsx` - Interface de admin

## Próximos Passos

Para produção, você precisará:
1. Hospedar o servidor de convites (ex: Railway, Render)
2. Configurar variáveis de ambiente no host
3. Atualizar `FRONTEND_ORIGIN` para seu domínio
4. Considerar usar serviço de email profissional (SendGrid, AWS SES)
