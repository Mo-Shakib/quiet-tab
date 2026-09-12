const SEARCH_ENGINES = [
  {
    id: "google", name: "Google", url: "https://www.google.com/search?q=", placeholder: "Search Google or type a URL",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.1 5.1 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77a6.6 6.6 0 0 1-9.87-3.48H2.18v2.85A11 11 0 0 0 12 23Z"/><path fill="#fbbc05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.85Z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84A6.55 6.55 0 0 1 12 5.38Z"/></svg>`
  },
  {
    id: "duckduckgo", name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", placeholder: "Search privately with DuckDuckGo",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#de5833"/><path fill="#fff" d="M8.1 12.2c-.7-3.6 1.3-6.4 4.3-6.4 2.7 0 4.6 1.8 4.8 4.4 1 .2 1.8.7 2.2 1.3-1.2 1-3 1.5-5 1.3l-.5 1.3c1.2.5 2.3 1.2 3.1 2.2-1.3 1.3-3 2-5 2-2.5 0-4.5-1-5.7-2.8.6-1.2 1.1-2.3 1.8-3.3Z"/><circle cx="13.9" cy="8.9" r="1" fill="#202124"/><path fill="#f2b233" d="M15.6 10.7c1.7-.3 3.3 0 4.2.8-1 .9-2.6 1.3-4.4 1l.2-1.8Z"/></svg>`
  },
  {
    id: "bing", name: "Bing", url: "https://www.bing.com/search?q=", placeholder: "Search Bing",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#0ca5a5" d="M6.2 2.2 10 3.5v10.3l3.3-1.9 4.4 2.2-7.7 4.5-3.8-2.2V2.2Z"/><path fill="#087d8b" d="m10 9.3 7.7 4.8-4.4-2.2-3.3 1.9V9.3Z"/></svg>`
  },
  {
    id: "brave", name: "Brave", url: "https://search.brave.com/search?q=", placeholder: "Search with Brave",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fb542b" d="m12 1.5 8.7 3.2-.8 12.1-4.6 5.7H8.7l-4.6-5.7-.8-12.1L12 1.5Z"/><path fill="#fff" d="m7 7.1 2.5-1.4 2.5.7 2.5-.7L17 7.1l1.1 7.5-3.5 4.4H9.4l-3.5-4.4L7 7.1Zm2.1 3 .4 4.9 2.5 1.5 2.5-1.5.4-4.9-2.9 1-2.9-1Z"/></svg>`
  },
  {
    id: "youtube", name: "YouTube", url: "https://www.youtube.com/results?search_query=", placeholder: "Search YouTube",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#ff0033" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8Z"/><path fill="#fff" d="m9.6 15.6 6.2-3.6-6.2-3.6v7.2Z"/></svg>`
  },
  {
    id: "github", name: "GitHub", url: "https://github.com/search?q=", placeholder: "Search GitHub",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#f0f0f2" fill-rule="evenodd" d="M12 2C6.48 2 2 6.49 2 12.02a10 10 0 0 0 6.84 9.5c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.35-3.37-1.35-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.55 9.55 0 0 1 12 6.84c.85 0 1.71.12 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.49 17.52 2 12 2Z" clip-rule="evenodd"/></svg>`
  },
  {
    id: "reddit", name: "Reddit", url: "https://www.reddit.com/search/?q=", placeholder: "Search Reddit",
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#ff4500"/><path fill="#fff" d="M18.4 10.1c-.5 0-.9.2-1.2.5A8.3 8.3 0 0 0 12.5 9l.8-3.4 2.4.5a1.5 1.5 0 1 0 .2-.8l-2.9-.6c-.3-.1-.5.1-.6.4L11.5 9a8.6 8.6 0 0 0-4.8 1.5 1.7 1.7 0 1 0-1.8 2.8v.5c0 2.7 3.2 4.9 7.1 4.9s7.1-2.2 7.1-4.9v-.5a1.7 1.7 0 0 0-.7-3.2ZM8.6 13.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm6.7 4c-.9.9-2.6 1-3.3 1s-2.4-.1-3.3-1a.4.4 0 0 1 .6-.6c.6.6 1.9.8 2.7.8.8 0 2.1-.2 2.7-.8a.4.4 0 0 1 .6.6Zm.1-1.6a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/></svg>`
  }
];

