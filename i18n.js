// Focus Tools — Shared i18n helper
// Loaded by: popup.html, options.html, blocked.html (before page-specific scripts)

let _messages = null; // null = use chrome.i18n (Chrome default), object = custom locale
let _currentLang = null; // resolved language code

/**
 * Get a translated message with optional placeholder substitutions.
 * Uses custom-loaded messages if a language override is set, otherwise chrome.i18n.
 */
function msg(key, substitutions) {
  if (_messages) {
    const entry = _messages[key];
    if (!entry) return key;
    let text = entry.message;
    if (substitutions && entry.placeholders) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      for (const [name, ph] of Object.entries(entry.placeholders)) {
        const val = ph.content.replace(/\$(\d+)/g, (_, idx) => subs[parseInt(idx) - 1] || "");
        text = text.replace(new RegExp("\\$" + name + "\\$", "gi"), val);
      }
    }
    return text;
  }
  return chrome.i18n.getMessage(key, substitutions) || key;
}

/**
 * Available languages with display info.
 */
const LANGUAGES = [
  { code: "auto", name: "🌐 Chrome default" },
  { code: "en",   name: "English" },
  { code: "es",   name: "Español" },
  { code: "ar",   name: "العربية" },
  { code: "ru",   name: "Русский" },
  { code: "fr",   name: "Français" },
  { code: "it",   name: "Italiano" },
  { code: "he",   name: "עברית" }
];

/**
 * Load i18n resources. Returns a promise that resolves when ready.
 * - If language is "auto" or unset: uses chrome.i18n (zero overhead)
 * - If a specific language: fetches the locale's messages.json
 */
async function initI18n() {
  // Read user language preference
  const data = await chrome.storage.local.get("language");
  const language = data.language || "auto";

  if (language !== "auto") {
    try {
      const url = chrome.runtime.getURL(`_locales/${language}/messages.json`);
      const res = await fetch(url);
      _messages = await res.json();
      _currentLang = language;
    } catch (e) {
      _messages = null;
      _currentLang = null;
    }
  }

  // Determine effective language for RTL detection
  const lang = _currentLang || chrome.i18n.getUILanguage();
  if (lang.startsWith("ar") || lang.startsWith("he")) {
    document.documentElement.setAttribute("dir", "rtl");
  } else {
    document.documentElement.removeAttribute("dir");
  }

  // Process data-i18n attributes on static HTML elements
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const m = msg(el.getAttribute("data-i18n"));
    if (m) el.textContent = m;
  });

  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const m = msg(el.getAttribute("data-i18n-html"));
    if (m) el.innerHTML = m;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const m = msg(el.getAttribute("data-i18n-placeholder"));
    if (m) el.placeholder = m;
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const m = msg(el.getAttribute("data-i18n-title"));
    if (m) el.title = m;
  });
}

// Start loading immediately — page scripts await this promise
const i18nReady = initI18n();
