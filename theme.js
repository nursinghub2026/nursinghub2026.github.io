/* Apply the saved choice before first paint, including admin and the file viewer. */
(function () {
  'use strict';
  const key = 'NPH_THEME_V1';
  function apply(value) {
    const dark = value === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الليلي');
    });
    document.querySelectorAll('img[data-dark-src]').forEach(img => {
      const target = dark ? img.dataset.darkSrc : img.dataset.lightSrc;
      if (target && img.getAttribute('src') !== target) img.setAttribute('src', target);
    });
  }
  let saved = 'light';
  try { saved = localStorage.getItem(key) || 'light'; } catch (_) {}
  apply(saved);
  window.NPHTheme = {
    toggle() {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(key, next); } catch (_) {}
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', () => window.NPHTheme.toggle());
    });
  });
  window.addEventListener('storage', event => { if (event.key === key) apply(event.newValue); });
})();
