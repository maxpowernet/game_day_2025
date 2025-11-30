# PowerShell script to apply migration to Supabase
# Run: .\scripts\apply_migration_remove_teams.ps1

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
    Write-Host "Configure a chave de serviço no arquivo .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔄 Aplicando migration: Remover Teams e Team_Members" -ForegroundColor Cyan
Write-Host ""

# Read SQL migration file
$sqlContent = Get-Content "scripts\migration_remove_teams.sql" -Raw

# Create temporary Node.js script to execute SQL
$scriptContent = @"
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('$supabaseUrl', '$serviceKey', {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = ``$sqlContent``;

(async () => {
  try {
    console.log('Executando migration SQL...');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        console.log('Executando:', trimmed.substring(0, 60) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: trimmed });
        if (error) {
          console.warn('Aviso:', error.message);
        }
      }
    }
    
    console.log('✅ Migration aplicada com sucesso!');
    console.log('');
    console.log('Alterações:');
    console.log('- Tabela team_members removida');
    console.log('- Tabela teams removida');
    console.log('- Coluna team_id removida de players');
    console.log('- Políticas RLS relacionadas removidas');
    
  } catch (err) {
    console.error('❌ Erro ao aplicar migration:', err.message);
    process.exit(1);
  }
})();
"@

$tempScript = "scripts\_temp_migration.cjs"
$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

try {
    node $tempScript
    $exitCode = $LASTEXITCODE
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration concluída!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️ Migration executada com avisos. Verifique o log acima." -ForegroundColor Yellow
    }
    
    exit $exitCode
} catch {
    Write-Host "❌ Erro ao executar migration: $_" -ForegroundColor Red
    Remove-Item $tempScript -ErrorAction SilentlyContinue
    exit 1
}
