// ---------- Helpers ----------
function esc(v) {
  const d = document.createElement('div');
  d.textContent = v == null ? '' : v;
  return d.innerHTML;
}

const ROLE_TONE = { admin: '', faculty: 'good', student: 'warn' };

function cell(v) {
  const key = String(v == null ? '' : v).toLowerCase();
  if (key in ROLE_TONE) return '<span class="badge ' + ROLE_TONE[key] + '">' + esc(v) + '</span>';
  return esc(v);
}

function render(rows) {
  if (!rows) return '<p class="empty">No data.</p>';
  if (!Array.isArray(rows)) rows = [rows];
  if (rows.length === 0) return '<p class="empty">No data.</p>';
  const cols = Object.keys(rows[0]);
  return '<table><thead><tr>' + cols.map(c => '<th>' + esc(c.replace(/_/g, ' ')) + '</th>').join('') + '</tr></thead><tbody>'
    + rows.map(r => '<tr>' + cols.map(c => '<td>' + cell(r[c]) + '</td>').join('') + '</tr>').join('')
    + '</tbody></table>';
}

function renderStats(s) {
  const entries = Object.entries(s || {});
  if (!entries.length) return '<p class="empty">No summary data.</p>';
  return '<div class="stats">' + entries.map(([k, v]) =>
    '<div class="stat"><span class="num">' + esc(v == null ? 0 : v) + '</span><span class="label">' + esc(k.replace(/_/g, ' ')) + '</span></div>'
  ).join('') + '</div>';
}

async function load(url) {
  const res = await fetch(url);
  if (res.status === 401 || res.status === 403) { location.href = 'index.html'; return null; }
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    const box = document.getElementById('error');
    if (box) box.textContent = (data && data.error) || 'Request failed (' + res.status + ')';
    return null;
  }
  return data;
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  location.href = 'index.html';
}

async function whoami() {
  const today = document.getElementById('today');
  if (today) today.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const res = await fetch('/api/me');
  if (res.ok) document.getElementById('welcome').textContent = 'Welcome, ' + (await res.json()).name;
}

// ---------- Charts ----------
function pctTone(p) { return p >= 75 ? 'good' : p >= 50 ? '' : 'bad'; }

// items: [{label, value, tone?}]  – value is shown as-is plus suffix
function barChart(items, max = 100, suffix = '') {
  if (!items || !items.length) return '<p class="empty">Nothing to chart yet.</p>';
  return '<div class="bars">' + items.map(i => {
    const pct = Math.max(0, Math.min(100, (i.value / max) * 100));
    const tone = i.tone !== undefined ? i.tone : pctTone(pct);
    return '<div class="bar-row"><span class="bar-label" title="' + esc(i.label) + '">' + esc(i.label) + '</span>'
      + '<div class="bar-track"><div class="bar-fill ' + tone + '" style="width:' + pct + '%"></div></div>'
      + '<span class="bar-value">' + esc(i.value) + suffix + '</span></div>';
  }).join('') + '</div>';
}

// pct: 0-100. tone: 'good' | 'warn' | 'bad' (auto from pct if omitted)
function donut(pct, caption, tone) {
  pct = Math.max(0, Math.min(100, Number(pct) || 0));
  tone = tone || (pct >= 75 ? 'good' : pct >= 60 ? 'warn' : 'bad');
  return '<div class="donut-wrap"><div class="donut ' + tone + '" style="--pct:' + pct + '"><span>' + Math.round(pct) + '%</span></div>'
    + '<div class="muted">' + esc(caption || '') + '</div></div>';
}

function columnChart(items) {
  if (!items || !items.length) return '<p class="empty">Nothing to chart yet.</p>';
  const top = Math.max(...items.map(i => i.value), 1);
  return '<div class="cols">' + items.map(i =>
    '<div class="col"><span class="col-value">' + esc(i.value) + '</span>'
    + '<div class="col-fill" style="height:' + (i.value / top) * 100 + '%"></div>'
    + '<span class="col-label" title="' + esc(i.label) + '">' + esc(i.label) + '</span></div>'
  ).join('') + '</div>';
}