// Focus Tools — Background Service Worker
importScripts("site-config.js");

// Rebuild session rules for community blocklist categories.
// Uses requestDomains so one rule covers an entire category (no 5k-rule-limit issue).
// Session rules survive service-worker sleep but are cleared on browser restart,
// so this is called on startup and whenever blocklist or enabled state changes.
async function updateBlocklistRules() {
  const catKeys = Object.keys(BLOCKLIST_CATEGORIES);
  // Fixed rule IDs: one per category. Always remove all before re-adding
  // to avoid race conditions between concurrent calls.
  const allRuleIds = catKeys.map((_, i) => i + 1);

  const storageKeys = ["enabled", "blocklistCategories", "customRedirectUrl",
    ...catKeys.map(k => `blocklistDomains_${k}`)];

  const data = await chrome.storage.local.get(storageKeys);

  if (data.enabled === false) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: allRuleIds })
      .catch(err => console.error("updateSessionRules clear failed:", err));
    return;
  }

  const cats = data.blocklistCategories || DEFAULT_BLOCKLIST_CATEGORIES;
  const blockedAction = data.customRedirectUrl
    ? { type: "redirect", redirect: { url: data.customRedirectUrl } }
    : { type: "redirect", redirect: { extensionPath: "/blocked.html" } };

  const addRules = [];

  for (let i = 0; i < catKeys.length; i++) {
    const catInfo = cats[catKeys[i]];
    if (!catInfo || !catInfo.enabled) continue;

    const domains = data[`blocklistDomains_${catKeys[i]}`];
    if (!domains || domains.length === 0) continue;

    addRules.push({
      id: i + 1,
      priority: 1,
      action: blockedAction,
      condition: {
        requestDomains: domains,
        resourceTypes: ["main_frame"]
      }
    });
  }

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: allRuleIds,
    addRules
  }).catch(err => console.error("updateSessionRules failed:", err));
}

// Fetch and parse a StevenBlack hosts file for a category
async function fetchBlocklistCategory(category) {
  const config = BLOCKLIST_CATEGORIES[category];
  if (!config) throw new Error("Unknown category: " + category);

  const response = await fetch(config.url, { signal: AbortSignal.timeout(15000) });
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

  await updateBlocklistRules();
  return cats;
}

// Rebuild blocklist session rules on service worker startup
updateBlocklistRules();

// Only create calendar alarm if calendar is enabled
chrome.storage.local.get("calendarEnabled", (result) => {
  if (result.calendarEnabled) {
    chrome.alarms.get("calendarCheck", (alarm) => {
      if (!alarm) chrome.alarms.create("calendarCheck", { periodInMinutes: 1 });
    });
  } else {
    chrome.alarms.clear("calendarCheck");
  }
});

// Port listener for popup countdown freeze
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popupCountdown") {
    port.onDisconnect.addListener(() => {
      chrome.storage.local.get(["timerFreeze", "disabling", "disableWaitingConfirm"], (result) => {
        if (result.timerFreeze && (result.disabling || result.disableWaitingConfirm)) {
          chrome.alarms.clear("disableExtension");
          chrome.storage.local.set({
            disabling: false, disableAt: null,
            disableWaitingConfirm: false,
            disablePaused: false, disablePausedRemaining: null
          });
        }
      });
    });
  }
});

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
    if (result.timerClickOk === undefined) updates.timerClickOk = false;
    if (result.passwordHash === undefined) updates.passwordHash = "";
    if (result.timerFreeze === undefined) updates.timerFreeze = false;
    if (result.calendarEnabled === undefined) updates.calendarEnabled = false;
    if (result.calendarDays === undefined) updates.calendarDays = [false,false,false,false,false,false,false];
    if (result.calendarStartHour === undefined) updates.calendarStartHour = 9;
    if (result.calendarEndHour === undefined) updates.calendarEndHour = 17;
    if (Object.keys(updates).length) chrome.storage.local.set(updates);
  });
  updateRules();
  updateBlocklistRules();
});

// Block chrome://extensions and edge://extensions when enabled
function isExtensionsUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.startsWith("chrome://extensions") || lower.startsWith("edge://extensions");
}

function blockExtensionsTab(tabId, url) {
  if (!isExtensionsUrl(url)) return;
  chrome.storage.local.get(["blockExtensionsPage", "enabled", "customRedirectUrl"], (result) => {
    if (result.blockExtensionsPage && result.enabled !== false) {
      const redirectUrl = result.customRedirectUrl || chrome.runtime.getURL("blocked.html");
      chrome.tabs.update(tabId, { url: redirectUrl });
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
    if (chrome.runtime.lastError) return;
    if (tab && tab.url) blockExtensionsTab(tab.id, tab.url);
  });
});

