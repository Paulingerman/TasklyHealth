/* ═══════════════════════════════════════════════════════════════
   diet.js — Alimentação local, fichas, alimentos customizados e histórico
═══════════════════════════════════════════════════════════════ */

let foodTimer = null;

function allFoods() {
  const custom = (S.customFoods || []).map(f => ({ ...f, custom: true }));
  return [...FOODS, ...custom];
}

function getFoodById(id) {
  return allFoods().find(f => String(f.id) === String(id));
}

function cloneFood(food) {
  return { ...food };
}

function mealLabel(key) {
  return MEAL_CFG.find(m => m.key === key)?.label || 'Refeicao';
}

function mealColor(key) {
  return MEAL_CFG.find(m => m.key === key)?.color || 'var(--accent)';
}


function getDietTarget() {
  const goal = S.user?.goal || S.user?.objetivo || 'saude_geral';
  const targets = {
    perda_peso: { cal: 1800, prot: 130, carb: 190, fat: 55 },
    manutencao: { cal: 2200, prot: 130, carb: 260, fat: 70 },
    ganho_massa: { cal: 2600, prot: 160, carb: 330, fat: 80 },
    saude_geral: { cal: 2000, prot: 120, carb: 240, fat: 65 }
  };
  return targets[goal] || targets.saude_geral;
}

function pctOf(value, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((Number(value || 0) / target) * 100));
}

function setBarWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}

function toggleCustomFoodPanel(force = null) {
  const panel = document.getElementById('customFoodPanel');
  if (!panel) return;
  const shouldOpen = force === null ? !panel.classList.contains('open') : !!force;
  panel.classList.toggle('open', shouldOpen);
  if (shouldOpen) setTimeout(() => document.getElementById('cfName')?.focus(), 80);
}

function setMealShortcut(meal) {
  const picker = document.getElementById('mealPicker');
  if (picker) picker.value = meal;
  document.getElementById('foodSearch')?.focus();
  renderMealShortcuts();
}

function renderMealShortcuts() {
  const wrap = document.getElementById('mealShortcutBar');
  if (!wrap) return;
  const active = document.getElementById('mealPicker')?.value || 'breakfast';
  wrap.innerHTML = MEAL_CFG.map(m => `
    <button class="meal-shortcut ${active === m.key ? 'active' : ''}" onclick="setMealShortcut('${m.key}')">
      <i class='bx ${m.icon}'></i><span>${m.label}</span>
    </button>
  `).join('');
}

function updateDietHero(date, diet, totals) {
  const target = getDietTarget();
  const mealsDone = MEAL_CFG.filter(m => (diet[m.key] || []).length).length;
  const itemsDone = Object.values(diet).flat().length;
  const pct = pctOf(totals.cal, target.cal);
  const dateText = new Date(date + 'T12:00').toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'short' });

  const heroDate = document.getElementById('dietHeroDate');
  const heroTitle = document.getElementById('dietHeroTitle');
  const heroSubtitle = document.getElementById('dietHeroSubtitle');
  const targetLabel = document.getElementById('dietTargetLabel');
  const targetHint = document.getElementById('dietTargetHint');

  if (heroDate) heroDate.textContent = dateText;
  if (heroTitle) heroTitle.textContent = mealsDone ? `${mealsDone} refeição${mealsDone !== 1 ? 'ões' : ''} registrada${mealsDone !== 1 ? 's' : ''}` : 'Resumo alimentar';
  if (heroSubtitle) heroSubtitle.textContent = itemsDone ? `${itemsDone} alimento${itemsDone !== 1 ? 's' : ''} no dia. Continue ajustando com calma.` : 'Nenhum alimento registrado ainda. Comece pela busca rápida.';
  if (targetLabel) targetLabel.textContent = `${target.cal.toLocaleString('pt-BR')} kcal`;
  if (targetHint) targetHint.textContent = `${pct}% da meta diária estimada`;

  const ring = document.querySelector('.calorie-ring-lite');
  if (ring) ring.style.setProperty('--pct', `${pct}%`);
  setBarWidth('dietTargetFill', pct);
  setBarWidth('protFill', pctOf(totals.prot, target.prot));
  setBarWidth('carbFill', pctOf(totals.carb, target.carb));
  setBarWidth('fatFill', pctOf(totals.fat, target.fat));
}

function getDietDate() {
  if (!S.selectedDietDate) S.selectedDietDate = todayKey();
  return S.selectedDietDate;
}

