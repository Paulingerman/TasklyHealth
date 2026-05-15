/* ═══════════════════════════════════════════════════════════════
   main.js — Inicialização local do aplicativo
═══════════════════════════════════════════════════════════════ */

(function init() {
  const savedTheme = ls('tl_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeIcon = document.querySelector('#themeBtn i');
  if (themeIcon) themeIcon.className = savedTheme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';

  const updateDate = () => {
    const el = document.getElementById('topDate');
    if (el) el.textContent = new Date().toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' });
  };
  updateDate();
  setInterval(updateDate, 60000);

  loadState().then(() => {
    if (S.user) bootApp();
    else {
      showAuth(true);
      showAuthPage('register');
    }
  });
})();


/* ═══════════════════════════════════════════════════════════════
   Taskly input filters — letras em campos de texto e números em campos numéricos
═══════════════════════════════════════════════════════════════ */
function normalizeDecimalText(value) {
  let v = String(value || '').replace(',', '.').replace(/[^0-9.]/g, '');
  const parts = v.split('.');
  if (parts.length > 2) v = `${parts.shift()}.${parts.join('')}`;
  return v;
}

function readDecimal(id, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return null;
  const raw = normalizeDecimalText(el.value);
  if (!raw) return null;
  const value = Number(raw);

  if (!Number.isFinite(value)) {
    toast(`Digite um valor válido para ${opts.label || 'o campo'}.`, 'error');
    el.focus();
    return false;
  }

  if (opts.min !== undefined && value < opts.min) {
    toast(`${opts.label || 'O valor'} deve ser no mínimo ${opts.min}.`, 'error');
    el.focus();
    return false;
  }

  if (opts.max !== undefined && value > opts.max) {
    toast(`${opts.label || 'O valor'} deve ser no máximo ${opts.max}.`, 'error');
    el.focus();
    return false;
  }

  return value;
}

document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (!el || !el.matches('input[data-only]')) return;

  const mode = el.dataset.only;
  const before = el.value;

  if (mode === 'letters') {
    el.value = before.replace(/[^A-Za-zÀ-ÿ\s]/g, '').replace(/\s{2,}/g, ' ');
  }

  if (mode === 'integer') {
    el.value = before.replace(/\D/g, '');
  }

  if (mode === 'decimal') {
    el.value = normalizeDecimalText(before).replace('.', ',');
  }
});

document.addEventListener('keydown', (ev) => {
  const el = ev.target;
  if (!el || !el.matches('input[data-only="integer"], input[data-only="decimal"]')) return;
  if (['e', 'E', '+', '-'].includes(ev.key)) ev.preventDefault();
});