// Calendar evaluation
function evaluateCalendar() {
  chrome.storage.local.get(["calendarEnabled", "calendarDays", "calendarStartHour", "calendarEndHour", "enabled"], (result) => {
    if (!result.calendarEnabled) {
      chrome.storage.local.set({ calendarControlling: false });
      return;
    }
    const now = new Date();
    const dayActive = result.calendarDays && result.calendarDays[now.getDay()];
    const hour = now.getHours();
    const inRange = result.calendarStartHour < result.calendarEndHour
      ? (hour >= result.calendarStartHour && hour < result.calendarEndHour)
      : false;
    const shouldBeEnabled = dayActive && inRange;
    const currentlyEnabled = result.enabled !== false;

    if (shouldBeEnabled !== currentlyEnabled) {
      chrome.storage.local.set({ enabled: shouldBeEnabled, calendarControlling: true });
      updateRules();
      updateBlocklistRules();
    } else {
      chrome.storage.local.set({ calendarControlling: true });
    }
  });
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "calendarCheck") {
    evaluateCalendar();
    return;
  }
  if (alarm.name === "disableExtension") {
    chrome.storage.local.get(["timerClickOk"], (result) => {
      if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return; }
      if (result.timerClickOk) {
        // Wait for user confirmation instead of auto-disabling
        chrome.storage.local.set({ disabling: false, disableWaitingConfirm: true });
        chrome.runtime.sendMessage({ type: "waitingConfirm" }).catch(() => {});
      } else {
        chrome.storage.local.set({ enabled: false, disabling: false });
        updateRules();
        updateBlocklistRules();
        chrome.runtime.sendMessage({ type: "disabled" }).catch(() => {});
      }
    });
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getState") {
    chrome.storage.local.get(null, (result) => {
      const storedToggles = result.siteToggles || {};
      const mergedToggles = {};
      for (const siteKey of Object.keys(DEFAULT_SITE_TOGGLES)) {
        mergedToggles[siteKey] = mergeTogglesWithDefaults(siteKey, storedToggles[siteKey]);
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
        blocklistCategories: result.blocklistCategories || DEFAULT_BLOCKLIST_CATEGORIES,
        customRedirectUrl: result.customRedirectUrl || "",
        timerClickOk: result.timerClickOk || false,
        disableWaitingConfirm: result.disableWaitingConfirm || false,
        calendarEnabled: result.calendarEnabled || false,
        calendarDays: result.calendarDays || [false,false,false,false,false,false,false],
        calendarStartHour: result.calendarStartHour !== undefined ? result.calendarStartHour : 9,
        calendarEndHour: result.calendarEndHour !== undefined ? result.calendarEndHour : 17,
        passwordHash: result.passwordHash || "",
        timerFreeze: result.timerFreeze || false,
        disablePaused: result.disablePaused || false,
        disablePausedRemaining: result.disablePausedRemaining || null,
        calendarControlling: result.calendarControlling || false
      });
    });
    return true;
  }

  // --- Extension enable/disable (popup) ---

  if (msg.type === "requestDisable") {
    chrome.storage.local.get(["countdownSeconds", "calendarEnabled", "calendarControlling"], (result) => {
      if (result.calendarEnabled && result.calendarControlling) {
        sendResponse({ rejected: true, reason: "calendar" });
        return;
      }
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
    chrome.storage.local.set({ disabling: false, disableAt: null, disableWaitingConfirm: false });
    sendResponse({ disabling: false });
    return true;
  }

  if (msg.type === "confirmDisable") {
    chrome.storage.local.set({ enabled: false, disableWaitingConfirm: false, disabling: false });
    updateRules();
    updateBlocklistRules();
    sendResponse({ enabled: false });
    return true;
  }

  if (msg.type === "pauseDisable") {
    chrome.storage.local.get(["disableAt"], (result) => {
      const remaining = Math.max(0, (result.disableAt || 0) - Date.now());
      chrome.alarms.clear("disableExtension");
      chrome.storage.local.set({ disablePaused: true, disablePausedRemaining: remaining });
      sendResponse({ paused: true, remaining });
    });
    return true;
  }

  if (msg.type === "resumeDisable") {
    chrome.storage.local.get(["disablePausedRemaining"], (result) => {
      const remaining = result.disablePausedRemaining || 0;
      const disableAt = Date.now() + remaining;
      chrome.storage.local.set({ disablePaused: false, disablePausedRemaining: null, disableAt });
      chrome.alarms.create("disableExtension", { delayInMinutes: remaining / 60000 });
      sendResponse({ disableAt });
    });
    return true;
  }

  if (msg.type === "enable") {
    chrome.storage.local.get(["calendarEnabled", "calendarControlling"], (result) => {
      if (result.calendarEnabled && result.calendarControlling) {
        sendResponse({ rejected: true, reason: "calendar" });
        return;
      }
      chrome.alarms.clear("disableExtension");
      chrome.storage.local.set({ enabled: true, disabling: false, disableAt: null });
      updateRules();
      updateBlocklistRules();
      sendResponse({ enabled: true });
    });
    return true;
  }

  // --- Calendar ---

  if (msg.type === "setCalendarEnabled") {
    chrome.storage.local.set({ calendarEnabled: msg.value });
    if (msg.value) {
      chrome.alarms.create("calendarCheck", { periodInMinutes: 1 });
      evaluateCalendar();
    } else {
      chrome.alarms.clear("calendarCheck");
      chrome.storage.local.set({ calendarControlling: false });
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === "saveCalendarSchedule") {
    chrome.storage.local.set({
      calendarDays: msg.calendarDays,
      calendarStartHour: msg.calendarStartHour,
      calendarEndHour: msg.calendarEndHour
    }, () => {
      evaluateCalendar();
      sendResponse({ ok: true });
    });
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

  if (msg.type === "saveCustomRedirectUrl") {
    chrome.storage.local.set({ customRedirectUrl: msg.url });
    updateRules();
    updateBlocklistRules();
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
        updateBlocklistRules();
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
  const { enabled, blockedSites, blockedKeywords, siteModes, siteToggles, customRedirectUrl } = await chrome.storage.local.get([
    "enabled", "blockedSites", "blockedKeywords", "siteModes", "siteToggles", "customRedirectUrl"
  ]);

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingRules.map((r) => r.id);

  if (enabled === false) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds });
    return;
  }

  const rules = [];
  let ruleId = 1;
  const blockedAction = customRedirectUrl
    ? { type: "redirect", redirect: { url: customRedirectUrl } }
    : { type: "redirect", redirect: { extensionPath: "/blocked.html" } };
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

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules: rules })
    .catch(err => console.error("updateDynamicRules failed:", err));
}