function sumFoods(items) {
  return (items || []).reduce((acc, item) => {
    acc.cal += Number(item.cal || 0);
    acc.prot += Number(item.prot || 0);
    acc.carb += Number(item.carb || 0);
    acc.fat += Number(item.fat || 0);
    return acc;
  }, { cal: 0, prot: 0, carb: 0, fat: 0 });
}

function ensureDietDay(date = getDietDate()) {
  if (!S.dietLog[date]) S.dietLog[date] = {};
  MEAL_CFG.forEach(m => { if (!S.dietLog[date][m.key]) S.dietLog[date][m.key] = []; });
}

function setDietDate(date) {
  if (!date) return;
  S.selectedDietDate = date;
  renderDiet();
}

function moveDietDate(delta) {
  const d = new Date(getDietDate() + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  setDietDate(d.toISOString().split('T')[0]);
}

function searchFood(q) {
  clearTimeout(foodTimer);
  const dd = document.getElementById('foodDropdown');
  if (!dd) return;
  if (!q.trim()) {
    dd.classList.remove('open');
    dd.innerHTML = '';
    return;
  }

  foodTimer = setTimeout(() => {
    const needle = q.toLowerCase();
    const results = allFoods()
      .filter(f => f.name.toLowerCase().includes(needle))
      .slice(0, 16);

    if (!results.length) {
      dd.innerHTML = `<div class="food-opt"><div><div class="food-opt-name">Nenhum alimento encontrado</div><div class="food-opt-meta">Crie um alimento personalizado ao lado.</div></div></div>`;
      dd.classList.add('open');
      return;
    }

    dd.innerHTML = results.map(f => `
      <div class="food-opt" onclick="addFood('${f.id}')">
        <div>
          <div class="food-opt-name">${f.name} ${f.custom ? '<span class="custom-pill">meu</span>' : ''}</div>
          <div class="food-opt-meta">P:${f.prot}g · C:${f.carb}g · G:${f.fat}g</div>
        </div>
        <span class="food-opt-cal">${f.cal} kcal</span>
      </div>
    `).join('');
    dd.classList.add('open');
  }, 160);
}

async function addFood(id) {
  const food = getFoodById(id);
  const meal = document.getElementById('mealPicker').value;
  const date = getDietDate();
  if (!food) return;

  ensureDietDay(date);
  S.dietLog[date][meal].push(cloneFood(food));
  if (!S.healthLog[date]) S.healthLog[date] = {};
  S.healthLog[date][meal] = true;
  await persist('diet_log', S.dietLog);
  await persist('health_log', S.healthLog);

  const search = document.getElementById('foodSearch');
  const dd = document.getElementById('foodDropdown');
  if (search) search.value = '';
  if (dd) dd.classList.remove('open');

  renderDiet();
  toast(`${food.name} adicionado em ${mealLabel(meal)}.`);
}

async function removeFood(meal, idx) {
  const date = getDietDate();
  if (S.dietLog[date]?.[meal]) {
    S.dietLog[date][meal].splice(idx, 1);
    await persist('diet_log', S.dietLog);
    renderDiet();
  }
}

async function saveCustomFood() {
  const name = document.getElementById('cfName').value.trim();
  const cal = Number(document.getElementById('cfCal').value || 0);
  const prot = Number(document.getElementById('cfProt').value || 0);
  const carb = Number(document.getElementById('cfCarb').value || 0);
  const fat = Number(document.getElementById('cfFat').value || 0);

  if (!name) { toast('Digite o nome do alimento.', 'error'); return; }
  if (cal <= 0 && prot <= 0 && carb <= 0 && fat <= 0) {
    toast('Preencha pelo menos um valor nutricional.', 'error');
    return;
  }

  if (!Array.isArray(S.customFoods)) S.customFoods = [];
  S.customFoods.unshift({ id: `cf_${Date.now()}`, name, cal, prot, carb, fat });
  await persist('custom_foods', S.customFoods);

  ['cfName','cfCal','cfProt','cfCarb','cfFat'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  toast('Alimento personalizado salvo.');
}

async function saveMealAsTemplate(mealKey) {
  const date = getDietDate();
  const items = S.dietLog[date]?.[mealKey] || [];
  if (!items.length) { toast('Adicione alimentos antes de salvar a ficha.', 'info'); return; }

  const defaultName = `${mealLabel(mealKey)} - ${new Date(date + 'T12:00').toLocaleDateString('pt-BR')}`;
  const name = prompt('Nome da ficha alimentar:', defaultName);
  if (!name || !name.trim()) return;

  if (!Array.isArray(S.mealTemplates)) S.mealTemplates = [];
  S.mealTemplates.unshift({
    id: Date.now(),
    name: name.trim(),
    meal: mealKey,
    createdAt: new Date().toISOString(),
    sourceDate: date,
    items: items.map(cloneFood)
  });

  await persist('meal_templates', S.mealTemplates);
  renderDiet();
  toast('Ficha alimentar salva.');
}

async function renameMealTemplate(id) {
  const t = S.mealTemplates.find(x => x.id === id);
  if (!t) return;
  const name = prompt('Novo nome da ficha:', t.name);
  if (!name || !name.trim()) return;
  t.name = name.trim();
  await persist('meal_templates', S.mealTemplates);
  renderDiet();
  toast('Ficha renomeada.');
}

async function applyMealTemplate(id, targetMeal = null) {
  const t = S.mealTemplates.find(x => x.id === id);
  if (!t) return;
  const meal = targetMeal || document.getElementById('mealPicker').value || t.meal;
  const date = getDietDate();
  ensureDietDay(date);
  S.dietLog[date][meal].push(...(t.items || []).map(cloneFood));
  if (!S.healthLog[date]) S.healthLog[date] = {};
  S.healthLog[date][meal] = true;
  await persist('diet_log', S.dietLog);
  await persist('health_log', S.healthLog);
  renderDiet();
  toast(`Ficha adicionada em ${mealLabel(meal)}.`);
}

async function deleteMealTemplate(id) {
  if (!confirm('Excluir esta ficha alimentar?')) return;
  S.mealTemplates = (S.mealTemplates || []).filter(t => t.id !== id);
  await persist('meal_templates', S.mealTemplates);
  renderDiet();
  toast('Ficha removida.', 'info');
}

function renderMealTemplates() {
  const wrap = document.getElementById('mealTemplatesGrid');
  if (!wrap) return;
  const filter = document.getElementById('templateMealFilter')?.value || 'all';
  const list = (S.mealTemplates || []).filter(t => filter === 'all' || t.meal === filter);

  if (!list.length) {
    wrap.innerHTML = `
      <div class="empty-template-box">
        <i class='bx bx-bookmark-plus'></i>
        <div><strong>Nenhuma ficha salva.</strong><span>Monte uma refeicao abaixo e clique em “Salvar como ficha”.</span></div>
      </div>`;
    return;
  }

  wrap.innerHTML = list.map(t => {
    const totals = sumFoods(t.items);
    const color = mealColor(t.meal);
    return `
      <div class="meal-template-card">
        <div class="meal-template-head">
          <div>
            <div class="meal-template-name">${t.name}</div>
            <div class="meal-template-meta">${mealLabel(t.meal)} · ${t.items.length} item${t.items.length !== 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;gap:.35rem">
            <button class="icon-mini" onclick="renameMealTemplate(${t.id})" title="Renomear"><i class='bx bx-edit'></i></button>
            <button class="icon-mini danger" onclick="deleteMealTemplate(${t.id})" title="Excluir"><i class='bx bx-trash'></i></button>
          </div>
        </div>
        <div class="meal-template-macros">
          <span>${Math.round(totals.cal)} kcal</span><span>P:${Math.round(totals.prot)}g</span><span>C:${Math.round(totals.carb)}g</span><span>G:${Math.round(totals.fat)}g</span>
        </div>
        <div class="meal-template-foods">
          ${(t.items || []).map(item => `
            <div class="meal-template-food"><span class="template-dot" style="background:${color}"></span><span>${item.name}</span><strong>${item.cal} kcal</strong></div>
          `).join('')}
        </div>
        <div class="meal-template-actions">
          <button class="btn btn-primary btn-template" onclick="applyMealTemplate(${t.id}, '${t.meal}')"><i class='bx bx-plus-circle'></i>Usar em ${mealLabel(t.meal)}</button>
          <button class="btn btn-ghost btn-template" onclick="applyMealTemplate(${t.id})"><i class='bx bx-transfer'></i>Usar na selecionada</button>
        </div>
      </div>`;
  }).join('');
}

function getDietDayTotals(date) {
  const diet = S.dietLog[date] || {};
  return sumFoods(Object.values(diet).flat());
}

function renderDietHistory() {
  const wrap = document.getElementById('dietHistoryList');
  if (!wrap) return;
  const dates = Object.keys(S.dietLog || {}).sort().reverse().slice(0, 10);
  if (!dates.length) {
    wrap.innerHTML = `<div class="empty-inline">Nenhum histórico alimentar ainda.</div>`;
    return;
  }
  wrap.innerHTML = dates.map(d => {
    const totals = getDietDayTotals(d);
    const active = d === getDietDate();
    return `<button class="diet-history-item ${active ? 'active' : ''}" onclick="setDietDate('${d}')">
      <span>${new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' })}</span>
      <strong>${Math.round(totals.cal)} kcal</strong>
      <small>P:${Math.round(totals.prot)}g · C:${Math.round(totals.carb)}g · G:${Math.round(totals.fat)}g</small>
    </button>`;
  }).join('');
}

function renderDiet() {
  const date = getDietDate();
  const picker = document.getElementById('dietDatePicker');
  if (picker) picker.value = date;
  ensureDietDay(date);
  renderMealShortcuts();
  renderMealTemplates();
  renderDietHistory();

  const diet = S.dietLog[date] || {};
  const totals = sumFoods(Object.values(diet).flat());
  updateDietHero(date, diet, totals);

  const calEl = document.getElementById('macCal');
  if (calEl) calEl.textContent = Math.round(totals.cal);
  const protEl = document.getElementById('macProt');
  if (protEl) protEl.textContent = `${Math.round(totals.prot)}g`;
  const carbEl = document.getElementById('macCarb');
  if (carbEl) carbEl.textContent = `${Math.round(totals.carb)}g`;
  const fatEl = document.getElementById('macFat');
  if (fatEl) fatEl.textContent = `${Math.round(totals.fat)}g`;

  const container = document.getElementById('mealsContainer');
  if (!container) return;

  container.innerHTML = MEAL_CFG.map(m => {
    const items = diet[m.key] || [];
    const mt = sumFoods(items);
    const openClass = items.length ? 'has-food' : '';
    return `
      <div class="meal-card modern-meal-card ${openClass}">
        <div class="meal-header" onclick="toggleMealBody(this)">
          <div class="meal-header-left">
            <div class="meal-icon" style="background:${m.color}20"><i class='bx ${m.icon}' style="color:${m.color}"></i></div>
            <div><div class="meal-name">${m.label}</div><div class="meal-cal-sub">${Math.round(mt.cal)} kcal · ${items.length} item${items.length !== 1 ? 's' : ''}</div></div>
          </div>
          <div class="meal-header-right"><span class="meal-mini-macros">P:${Math.round(mt.prot)}g · C:${Math.round(mt.carb)}g · G:${Math.round(mt.fat)}g</span><span class="meal-chevron"><i class='bx bx-chevron-down'></i></span></div>
        </div>
        <div class="meal-body">
          ${!items.length ? `<div class="empty-meal-mini"><i class='bx bx-food-menu'></i><span>Nenhum alimento registrado nessa refeição.</span></div>` : items.map((item, idx) => `
            <div class="food-row">
              <div class="food-dot" style="background:${m.color}"></div>
              <div style="flex:1"><div class="food-row-name">${item.name}</div><div class="food-row-macro">P:${item.prot}g · C:${item.carb}g · G:${item.fat}g</div></div>
              <span class="food-row-cal">${item.cal} kcal</span>
              <i class='bx bx-trash food-row-del' onclick="event.stopPropagation(); removeFood('${m.key}',${idx})"></i>
            </div>`).join('')}
          <div class="meal-actions-line">
            <div class="meal-add" onclick="document.getElementById('mealPicker').value='${m.key}'; renderMealShortcuts(); document.getElementById('foodSearch').focus()"><i class='bx bx-plus'></i>Adicionar alimento</div>
            ${items.length ? `<button class="save-template-btn" onclick="saveMealAsTemplate('${m.key}')"><i class='bx bx-bookmark-plus'></i>Salvar como ficha</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

function toggleMealBody(header) {
  const body = header.nextElementSibling;
  const chev = header.querySelector('.meal-chevron');
  const open = body.style.display !== 'none' && body.style.display !== '';
  body.style.display = open ? 'none' : 'block';
  chev.classList.toggle('open', !open);
}
