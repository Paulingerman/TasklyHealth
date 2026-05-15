/* ═══════════════════════════════════════════════════════════════
   main.js — Inicializacao local do aplicativo
═══════════════════════════════════════════════════════════════ */

(function init() {
  const savedTheme = ls('tl_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeIcon = document.querySelector('#themeBtn i');
  if (themeIcon) themeIcon.className = savedTheme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';

  const updateDate = () => {
    const el = document.getElementById('topDate');
    if (el) el.textContent = new Date().toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short' });
  };
  updateDate();
  setInterval(updateDate, 60000);

  loadState().then(() => {
    if (S.user) bootApp();
    else {
      showAuth(true);
      showAuthPage('register');
    }
  });
})();
