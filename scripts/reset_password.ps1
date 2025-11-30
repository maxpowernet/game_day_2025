# PowerShell script to reset user password
# Run: .\scripts\reset_password.ps1

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}

$supabaseUrl = $env:SUPABASE_URL
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $serviceKey -or $serviceKey -eq 'your_service_role_key_here') {
    Write-Host "❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para resetar senha, você precisa:" -ForegroundColor Yellow
    Write-Host "1. Acessar: https://app.supabase.com/project/_/settings/api" -ForegroundColor Cyan
    Write-Host "2. Copiar a 'service_role key' (mantenha SECRETO!)" -ForegroundColor Cyan
    Write-Host "3. Adicionar no arquivo .env:" -ForegroundColor Cyan
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️ NUNCA compartilhe ou commite esta chave no git!" -ForegroundColor Red
    exit 1
}

$email = "max.eldon@gmail.com"
$newPassword = "123456"

Write-Host "🔄 Resetando senha para: $email" -ForegroundColor Cyan

# Create temporary Node.js script
$scriptContent = @"
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('$supabaseUrl', '$serviceKey', {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  try {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.users.find(u => u.email === '$email');
    if (!user) {
      console.error('❌ Usuário não encontrado: $email');
      process.exit(1);
    }

    console.log('✅ Usuário encontrado. ID:', user.id);

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: '$newPassword'
    });

    if (error) throw error;

    console.log('✅ Senha atualizada com sucesso!');
    console.log('');
    console.log('📋 Credenciais de login:');
    console.log('Email: $email');
    console.log('Senha: $newPassword');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
"@

$tempScript = "scripts\_temp_reset.cjs"
$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

try {
    node $tempScript
    $exitCode = $LASTEXITCODE
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    exit $exitCode
} catch {
    Write-Host "❌ Erro ao executar script: $_" -ForegroundColor Red
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    exit 1
}
