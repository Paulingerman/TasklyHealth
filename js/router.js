/* ═══════════════════════════════════════════════════════════════
   router.js — Navegação entre páginas separadas, tema, toasts, helpers
═══════════════════════════════════════════════════════════════ */

const CRUMBS = {
  dashboard: 'Dashboard',
  hydration: 'Hidratacao',
  exercises: 'Exercicios',
  diet:      'Alimentacao',
  routine:   'Minha Rotina',
  progress:  'Progresso',
  profile:   'Perfil',
};

const PAGE_FILES = {
  dashboard: 'pages/dashboard.html',
  hydration: 'pages/hydration.html',
  exercises: 'pages/exercises.html',
  diet:      'pages/diet.html',
  routine:   'pages/routine.html',
  progress:  'pages/progress.html',
  profile:   'pages/profile.html',
};

const PAGE_CACHE = {};
let currentPage = null;

async function loadPage(name) {
  const root = document.getElementById('page-root');
  const file = PAGE_FILES[name] || PAGE_FILES.dashboard;

  if (!root) return;

  if (!PAGE_CACHE[name]) {
    root.innerHTML = `
      <div class="page-loading">
        <i class='bx bx-loader-alt bx-spin'></i>
        Carregando pagina...
      </div>`;

    try {
      const res = await fetch(file, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      PAGE_CACHE[name] = await res.text();
    } catch (err) {
      root.innerHTML = `
        <div class="empty" style="margin-top:1rem">
          <div class="empty-icon"><i class='bx bx-error-circle'></i></div>
          <h3 class="empty-title">Nao consegui carregar esta pagina</h3>
          <p class="empty-desc">
            Rode o projeto pelo servidor, por exemplo <strong>npm start</strong> dentro da pasta backend,
            e acesse pelo navegador em <strong>http://localhost:3000</strong>.
          </p>
        </div>`;
      console.error('Erro ao carregar pagina:', file, err);
      return;
    }
  }

  root.innerHTML = PAGE_CACHE[name];
  root.dataset.page = name;
  currentPage = name;
}

/* ── Roteamento ──────────────────────────────────────────────── */
async function go(name) {
  const page = PAGE_FILES[name] ? name : 'dashboard';

  await loadPage(page);

  document.querySelectorAll('.sb-link').forEach(l => l.classList.toggle('active', l.dataset.p === page));
  document.querySelectorAll('.bn-item').forEach(b => b.classList.toggle('active', b.dataset.p === page));

  const crumb = document.getElementById('topCrumb');
  if (crumb) crumb.innerHTML = `<strong>${CRUMBS[page] || page}</strong>`;

  closeSidebar();

  const renders = {
    dashboard: renderDashboard,
    hydration: renderHydration,
    exercises: renderExercises,
    diet:      renderDiet,
    routine:   renderRoutine,
    progress:  renderProgress,
    profile:   renderProfile,
  };

  if (renders[page]) renders[page]();
}

/* ── Sidebar ─────────────────────────────────────────────────── */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

/* ── Tema ────────────────────────────────────────────────────── */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  ls('tl_theme', next);

  const icon = document.querySelector('#themeBtn i');
  if (icon) icon.className = next === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
}

/* ── Toast ───────────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const icons = { success:'bx-check-circle', error:'bx-error-circle', info:'bx-info-circle' };
  const el = document.createElement('div');
  el.className = `toast t-${type}`;
  el.innerHTML = `<i class='bx ${icons[type]}'></i><span>${msg}</span>`;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── Helpers utilitários ─────────────────────────────────────── */
const pad2     = n  => String(Math.floor(n)).padStart(2, '0');
const fmtTime  = s  => `${pad2(s / 60)}:${pad2(s % 60)}`;
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};

/* ── Autenticação — mostrar/ocultar ─────────────────────────── */
function showAuth(on) {
  document.getElementById('auth-root').classList.toggle('active', on);
  document.getElementById('app-root').style.display = on ? 'none' : 'flex';
}

function showAuthPage(page) {
  document.getElementById('auth-login').style.display    = page === 'login'    ? '' : 'none';
  document.getElementById('auth-register').style.display = page === 'register' ? '' : 'none';
}

/* ── Boot do app ─────────────────────────────────────────────── */
function bootApp() {
  showAuth(false);
  const u = S.user;
  document.getElementById('sbAvatar').textContent = u?.name?.[0]?.toUpperCase() || '?';
  document.getElementById('sbName').textContent   = u?.name  || '—';
  document.getElementById('sbGoal').textContent   = GOAL_LABELS[u?.goal] || 'Saude Geral';
  go('dashboard');
}

/* ── Helpers de progresso (compartilhados) ───────────────────── */
function getLast7() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function dayScore(key) {
  const d  = S.healthLog[key] || {};
  const r  = S.routine;
  let sc = 0, tot = 0;
  if (r.waterGoal)         { tot++; if ((d.water  || 0) >= r.waterGoal) sc++; }
  if (r.exercises?.length) { tot++; if (d.exercise) sc++; }
  if (r.breakfast)         { tot++; if (d.breakfast) sc++; }
  if (r.lunch)             { tot++; if (d.lunch)     sc++; }
  if (r.dinner)            { tot++; if (d.dinner)    sc++; }
  if (r.snack)             { tot++; if (d.snack)     sc++; }
  if (r.sleepGoal)         { tot++; if (d.sleep)     sc++; }
  return tot > 0 ? Math.round((sc / tot) * 100) : 0;
}

function calcStreak() {
  const days = getLast7();
  let s = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (dayScore(days[i]) >= 80) s++;
    else break;
  }
  return s;
}

function calcWeekAvg() {
  const days = getLast7();
  return Math.round(days.reduce((a, d) => a + dayScore(d), 0) / 7);
}

function buildWeekChart(containerId, barH) {
  const days  = getLast7();
  const today = todayKey();
  const el    = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = days.map((d, i) => {
    const sc      = dayScore(d);
    const isToday = d === today;
    const h       = Math.max(4, Math.round((sc / 100) * barH));
    const name    = DAY_NAMES[new Date(d + 'T12:00').getDay()];
    const col     = SCORE_COLOR(sc);
    return `<div class="wc-col ${isToday ? 'wc-today' : ''}">
      <div class="wc-bar" style="height:${h}px;background:${col};opacity:${sc > 0 ? 1 : .2}" data-tip="${sc}% — ${name}"></div>
      <span class="wc-label">${name}</span>
    </div>`;
  }).join('');
}

/* ── Eventos globais ─────────────────────────────────────────── */
document.addEventListener('click', e => {
  const dd = document.getElementById('foodDropdown');
  const fs = document.getElementById('foodSearch');
  if (dd && fs && !dd.contains(e.target) && e.target !== fs) dd.classList.remove('open');
  if (e.target.id === 'sbOverlay') closeSidebar();
  if (e.target.id === 'exModal')   closeExModal();
});

['loginEmail', 'loginPwd'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});
