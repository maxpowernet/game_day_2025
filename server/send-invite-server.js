#!/usr/bin/env node
/*
  Simple local invite sender for development.
  Run with: node server/send-invite-server.js
  Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

  This server accepts POST /send-invite with JSON { name, email, token }
  and will create a confirmed auth user (if possible) and upsert the
  `admins` row via Supabase REST using the service role key.

  This is intended for local development only. Do NOT run in production
  or expose the service role key.
*/

import http from 'http';
import nodemailer from 'nodemailer';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

// SMTP env vars (optional)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || `Game Day <no-reply@localhost>`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

function jsonResponse(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function createAuthUser(email) {
  // create a random password for the invited user
  const password = 'x' + Math.random().toString(36).slice(2, 12) + 'X!';
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      // return object with error info
      return { error: json };
    }
    return { user: json, password };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

async function upsertAdminRow({ name, email, token, auth_uid }) {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/admins`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({ name, email, invited: true, invite_token: token, auth_uid }),
    });
    const json = await resp.json();
    if (!resp.ok) return { error: json };
    return { data: json };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

async function trySendEmail({ to, name, link, password }) {
  if (!SMTP_HOST) return { skipped: true, reason: 'SMTP not configured' };

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
    secure: (process.env.SMTP_SECURE === 'true'),
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  const text = `Olá ${name || ''},\n\nVocê foi convidado para acessar o Game Day. Abra o link abaixo para aceitar o convite:\n\n${link}\n\n${password ? `Senha temporária: ${password}\n` : ''}\n`;
  const html = `<p>Olá ${name || ''},</p><p>Você foi convidado para acessar o <strong>Game Day</strong>. Abra o link abaixo para aceitar o convite:</p><p><a href="${link}">${link}</a></p>${password ? `<p>Senha temporária: <code>${password}</code></p>` : ''}`;

  try {
    const info = await transporter.sendMail({ from: SMTP_FROM, to, subject: 'Convite para Game Day', text, html });
    return { sent: true, info };
  } catch (err) {
    return { sent: false, error: err?.message || String(err) };
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/send-invite') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { name, email, token } = payload;
        if (!email || !token) return jsonResponse(res, 400, { error: 'Missing email or token' });

        // Try to create auth user
        const authResult = await createAuthUser(email);
        let auth_uid = null;
        if (authResult.user && authResult.user.id) {
          auth_uid = authResult.user.id;
        }

        // Upsert admin row in DB
        const upsert = await upsertAdminRow({ name: name || email.split('@')[0], email, token, auth_uid });
        if (upsert.error) {
          return jsonResponse(res, 500, { error: upsert.error });
        }

        // Build invite link (frontend expected path /accept-invite)
        const link = `${(process.env.FRONTEND_ORIGIN || 'http://localhost:8080').replace(/\/$/, '')}/accept-invite?token=${token}`;

        // Try to send email (if SMTP configured). Include temporary password when auth user was created.
        const mailResult = await trySendEmail({ to: email, name: name || email.split('@')[0], link, password: authResult?.password });

        // Log results for debugging (will appear in server terminal)
        console.log('== invite result ==');
        console.log('authResult:', JSON.stringify(authResult));
        console.log('upsert:', JSON.stringify(upsert));
        console.log('mailResult:', JSON.stringify(mailResult));

        return jsonResponse(res, 200, { success: true, link, authResult, mailResult });
      } catch (err) {
        return jsonResponse(res, 500, { error: err.message || String(err) });
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Invite server listening on http://localhost:${PORT}/send-invite`);
});
