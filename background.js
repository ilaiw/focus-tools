// Focus Tools — Background Service Worker
importScripts("site-config.js");

const BLOCKLIST_CATEGORIES = {
  porn:     { label: "Porn",      url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts" },
  gambling: { label: "Gambling",  url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling-only/hosts" },
  fakenews: { label: "Fake News", url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-only/hosts" }
};

const DEFAULT_BLOCKLIST_CATEGORIES = {
  porn:     { enabled: false, lastUpdated: null, domainCount: 0 },
  gambling: { enabled: false, lastUpdated: null, domainCount: 0 },
  fakenews: { enabled: false, lastUpdated: null, domainCount: 0 }
};

let blocklistDomainSet = new Set();

// Load enabled blocklist domains into memory (called on startup and after changes)
async function loadBlocklistIntoMemory() {
  const { blocklistCategories } = await chrome.storage.local.get("blocklistCategories");
  const cats = blocklistCategories || DEFAULT_BLOCKLIST_CATEGORIES;
  const keys = [];
  for (const [cat, info] of Object.entries(cats)) {
    if (info.enabled) keys.push(`blocklistDomains_${cat}`);
  }
  if (keys.length === 0) { blocklistDomainSet = new Set(); return; }

  const data = await chrome.storage.local.get(keys);
  const combined = new Set();
  for (const key of keys) {
    if (data[key]) for (const d of data[key]) combined.add(d);
  }
  blocklistDomainSet = combined;
}

// Fetch and parse a StevenBlack hosts file for a category
async function fetchBlocklistCategory(category) {
  const config = BLOCKLIST_CATEGORIES[category];
  if (!config) throw new Error("Unknown category: " + category);

  const response = await fetch(config.url);
  if (!response.ok) throw new Error("Fetch failed: " + response.status);
  const text = await response.text();

  const domains = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("::1") || trimmed.startsWith("127.0.0.1")) continue;
    if (!trimmed.startsWith("0.0.0.0 ")) continue;
    const domain = trimmed.substring(8).trim();
    if (domain && domain !== "0.0.0.0") domains.push(domain);
  }

  const { blocklistCategories } = await chrome.storage.local.get("blocklistCategories");
  const cats = blocklistCategories || DEFAULT_BLOCKLIST_CATEGORIES;
  cats[category] = { enabled: true, lastUpdated: Date.now(), domainCount: domains.length };

  await chrome.storage.local.set({
    [`blocklistDomains_${category}`]: domains,
    blocklistCategories: cats
  });

  await loadBlocklistIntoMemory();
  return cats;
}

// Load blocklist on service worker startup
loadBlocklistIntoMemory();

const DEFAULT_COUNTDOWN_SECONDS = 2;

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (result) => {
    const updates = {};
    if (result.enabled === undefined) updates.enabled = true;
    if (!result.blockedSites) updates.blockedSites = [];
    if (!result.blockedKeywords) updates.blockedKeywords = [];
    if (!result.siteToggles) updates.siteToggles = DEFAULT_SITE_TOGGLES;
    if (!result.siteModes) updates.siteModes = DEFAULT_SITE_MODES;
    if (!result.countdownSeconds) updates.countdownSeconds = DEFAULT_COUNTDOWN_SECONDS;
    if (!result.blocklistCategories) updates.blocklistCategories = DEFAULT_BLOCKLIST_CATEGORIES;
    if (Object.keys(updates).length) chrome.storage.local.set(updates);
  });
  updateRules();
});

// Block chrome://extensions and edge://extensions when enabled
function isExtensionsUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.startsWith("chrome://extensions") || lower.startsWith("edge://extensions");
}

function blockExtensionsTab(tabId, url) {
  if (!isExtensionsUrl(url)) return;
  chrome.storage.local.get(["blockExtensionsPage"], (result) => {
    if (result.blockExtensionsPage) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL("blocked.html") });
    }
  });
}

// Catch URL changes within a tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) blockExtensionsTab(tabId, changeInfo.url);
});

// Catch when user switches to a tab that's already on extensions page
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) blockExtensionsTab(tab.id, tab.url);
  });
});

// Listen for alarms (only used by popup disable)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "disableExtension") {
    chrome.storage.local.set({ enabled: false, disabling: false });
    updateRules();
    chrome.runtime.sendMessage({ type: "disabled" }).catch(() => {});
  }
});

// Block domains from community blocklists via webNavigation
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  if (blocklistDomainSet.size === 0) return;

  chrome.storage.local.get("enabled", (result) => {
    if (result.enabled === false) return;
    let hostname;
    try { hostname = new URL(details.url).hostname.replace(/^www\./, ""); } catch { return; }
    if (blocklistDomainSet.has(hostname)) {
      chrome.tabs.update(details.tabId, { url: chrome.runtime.getURL("blocked.html") });
    }
  });
});

