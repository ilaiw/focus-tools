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

const DEFAULT_BLOCKED_SITES = [
  "tiktok.com",
  "instagram.com/reels"
];

const DEFAULT_COUNTDOWN_SECONDS = 2;

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (result) => {
    const updates = {};
    if (result.enabled === undefined) updates.enabled = true;
    if (!result.blockedSites) updates.blockedSites = DEFAULT_BLOCKED_SITES;
    if (!result.siteToggles) updates.siteToggles = DEFAULT_SITE_TOGGLES;
    if (!result.siteModes) updates.siteModes = DEFAULT_SITE_MODES;
    if (!result.countdownSeconds) updates.countdownSeconds = DEFAULT_COUNTDOWN_SECONDS;
    if (!result.blocklistCategories) updates.blocklistCategories = DEFAULT_BLOCKLIST_CATEGORIES;
    if (Object.keys(updates).length) chrome.storage.local.set(updates);

    // Clean up stale keys from older versions
    chrome.storage.local.remove([
      "settingsLocked", "settingsUnlockAt",
      "pendingToggleDisable", "pendingBlocklistRemove", "pendingModeChange"
    ]);
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
      sendResponse({
        enabled: result.enabled !== false,
        blockedSites: result.blockedSites || DEFAULT_BLOCKED_SITES,
        countdownSeconds: result.countdownSeconds || DEFAULT_COUNTDOWN_SECONDS,
        disabling: result.disabling || false,
        disableAt: result.disableAt || null,
        siteToggles: result.siteToggles || DEFAULT_SITE_TOGGLES,
        siteModes: result.siteModes || DEFAULT_SITE_MODES,
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
    chrome.storage.local.get(["siteModes"], (result) => {
      const modes = result.siteModes || DEFAULT_SITE_MODES;
      modes[msg.siteKey] = msg.mode;
      chrome.storage.local.set({ siteModes: modes });
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
  const { enabled, blockedSites, siteModes } = await chrome.storage.local.get([
    "enabled", "blockedSites", "siteModes"
  ]);

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingRules.map((r) => r.id);

  if (enabled === false) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds });
    return;
  }

  const allBlockedDomains = new Set(blockedSites || DEFAULT_BLOCKED_SITES);

  const modes = siteModes || DEFAULT_SITE_MODES;
  for (const [siteKey, mode] of Object.entries(modes)) {
    if (mode === "block") {
      const config = SITE_CONFIG[siteKey];
      if (config) {
        for (const domain of config.matches) allBlockedDomains.add(domain);
      }
    }
  }

  const addRules = [...allBlockedDomains].map((site, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: `||${site}`, resourceTypes: ["main_frame"] }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules });
}
