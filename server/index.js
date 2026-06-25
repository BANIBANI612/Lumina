require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true }));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-secret';

const publicAppRoot = path.join(__dirname, '../lumina_pro');
const rootStatic = path.join(__dirname, '..');

app.use('/scripts', express.static(path.join(__dirname, '../scripts')));
app.use(express.static(publicAppRoot));
app.get('/manifest.json', (req, res) => res.sendFile(path.join(rootStatic, 'manifest.json')));
app.get('/sw.js', (req, res) => res.sendFile(path.join(rootStatic, 'sw.js')));
app.get('/', (req, res) => res.sendFile(path.join(publicAppRoot, 'code.html')));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });


function requireAdmin(req, res, next) {
  const token = req.get('Authorization')?.replace(/^Bearer\s+/, '') || req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (payload && payload.admin) return next();
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireUser(req, res, next) {
  const token = req.get('Authorization')?.replace(/^Bearer\s+/, '') || req.cookies?.user_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (payload && payload.userId) {
      req.user = payload;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{ username, password_hash, created_at: new Date().toISOString() }]);
    if (error) {
      if (error.code === '23505' || error.details?.includes('unique')) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      throw error;
    }
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
  try {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).limit(1).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
    const passwordMatch = await bcrypt.compare(password, data.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: data.id, username: data.username }, ADMIN_JWT_SECRET, { expiresIn: '2h' });
    res.json({ ok: true, token, username: data.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/subscribe', requireUser, async (req, res) => {
  const { plan } = req.body;
  if (!plan) return res.status(400).json({ error: 'Missing plan' });
  try {
    const { data, error } = await supabase.from('subscriptions').insert([{ user_id: req.user.userId, username: req.user.username, plan, created_at: new Date().toISOString() }]);
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin-only: fetch users or data
app.get('/api/admin/subscriptions', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin login to mint a short-lived JWT (for demo purposes only)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  // For production, validate against a user store. Here we use env vars or a simple check.
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'password';
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ admin: true, user: username }, ADMIN_JWT_SECRET, { expiresIn: '2h' });
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Server running on port', port));
