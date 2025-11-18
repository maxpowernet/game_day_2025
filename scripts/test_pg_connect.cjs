const fs = require('fs');
const { Client } = require('pg');

function readMcp() {
  const path = './.vscode/mcp.json';
  const raw = fs.readFileSync(path, 'utf8');
  const noComments = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return JSON.parse(noComments);
}

(async () => {
  try {
    const conf = readMcp();
    const env = conf.servers && conf.servers.postgres && conf.servers.postgres.env;
    if (!env) throw new Error('Postgres env not found in .vscode/mcp.json');
    const client = new Client({
      host: env.POSTGRES_HOST || 'localhost',
      port: parseInt(env.POSTGRES_PORT || '5432', 10),
      database: env.POSTGRES_DATABASE || 'game-day',
      user: env.POSTGRES_USER || 'postgres',
      password: env.POSTGRES_PASSWORD || '',
      connectionTimeoutMillis: 5000,
    });

    console.log('Attempting to connect to Postgres with:', { host: client.host, port: client.port, database: client.database, user: client.user });
    await client.connect();
    const res = await client.query("SELECT version() as v, current_database() as db, current_user as user");
    console.log('Connection successful:', res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    process.exit(2);
  }
})();
