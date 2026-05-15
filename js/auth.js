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
  toast(`Perfil carregado: ${S.user.name?.split(' ')[0] || 'usuário'}.`, 'success');
}

async function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail')?.value.trim() || '';
  const weight = readDecimal('regWeight', { min:30, max:300, label:'peso' });
  const height = readDecimal('regHeight', { min:100, max:250, label:'altura' });

  if (!name) {
    toast('Digite pelo menos seu nome.', 'error');
    return;
  }
  if (!/^[A-Za-zÀ-ÿ ]{3,}$/.test(name)) {
    toast('Digite um nome válido, usando apenas letras.', 'error');
    return;
  }
  if (weight === false || height === false) return;

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
