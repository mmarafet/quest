// js/theme.js
const Theme = (() => {
  const KEY = "TASK_THEME"; // "minimal" | "game" | "hitech"
  const THEMES = ["minimal", "game", "hitech"];

  function get() {
    const t = localStorage.getItem(KEY) || "minimal";
    return THEMES.includes(t) ? t : "minimal";
  }

  function label(theme){
    if (theme === "game") return "Режим: ИГРОВОЙ";
    if (theme === "hitech") return "Режим: ХАЙТЕК";
    return "Режим: МИНИМАЛ";
  }

  function apply(theme) {
    const t = THEMES.includes(theme) ? theme : "minimal";
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(KEY, t);

    const pill = document.getElementById("themeLabel");
    if (pill) pill.innerText = label(t);

    const sel = document.getElementById("themeSelect");
    if (sel) sel.value = t;
  }

  function toggle() {
    const cur = get();
    const idx = THEMES.indexOf(cur);
    const next = THEMES[(idx + 1) % THEMES.length];
    apply(next);
  }

  function init() {
    apply(get());
    const sel = document.getElementById("themeSelect");
    if (sel) sel.addEventListener("change", () => apply(sel.value));
  }

  return { init, toggle, apply, get };
})();
