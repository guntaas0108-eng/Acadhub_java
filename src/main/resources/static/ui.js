/* ============================================================
   AcadHub · ui.js
   Purely additive UI layer. It never touches your API calls or
   input IDs. Load it BEFORE app.js:
     <script src="ui.js"></script><script src="app.js"></script>
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- icons (Lucide-style) ---------- */
  const ICONS = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    sparkle: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
  };
  const icon = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const hydrateIcons = (r = document) => $$('i[data-i]', r).forEach(e => { e.outerHTML = icon(e.dataset.i); });

  /* ---------- theme (dark default) with circular reveal ---------- */
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  root.dataset.theme = store.get('acadhub-theme') || 'dark';
  const applyTheme = t => { root.dataset.theme = t; store.set('acadhub-theme', t); };
  function toggleTheme(ev) {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) { applyTheme(next); return; }
    const btn = $('#themeToggle');
    const b = btn ? btn.getBoundingClientRect() : { left: innerWidth - 60, top: 20, width: 0, height: 0 };
    const x = ev && ev.clientX ? ev.clientX : b.left + b.width / 2;
    const y = ev && ev.clientY ? ev.clientY : b.top + b.height / 2;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
    )).catch(() => {});
  }

  /* ---------- toasts ---------- */
  function toast(type = 'info', msg = '', ms = 4200) {
    let box = $('#toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    while (box.children.length >= 4) box.firstElementChild.remove();
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const ico = { success: 'check', error: 'x', warning: 'alert', info: 'info' }[type] || 'info';
    t.innerHTML = `<span class="t-ic">${icon(ico)}</span><span class="t-msg"></span><button class="t-x" aria-label="Dismiss">${icon('x')}</button><span class="t-bar" style="animation-duration:${ms}ms"></span>`;
    $('.t-msg', t).textContent = msg;
    const close = () => { if (t.classList.contains('out')) return; t.classList.add('out'); setTimeout(() => t.remove(), 300); };
    $('.t-x', t).onclick = close;
    $('.t-bar', t).addEventListener('animationend', close);
    box.appendChild(t);
    if (type === 'success' && /marks|attendance|grade/i.test(msg)) confetti();
    return t;
  }
  // Replace browser alerts with toasts (app.js keeps working unchanged)
  window.alert = m => {
    const s = String(m);
    const type = /fail|error|invalid|wrong|denied|incorrect|unable|not found|unauthor|forbidden/i.test(s) ? 'error'
      : /success|saved|added|created|updated|deleted|marked|done|welcome/i.test(s) ? 'success'
      : /warn|select|enter|required|please|already|missing/i.test(s) ? 'warning' : 'info';
    toast(type, s);
  };

  /* ---------- top progress bar + fetch observer (transparent wrapper) ---------- */
  let pending = 0;
  const bar = on => {
    const b = $('#topbar') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'topbar' }));
    if (on) { b.className = ''; void b.offsetWidth; b.className = 'on'; } else { b.className = 'done'; }
  };
  const _fetch = window.fetch.bind(window);
  window.fetch = (...args) => {
    pending++; window.__fetched = true;
    if (document.body) { document.body.setAttribute('data-busy', ''); if (pending === 1) bar(true); }
    return _fetch(...args).then(
      r => { if (r.status >= 500) toast('error', 'Server error (' + r.status + '). Please try again.'); return r; },
      e => { toast('error', 'Network problem. Check your connection.'); throw e; }
    ).finally(() => { pending--; if (!pending && document.body) { document.body.removeAttribute('data-busy'); bar(false); } });
  };

  /* ---------- confetti ---------- */
  function confetti() {
    if (reduce) return;
    const c = document.createElement('canvas'); c.className = 'confetti';
    c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
    const g = c.getContext('2d');
    const cols = ['#14B8A6', '#38BDF8', '#5EEAD4', '#BAE6FD', '#F59E0B'];
    const ps = Array.from({ length: 110 }, () => ({
      x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 3,
      s: Math.random() * 7 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.random() * cols.length | 0]
    }));
    let f = 0;
    (function tick() {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); g.restore(); });
      if (++f < 130) requestAnimationFrame(tick); else c.remove();
    })();
  }
  function celebrateOnce() {
    if (document.body.dataset.page !== 'student') return;
    if (store.get('ah-confetti-' + new Date().toDateString())) return;
    store.set('ah-confetti-' + new Date().toDateString(), '1'); confetti();
  }

  /* ---------- count-up, rings, sparklines ---------- */
  function countStat(el) {
    const txt = el.textContent.trim();
    if (el.dataset.counting || el.dataset.last === txt) return;
    el.dataset.last = txt;
    if (!/^\d[\d,]*(\.\d+)?$/.test(txt) || reduce) return;
    const n = parseFloat(txt.replace(/,/g, '')), dec = txt.includes('.') ? txt.split('.')[1].length : 0;
    const t0 = performance.now(), dur = 900;
    el.dataset.counting = '1';
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? (n * e).toFixed(dec) : txt;
      if (p < 1) requestAnimationFrame(step); else delete el.dataset.counting;
    })(t0);
  }
  function ringUpdate(w) {
    const v = $('.ring-val', w); if (!v) return;
    const m = v.textContent.match(/\d+(\.\d+)?/); if (!m) return;
    const p = Math.min(100, +m[0]);
    if (w.dataset.p === String(p)) return;
    w.dataset.p = p;
    if (/^\s*\d+(\.\d+)?\s*$/.test(v.textContent)) v.textContent = p + '%';
    const fg = $('.ring-fg', w), C = 2 * Math.PI * 52;
    fg.style.strokeDasharray = C; fg.style.strokeDashoffset = C * (1 - p / 100);
    w.classList.toggle('low', p < 75); w.classList.toggle('mid', p >= 75 && p < 80);
  }
  function sparkRender(el) {
    const vals = (el.dataset.spark || '').split(',').map(Number).filter(n => !isNaN(n));
    if (vals.length < 2 || el.dataset.drawn === el.dataset.spark) return;
    el.dataset.drawn = el.dataset.spark;
    const max = Math.max(...vals), min = Math.min(...vals), rng = max - min || 1;
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 100, 30 - ((v - min) / rng) * 26]);
    el.innerHTML = `<svg class="spark" viewBox="0 0 100 34" preserveAspectRatio="none"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}" vector-effect="non-scaling-stroke"/></svg>`;
  }

  /* ---------- table enhancement (grade badges, bars, chips, empty states) ---------- */
  const GRADE = /^(A\+|A|B\+|B|C\+|C|D|E|F|O)$/i;
  const PCT = /^(\d{1,3}(?:\.\d+)?)\s*%$/;
  const gradeClass = g => { g = g.toUpperCase(); return g === 'A+' || g === 'O' ? 'g-ap' : g[0] === 'A' ? 'g-a' : g[0] === 'B' ? 'g-b' : g[0] === 'C' ? 'g-c' : (g === 'F' || g === 'E') ? 'g-f' : 'g-d'; };
  function enhanceCell(td) {
    if (td.dataset.e || td.childElementCount) return;
    const txt = td.textContent.trim(); let m;
    if (GRADE.test(txt)) {
      td.dataset.e = '1';
      td.innerHTML = `<span class="grade ${gradeClass(txt)}">${esc(txt.toUpperCase())}</span>`;
      if (/^(A\+|O)$/i.test(txt)) celebrateOnce();
    } else if ((m = txt.match(PCT))) {
      const v = Math.min(100, +m[1]), low = v < 75;
      td.dataset.e = '1';
      td.innerHTML = `<div class="pbar ${low ? 'low' : 'ok'}"><span class="pbar-fill" style="--w:${v}%"></span></div><b class="pv">${v}%</b>` +
        (low ? `<span class="chip ${v < 60 ? 'danger' : 'warn'}">${v < 60 ? 'Critical' : 'At risk'}</span>` : '');
      if (low) { const tr = td.closest('tr'); if (tr) tr.classList.add('risk-row'); }
    } else if (/^(present|absent|late|pass|fail)$/i.test(txt)) {
      const k = txt.toLowerCase(), cls = (k === 'present' || k === 'pass') ? 'ok' : k === 'late' ? 'warn' : 'danger';
      td.dataset.e = '1';
      td.innerHTML = `<span class="chip ${cls}">${esc(txt)}</span>`;
    }
  }
  const EMPTY_SVG = `<svg viewBox="0 0 120 100" fill="none"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14B8A6"/><stop offset="1" stop-color="#38BDF8"/></linearGradient></defs><ellipse cx="60" cy="90" rx="34" ry="5" fill="currentColor" opacity=".08"/><rect x="22" y="26" width="76" height="54" rx="10" fill="url(#eg)" opacity=".15" stroke="url(#eg)" stroke-width="2"/><path d="M22 58h22l6 9h20l6-9h22" stroke="url(#eg)" stroke-width="2" stroke-linejoin="round"/><circle cx="90" cy="22" r="5" fill="url(#eg)" opacity=".7"/><circle cx="30" cy="16" r="3" fill="url(#eg)" opacity=".5"/></svg>`;
  function initTableWraps() {
    $$('.table-wrap').forEach(w => {
      if ($('.empty', w)) return;
      const e = document.createElement('div'); e.className = 'empty';
      e.innerHTML = `${EMPTY_SVG}<b>${esc(w.dataset.emptyTitle || 'Nothing here yet')}</b><span>${esc(w.dataset.emptyText || 'Records will appear here once they are added.')}</span>`;
      const s = document.createElement('div'); s.className = 'skel'; s.innerHTML = '<i></i><i></i><i></i><i></i>';
      w.append(e, s);
    });
  }
  function enhanceAll() {
    $$('td:not([data-e])').forEach(enhanceCell);
    $$('tbody').forEach(tb => Array.from(tb.rows).forEach((r, i) => { if (!r.style.getPropertyValue('--i')) r.style.setProperty('--i', Math.min(i, 14)); }));
    $$('.table-wrap').forEach(w => w.classList.toggle('is-empty', !w.querySelector('tbody tr')));
    $$('.stat-value').forEach(countStat);
    $$('.ring-wrap').forEach(ringUpdate);
    $$('[data-spark]').forEach(sparkRender);
    // surface inline errors as toasts + shake
    $$('.form-error').forEach(e => {
      const t = e.textContent.trim();
      if (t && e.dataset.seen !== t) {
        e.dataset.seen = t; toast('error', t);
        const c = e.closest('.card'); if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
      } else if (!t) delete e.dataset.seen;
    });
    // smart insight strip
    $$('[data-insight]').forEach(el => {
      if (!window.__fetched || document.body.hasAttribute('data-busy')) return;
      const n = $$(el.dataset.insight + ' tr.risk-row').length;
      const txt = $('.insight-text', el);
      const msg = n ? `${n} student${n > 1 ? 's are' : ' is'} below 75% attendance and need attention.` : 'All clear. No students are below the 75% attendance line.';
      if (txt && txt.textContent !== msg) { txt.textContent = msg; el.classList.toggle('alert', n > 0); }
    });
  }

  /* ---------- segmented tabs ---------- */
  function initTabs() {
    $$('.seg').forEach(seg => {
      let pill = $('.seg-pill', seg);
      if (!pill) {
        pill = document.createElement('span'); pill.className = 'seg-pill'; seg.prepend(pill);
      }
      const btns = $$('[data-tab]', seg);
      if (!btns.length) return;
      const go = b => {
        btns.forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b); });
        pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft - 4}px)`;
        $$(`.tab-panel[data-group="${seg.dataset.group}"]`).forEach(p => p.classList.toggle('show', p.id === b.dataset.tab));
      };
      btns.forEach(b => b.addEventListener('click', () => go(b)));
      const activeBtn = $('.active', seg) || btns[0];
      go(activeBtn);
      const re = () => go($('.active', seg) || btns[0]);
      addEventListener('resize', re); addEventListener('load', re);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(re);
    });
  }

  /* ---------- command palette (Ctrl/Cmd+K or /) ---------- */
  function initPalette() {
    const el = document.createElement('div'); el.className = 'palette';
    el.innerHTML = `<div class="pal-box" role="dialog" aria-modal="true" aria-label="Command palette"><div class="pal-in">${icon('search')}<input placeholder="Type a command or search…" aria-label="Search commands"><kbd>Esc</kbd></div><ul class="pal-list"></ul></div>`;
    document.body.appendChild(el);
    const input = $('input', el), list = $('.pal-list', el);
    let cmds = [], shown = [], idx = 0;
    const build = () => {
      cmds = [];
      $$('.nav a').forEach(a => cmds.push({ t: 'Go to ' + a.textContent.trim(), i: 'arrow', run: () => { location.href = a.href; } }));
      $$('[data-tab]').forEach(b => cmds.push({ t: 'Open ' + b.textContent.trim() + ' tab', i: 'plus', run: () => { b.click(); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }));
      cmds.push({ t: 'Toggle light / dark theme', i: 'moon', k: 'T', run: () => toggleTheme() });
      cmds.push({ t: 'Print this page', i: 'printer', run: () => print() });
      cmds.push({ t: 'Sign out', i: 'logout', run: () => { if (typeof window.logout === 'function') window.logout(); else location.href = 'index.html'; } });
    };
    const render = () => {
      const q = input.value.trim().toLowerCase();
      shown = cmds.filter(c => c.t.toLowerCase().includes(q)); idx = Math.min(idx, Math.max(0, shown.length - 1));
      list.innerHTML = shown.length ? shown.map((c, n) => `<li class="${n === idx ? 'sel' : ''}" data-n="${n}">${icon(c.i)}<span>${esc(c.t)}</span>${c.k ? `<kbd>${c.k}</kbd>` : ''}</li>`).join('') : '<li class="pal-none">No matching commands</li>';
    };
    const open = () => { build(); input.value = ''; idx = 0; render(); el.classList.add('open'); setTimeout(() => input.focus(), 30); };
    const close = () => el.classList.remove('open');
    const run = n => { const c = shown[n]; if (c) { close(); c.run(); } };
    input.addEventListener('input', () => { idx = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % Math.max(1, shown.length); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + shown.length) % Math.max(1, shown.length); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(idx); }
      else if (e.key === 'Escape') close();
    });
    list.addEventListener('click', e => { const li = e.target.closest('li[data-n]'); if (li) run(+li.dataset.n); });
    el.addEventListener('click', e => { if (e.target === el) close(); });
    $$('[data-open-palette]').forEach(b => b.addEventListener('click', open));
    return { open, close, toggle: () => (el.classList.contains('open') ? close() : open()) };
  }

  /* ---------- greeting + clock ---------- */
  function greet() {
    const h = new Date().getHours();
    const g = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
    $$('[data-greeting]').forEach(e => { e.textContent = g; });
  }
  function clock() {
    const d = new Date();
    $$('[data-clock]').forEach(e => {
      e.textContent = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }

  /* ---------- init ---------- */
  function init() {
    hydrateIcons();
    const tt = $('#themeToggle'); if (tt) tt.addEventListener('click', toggleTheme);
    $$('.bento > *').forEach((c, i) => c.style.setProperty('--i', i));
    initTableWraps(); initTabs();
    const pal = initPalette();
    greet(); clock(); setInterval(() => { greet(); clock(); }, 20000);

    // collapsible cards
    document.addEventListener('click', e => { const b = e.target.closest('[data-collapse]'); if (b) b.closest('.collapsible').classList.toggle('collapsed'); });
    
    // login role chips -> hidden #role select (if present)
    $$('.role-chip').forEach(ch => ch.addEventListener('click', () => {
      $$('.role-chip').forEach(x => x.classList.toggle('active', x === ch));
      const sel = $('#role'); 
      if (sel) { 
        sel.value = ch.dataset.role; 
        sel.dispatchEvent(new Event('change', { bubbles: true })); 
      }
    }));
    
    // password reveal
    $$('[data-eye]').forEach(b => b.addEventListener('click', () => { const i = $(b.dataset.eye); if (i) i.type = i.type === 'password' ? 'text' : 'password'; }));
    
    // ripple + spotlight + magnetic
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest('.btn'); if (!b || reduce) return;
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement('span');
      s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s); setTimeout(() => s.remove(), 600);
    });
    document.addEventListener('pointermove', e => {
      const c = e.target.closest && e.target.closest('.card');
      if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    });
    if (!reduce) $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .2}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    
    // shortcuts
    addEventListener('keydown', e => {
      const typing = /input|textarea|select/i.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.toggle(); return; }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); pal.open(); }
      else if (e.key.toLowerCase() === 't') toggleTheme();
    });

    // watch DOM so rows/numbers rendered by app.js get enhanced automatically
    enhanceAll();
    let raf = 0;
    new MutationObserver(() => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; enhanceAll(); }); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.UI = { toast, confetti, toggleTheme, icon };
})();
