/* ═══════════════════════════════════════════════════════════════
   dashboard.js — Dashboard principal
═══════════════════════════════════════════════════════════════ */

/* ── Monta lista de tarefas do dia baseada na rotina ─────────── */
function getDayTasks() {
  const r = S.routine;
  const t = [];
  if (r.waterGoal)         t.push({ key:'water',     label:`Ingestao de ${r.waterGoal}L de agua`, color:'var(--blue)',   icon:'bx-droplet' });
  if (r.exercises?.length) t.push({ key:'exercise',  label:'Completar treino do dia',              color:'var(--accent)', icon:'bx-dumbbell' });
  if (r.breakfast)         t.push({ key:'breakfast', label:'Cafe da manha registrado',             color:'var(--amber)',  icon:'bx-coffee' });
  if (r.lunch)             t.push({ key:'lunch',     label:'Almoco registrado',                    color:'var(--amber)',  icon:'bxs-bowl-hot' });
  if (r.snack)             t.push({ key:'snack',     label:'Lanche registrado',                    color:'var(--blue)',   icon:'bx-food-tag' });
  if (r.dinner)            t.push({ key:'dinner',    label:'Jantar registrado',                    color:'var(--purple)', icon:'bx-moon' });
  if (r.sleepGoal)         t.push({ key:'sleep',     label:`Meta de sono de ${r.sleepGoal}h`,      color:'#A78BFA',       icon:'bx-moon' });
  return t;
}

/* ── Renderiza o dashboard ───────────────────────────────────── */
function renderDashboard() {
  const today = todayKey();
  const log   = S.healthLog[today] || {};
  const diet  = S.dietLog[today]   || {};
  const tasks = getDayTasks();
  const done  = tasks.filter(t => log[t.key]).length;
  const total = tasks.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  /* Saudação e data */
  document.getElementById('dashGreet').textContent =
    `${greeting()}, ${S.user?.name?.split(' ')[0] || 'atleta'}`;
  document.getElementById('dashDate').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' });

  /* KPIs */
  const dietCal = Object.values(diet).reduce(
    (a, items) => a + (Array.isArray(items) ? items.reduce((b, i) => b + (i.cal || 0), 0) : 0), 0
  );
  document.getElementById('kpiDay').textContent    = `${pct}%`;
  document.getElementById('kpiWater').textContent  = `${(log.water || 0).toFixed(1)}L`;
  document.getElementById('kpiStreak').textContent = calcStreak();
  document.getElementById('kpiCal').textContent    = Math.round(dietCal);

  /* Anel de progresso (r=53 → circ≈333) */
  document.getElementById('dashRing').style.strokeDashoffset = 333 * (1 - (pct / 100));
  document.getElementById('dashRingPct').textContent  = `${pct}%`;
  document.getElementById('dashRingSub').textContent  = `${done} / ${total} tarefas`;

  /* Checklist */
  const tl = document.getElementById('taskList');
  if (!tasks.length) {
    tl.innerHTML = `
      <div class="empty" style="border:none;padding:1rem">
        <div class="empty-icon"><i class='bx bx-calendar'></i></div>
        <p class="empty-desc">Configure sua rotina para comecar</p>
        <button class="btn btn-primary btn-sm" style="margin-top:.75rem" onclick="go('routine')">Configurar</button>
      </div>`;
  } else {
    tl.innerHTML = tasks.map(t => `
      <div class="task-item ${log[t.key] ? 'done' : ''}" onclick="toggleTask('${t.key}')">
        <div class="task-icon" style="background:${t.color}20">
          <i class='bx ${t.icon}' style="color:${t.color}"></i>
        </div>
        <span class="task-label">${t.label}</span>
        <div class="task-check">${log[t.key] ? `<i class='bx bx-check'></i>` : ''}</div>
      </div>`).join('');
  }

  /* Banner motivacional */
  const mv = document.getElementById('dashMotiv');
  if (pct === 100 && total > 0) {
    mv.style.display = '';
    mv.innerHTML = `
      <div class="motiv">
        <div class="motiv-icon"><i class='bx bx-trophy'></i></div>
        <div>
          <div class="motiv-title">Rotina completa!</div>
          <div class="motiv-sub">Excelente consistencia. Continue amanha.</div>
        </div>
      </div>`;
  } else {
    mv.style.display = 'none';
  }

  /* Resumo rápido */
  const mealsAtivos = ['breakfast','lunch','snack','dinner'].filter(k => S.routine[k]);
  const mealsOk     = mealsAtivos.filter(k => (diet[k] || []).length > 0).length;
  document.getElementById('sMeals').textContent    = `${mealsOk}/${mealsAtivos.length}`;
  document.getElementById('sExercise').textContent = log.exercise ? 'Concluido' : 'Pendente';
  document.getElementById('sSleep').textContent    = log.sleep    ? `${S.routine.sleepGoal}h` : 'Pendente';
  document.getElementById('sWeekAvg').textContent  = `${calcWeekAvg()}%`;

  /* Dica do dia */
  document.getElementById('dashTip').textContent = TIPS[new Date().getDate() % TIPS.length];

  /* Mini gráfico semanal */
  buildWeekChart('dashWeekChart', 55);
}

/* ── Alterna tarefa como concluída ───────────────────────────── */
async function toggleTask(key) {
  const today = todayKey();
  if (!S.healthLog[today]) S.healthLog[today] = {};
  S.healthLog[today][key] = !S.healthLog[today][key];
  await persist('health_log', S.healthLog);
  renderDashboard();
}
