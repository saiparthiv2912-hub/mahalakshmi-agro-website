const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// ---------- Simple JSON-file database ----------
// No native compilation required (unlike better-sqlite3), so this installs
// and runs cleanly on any machine with just Node.js.

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'quotes.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ nextId: 1, quotes: [] }, null, 2));

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function insertQuote(entry) {
  const db = readDb();
  const quote = {
    id: db.nextId,
    ...entry,
    status: 'new',
    created_at: new Date().toISOString(),
  };
  db.quotes.unshift(quote);
  db.nextId += 1;
  writeDb(db);
  return quote;
}

function listQuotes() {
  return readDb().quotes;
}

function getQuoteById(id) {
  return readDb().quotes.find((q) => q.id === Number(id));
}

function updateQuoteStatus(id, status) {
  const db = readDb();
  const quote = db.quotes.find((q) => q.id === Number(id));
  if (!quote) return null;
  quote.status = status;
  writeDb(db);
  return quote;
}

function deleteQuoteById(id) {
  const db = readDb();
  const before = db.quotes.length;
  db.quotes = db.quotes.filter((q) => q.id !== Number(id));
  writeDb(db);
  return db.quotes.length < before;
}

// ---------- App setup ----------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic auth middleware for admin routes
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    if (user === ADMIN_USER && pass === ADMIN_PASSWORD) {
      return next();
    }
  }
  res.set('WWW-Authenticate', 'Basic realm="Mahalaxmi Admin"');
  return res.status(401).send('Authentication required.');
}

// ---------- Public API ----------

// Submit a wholesale quote request
app.post('/api/quotes', (req, res) => {
  const { name, company, variety, quantity, message, phone, email } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!variety || typeof variety !== 'string' || !variety.trim()) {
    return res.status(400).json({ error: 'Rice variety is required.' });
  }

  let qty = null;
  if (quantity !== undefined && quantity !== null && quantity !== '') {
    qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }
  }

  const created = insertQuote({
    name: name.trim(),
    company: (company || '').trim() || null,
    variety: variety.trim(),
    quantity_tonnes: qty,
    message: (message || '').trim() || null,
    phone: (phone || '').trim() || null,
    email: (email || '').trim() || null,
  });

  res.status(201).json({ ok: true, quote: created });
});

// ---------- Admin API (protected) ----------

app.get('/api/quotes', requireAdmin, (req, res) => {
  res.json({ quotes: listQuotes() });
});

app.patch('/api/quotes/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['new', 'contacted', 'quoted', 'won', 'lost'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }
  const updated = updateQuoteStatus(id, status);
  if (!updated) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true, quote: updated });
});

app.delete('/api/quotes/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = getQuoteById(id);
  if (!existing) return res.status(404).json({ error: 'Not found.' });
  deleteQuoteById(id);
  res.json({ ok: true });
});

// Admin dashboard page (protected)
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mahalaxmi Agro Industries site running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin`);
  console.log(`  (username: ${ADMIN_USER}, password: set via ADMIN_PASSWORD env var, default "changeme123")`);
});
