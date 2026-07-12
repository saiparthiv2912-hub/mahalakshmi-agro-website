const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set.');
  console.error('Set it to your MongoDB Atlas connection string before starting the server.');
  process.exit(1);
}

// ---------- Database setup (MongoDB Atlas) ----------
mongoose.set('strictQuery', true);

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB Atlas:', err.message);
    process.exit(1);
  });

const quoteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, default: null },
  variety: { type: String, required: true },
  quantity_tonnes: { type: Number, default: null },
  message: { type: String, default: null },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  status: {
    type: String,
    enum: ['new', 'contacted', 'quoted', 'won', 'lost'],
    default: 'new',
  },
  created_at: { type: Date, default: Date.now },
});

const Quote = mongoose.model('Quote', quoteSchema);

function serializeQuote(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    company: doc.company,
    variety: doc.variety,
    quantity_tonnes: doc.quantity_tonnes,
    message: doc.message,
    phone: doc.phone,
    email: doc.email,
    status: doc.status,
    created_at: doc.created_at.toISOString(),
  };
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
app.post('/api/quotes', async (req, res) => {
  try {
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

    const doc = await Quote.create({
      name: name.trim(),
      company: (company || '').trim() || null,
      variety: variety.trim(),
      quantity_tonnes: qty,
      message: (message || '').trim() || null,
      phone: (phone || '').trim() || null,
      email: (email || '').trim() || null,
    });

    res.status(201).json({ ok: true, quote: serializeQuote(doc) });
  } catch (err) {
    console.error('POST /api/quotes error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ---------- Admin API (protected) ----------

app.get('/api/quotes', requireAdmin, async (req, res) => {
  try {
    const docs = await Quote.find().sort({ created_at: -1 });
    res.json({ quotes: docs.map(serializeQuote) });
  } catch (err) {
    console.error('GET /api/quotes error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.patch('/api/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['new', 'contacted', 'quoted', 'won', 'lost'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }
    const doc = await Quote.findByIdAndUpdate(id, { status }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found.' });
    res.json({ ok: true, quote: serializeQuote(doc) });
  } catch (err) {
    console.error('PATCH /api/quotes/:id error:', err);
    res.status(400).json({ error: 'Invalid request.' });
  }
});

app.delete('/api/quotes/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Quote.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/quotes/:id error:', err);
    res.status(400).json({ error: 'Invalid request.' });
  }
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
