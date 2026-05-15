/* ═══════════════════════════════════════════════════════════════
   hydration.js — Controle de hidratação diária
═══════════════════════════════════════════════════════════════ */

function renderHydration() {
  const today = todayKey();
  const log   = S.healthLog[today] || {};
  const goal  = S.routine.waterGoal || 2;
  const cur   = log.water || 0;
  const pct   = Math.min(100, Math.round((cur / goal) * 100));
  const done  = cur >= goal;

  /* Valores numéricos */
  document.getElementById('hydLiters').textContent   = `${cur.toFixed(1)}L`;
  document.getElementById('hydGoalTxt').textContent  = `/ ${goal.toFixed(1)}L`;
  document.getElementById('hydPct').textContent      = `${pct}%`;
  document.getElementById('hydPct').style.color      = done ? 'var(--accent)' : 'var(--blue)';
  document.getElementById('hydGlasses').textContent  = `${Math.round(cur / 0.25)} copos de 250ml`;

  /* Anel (r=78 → circ≈490) */
  const ring = document.getElementById('hydRing');
  ring.style.strokeDashoffset = 490 * (1 - (pct / 100));
  ring.style.stroke           = done ? 'var(--accent)' : 'var(--blue)';

  /* Banner de meta atingida */
  document.getElementById('hydSuccess').style.display = done ? 'flex' : 'none';

  /* Desabilita botões quando meta atingida */
  document.querySelectorAll('.quick-btn').forEach(b => b.disabled = done);

  /* Histórico do dia */
  const his     = document.getElementById('hydHistory');
  const entries = (S.waterLog || []).filter(e => e.date === today);

  if (!entries.length) {
    his.innerHTML = `
      <div class="empty" style="padding:1.5rem;border:none">
        <div class="empty-icon"><i class='bx bx-droplet'></i></div>
        <p class="empty-desc">Nenhum registro ainda</p>
      </div>`;
  } else {
    his.innerHTML = entries.slice().reverse().map(e => `
      <div class="hyd-entry">
        <span class="hyd-entry-time">${e.time}</span>
        <div class="hyd-entry-bar-wrap">
          <div class="hyd-entry-bar" style="width:${Math.min(100, e.ml / 10)}%"></div>
        </div>
        <span class="hyd-entry-ml">+${e.ml}ml</span>
      </div>`).join('');
  }
}

/* ── Adiciona água ────────────────────────────────────────────── */
async function addWater(liters, label) {
  const today = todayKey();
  if (!S.healthLog[today]) S.healthLog[today] = {};

  const goal = S.routine.waterGoal || 2;
  const cur  = S.healthLog[today].water || 0;
  if (cur >= goal) return;

  S.healthLog[today].water = Math.min(goal, parseFloat((cur + liters).toFixed(2)));

  if (!S.waterLog) S.waterLog = [];
  S.waterLog.push({
    date: today,
    time: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
    ml:   Math.round(liters * 1000),
  });
  await persist('water_log', S.waterLog);
  await persist('health_log', S.healthLog);
  renderHydration();
  toast(`${label} registrado.`);
}

/* ── Zera contagem do dia ────────────────────────────────────── */
async function resetWater() {
  const today = todayKey();
  if (!S.healthLog[today]) S.healthLog[today] = {};
  S.healthLog[today].water = 0;
  S.waterLog = (S.waterLog || []).filter(e => e.date !== today);
  await persist('water_log', S.waterLog);
  await persist('health_log', S.healthLog);
  renderHydration();
  toast('Contagem zerada.', 'info');
}