// Listen for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getState") {
    chrome.storage.local.get(null, (result) => {
      // Merge stored toggles with defaults so new keys are always present
      const storedToggles = result.siteToggles || {};
      const mergedToggles = {};
      for (const [siteKey, defaults] of Object.entries(DEFAULT_SITE_TOGGLES)) {
        mergedToggles[siteKey] = { ...defaults, ...(storedToggles[siteKey] || {}) };
      }

      const storedModes = result.siteModes || {};
      const mergedModes = { ...DEFAULT_SITE_MODES, ...storedModes };

      sendResponse({
        enabled: result.enabled !== false,
        blockedSites: result.blockedSites || [],
        blockedKeywords: result.blockedKeywords || [],
        countdownSeconds: result.countdownSeconds || DEFAULT_COUNTDOWN_SECONDS,
        disabling: result.disabling || false,
        disableAt: result.disableAt || null,
        siteToggles: mergedToggles,
        siteModes: mergedModes,
        blockExtensionsPage: result.blockExtensionsPage || false,
        blocklistCategories: result.blocklistCategories || DEFAULT_BLOCKLIST_CATEGORIES
      });
    });
    return true;
  }

  // --- Extension enable/disable (popup) ---

  if (msg.type === "requestDisable") {
    chrome.storage.local.get(["countdownSeconds"], (result) => {
      const seconds = result.countdownSeconds || DEFAULT_COUNTDOWN_SECONDS;
      const disableAt = Date.now() + seconds * 1000;
      chrome.storage.local.set({ disabling: true, disableAt });
      chrome.alarms.create("disableExtension", { delayInMinutes: seconds / 60 });
      sendResponse({ disabling: true, disableAt });
    });
    return true;
  }

  if (msg.type === "cancelDisable") {
    chrome.alarms.clear("disableExtension");
    chrome.storage.local.set({ disabling: false, disableAt: null });
    sendResponse({ disabling: false });
    return true;
  }

  if (msg.type === "enable") {
    chrome.alarms.clear("disableExtension");
    chrome.storage.local.set({ enabled: true, disabling: false, disableAt: null });
    updateRules();
    sendResponse({ enabled: true });
    return true;
  }

  // --- Blocklist ---

  if (msg.type === "addSites") {
    chrome.storage.local.get(["blockedSites"], (result) => {
      const sites = result.blockedSites || [];
      const existing = new Set(sites);
      for (const s of msg.sites) {
        if (s && !existing.has(s)) { sites.push(s); existing.add(s); }
      }
      chrome.storage.local.set({ blockedSites: sites });
      updateRules();
      sendResponse({ ok: true, blockedSites: sites });
    });
    return true;
  }

  if (msg.type === "addSite") {
    chrome.storage.local.get(["blockedSites"], (result) => {
      const sites = result.blockedSites || [];
      if (!sites.includes(msg.site)) {
        sites.push(msg.site);
        chrome.storage.local.set({ blockedSites: sites });
        updateRules();
      }
      sendResponse({ ok: true, blockedSites: sites });
    });
    return true;
  }

  if (msg.type === "removeSite") {
    chrome.storage.local.get(["blockedSites"], (result) => {
      const sites = (result.blockedSites || []).filter((s) => s !== msg.site);
      chrome.storage.local.set({ blockedSites: sites });
      updateRules();
      sendResponse({ ok: true, blockedSites: sites });
    });
    return true;
  }

  // --- Blocked keywords ---

  if (msg.type === "addKeywords") {
    chrome.storage.local.get(["blockedKeywords"], (result) => {
      const keywords = result.blockedKeywords || [];
      const existing = new Set(keywords);
      for (const k of msg.keywords) {
        if (k && !existing.has(k)) { keywords.push(k); existing.add(k); }
      }
      chrome.storage.local.set({ blockedKeywords: keywords });
      updateRules();
      sendResponse({ ok: true, blockedKeywords: keywords });
    });
    return true;
  }

  if (msg.type === "removeKeyword") {
    chrome.storage.local.get(["blockedKeywords"], (result) => {
      const keywords = (result.blockedKeywords || []).filter((k) => k !== msg.keyword);
      chrome.storage.local.set({ blockedKeywords: keywords });
      updateRules();
      sendResponse({ ok: true, blockedKeywords: keywords });
    });
    return true;
  }

  // --- Block extensions page ---

  if (msg.type === "setBlockExtensionsPage") {
    chrome.storage.local.set({ blockExtensionsPage: msg.value });
    sendResponse({ ok: true });
    return true;
  }

  // --- Countdown setting ---

  if (msg.type === "saveCountdown") {
    chrome.storage.local.set({ countdownSeconds: msg.countdownSeconds });
    sendResponse({ ok: true });
    return true;
  }

  // --- Site mode ---

  if (msg.type === "setSiteMode") {
    chrome.storage.local.get(["siteModes", "blockedSites"], (result) => {
      const modes = result.siteModes || DEFAULT_SITE_MODES;
      modes[msg.siteKey] = msg.mode;

      // If changing away from "block", remove this site's domains from blockedSites
      // so the manual blocklist doesn't override the mode change
      let sites = result.blockedSites || [];
      if (msg.mode !== "block") {
        const config = SITE_CONFIG[msg.siteKey];
        if (config) {
          const domainsToRemove = new Set(config.matches);
          sites = sites.filter(s => !domainsToRemove.has(s));
        }
      }

      chrome.storage.local.set({ siteModes: modes, blockedSites: sites });
      updateRules();
      sendResponse({ ok: true, siteModes: modes });
    });
    return true;
  }

  // --- Per-site toggle ---

  if (msg.type === "setToggle") {
    chrome.storage.local.get(["siteToggles"], (result) => {
      const toggles = result.siteToggles || DEFAULT_SITE_TOGGLES;
      if (!toggles[msg.siteKey]) toggles[msg.siteKey] = {};
      toggles[msg.siteKey][msg.toggleKey] = msg.value;
      chrome.storage.local.set({ siteToggles: toggles });
      // block-url toggles affect declarativeNetRequest rules
      const config = SITE_CONFIG[msg.siteKey];
      const toggleDef = config && config.toggles.find((t) => t.key === msg.toggleKey);
      if (toggleDef && (toggleDef.type === "block-url" || toggleDef.type === "redirect-url")) updateRules();
      sendResponse({ ok: true, siteToggles: toggles });
    });
    return true;
  }

  // --- Blocklist categories ---

  if (msg.type === "enableBlocklistCategory") {
    fetchBlocklistCategory(msg.category)
      .then((cats) => sendResponse({ ok: true, blocklistCategories: cats }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg.type === "disableBlocklistCategory") {
    chrome.storage.local.get("blocklistCategories", (result) => {
      const cats = result.blocklistCategories || DEFAULT_BLOCKLIST_CATEGORIES;
      if (cats[msg.category]) cats[msg.category].enabled = false;
      chrome.storage.local.set({ blocklistCategories: cats }, () => {
        loadBlocklistIntoMemory();
        sendResponse({ ok: true, blocklistCategories: cats });
      });
    });
    return true;
  }

  if (msg.type === "refreshBlocklistCategory") {
    fetchBlocklistCategory(msg.category)
      .then((cats) => sendResponse({ ok: true, blocklistCategories: cats }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

// Rebuild declarativeNetRequest rules
async function updateRules() {
  const { enabled, blockedSites, blockedKeywords, siteModes, siteToggles } = await chrome.storage.local.get([
    "enabled", "blockedSites", "blockedKeywords", "siteModes", "siteToggles"
  ]);

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingRules.map((r) => r.id);

  if (enabled === false) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds });
    return;
  }

  const rules = [];
  let ruleId = 1;
  const blockedAction = { type: "redirect", redirect: { extensionPath: "/blocked.html" } };
  const isAscii = (s) => /^[\x00-\x7F]*$/.test(s);

  // Manual blocklist
  for (const site of (blockedSites || [])) {
    if (!isAscii(site)) continue;
    rules.push({
      id: ruleId++, priority: 1, action: blockedAction,
      condition: { urlFilter: `||${site}`, resourceTypes: ["main_frame"] }
    });
  }

  // Keyword blocklist — match anywhere in URL
  for (const keyword of (blockedKeywords || [])) {
    if (!isAscii(keyword)) continue;
    rules.push({
      id: ruleId++, priority: 1, action: blockedAction,
      condition: { urlFilter: keyword, resourceTypes: ["main_frame"] }
    });
  }

  // Sites set to "block" mode
  const modes = { ...DEFAULT_SITE_MODES, ...(siteModes || {}) };
  for (const [siteKey, mode] of Object.entries(modes)) {
    if (mode === "block") {
      const config = SITE_CONFIG[siteKey];
      if (config) {
        for (const domain of config.matches) {
          rules.push({
            id: ruleId++, priority: 1, action: blockedAction,
            condition: { urlFilter: `||${domain}`, resourceTypes: ["main_frame"] }
          });
        }
      }
    }
  }

  // block-url and redirect-url toggles (only when site is in "filter" mode)
  const storedToggles = siteToggles || {};
  for (const [siteKey, config] of Object.entries(SITE_CONFIG)) {
    if (modes[siteKey] !== "filter") continue;
    const siteState = { ...DEFAULT_SITE_TOGGLES[siteKey], ...(storedToggles[siteKey] || {}) };
    for (const toggle of config.toggles) {
      if (!siteState[toggle.key]) continue;
      if (toggle.type === "block-url") {
        rules.push({
          id: ruleId++, priority: 2, action: blockedAction,
          condition: { urlFilter: toggle.urlPattern, resourceTypes: ["main_frame"] }
        });
      } else if (toggle.type === "redirect-url") {
        rules.push({
          id: ruleId++, priority: 1,
          action: { type: "redirect", redirect: { url: toggle.redirectUrl } },
          condition: { urlFilter: toggle.urlPattern, resourceTypes: ["main_frame"] }
        });
      }
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules: rules });
}
