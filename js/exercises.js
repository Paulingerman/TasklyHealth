/* ═══════════════════════════════════════════════════════════════
   exercises.js — Catalogo, fichas de treino e timer local
═══════════════════════════════════════════════════════════════ */

let exFilter = 'Todos';
let workoutBuilderCat = 'Peito';
let workoutDraftSelected = new Set();
let restIv = null;
let restSecs = 0;
let restTotal = 60;
let restRunning = false;


function toggleWorkoutBuilderPanel(open = null) {
  const card = document.getElementById('workoutBuilderCard');
  if (!card) return;
  const shouldOpen = open === null ? card.classList.contains('builder-collapsed') : !!open;
  card.classList.toggle('builder-collapsed', !shouldOpen);
  if (shouldOpen) {
    renderWorkoutBuilder();
    setTimeout(() => document.getElementById('workoutName')?.focus(), 80);
  }
}

function getSuggestedWorkoutTemplate() {
  const list = S.workoutTemplates || [];
  if (!list.length) return null;
  const todayDone = S.workoutLog?.[todayKey()] || [];
  return list.find(t => !todayDone.some(d => d.templateId === t.id)) || list[0];
}

function updateWorkoutHero() {
  const list = S.workoutTemplates || [];
  const doneToday = S.workoutLog?.[todayKey()] || [];
  const suggested = getSuggestedWorkoutTemplate();
  const exs = suggested ? (suggested.exerciseIds || []).map(getExerciseById).filter(Boolean) : [];
  const totalMinutes = suggested ? formatWorkoutTime(estimateWorkoutSeconds(exs)) : '0 min';

  const title = document.getElementById('workoutHeroTitle');
  const subtitle = document.getElementById('workoutHeroSubtitle');
  const btn = document.getElementById('startMainWorkoutBtn');
  const statTemplates = document.getElementById('workoutStatTemplates');
  const statToday = document.getElementById('workoutStatToday');
  const statMinutes = document.getElementById('workoutStatMinutes');

  if (title) title.textContent = suggested ? suggested.name : 'Monte sua primeira ficha';
  if (subtitle) subtitle.textContent = suggested ? `${exs.length} exercício${exs.length !== 1 ? 's' : ''} · ${totalMinutes} · ${[...new Set(exs.map(e => e.cat))].slice(0,3).join(', ') || 'treino personalizado'}` : 'Crie um treino A/B/C para aparecer aqui como treino principal.';
  if (btn) btn.disabled = !suggested;
  if (statTemplates) statTemplates.textContent = list.length;
  if (statToday) statToday.textContent = doneToday.length;
  if (statMinutes) statMinutes.textContent = totalMinutes;
}

