/* ═══════════════════════════════════════════════════════════════
   profile.js — Perfil local, IMC e backup
═══════════════════════════════════════════════════════════════ */

function renderProfile() {
  const u = S.user;
  if (!u) return;

  document.getElementById('profAv').textContent = u.name?.[0]?.toUpperCase() || '?';
  document.getElementById('profName').textContent = u.name || '—';
  document.getElementById('profEmail').textContent = u.email || 'Perfil local';
  document.getElementById('profGoalBadge').innerHTML = `<i class='bx bx-target-lock'></i>${GOAL_LABELS[u.goal] || 'Saúde Geral'}`;

  document.getElementById('profNameIn').value = u.name || '';
  document.getElementById('profWeightIn').value = u.weight || '';
  document.getElementById('profHeightIn').value = u.height || '';

  _profGoal = u.goal || 'saude_geral';
  document.querySelectorAll('#profGoalGrid .goal-opt').forEach(b => b.classList.toggle('active', b.dataset.g === _profGoal));

  if (u.weight && u.height) {
    const h = u.height / 100;
    const imc = +(u.weight / (h * h)).toFixed(1);
    const [cat, col] = imc < 18.5 ? ['Abaixo do peso', 'var(--blue)'] : imc < 25 ? ['Peso normal', 'var(--accent)'] : imc < 30 ? ['Sobrepeso', 'var(--amber)'] : ['Obesidade', 'var(--red)'];
    document.getElementById('imcBlock').style.display = '';
    document.getElementById('imcVal').textContent = imc;
    document.getElementById('imcCat').textContent = cat;
    document.getElementById('imcCat').style.color = col;
  } else {
    document.getElementById('imcBlock').style.display = 'none';
  }

  const r = S.routine;
  document.getElementById('routineSummary').innerHTML = `
    <div class="data-row"><span class="data-row-label">Meta de água</span><span class="data-row-value">${r.waterGoal || 2}L / dia</span></div>
    <div class="data-row"><span class="data-row-label">Meta de sono</span><span class="data-row-value">${r.sleepGoal || 8}h / noite</span></div>
    <div class="data-row"><span class="data-row-label">Modalidades</span><span class="data-row-value">${r.exercises?.length ? r.exercises.join(', ') : 'Não definido'}</span></div>
    <div class="data-row"><span class="data-row-label">Dias de treino</span><span class="data-row-value">${r.exerciseDays?.length ? `${r.exerciseDays.length} dias/semana` : 'Não definido'}</span></div>
    <div class="data-row"><span class="data-row-label">Fichas alimentares</span><span class="data-row-value">${S.mealTemplates?.length || 0}</span></div>
    <div class="data-row"><span class="data-row-label">Fichas de treino</span><span class="data-row-value">${S.workoutTemplates?.length || 0}</span></div>
    <div class="data-row"><span class="data-row-label">Membro desde</span><span class="data-row-value">${u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '—'}</span></div>`;
}

async function saveProfile() {
  const name = document.getElementById('profNameIn').value.trim();
  const weight = readDecimal('profWeightIn', { min:30, max:300, label:'peso' });
  const height = readDecimal('profHeightIn', { min:100, max:250, label:'altura' });
  if (!name) { toast('Digite seu nome.', 'error'); return; }
  if (!/^[A-Za-zÀ-ÿ ]{3,}$/.test(name)) { toast('Digite um nome válido, usando apenas letras.', 'error'); return; }
  if (weight === false || height === false) return;

  S.user = { ...S.user, name, weight, height, goal: _profGoal, updatedAt: new Date().toISOString() };
  ls('tl_user', JSON.stringify(S.user));

  document.getElementById('sbAvatar').textContent = S.user.name?.[0]?.toUpperCase() || '?';
  document.getElementById('sbName').textContent = S.user.name;
  document.getElementById('sbGoal').textContent = GOAL_LABELS[S.user.goal] || 'Saúde Geral';
  renderProfile();
  toast('Perfil local atualizado.');
}
