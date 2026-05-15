/* ═══════════════════════════════════════════════════════════════
   routine.js — Configuração de rotina diária
═══════════════════════════════════════════════════════════════ */

/* ── Renderiza configurações atuais ──────────────────────────── */
function renderRoutine() {
  const r = S.routine;

  document.getElementById('stWater').textContent = `${(r.waterGoal || 2).toFixed(1)}L`;
  document.getElementById('stSleep').textContent = `${r.sleepGoal || 8}h`;

  /* Toggles de refeição */
  ['breakfast','lunch','snack','dinner'].forEach(k => {
    const el = document.getElementById(`tg-${k}`);
    if (el) el.checked = !!r[k];
  });

  /* Chips de modalidade de exercício */
  document.querySelectorAll('#exTypeChips .chip').forEach(c =>
    c.classList.toggle('active', (r.exercises || []).includes(c.dataset.ex))
  );

  /* Dias de treino */
  document.querySelectorAll('#dayBtns .day-btn').forEach(b =>
    b.classList.toggle('active', (r.exerciseDays || []).includes(parseInt(b.dataset.d)))
  );
}

/* ── Stepper (incrementa/decrementa valores) ─────────────────── */
function step(field, delta, min, max) {
  S.routine[field] = Math.min(max, Math.max(min,
    parseFloat(((S.routine[field] || 0) + delta).toFixed(1))
  ));
  document.getElementById('stWater').textContent = `${(S.routine.waterGoal || 2).toFixed(1)}L`;
  document.getElementById('stSleep').textContent = `${S.routine.sleepGoal || 8}h`;
}

/* ── Ativa/desativa modalidade de exercício ──────────────────── */
function toggleExType(btn) {
  const id   = btn.dataset.ex;
  const list = S.routine.exercises || [];
  S.routine.exercises = list.includes(id) ? list.filter(e => e !== id) : [...list, id];
  btn.classList.toggle('active', S.routine.exercises.includes(id));
}

/* ── Ativa/desativa dia de treino ────────────────────────────── */
function toggleDay(btn) {
  const d    = parseInt(btn.dataset.d);
  const list = S.routine.exerciseDays || [];
  S.routine.exerciseDays = list.includes(d) ? list.filter(x => x !== d) : [...list, d];
  btn.classList.toggle('active', S.routine.exerciseDays.includes(d));
}

/* ── Salva rotina ────────────────────────────────────────────── */
async function saveRoutine() {
  ['breakfast','lunch','snack','dinner'].forEach(k => {
    const el = document.getElementById(`tg-${k}`);
    if (el) S.routine[k] = el.checked;
  });

  await persist('routine', S.routine);

  const btn = document.getElementById('saveRoutineBtn');
  btn.innerHTML = `<i class='bx bx-check'></i>Salvo!`;
  setTimeout(() => { btn.innerHTML = `<i class='bx bx-save'></i>Salvar rotina`; }, 2200);
  toast('Rotina salva com sucesso!');
}
