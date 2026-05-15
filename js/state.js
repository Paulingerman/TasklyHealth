/* ═══════════════════════════════════════════════════════════════
   state.js — Estado global 100% local, sem banco e sem API
═══════════════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  user:             'tl_user',
  routine:          'tl_routine',
  healthLog:        'tl_health_log',
  dietLog:          'tl_diet_log',
  mealTemplates:    'tl_meal_templates',
  customFoods:      'tl_custom_foods',
  waterLog:         'tl_water_log',
  workoutTemplates: 'tl_workout_templates',
  workoutLog:       'tl_workout_log',
  theme:            'tl_theme'
};

const DEFAULT_ROUTINE = {
  waterGoal: 2,
  sleepGoal: 8,
  breakfast: true,
  lunch: true,
  dinner: true,
  snack: false,
  exercises: [],
  exerciseDays: []
};

let S = {
  user: null,
  token: null,
  routine: { ...DEFAULT_ROUTINE },
  healthLog: {},
  dietLog: {},
  mealTemplates: [],
  customFoods: [],
  waterLog: [],
  workoutTemplates: [],
  workoutLog: {},
  currentEx: null,
  selectedDietDate: null
};

const ls = (k, v) =>
  v === undefined
    ? localStorage.getItem(k)
    : v === null
      ? localStorage.removeItem(k)
      : localStorage.setItem(k, v);

const todayKey = () => new Date().toISOString().split('T')[0];

function safeParse(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); }
  catch (e) { return fallback; }
}

function normalizeState() {
  S.routine = { ...DEFAULT_ROUTINE, ...(S.routine || {}) };
  if (!Array.isArray(S.routine.exercises)) S.routine.exercises = [];
  if (!Array.isArray(S.routine.exerciseDays)) S.routine.exerciseDays = [];
  if (!S.healthLog || typeof S.healthLog !== 'object') S.healthLog = {};
  if (!S.dietLog || typeof S.dietLog !== 'object') S.dietLog = {};
  if (!Array.isArray(S.mealTemplates)) S.mealTemplates = [];
  if (!Array.isArray(S.customFoods)) S.customFoods = [];
  if (!Array.isArray(S.waterLog)) S.waterLog = [];
  if (!Array.isArray(S.workoutTemplates)) S.workoutTemplates = [];
  if (!S.workoutLog || typeof S.workoutLog !== 'object') S.workoutLog = {};
  if (!S.selectedDietDate) S.selectedDietDate = todayKey();
}

async function call() {
  throw new Error('Este projeto esta em modo local. Nao existe API ou banco de dados.');
}

async function persist(type, data) {
  const map = {
    routine: 'routine',
    health_log: 'healthLog',
    diet_log: 'dietLog',
    meal_templates: 'mealTemplates',
    custom_foods: 'customFoods',
    water_log: 'waterLog',
    workout_templates: 'workoutTemplates',
    workout_log: 'workoutLog'
  };
  const stateKey = map[type];
  const storageKey = `tl_${type}`;
  if (stateKey) S[stateKey] = data;
  ls(storageKey, JSON.stringify(data));
}

async function loadState() {
  S.user             = safeParse(ls(STORAGE_KEYS.user), null);
  S.routine          = safeParse(ls(STORAGE_KEYS.routine), { ...DEFAULT_ROUTINE });
  S.healthLog        = safeParse(ls(STORAGE_KEYS.healthLog), {});
  S.dietLog          = safeParse(ls(STORAGE_KEYS.dietLog), {});
  S.mealTemplates    = safeParse(ls(STORAGE_KEYS.mealTemplates), []);
  S.customFoods      = safeParse(ls(STORAGE_KEYS.customFoods), []);
  S.waterLog         = safeParse(ls(STORAGE_KEYS.waterLog), []);
  S.workoutTemplates = safeParse(ls(STORAGE_KEYS.workoutTemplates), []);
  S.workoutLog       = safeParse(ls(STORAGE_KEYS.workoutLog), {});
  normalizeState();
}

function getBackupPayload() {
  normalizeState();
  return {
    app: 'TasklyHealth',
    version: 'local-3.0.0',
    exportedAt: new Date().toISOString(),
    user: S.user,
    routine: S.routine,
    healthLog: S.healthLog,
    dietLog: S.dietLog,
    mealTemplates: S.mealTemplates,
    customFoods: S.customFoods,
    waterLog: S.waterLog,
    workoutTemplates: S.workoutTemplates,
    workoutLog: S.workoutLog,
    theme: ls(STORAGE_KEYS.theme) || 'dark'
  };
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportLocalData() {
  const date = todayKey();
  downloadJSON(`taskly-health-backup-${date}.json`, getBackupPayload());
  toast('Backup exportado.', 'success');
}

async function importLocalDataFromFile(file) {
  if (!file) return;
  const text = await file.text();
  let data;
  try { data = JSON.parse(text); }
  catch (e) { toast('Arquivo JSON invalido.', 'error'); return; }

  const imported = {
    user: data.user || null,
    routine: data.routine || { ...DEFAULT_ROUTINE },
    healthLog: data.healthLog || {},
    dietLog: data.dietLog || {},
    mealTemplates: data.mealTemplates || [],
    customFoods: data.customFoods || [],
    waterLog: data.waterLog || [],
    workoutTemplates: data.workoutTemplates || [],
    workoutLog: data.workoutLog || {}
  };

  S = { ...S, ...imported, selectedDietDate: todayKey() };
  normalizeState();

  ls(STORAGE_KEYS.user, JSON.stringify(S.user));
  await persist('routine', S.routine);
  await persist('health_log', S.healthLog);
  await persist('diet_log', S.dietLog);
  await persist('meal_templates', S.mealTemplates);
  await persist('custom_foods', S.customFoods);
  await persist('water_log', S.waterLog);
  await persist('workout_templates', S.workoutTemplates);
  await persist('workout_log', S.workoutLog);

  if (data.theme) {
    ls(STORAGE_KEYS.theme, data.theme);
    document.documentElement.setAttribute('data-theme', data.theme);
  }

  toast('Backup importado com sucesso.', 'success');
  if (S.user) bootApp();
  else showAuth(true);
}

function wipeLocalData() {
  if (!confirm('Apagar todos os dados locais deste navegador? Essa acao nao pode ser desfeita.')) return;
  Object.values(STORAGE_KEYS).forEach(k => ls(k, null));
  S = {
    user: null,
    token: null,
    routine: { ...DEFAULT_ROUTINE },
    healthLog: {},
    dietLog: {},
    mealTemplates: [],
    customFoods: [],
    waterLog: [],
    workoutTemplates: [],
    workoutLog: {},
    currentEx: null,
    selectedDietDate: todayKey()
  };
  toast('Dados locais apagados.', 'info');
  showAuth(true);
  showAuthPage('register');
}
