// Expose for backward-compat with old onclick buttons (if you keep any)
window.goTo = function (page) {
  if (!page) return;
  window.location.href = page;
};