const state = { engineIndex: 0, is24Hour: false, targetBlank: false, username: "", toastTimer: null };
const $ = (selector) => document.querySelector(selector);
const safeStorage = {
  set(key, value) { try { localStorage.setItem(key, String(value)); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); return true; } catch { return false; } }
};

const _fmtCache = new Map();
function cachedDateFormat(options) {
  const key = JSON.stringify(options);
  let fmt = _fmtCache.get(key);
  if (!fmt) { fmt = new Intl.DateTimeFormat(options.locale, options); _fmtCache.set(key, fmt); }
  return fmt;
}

function readStorage() {
  try {
    const engineId = localStorage.getItem("nt_engine");
    const index = SEARCH_ENGINES.findIndex((engine) => engine.id === engineId);
    state.engineIndex = index >= 0 ? index : 0;
    state.is24Hour = localStorage.getItem("nt_24h") === "true";
    state.targetBlank = localStorage.getItem("nt_target_blank") === "true";
    state.username = localStorage.getItem("nt_username") || "";
  } catch {}
}

function engineBadge(engine) {
  const template = document.createElement("template");
  template.innerHTML = engine.icon;
  const logo = template.content.firstElementChild;
  logo.classList.add("engine-logo");
  return logo;
}

function renderEngine() {
  const engine = SEARCH_ENGINES[state.engineIndex];
  $("#current-engine-icon").replaceChildren(engineBadge(engine));
  $("#current-engine-name").textContent = engine.name;
  $("#search-input").placeholder = engine.placeholder;
  const list = $("#engine-options-list");
  list.replaceChildren();
  SEARCH_ENGINES.forEach((item, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "engine-option";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === state.engineIndex));
    option.append(engineBadge(item));
    const name = document.createElement("span");
    name.textContent = item.name;
    option.append(name);
    if (index === state.engineIndex) {
      const check = document.createElement("span");
      check.className = "check";
      check.textContent = "✓";
      option.append(check);
    }
    option.addEventListener("click", () => selectEngine(index));
    list.append(option);
  });
}

function toggleEngineMenu(force) {
  const button = $("#engine-dropdown-button");
  const menu = $("#engine-menu");
  const shouldOpen = force ?? menu.hidden;
  menu.hidden = !shouldOpen;
  button.setAttribute("aria-expanded", String(shouldOpen));
}

function selectEngine(index, notify = false) {
  state.engineIndex = index;
  safeStorage.set("nt_engine", SEARCH_ENGINES[index].id);
  renderEngine();
  toggleEngineMenu(false);
  $("#search-input").focus();
  if (notify) showToast(`Searching with ${SEARCH_ENGINES[index].name}`);
}

let _lastClockText = '', _lastDateText = '', _lastGreetingText = '', _lastPeriodText = '', _lastPeriodHidden = null;
function updateClock() {
  const now = window.solarContext?.date || new Date();
  const timeZone = window.solarContext?.timeZone || 'Asia/Dhaka';
  const timeFmt = cachedDateFormat({locale:'en-GB',timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const parts = timeFmt.formatToParts(now);
  const hour = Number(parts.find(p=>p.type==='hour').value);
  const minute = Number(parts.find(p=>p.type==='minute').value);
  const shownHour = state.is24Hour ? hour : hour % 12 || 12;
  const clockText = `${String(shownHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  if (clockText !== _lastClockText) { $("#clock-display").textContent = clockText; _lastClockText = clockText; }
  const periodText = hour >= 12 ? "PM" : "AM";
  if (periodText !== _lastPeriodText) { $("#period-display").textContent = periodText; _lastPeriodText = periodText; }
  if (state.is24Hour !== _lastPeriodHidden) { $("#period-display").hidden = state.is24Hour; _lastPeriodHidden = state.is24Hour; }
  const dateFmt = cachedDateFormat({timeZone, weekday: "short", month: "short", day: "numeric"});
  const dateText = dateFmt.format(now);
  const dateEl = $("#date-display");
  if (dateEl && dateText !== _lastDateText) { dateEl.textContent = dateText; _lastDateText = dateText; }
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greetingText = state.username ? `${greeting}, ${state.username}.` : `${greeting}.`;
  if (greetingText !== _lastGreetingText) { $("#greeting-display").textContent = greetingText; _lastGreetingText = greetingText; }
}

function looksLikeAddress(value) {
  if (/^(https?|file):\/\//i.test(value)) return true;
  if (/^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/i.test(value)) return true;
  return /^[^\s]+\.[a-z]{2,}(\/[^\s]*)?$/i.test(value);
}

function handleSearch(event) {
  event.preventDefault();
  const query = $("#search-input").value.trim();
  if (!query) return;
  const destination = looksLikeAddress(query) ? (/^[a-z]+:\/\//i.test(query) ? query : `https://${query}`) : SEARCH_ENGINES[state.engineIndex].url + encodeURIComponent(query);
  if (state.targetBlank) window.open(destination, "_blank", "noopener,noreferrer");
  else window.location.assign(destination);
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog.open) dialog.showModal();
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog.open) dialog.close();
}

