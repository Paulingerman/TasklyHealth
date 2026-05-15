/* ═══════════════════════════════════════════════════════════════
   progress.js — Tela de progresso visual estilo dashboard
═══════════════════════════════════════════════════════════════ */

function dietTotalsForDate(date) {
  const diet = S.dietLog?.[date] || {};
  return Object.values(diet).flat().reduce((acc, item) => {
    acc.cal += Number(item.cal || 0);
    acc.prot += Number(item.prot || 0);
    acc.carb += Number(item.carb || 0);
    acc.fat += Number(item.fat || 0);
    return acc;
  }, { cal: 0, prot: 0, carb: 0, fat: 0 });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
}

function clampProgress(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function progressBar(label, value, icon, detail) {
  const pct = clampProgress(value);
  return `
    <div class="profile-meter">
      <div class="profile-meter-head">
        <span><i class='bx ${icon}'></i>${label}</span>
        <strong>${detail || `${pct}%`}</strong>
      </div>
      <div class="profile-meter-track"><span style="width:${pct}%"></span></div>
    </div>`;
}

function radarPoints(values) {
  const cx = 130, cy = 130, radius = 102;
  return values.map((raw, i) => {
    const pct = clampProgress(raw) / 100;
    const angle = (-90 + i * 72) * Math.PI / 180;
    const x = cx + Math.cos(angle) * radius * pct;
    const y = cy + Math.sin(angle) * radius * pct;
    return { x, y };
  });
}

function renderRadar(labels, values) {
  const pts = radarPoints(values);
  const polygon = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const shape = document.getElementById('radarShape');
  if (shape) shape.setAttribute('points', polygon);
  pts.forEach((p, i) => {
    const dot = document.getElementById(`radarDot${i}`);
    if (!dot) return;
    dot.setAttribute('cx', p.x.toFixed(1));
    dot.setAttribute('cy', p.y.toFixed(1));
  });

  setHTML('radarLabels', labels.map((label, i) => `
    <div class="radar-label-item">
      <span>${label}</span>
      <strong>${clampProgress(values[i])}%</strong>
    </div>`).join(''));
}

function renderProgress() {
  const days = getLast7();
  const today = todayKey();
  const scores = days.map(d => dayScore(d));
  const waters = days.map(d => Number(S.healthLog?.[d]?.water || 0));
  const diets = days.map(dietTotalsForDate);
  const cals = diets.map(t => Math.round(t.cal));
  const proteins = diets.map(t => Math.round(t.prot));
  const workouts = days.map(d => (S.workoutLog?.[d] || []).length || (S.healthLog?.[d]?.exercise ? 1 : 0));

  const avg = Math.round(scores.reduce((a, v) => a + v, 0) / 7);
  const waterAvg = waters.reduce((a, v) => a + v, 0) / 7;
  const weekCalories = cals.reduce((a, v) => a + v, 0);
  const weekProtein = proteins.reduce((a, v) => a + v, 0);
  const workoutCount = workouts.reduce((a, v) => a + v, 0);
  const waterGoal = Number(S.routine.waterGoal || 2);
  const workoutGoal = Math.max(1, S.routine.exerciseDays?.length || 3);
  const proteinGoal = 70 * 7;
  const caloriesGoal = 1800 * 7;

  const waterScore = clampProgress((waterAvg / waterGoal) * 100);
  const nutritionScore = clampProgress((days.filter((_, i) => cals[i] > 0).length / 7) * 100);
  const proteinScore = clampProgress((weekProtein / proteinGoal) * 100);
  const workoutScore = clampProgress((workoutCount / workoutGoal) * 100);
  const caloriesScore = clampProgress((weekCalories / caloriesGoal) * 100);
  const mainScore = clampProgress((avg + waterScore + nutritionScore + proteinScore + workoutScore) / 5);

  const uName = S.user?.name || 'Meu Progresso';
  const uGoal = GOAL_LABELS[S.user?.goal] || 'Saúde geral';

  setText('progressTodayLabel', new Date(today + 'T12:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'short' }));
  setText('progressAvatar', uName.trim()[0]?.toUpperCase() || 'P');
  setText('progressUserName', uName);
  setText('progressUserGoal', uGoal);
  setText('progressMainScore', mainScore);
  setText('progressStreakCard', calcStreak());
  setText('radarScoreText', `${mainScore}%`);

  setHTML('progressProfileMeters', [
    progressBar('Água', waterScore, 'bx-droplet', `${waterAvg.toFixed(1)}L/dia`),
    progressBar('Alimentação', nutritionScore, 'bx-restaurant', `${days.filter((_, i) => cals[i] > 0).length}/7 dias`),
    progressBar('Proteína', proteinScore, 'bx-food-tag', `${Math.round(weekProtein)}g`),
    progressBar('Treinos', workoutScore, 'bx-dumbbell', `${workoutCount}/${workoutGoal}`)
  ].join(''));

  renderRadar(['Rotina', 'Água', 'Calorias', 'Proteína', 'Treinos'], [avg, waterScore, caloriesScore, proteinScore, workoutScore]);

  setHTML('progressStatsStrip', `
    <div class="progress-stat-pill"><i class='bx bx-trending-up'></i><div><strong>${avg}%</strong><span>Média da rotina</span></div></div>
    <div class="progress-stat-pill"><i class='bx bx-droplet'></i><div><strong>${waterAvg.toFixed(1)}L</strong><span>Água média</span></div></div>
    <div class="progress-stat-pill"><i class='bx bx-restaurant'></i><div><strong>${weekCalories}</strong><span>Kcal na semana</span></div></div>
    <div class="progress-stat-pill"><i class='bx bx-dumbbell'></i><div><strong>${workoutCount}</strong><span>Treinos feitos</span></div></div>
  `);

  setHTML('progressWeekline', days.map((d, i) => {
    const sc = scores[i];
    const isToday = d === today;
    const name = DAY_NAMES[new Date(d + 'T12:00').getDay()];
    return `
      <div class="progress-week-day ${isToday ? 'is-today' : ''}">
        <div class="progress-week-ring" style="--p:${sc};--ring:${SCORE_COLOR(sc)}">
          <span>${sc}%</span>
        </div>
        <strong>${name}</strong>
        <small>${new Date(d + 'T12:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</small>
      </div>`;
  }).join(''));

  const goalCards = [
    { title:'Bater meta de água', icon:'bx-droplet', pct:waterScore, desc:`Meta: ${waterGoal.toFixed(1)}L por dia` },
    { title:'Registrar refeições', icon:'bx-restaurant', pct:nutritionScore, desc:'Manter histórico alimentar vivo' },
    { title:'Treinar na semana', icon:'bx-dumbbell', pct:workoutScore, desc:`Objetivo: ${workoutGoal} treino${workoutGoal > 1 ? 's' : ''}` },
    { title:'Consumir proteína', icon:'bx-food-tag', pct:proteinScore, desc:'Referência semanal de 490g' }
  ];

  setHTML('progressGoalsList', goalCards.map(g => `
    <div class="progress-goal-card">
      <div class="progress-goal-icon"><i class='bx ${g.icon}'></i></div>
      <div class="progress-goal-body">
        <div class="progress-goal-head"><strong>${g.title}</strong><span>${g.pct}%</span></div>
        <p>${g.desc}</p>
        <div class="progress-goal-track"><span style="width:${g.pct}%"></span></div>
      </div>
    </div>`).join(''));

  const details = [...days].reverse().map(d => {
    const sc = dayScore(d);
    const dl = S.healthLog[d] || {};
    const dt = dietTotalsForDate(d);
    const w = (S.workoutLog?.[d] || []).length || (dl.exercise ? 1 : 0);
    const hasData = (dl.water || 0) > 0 || dt.cal > 0 || w > 0 || dl.sleep;
    return `
      <div class="progress-day-card">
        <div class="progress-day-head">
          <div>
            <strong>${new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' })}</strong>
            <span>${hasData ? 'Registros salvos' : 'Sem registros'}</span>
          </div>
          <b style="color:${SCORE_COLOR(sc)}">${sc}%</b>
        </div>
        <div class="progress-day-tags">
          <span><i class='bx bx-droplet'></i>${Number(dl.water || 0).toFixed(1)}L</span>
          <span><i class='bx bx-restaurant'></i>${Math.round(dt.cal)} kcal</span>
          <span><i class='bx bx-food-tag'></i>${Math.round(dt.prot)}g</span>
          <span><i class='bx bx-dumbbell'></i>${w} treino${w === 1 ? '' : 's'}</span>
        </div>
      </div>`;
  }).join('');

  setHTML('detailList', details);
}
