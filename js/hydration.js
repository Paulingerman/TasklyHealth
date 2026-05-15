/* ═══════════════════════════════════════════════════════════════
   hydration.js — Controle de hidratação diária
═══════════════════════════════════════════════════════════════ */

function formatLiters(value) {
  return `${Number(value || 0).toFixed(1)}L`;
}

function getTodayWaterEntries() {
  const today = todayKey();
  return (S.waterLog || []).filter(e => e.date === today);
}

function renderHydration() {
  const today = todayKey();
  const log   = S.healthLog[today] || {};
  const goal  = Number(S.routine.waterGoal || 2);
  const cur   = Number(log.water || 0);
  const pct   = goal > 0 ? Math.min(100, Math.round((cur / goal) * 100)) : 0;
  const done  = cur >= goal;
  const remaining = Math.max(0, goal - cur);

  document.getElementById('hydLiters').textContent   = formatLiters(cur);
  document.getElementById('hydGoalTxt').textContent  = `/ ${formatLiters(goal)}`;
  document.getElementById('hydPct').textContent      = `${pct}%`;
  document.getElementById('hydPct').style.color      = done ? 'var(--accent)' : 'var(--blue)';
  document.getElementById('hydGlasses').textContent  = `${Math.round(cur / 0.25)} copos de 250ml`;

  const remainingEl = document.getElementById('hydRemaining');
  if (remainingEl) {
    remainingEl.textContent = done ? 'Meta diária concluída.' : `Faltam ${formatLiters(remaining)} para a meta`;
  }

  const goalInput = document.getElementById('hydGoalInput');
  if (goalInput && document.activeElement !== goalInput) goalInput.value = String(goal).replace('.', ',');

  const ring = document.getElementById('hydRing');
  ring.style.strokeDashoffset = 490 * (1 - (pct / 100));
  ring.style.stroke = done ? 'var(--accent)' : 'var(--blue)';

  document.getElementById('hydSuccess').style.display = done ? 'flex' : 'none';
  document.querySelectorAll('.quick-btn').forEach(b => b.disabled = done);

  const tip = document.getElementById('hydTip');
  if (tip) {
    tip.textContent = done
      ? 'Meta batida. Agora mantenha o ritmo sem exagerar de uma vez.'
      : pct >= 70
        ? 'Você está perto da meta. Pequenos registros completam o dia sem pressão.'
        : 'Tente registrar água em pequenos intervalos para criar consistência.';
  }

  const his     = document.getElementById('hydHistory');
  const entries = getTodayWaterEntries();

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

async function addWater(liters, label) {
  const today = todayKey();
  if (!S.healthLog[today]) S.healthLog[today] = {};

  const goal = Number(S.routine.waterGoal || 2);
  const cur  = Number(S.healthLog[today].water || 0);
  if (cur >= goal) {
    toast('Meta diária já foi atingida.', 'info');
    return;
  }

  const next = Math.min(goal, Number((cur + liters).toFixed(2)));
  S.healthLog[today].water = next;

  if (!S.waterLog) S.waterLog = [];
  S.waterLog.push({
    date: today,
    time: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
    ml: Math.round((next - cur) * 1000),
  });

  await persist('water_log', S.waterLog);
  await persist('health_log', S.healthLog);
  renderHydration();
  toast(`${label} registrado.`);
}

async function addCustomWater() {
  const input = document.getElementById('customWaterMl');
  const ml = readDecimal('customWaterMl', { min:50, max:3000, label:'quantidade de água' });
  if (ml === false) return;
  if (!ml) {
    toast('Digite a quantidade em ml.', 'error');
    input?.focus();
    return;
  }
  input.value = '';
  await addWater(ml / 1000, `${ml}ml`);
}

async function saveWaterGoalFromHydration() {
  const value = readDecimal('hydGoalInput', { min:0.5, max:6, label:'meta diária de água' });
  if (value === false) return;
  if (!value) {
    toast('Digite a meta em litros.', 'error');
    return;
  }
  S.routine = { ...S.routine, waterGoal: Number(value.toFixed(1)) };
  await persist('routine', S.routine);
  renderHydration();
  toast('Meta de hidratação atualizada.', 'success');
}

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