function saveUsername() {
  state.username = $("#setting-username").value.trim();
  safeStorage.set("nt_username", state.username);
  updateClock();
  showToast("Greeting updated");
}

function syncSettings() {
  $("#setting-24h").checked = state.is24Hour;
  $("#setting-target").checked = state.targetBlank;
  $("#setting-username").value = state.username;
}

function resetPreferences() {
  ["nt_engine", "nt_24h", "nt_target_blank", "nt_username"].forEach((key) => safeStorage.remove(key));
  state.engineIndex = 0;
  state.is24Hour = false;
  state.targetBlank = false;
  state.username = "";
  syncSettings(); renderEngine(); updateClock();
  document.dispatchEvent(new CustomEvent("quiet-reset"));
  showToast("Preferences reset");
}

function showToast(message) {
  const toast = $("#toast");
  $("#toast-message").textContent = message;
  toast.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

function bindEvents() {
  $("#search-form").addEventListener("submit", handleSearch);
  $("#engine-dropdown-button").addEventListener("click", () => toggleEngineMenu());
  $("#clear-search-btn").addEventListener("click", () => { $("#search-input").value = ""; $("#clear-search-btn").hidden = true; $("#search-input").focus(); });
  $("#search-input").addEventListener("input", (event) => { $("#clear-search-btn").hidden = !event.currentTarget.value; });
  $("#open-settings-trigger").addEventListener("click", () => openDialog("settings-modal"));
  $("#save-username").addEventListener("click", saveUsername);
  $("#setting-username").addEventListener("keydown", (event) => { if (event.key === "Enter") saveUsername(); });
  $("#setting-24h").addEventListener("change", (event) => { state.is24Hour = event.currentTarget.checked; safeStorage.set("nt_24h", state.is24Hour); updateClock(); });
  $("#setting-target").addEventListener("change", (event) => { state.targetBlank = event.currentTarget.checked; safeStorage.set("nt_target_blank", state.targetBlank); });
  $("#reset-trigger").addEventListener("click", () => openDialog("reset-modal"));
  $("#confirm-reset").addEventListener("click", () => { closeDialog("reset-modal"); resetPreferences(); });
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.close)));
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));
  document.addEventListener("click", (event) => { if (!$(".engine-picker").contains(event.target)) toggleEngineMenu(false); });
  document.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    if (event.key === "/" && !typing) { event.preventDefault(); $("#search-input").focus(); }
    else if (event.key === "Tab") { event.preventDefault(); selectEngine((state.engineIndex + 1) % SEARCH_ENGINES.length); }
    else if (event.key === "Escape") toggleEngineMenu(false);
  });
}

function init() {
  readStorage(); syncSettings(); renderEngine(); updateClock(); bindEvents();
  // solar.js drives updateClock() via render() every second when loaded;
  // only start a standalone clock if solar.js isn't present.
  if (!window.SolarModel) setInterval(updateClock, 1000);
}

document.addEventListener("DOMContentLoaded", init);
