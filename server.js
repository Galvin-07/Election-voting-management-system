// Election Voting Management System - Candidate Management backend
// Zero dependencies: only Node's built-in modules. Run: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'candidates.json');
const PUBLIC = path.join(__dirname, 'public');

// ---------- Storage (JSON file) ----------
let candidates = [];
try { candidates = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { candidates = []; }
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(candidates, null, 2));

// ---------- Helpers ----------
const send = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};
const readBody = req => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', c => { raw += c; if (raw.length > 1e6) req.destroy(); });
  req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); } });
});
const clean = v => (typeof v === 'string' ? v.trim() : '');
const validate = c => {
  if (!c.id) return 'Candidate ID is required.';
  if (!c.name) return 'Name is required.';
  if (!c.party) return 'Party name is required.';
  if (!c.constituency) return 'Constituency is required.';
  return null;
};

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon' };

// ---------- API ----------
async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api','candidates',':id']
  const id = parts[2] ? decodeURIComponent(parts[2]) : null;

  try {
    // GET /api/candidates?q=term  -> view all / search by ID, name or party
    if (req.method === 'GET' && !id) {
      const q = clean(url.searchParams.get('q') || '').toLowerCase();
      const list = q
        ? candidates.filter(c => [c.id, c.name, c.party].some(f => f.toLowerCase().includes(q)))
        : candidates;
      return send(res, 200, list);
    }
    // GET /api/candidates/:id
    if (req.method === 'GET' && id) {
      const c = candidates.find(x => x.id === id);
      return c ? send(res, 200, c) : send(res, 404, { error: 'Candidate not found.' });
    }
    // POST /api/candidates -> add
    if (req.method === 'POST' && !id) {
      const b = await readBody(req);
      const c = { id: clean(b.id), name: clean(b.name), party: clean(b.party), constituency: clean(b.constituency) };
      const err = validate(c);
      if (err) return send(res, 400, { error: err });
      if (candidates.some(x => x.id.toLowerCase() === c.id.toLowerCase()))
        return send(res, 409, { error: `Candidate ID "${c.id}" already exists.` });
      candidates.push(c); save();
      return send(res, 201, c);
    }
    // PUT /api/candidates/:id -> update (name, party, constituency)
    if (req.method === 'PUT' && id) {
      const b = await readBody(req);
      const c = candidates.find(x => x.id === id);
      if (!c) return send(res, 404, { error: 'Candidate not found.' });
      const next = { ...c, name: clean(b.name) || c.name, party: clean(b.party) || c.party, constituency: clean(b.constituency) || c.constituency };
      Object.assign(c, next); save();
      return send(res, 200, c);
    }
    // DELETE /api/candidates/:id
    if (req.method === 'DELETE' && id) {
      const i = candidates.findIndex(x => x.id === id);
      if (i === -1) return send(res, 404, { error: 'Candidate not found.' });
      const [removed] = candidates.splice(i, 1); save();
      return send(res, 200, removed);
    }
    send(res, 405, { error: 'Method not allowed.' });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
}

// ---------- Server ----------
http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/candidates')) return handleApi(req, res, url);

  // static files
  const rel = url.pathname === '/' ? 'index.html' : url.pathname;
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Election system running at http://localhost:${PORT}`));
