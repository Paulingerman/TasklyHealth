/* ═══════════════════════════════════════════════════════════════
   auth.js — Perfil local, sem login real e sem banco
═══════════════════════════════════════════════════════════════ */

let _regGoal = 'perda_peso';
let _profGoal = 'saude_geral';

function pickGoal(btn, gridId) {
  document.querySelectorAll(`#${gridId} .goal-opt`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (gridId === 'regGoalGrid') _regGoal = btn.dataset.g;
  else _profGoal = btn.dataset.g;
}

function togglePwd(inputId, icon) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  icon.className = inp.type === 'text' ? 'bx bx-show fi-eye' : 'bx bx-hide fi-eye';
}

async function doLogin() {
  await loadState();
  if (!S.user) {
    toast('Crie seu perfil local primeiro.', 'info');
    showAuthPage('register');
    return;
  }
  bootApp();
  toast(`Perfil carregado: ${S.user.name?.split(' ')[0] || 'usuario'}.`, 'success');
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail')?.value.trim() || '';
  const weight = parseFloat(document.getElementById('regWeight').value) || null;
  const height = parseFloat(document.getElementById('regHeight').value) || null;

  if (!name) {
    toast('Digite pelo menos seu nome.', 'error');
    return;
  }

  S.user = {
    id: 'local-user',
    name,
    email,
    weight,
    height,
    goal: _regGoal,
    createdAt: new Date().toISOString(),
    mode: 'local'
  };

  ls('tl_user', JSON.stringify(S.user));
  await loadState();
  bootApp();
  toast('Perfil local criado. Seus dados ficam neste navegador.', 'success');
}

function doLogout() {
  showAuth(true);
  showAuthPage('login');
  toast('Perfil fechado. Seus dados continuam salvos no navegador.', 'info');
}