function startSuggestedWorkout() {
  const suggested = getSuggestedWorkoutTemplate();
  if (!suggested) {
    toggleWorkoutBuilderPanel(true);
    toast('Crie uma ficha antes de iniciar o treino.', 'info');
    return;
  }
  const card = document.querySelector(`[data-workout-id="${suggested.id}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('pulse-focus');
    setTimeout(() => card.classList.remove('pulse-focus'), 1200);
  }
}

function getExerciseById(id) {
  return EX.find(e => String(e.id) === String(id));
}

function getWorkoutDate() {
  return todayKey();
}

function ensureWorkoutLog(date = getWorkoutDate()) {
  if (!S.workoutLog) S.workoutLog = {};
  if (!S.workoutLog[date]) S.workoutLog[date] = [];
}

function normalizeText(txt = '') {
  return String(txt)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getExerciseCategories() {
  return EX_CATS.filter(c => c !== 'Todos');
}

function estimateExerciseSeconds(ex) {
  const sets = Number.parseInt(ex?.sets, 10) || 1;
  const active = Number(ex?.active || 35);
  const rest = Number(ex?.rest || 60);
  return (sets * active) + (Math.max(sets - 1, 0) * rest);
}

function estimateWorkoutSeconds(exs = []) {
  return exs.reduce((total, ex) => total + estimateExerciseSeconds(ex), 0);
}

function formatWorkoutTime(seconds = 0) {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function setWorkoutBuilderCat(cat) {
  workoutBuilderCat = cat;
  const search = document.getElementById('workoutBuilderSearch');
  if (search) search.value = '';
  renderWorkoutBuilder();
}

function toggleWorkoutDraft(id) {
  const key = Number(id);
  if (workoutDraftSelected.has(key)) workoutDraftSelected.delete(key);
  else workoutDraftSelected.add(key);
  renderWorkoutBuilder();
}

function removeWorkoutDraft(id) {
  workoutDraftSelected.delete(Number(id));
  renderWorkoutBuilder();
}

function clearWorkoutDraft() {
  workoutDraftSelected.clear();
  document.querySelectorAll('#workoutPickList input:checked').forEach(i => i.checked = false);
  renderWorkoutBuilder();
}

function renderWorkoutBuilder() {
  const pick = document.getElementById('workoutPickList');
  if (!pick) return;

  const cats = getExerciseCategories();
  if (!cats.includes(workoutBuilderCat)) workoutBuilderCat = cats[0] || 'Todos';

  const catWrap = document.getElementById('workoutCatFilters');
  if (catWrap) {
    catWrap.innerHTML = cats.map(c => `
      <button class="chip ${c === workoutBuilderCat ? 'active' : ''}" onclick="setWorkoutBuilderCat('${c}')">${c}</button>
    `).join('');
  }

  const q = normalizeText(document.getElementById('workoutBuilderSearch')?.value || '');
  const list = EX.filter(e => {
    const matchCat = !q ? e.cat === workoutBuilderCat : true;
    const blob = normalizeText(`${e.name} ${e.cat} ${e.muscles} ${e.desc}`);
    return matchCat && (!q || blob.includes(q));
  });

  const count = document.getElementById('workoutSelectedCount');
  if (count) count.textContent = `${workoutDraftSelected.size} selecionado${workoutDraftSelected.size !== 1 ? 's' : ''}`;

  const preview = document.getElementById('workoutSelectedPreview');
  if (preview) {
    const selected = [...workoutDraftSelected].map(getExerciseById).filter(Boolean);
    preview.innerHTML = !selected.length
      ? `<span class="muted-preview">Nenhum exercicio selecionado ainda.</span>`
      : selected.map(e => `
          <button class="selected-ex-chip" onclick="removeWorkoutDraft(${e.id})" title="Remover ${e.name}">
            ${e.name}<i class='bx bx-x'></i>
          </button>
        `).join('') + `<button class="selected-ex-clear" onclick="clearWorkoutDraft()">Limpar</button>`;
  }

  pick.innerHTML = list.length === 0
    ? `<div class="empty-builder-list"><i class='bx bx-search-alt'></i>Nenhum exercicio encontrado.</div>`
    : list.map(e => {
        const checked = workoutDraftSelected.has(Number(e.id));
        return `
          <label class="workout-pick-item ${checked ? 'checked' : ''}">
            <input type="checkbox" value="${e.id}" ${checked ? 'checked' : ''} onchange="toggleWorkoutDraft(${e.id})">
            <span>
              <strong>${e.name}</strong>
              <small>${e.cat} · ${e.sets}x ${e.reps} · ${e.diff}</small>
            </span>
          </label>
        `;
      }).join('');
}

async function saveWorkoutTemplate() {
  const name = document.getElementById('workoutName')?.value.trim();
  const checked = [...workoutDraftSelected];

  if (!name) { toast('Digite o nome da ficha de treino.', 'error'); return; }
  if (!checked.length) { toast('Selecione pelo menos um exercicio.', 'error'); return; }

  if (!Array.isArray(S.workoutTemplates)) S.workoutTemplates = [];
  S.workoutTemplates.unshift({ id: Date.now(), name, exerciseIds: checked, createdAt: new Date().toISOString() });

  await persist('workout_templates', S.workoutTemplates);

  document.getElementById('workoutName').value = '';
  workoutDraftSelected.clear();
  renderWorkoutBuilder();
  renderWorkoutTemplates();
  toggleWorkoutBuilderPanel(false);
  updateWorkoutHero();
  toast('Ficha de treino salva.');
}

async function renameWorkoutTemplate(id) {
  const t = S.workoutTemplates.find(x => x.id === id);
  if (!t) return;
  const name = prompt('Novo nome da ficha:', t.name);
  if (!name || !name.trim()) return;
  t.name = name.trim();
  await persist('workout_templates', S.workoutTemplates);
  renderWorkoutTemplates();
  toast('Ficha renomeada.');
}

async function deleteWorkoutTemplate(id) {
  if (!confirm('Excluir esta ficha de treino?')) return;
  S.workoutTemplates = (S.workoutTemplates || []).filter(t => t.id !== id);
  await persist('workout_templates', S.workoutTemplates);
  renderWorkoutTemplates();
  updateWorkoutHero();
  toast('Ficha removida.', 'info');
}

async function completeWorkoutTemplate(id) {
  const t = S.workoutTemplates.find(x => x.id === id);
  if (!t) return;

  const date = getWorkoutDate();
  ensureWorkoutLog(date);

  S.workoutLog[date].push({
    id: Date.now(),
    templateId: t.id,
    name: t.name,
    exerciseIds: [...t.exerciseIds],
    doneAt: new Date().toISOString()
  });

  if (!S.healthLog[date]) S.healthLog[date] = {};
  S.healthLog[date].exercise = true;

  await persist('workout_log', S.workoutLog);
  await persist('health_log', S.healthLog);

  renderWorkoutTemplates();
  updateWorkoutHero();
  toast(`Treino "${t.name}" concluido.`);
}

function renderWorkoutTemplates() {
  const wrap = document.getElementById('workoutTemplatesGrid');
  if (!wrap) return;

  const list = S.workoutTemplates || [];
  if (!list.length) {
    wrap.innerHTML = `<div class="empty-template-box workout-empty-card"><i class='bx bx-dumbbell'></i><div><strong>Nenhuma ficha de treino salva.</strong><span>Selecione exercícios por categoria e salve sua primeira ficha.</span></div></div>`;
    updateWorkoutHero();
    return;
  }

  const todayDone = S.workoutLog?.[todayKey()] || [];

  wrap.innerHTML = list.map(t => {
    const exs = (t.exerciseIds || []).map(getExerciseById).filter(Boolean);
    const done = todayDone.some(d => d.templateId === t.id);
    const duration = formatWorkoutTime(estimateWorkoutSeconds(exs));
    const cats = [...new Set(exs.map(e => e.cat))].slice(0, 3).join(', ') || 'Treino';

    return `
      <div class="workout-template-card exercise-style ${done ? 'done' : ''}" data-workout-id="${t.id}">
        <div class="workout-template-main">
          <div class="ex-card-top workout-template-top">
            <div class="ex-card-icon"><i class='bx bx-dumbbell'></i></div>
            <div class="workout-template-title-wrap">
              <div class="ex-card-name">${t.name}</div>
              <div class="ex-card-cat">Ficha de treino</div>
              <p class="workout-template-sub">${cats}${done ? ' · feito hoje' : ''}</p>
            </div>
            <div class="workout-template-actions-top">
              <button class="icon-mini" onclick="renameWorkoutTemplate(${t.id})" title="Renomear"><i class='bx bx-edit'></i></button>
              <button class="icon-mini danger" onclick="deleteWorkoutTemplate(${t.id})" title="Excluir"><i class='bx bx-trash'></i></button>
            </div>
          </div>

          <div class="ex-card-meta workout-template-meta-row">
            <span class="badge badge-green">${exs.length} exercicio${exs.length !== 1 ? 's' : ''}</span>
            <span class="badge badge-blue"><i class='bx bx-time-five'></i>${duration}</span>
            ${done ? `<span class="badge badge-amber"><i class='bx bx-check-double'></i>feito hoje</span>` : `<span class="badge badge-red"><i class='bx bx-calendar-check'></i>pendente</span>`}
          </div>
        </div>

        <div class="workout-template-ex-grid">
          ${exs.map(e => `
            <div class="workout-template-ex-card" onclick="openExModal(${e.id})">
              <div class="workout-template-ex-top">
                <div class="ex-card-icon mini"><i class='bx ${e.icon}'></i></div>
                <div>
                  <div class="workout-template-ex-name">${e.name}</div>
                  <div class="ex-card-cat">${e.cat}</div>
                </div>
              </div>
              <p class="workout-template-ex-desc">${e.desc}</p>
              <div class="ex-card-meta">
                <span class="badge badge-green">${e.sets} series</span>
                <span class="badge badge-blue">${e.reps}</span>
                <span class="badge ${DIFF_BADGE[e.diff] || 'badge-blue'}">${e.diff}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <button class="btn ${done ? 'btn-outline' : 'btn-primary'} btn-full btn-sm workout-done-btn" onclick="completeWorkoutTemplate(${t.id})">
          <i class='bx ${done ? 'bx-check-double' : 'bx-check'}'></i>${done ? 'Marcar novamente' : 'Marcar treino feito'}
        </button>
      </div>`;
  }).join('');
  updateWorkoutHero();
}

function renderExercises() {
  renderWorkoutBuilder();
  renderWorkoutTemplates();

  const filters = document.getElementById('exFilters');
  if (filters) {
    filters.innerHTML = EX_CATS.map(c => `<button class="chip ${c === exFilter ? 'active' : ''}" onclick="setExFilter('${c}')">${c}</button>`).join('');
  }

  const q = normalizeText(document.getElementById('exSearch')?.value || '');
  const list = EX.filter(e => {
    const matchCat = exFilter === 'Todos' || e.cat === exFilter;
    const blob = normalizeText(`${e.name} ${e.cat} ${e.muscles} ${e.desc}`);
    return matchCat && (!q || blob.includes(q));
  });

  const grid = document.getElementById('exGrid');
  if (!grid) return;

  if (!list.length) {
    grid.className = 'ex-grid';
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-icon"><i class='bx bx-dumbbell'></i></div><p class="empty-title">Nenhum exercicio encontrado</p></div>`;
    return;
  }

  if (exFilter === 'Todos' && !q) {
    grid.className = 'ex-category-stack';
    grid.innerHTML = getExerciseCategories().map(cat => {
      const items = EX.filter(e => e.cat === cat);
      if (!items.length) return '';
      return `
        <section class="ex-category-section">
          <div class="ex-category-title">
            <span>${cat}</span>
            <small>${items.length} exercicio${items.length !== 1 ? 's' : ''}</small>
          </div>
          <div class="ex-grid compact-catalog">
            ${items.map(renderExerciseCard).join('')}
          </div>
        </section>
      `;
    }).join('');
    return;
  }

  grid.className = 'ex-grid';
  grid.innerHTML = list.map(renderExerciseCard).join('');
}

function renderExerciseCard(e) {
  return `
    <div class="ex-card" onclick="openExModal(${e.id})">
      <div class="ex-card-top">
        <div class="ex-card-icon"><i class='bx ${e.icon}'></i></div>
        <div>
          <div class="ex-card-name">${e.name}</div>
          <div class="ex-card-cat">${e.cat}</div>
        </div>
      </div>
      <p class="ex-card-desc">${e.desc}</p>
      <div class="ex-card-meta">
        <span class="badge badge-green">${e.sets} series</span>
        <span class="badge badge-blue">${e.reps}</span>
        <span class="badge ${DIFF_BADGE[e.diff] || 'badge-blue'}">${e.diff}</span>
      </div>
    </div>`;
}

function setExFilter(c) {
  exFilter = c;
  renderExercises();
}

function openExModal(id) {
  const ex = getExerciseById(id);
  if (!ex) return;

  S.currentEx = ex;
  stopRestTimer(false);

  document.getElementById('exModalTitle').textContent = ex.name;
  document.getElementById('exModalDesc').textContent = ex.desc;
  document.getElementById('exModalMeta').innerHTML = [
    `<span class="badge badge-green">${ex.sets} series x ${ex.reps}</span>`,
    `<span class="badge ${DIFF_BADGE[ex.diff] || 'badge-blue'}">${ex.diff}</span>`,
    `<span class="badge badge-amber">${ex.muscles}</span>`
  ].join('');

  renderLoadInputs(ex);
  document.getElementById('exModal').classList.add('open');
}

function closeExModal() {
  stopRestTimer(false);
  const presets = document.getElementById('restPresets');
  if (presets) presets.style.display = 'none';
  document.getElementById('exModal').classList.remove('open');
}

function getLoadKey(exId) { return 'load_' + exId; }

function renderLoadInputs(ex) {
  const saved = JSON.parse(localStorage.getItem(getLoadKey(ex.id)) || '{}');
  const wrap = document.getElementById('loadInputsWrap');
  const hint = document.getElementById('loadPrevHint');
  const setsCount = parseInt(ex.sets) || 3;

  hint.textContent = Object.keys(saved).length > 0 ? 'Progresso salvo ✓' : '';
  wrap.innerHTML = Array.from({ length: setsCount }, (_, i) => {
    const n = i + 1;
    const prev = saved['s' + n] || '';
    return `<div style="display:flex;align-items:center;gap:.75rem;"><span style="font-size:.75rem;font-weight:700;color:var(--text-3);min-width:54px">Serie ${n}</span><div style="position:relative;flex:1"><input type="number" inputmode="decimal" step="0.5" min="0" id="load_s${n}" value="${prev}" placeholder="${prev || 'kg'}" style="width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-m);padding:.5rem .75rem;color:var(--title);font-family:'Sora',sans-serif;font-weight:700;font-size:.9375rem;box-sizing:border-box;outline:none" oninput="saveLoad(${ex.id},${setsCount})"/><span style="position:absolute;right:.65rem;top:50%;transform:translateY(-50%);font-size:.7rem;font-weight:700;color:var(--text-3);pointer-events:none">kg</span></div>${prev ? `<span style="font-size:.7rem;color:var(--text-3);white-space:nowrap">ant: ${prev}kg</span>` : '<span style="min-width:60px"></span>'}</div>`;
  }).join('');
}

function saveLoad(exId, setsCount) {
  const data = {};
  for (let i = 1; i <= setsCount; i++) {
    const el = document.getElementById('load_s' + i);
    if (el && el.value) data['s' + i] = parseFloat(el.value);
  }
  localStorage.setItem(getLoadKey(exId), JSON.stringify(data));
}

function toggleRestTimer() {
  const presetsEl = document.getElementById('restPresets');
  if (restRunning) stopRestTimer(true);
  else if (restSecs > 0) startRestCountdown();
  else {
    presetsEl.style.display = presetsEl.style.display === 'none' ? 'flex' : 'none';
    if (presetsEl.style.display === 'flex') setRestTime(restTotal || 60);
  }
}

function setRestTime(secs) {
  restTotal = secs;
  restSecs = secs;
  document.getElementById('restPresets').style.display = 'none';
  updateRestDisplay();
  startRestCountdown();
}

function startRestCountdown() {
  clearInterval(restIv);
  restRunning = true;
  const btn = document.getElementById('restBtn');
  btn.style.borderColor = 'var(--blue)';
  btn.querySelector('span:first-child').innerHTML = `<i class='bx bx-stop-circle' style='color:var(--blue)'></i><span style='color:var(--blue)'>Descanso</span>`;

  restIv = setInterval(() => {
    restSecs--;
    updateRestDisplay();
    if (restSecs <= 0) {
      clearInterval(restIv);
      restRunning = false;
      restSecs = 0;
      toast('Descanso concluido! Proxima serie.', 'info');
      resetRestBtn();
      restSecs = restTotal;
      updateRestDisplay();
    }
  }, 1000);
}

function stopRestTimer(resetSecs = true) {
  clearInterval(restIv);
  restRunning = false;
  if (resetSecs) { restSecs = 0; restTotal = 60; }
  resetRestBtn();
  const el = document.getElementById('restTimerDisplay');
  if (el) el.textContent = '—';
}

function resetRestBtn() {
  const btn = document.getElementById('restBtn');
  if (!btn) return;
  btn.style.borderColor = '';
  btn.querySelector('span:first-child').innerHTML = `<i class='bx bx-time-five'></i>Descanso`;
}

function updateRestDisplay() {
  const m = Math.floor(restSecs / 60);
  const s = restSecs % 60;
  const el = document.getElementById('restTimerDisplay');
  if (el) {
    el.textContent = restSecs > 0 ? `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : '—';
    el.style.color = restRunning ? 'var(--blue)' : 'var(--accent)';
  }
}

async function markExDone() {
  const today = todayKey();
  if (S.currentEx) {
    saveLoad(S.currentEx.id, parseInt(S.currentEx.sets) || 3);
    ensureWorkoutLog(today);
    S.workoutLog[today].push({ id: Date.now(), exerciseId: S.currentEx.id, name: S.currentEx.name, doneAt: new Date().toISOString() });
    await persist('workout_log', S.workoutLog);
  }

  if (!S.healthLog[today]) S.healthLog[today] = {};
  S.healthLog[today].exercise = true;

  await persist('health_log', S.healthLog);
  closeExModal();
  toast('Treino registrado!');
}
