// Focus Tools — Options Page
// All countdowns use a single blocking modal. No inline timers anywhere.

const blockExtToggle = document.getElementById("blockExtToggle");
const countdownInput = document.getElementById("countdownInput");
const countdownActions = document.getElementById("countdownActions");
const blocklistSearch = document.getElementById("blocklistSearch");
const blocklistScroll = document.getElementById("blocklistScroll");
const blocklistCount = document.getElementById("blocklistCount");
const addSitesBtn = document.getElementById("addSitesBtn");
const addModal = document.getElementById("addModal");
const addModalTextarea = document.getElementById("addModalTextarea");
const addModalCancel = document.getElementById("addModalCancel");
const addModalConfirm = document.getElementById("addModalConfirm");
const keywordSearch = document.getElementById("keywordSearch");
const keywordScroll = document.getElementById("keywordScroll");
const keywordCount = document.getElementById("keywordCount");
const addKeywordsBtn = document.getElementById("addKeywordsBtn");
const addKeywordModal = document.getElementById("addKeywordModal");
const addKeywordTextarea = document.getElementById("addKeywordTextarea");
const addKeywordCancel = document.getElementById("addKeywordCancel");
const addKeywordConfirm = document.getElementById("addKeywordConfirm");
const siteTogglesContainer = document.getElementById("siteTogglesContainer");
const blocklistCategoriesContainer = document.getElementById("blocklistCategoriesContainer");
const countdownModal = document.getElementById("countdownModal");
const countdownLabel = document.getElementById("countdownLabel");
const countdownDisplay = document.getElementById("countdownDisplay");
const optionsLockScreen = document.getElementById("optionsLockScreen");
const optionsLockPassword = document.getElementById("optionsLockPassword");
const optionsUnlockBtn = document.getElementById("optionsUnlockBtn");
const optionsLockError = document.getElementById("optionsLockError");
const passwordInput = document.getElementById("passwordInput");
const savePasswordBtn = document.getElementById("savePasswordBtn");
const passwordWarning = document.getElementById("passwordWarning");
const passwordStatus = document.getElementById("passwordStatus");
const countdownCancel = document.getElementById("countdownCancel");
const countdownConfirmBtns = document.getElementById("countdownConfirmBtns");
const countdownOk = document.getElementById("countdownOk");
const countdownConfirmCancelBtn = document.getElementById("countdownConfirmCancel");
const timerClickOkToggle = document.getElementById("timerClickOkToggle");
const timerFreezeToggle = document.getElementById("timerFreezeToggle");

let state = {
  enabled: true,
  blockedSites: [],
  blockedKeywords: [],
  countdownSeconds: DEFAULT_COUNTDOWN_SECONDS,
  siteToggles: {},
  siteModes: {},
  blockExtensionsPage: false,
  blocklistCategories: {},
  customRedirectUrl: "",
  passwordHash: "",
  timerClickOk: false,
  timerFreeze: false,
  calendarEnabled: false,
  calendarDays: [false,false,false,false,false,false,false],
  calendarStartHour: 9,
  calendarEndHour: 17,
  calendarControlling: false
};

let searchFilter = "";
let keywordSearchFilter = "";
let blocklistExpanded = false;
let keywordListExpanded = false;

// Countdown modal state
let countdownTimer = null;
let countdownEndAt = null;
let pendingAction = null;
let countdownPausedRemaining = null;
let visibilityHandler = null;

// i18n helpers for site-config labels
function siteLabel(config) {
  return config.labelKey ? msg(config.labelKey) : config.label;
}

function toggleLabel(toggle) {
  return toggle.labelKey ? msg(toggle.labelKey) : toggle.label;
}

// Mode key map
const MODE_KEYS = { allow: "mode_allow", filter: "mode_filter", block: "mode_block" };

// ============================================================
// Init
// ============================================================

async function init() {
  await i18nReady;
  renderLanguageSelect();
  chrome.runtime.sendMessage({ type: "getState" }, (res) => {
    if (!res) return;
    state = res;
    if (state.passwordHash) {
      optionsLockScreen.classList.add("open");
    }
    renderGeneral();
    renderBlockExtToggle();
    renderBlocklist();
    renderKeywords();
    renderBlocklistCategories();
    renderSiteToggles();
    renderCalendar();
    renderAdvanced();
  });
}

// ============================================================
// Password Lock
// ============================================================

optionsUnlockBtn.addEventListener("click", () => {
  tryUnlock(optionsLockPassword, optionsLockError, state.passwordHash, () => {
    optionsLockScreen.classList.remove("open");
  });
});

optionsLockPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") optionsUnlockBtn.click();
});

passwordInput.addEventListener("input", () => {
  passwordWarning.style.display = passwordInput.value ? "" : "none";
  passwordStatus.style.display = "none";
});

savePasswordBtn.addEventListener("click", async () => {
  const val = passwordInput.value;
  if (val) {
    const hash = await hashPassword(val);
    chrome.storage.local.set({ passwordHash: hash });
    state.passwordHash = hash;
    passwordStatus.textContent = msg("options_password_set");
    passwordStatus.style.display = "";
    passwordWarning.style.display = "none";
    passwordInput.value = "";
  } else {
    chrome.storage.local.set({ passwordHash: "" });
    state.passwordHash = "";
    passwordStatus.textContent = msg("options_password_removed");
    passwordStatus.style.display = "";
    passwordWarning.style.display = "none";
  }
  setTimeout(() => { passwordStatus.style.display = "none"; }, 3000);
});

// ============================================================
// Countdown Modal — THE ONLY countdown mechanism
// ============================================================

function startCountdown(label, onComplete) {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  pendingAction = { label, action: onComplete };
  countdownLabel.textContent = label;
  countdownEndAt = Date.now() + state.countdownSeconds * 1000;
  countdownPausedRemaining = null;
  countdownCancel.style.display = "";
  countdownConfirmBtns.style.display = "none";
  countdownModal.classList.add("open");
  updateCountdownDisplay();

  // Timer freeze: pause when options tab is hidden
  if (state.timerFreeze) {
    if (visibilityHandler) document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = () => {
      if (document.hidden) {
        // Pause
        if (countdownTimer) {
          countdownPausedRemaining = Math.max(0, countdownEndAt - Date.now());
          clearInterval(countdownTimer);
          countdownTimer = null;
          countdownDisplay.textContent = msg("timer_paused", [formatTime(Math.ceil(countdownPausedRemaining / 1000))]);
        }
      } else {
        // Resume
        if (countdownPausedRemaining !== null && pendingAction) {
          countdownEndAt = Date.now() + countdownPausedRemaining;
          countdownPausedRemaining = null;
          countdownTimer = setInterval(countdownTick, 250);
        }
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);
  }

  countdownTimer = setInterval(countdownTick, 250);
}

function countdownTick() {
  const remaining = Math.max(0, countdownEndAt - Date.now());
  countdownDisplay.textContent = formatTime(Math.ceil(remaining / 1000));

  if (remaining <= 0) {
    clearInterval(countdownTimer);
    countdownTimer = null;
    cleanupVisibilityHandler();
    if (state.timerClickOk) {
      countdownCancel.style.display = "none";
      countdownConfirmBtns.style.display = "";
      countdownLabel.textContent = msg("countdown_confirm_action");
    } else {
      countdownModal.classList.remove("open");
      if (pendingAction) {
        pendingAction.action();
        pendingAction = null;
      }
    }
  }
}

function cleanupVisibilityHandler() {
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
  countdownPausedRemaining = null;
}

function updateCountdownDisplay() {
  const remaining = Math.max(0, countdownEndAt - Date.now());
  countdownDisplay.textContent = formatTime(Math.ceil(remaining / 1000));
}

function cancelCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  cleanupVisibilityHandler();
  countdownModal.classList.remove("open");
  countdownConfirmBtns.style.display = "none";
  countdownCancel.style.display = "";
  pendingAction = null;
  renderBlockExtToggle();
  updateSiteToggles();
  renderBlocklist();
  renderKeywords();
  renderBlocklistCategories();
}

countdownCancel.addEventListener("click", cancelCountdown);

countdownOk.addEventListener("click", () => {
  cleanupVisibilityHandler();
  countdownModal.classList.remove("open");
  countdownConfirmBtns.style.display = "none";
  countdownCancel.style.display = "";
  if (pendingAction) {
    pendingAction.action();
    pendingAction = null;
  }
});

countdownConfirmCancelBtn.addEventListener("click", cancelCountdown);

// ============================================================
// Block Extensions Page toggle
// ============================================================

function renderBlockExtToggle() {
  blockExtToggle.checked = state.blockExtensionsPage;
}

blockExtToggle.addEventListener("change", () => {
  const wantOn = blockExtToggle.checked;

  if (wantOn) {
    // Turning ON (more restrictive) — instant
    chrome.runtime.sendMessage({ type: "setBlockExtensionsPage", value: true }, () => {
      if (chrome.runtime.lastError) return;
      state.blockExtensionsPage = true;
    });
  } else {
    // Turning OFF (less restrictive) — countdown
    blockExtToggle.checked = true; // revert visually until countdown completes
    startCountdown(msg("countdown_disabling_ext_block"), () => {
      chrome.runtime.sendMessage({ type: "setBlockExtensionsPage", value: false }, () => {
        if (chrome.runtime.lastError) return;
        state.blockExtensionsPage = false;
        blockExtToggle.checked = false;
      });
    });
  }
});

// ============================================================
// General: Countdown setting
// ============================================================

function renderGeneral() {
  countdownInput.value = state.countdownSeconds;
  countdownInput.disabled = true;
  renderCountdownActions();
}

function renderCountdownActions() {
  countdownActions.innerHTML = "";
  const unlockBtn = el("button", { className: "btn-unlock", textContent: msg("options_unlock_to_edit") });
  unlockBtn.addEventListener("click", () => {
    startCountdown(msg("countdown_unlocking_setting"), () => {
      countdownInput.disabled = false;
      countdownActions.innerHTML = "";
      const saveBtn = el("button", { className: "btn-save", textContent: msg("options_save") });
      saveBtn.addEventListener("click", saveCountdown);
      countdownActions.appendChild(saveBtn);
    });
  });
  countdownActions.appendChild(unlockBtn);
}

function saveCountdown() {
  const val = Math.max(1, Math.min(3600, parseInt(countdownInput.value, 10) || DEFAULT_COUNTDOWN_SECONDS));
  chrome.runtime.sendMessage({ type: "saveCountdown", countdownSeconds: val }, () => {
    if (chrome.runtime.lastError) return;
    state.countdownSeconds = val;
    renderGeneral();
  });
}

// ============================================================
// Blocklist
// ============================================================

function renderBlocklist() {
  blocklistScroll.innerHTML = "";

  const total = state.blockedSites.length;

  // Update placeholder with count
  blocklistSearch.placeholder = total > 0
    ? msg("blocklist_sites_count_placeholder", [String(total)])
    : msg("blocklist_no_sites_placeholder");

  // Toggle expanded state
  blocklistScroll.classList.toggle("expanded", blocklistExpanded);
  blocklistCount.style.display = blocklistExpanded ? "" : "none";

  if (!blocklistExpanded) return;

  const filtered = searchFilter
    ? state.blockedSites.filter((s) => s.includes(searchFilter))
    : state.blockedSites;

  if (filtered.length === 0) {
    blocklistScroll.appendChild(el("div", {
      className: "blocklist-empty",
      textContent: searchFilter ? msg("blocklist_no_matching_sites") : msg("blocklist_no_sites_yet")
    }));
  } else {
    for (const site of filtered) {
      const item = el("div", { className: "blocklist-item" });

      const removeBtn = el("button", {
        className: "blocklist-remove",
        textContent: "\u00d7",
        title: msg("blocklist_remove_title")
      });
      removeBtn.addEventListener("click", () => {
        startCountdown(msg("countdown_removing_site", [site]), () => {
          chrome.runtime.sendMessage({ type: "removeSite", site }, (res) => {
            if (res) state.blockedSites = res.blockedSites;
            renderBlocklist();
          });
        });
      });

      const siteSpan = el("span", { className: "blocklist-site", textContent: site });
      item.appendChild(removeBtn);
      item.appendChild(siteSpan);
      blocklistScroll.appendChild(item);
    }
  }

  blocklistCount.textContent = searchFilter
    ? msg("blocklist_filtered_count", [String(filtered.length), String(total)])
    : msg("blocklist_total_count", [String(total)]);
}

blocklistSearch.addEventListener("focus", () => {
  blocklistExpanded = true;
  blocklistSearch.placeholder = msg("blocklist_search_sites");
  renderBlocklist();
});

blocklistSearch.addEventListener("input", () => {
  searchFilter = blocklistSearch.value.trim().toLowerCase();
  renderBlocklist();
});

// Add modal
addSitesBtn.addEventListener("click", () => {
  addModalTextarea.value = "";
  addModal.classList.add("open");
  addModalTextarea.focus();
});

addModalCancel.addEventListener("click", () => addModal.classList.remove("open"));
addModal.addEventListener("click", (e) => { if (e.target === addModal) addModal.classList.remove("open"); });

addModalConfirm.addEventListener("click", () => {
  const lines = addModalTextarea.value.split("\n");
  const newSites = [];
  const existing = new Set(state.blockedSites);

  for (const raw of lines) {
    let site = raw.trim().toLowerCase()
      .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
    if (site && !existing.has(site)) { newSites.push(site); existing.add(site); }
  }

  if (newSites.length === 0) { addModal.classList.remove("open"); return; }

  chrome.runtime.sendMessage({ type: "addSites", sites: newSites }, (res) => {
    if (res) state.blockedSites = res.blockedSites;
    renderBlocklist();
    addModal.classList.remove("open");
  });
});

// ============================================================
// Blocked Keywords
// ============================================================

function renderKeywords() {
  keywordScroll.innerHTML = "";

  const total = state.blockedKeywords.length;

  // Update placeholder with count
  keywordSearch.placeholder = total > 0
    ? msg("keywords_count_placeholder", [String(total)])
    : msg("keywords_no_keywords_placeholder");

  // Toggle expanded state
  keywordScroll.classList.toggle("expanded", keywordListExpanded);
  keywordCount.style.display = keywordListExpanded ? "" : "none";

  if (!keywordListExpanded) return;

  const filtered = keywordSearchFilter
    ? state.blockedKeywords.filter((k) => k.includes(keywordSearchFilter))
    : state.blockedKeywords;

  if (filtered.length === 0) {
    keywordScroll.appendChild(el("div", {
      className: "blocklist-empty",
      textContent: keywordSearchFilter ? msg("keywords_no_matching") : msg("keywords_no_keywords_yet")
    }));
  } else {
    for (const keyword of filtered) {
      const item = el("div", { className: "blocklist-item" });

      const removeBtn = el("button", {
        className: "blocklist-remove",
        textContent: "\u00d7",
        title: msg("blocklist_remove_title")
      });
      removeBtn.addEventListener("click", () => {
        startCountdown(msg("countdown_removing_keyword", [keyword]), () => {
          chrome.runtime.sendMessage({ type: "removeKeyword", keyword }, (res) => {
            if (res) state.blockedKeywords = res.blockedKeywords;
            renderKeywords();
          });
        });
      });

      const keywordSpan = el("span", { className: "blocklist-site", textContent: keyword });
      item.appendChild(removeBtn);
      item.appendChild(keywordSpan);
      keywordScroll.appendChild(item);
    }
  }

  keywordCount.textContent = keywordSearchFilter
    ? msg("keywords_filtered_count", [String(filtered.length), String(total)])
    : msg("keywords_total_count", [String(total)]);
}

keywordSearch.addEventListener("focus", () => {
  keywordListExpanded = true;
  keywordSearch.placeholder = msg("keywords_search");
  renderKeywords();
});

keywordSearch.addEventListener("input", () => {
  keywordSearchFilter = keywordSearch.value.trim().toLowerCase();
  renderKeywords();
});

// Collapse lists when clicking outside
document.addEventListener("click", (e) => {
  // Collapse blocked sites list
  if (blocklistExpanded) {
    const sitesSection = blocklistSearch.closest(".section");
    if (!sitesSection.contains(e.target)) {
      blocklistExpanded = false;
      searchFilter = "";
      blocklistSearch.value = "";
      renderBlocklist();
    }
  }
  // Collapse blocked keywords list
  if (keywordListExpanded) {
    const keywordsSection = keywordSearch.closest(".section");
    if (!keywordsSection.contains(e.target)) {
      keywordListExpanded = false;
      keywordSearchFilter = "";
      keywordSearch.value = "";
      renderKeywords();
    }
  }
});

// Add keywords modal
addKeywordsBtn.addEventListener("click", () => {
  addKeywordTextarea.value = "";
  addKeywordModal.classList.add("open");
  addKeywordTextarea.focus();
});

addKeywordCancel.addEventListener("click", () => addKeywordModal.classList.remove("open"));
addKeywordModal.addEventListener("click", (e) => { if (e.target === addKeywordModal) addKeywordModal.classList.remove("open"); });

addKeywordConfirm.addEventListener("click", () => {
  const lines = addKeywordTextarea.value.split("\n");
  const newKeywords = [];
  const existing = new Set(state.blockedKeywords);

  for (const raw of lines) {
    const keyword = raw.trim().toLowerCase();
    if (keyword && !existing.has(keyword)) { newKeywords.push(keyword); existing.add(keyword); }
  }

  if (newKeywords.length === 0) { addKeywordModal.classList.remove("open"); return; }

  chrome.runtime.sendMessage({ type: "addKeywords", keywords: newKeywords }, (res) => {
    if (res) state.blockedKeywords = res.blockedKeywords;
    renderKeywords();
    addKeywordModal.classList.remove("open");
  });
});

// ============================================================
// Blocklist Categories
// ============================================================

function renderBlocklistCategories() {
  blocklistCategoriesContainer.innerHTML = "";
  const cats = state.blocklistCategories || {};

  for (const [catKey, display] of Object.entries(BLOCKLIST_CATEGORIES)) {
    const catState = cats[catKey] || { enabled: false, lastUpdated: null, domainCount: 0 };

    const row = el("div", { className: "blocklist-cat-row" });

    // Info
    const info = el("div", { className: "blocklist-cat-info" });
    const catLabel = display.labelKey ? msg(display.labelKey) : display.label;
    const name = el("div", { className: "blocklist-cat-name", textContent: catLabel });
    const meta = el("div", { className: "blocklist-cat-meta" });
    if (catState.enabled && catState.lastUpdated) {
      const date = new Date(catState.lastUpdated);
      meta.textContent = msg("blocklist_cat_domains_updated", [catState.domainCount.toLocaleString(), date.toLocaleDateString()]);
    } else {
      meta.textContent = display.descriptionKey ? msg(display.descriptionKey) : display.description;
    }
    info.appendChild(name);
    info.appendChild(meta);

    // Actions
    const actions = el("div", { className: "blocklist-cat-actions" });

    if (catState.enabled) {
      const refreshBtn = el("button", { className: "btn-refresh", textContent: msg("blocklist_cat_refresh") });
      refreshBtn.addEventListener("click", () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = msg("blocklist_cat_fetching");
        chrome.runtime.sendMessage({ type: "refreshBlocklistCategory", category: catKey }, (res) => {
          if (res && res.ok) state.blocklistCategories = res.blocklistCategories;
          renderBlocklistCategories();
        });
      });
      actions.appendChild(refreshBtn);
    }

    // Toggle switch
    const switchLabel = el("label", { className: "switch" });
    const checkbox = el("input", { type: "checkbox", checked: catState.enabled });
    const slider = el("span", { className: "slider" });
    switchLabel.appendChild(checkbox);
    switchLabel.appendChild(slider);

    checkbox.addEventListener("change", () => {
      handleBlocklistCategoryToggle(catKey, checkbox.checked, checkbox);
    });

    actions.appendChild(switchLabel);
    row.appendChild(info);
    row.appendChild(actions);
    blocklistCategoriesContainer.appendChild(row);
  }
}

function handleBlocklistCategoryToggle(category, wantEnabled, checkbox) {
  if (wantEnabled) {
    // Enabling (more restrictive) — instant, triggers fetch
    const meta = checkbox.closest(".blocklist-cat-row").querySelector(".blocklist-cat-meta");
    if (meta) meta.textContent = msg("blocklist_cat_fetching");
    chrome.runtime.sendMessage({ type: "enableBlocklistCategory", category }, (res) => {
      if (res && res.ok) {
        state.blocklistCategories = res.blocklistCategories;
      } else {
        // Fetch failed — revert
        checkbox.checked = false;
        if (meta) meta.textContent = (res && res.error) || msg("blocklist_cat_fetch_failed");
      }
      renderBlocklistCategories();
    });
  } else {
    // Disabling (less restrictive) — countdown required
    checkbox.checked = true;
    const display = BLOCKLIST_CATEGORIES[category];
    const catLabel = display?.labelKey ? msg(display.labelKey) : (display?.label || category);
    startCountdown(msg("countdown_disabling_blocklist", [catLabel]), () => {
      chrome.runtime.sendMessage({ type: "disableBlocklistCategory", category }, (res) => {
        if (res && res.ok) state.blocklistCategories = res.blocklistCategories;
        renderBlocklistCategories();
      });
    });
  }
}

// ============================================================
// Site Toggles — Accordion with 3-way mode
// ============================================================

function renderSiteToggles() {
  siteTogglesContainer.innerHTML = "";

  for (const [siteKey, config] of Object.entries(SITE_CONFIG)) {
    const siteState = state.siteToggles[siteKey] || {};
    const mode = state.siteModes[siteKey] || "allow";
    const activeCount = config.toggles.filter((t) => siteState[t.key]).length;
    const isFilterMode = mode === "filter";

    const section = el("div", { className: "site-section" });
    section.dataset.site = siteKey;

    const header = el("div", { className: "site-header" });
    const headerLeft = el("div", { className: "site-header-left" });
    headerLeft.innerHTML = `<span class="arrow">&#9658;</span> ${siteLabel(config)}`;

    const headerRight = el("div", { className: "site-header-right" });

    const modeSelector = el("div", { className: "mode-selector" });
    modeSelector.dataset.modeFor = siteKey;

    for (const m of ["allow", "filter", "block"]) {
      const btn = el("button", { textContent: msg(MODE_KEYS[m]) });
      btn.dataset.mode = m;
      btn.className = mode === m ? `active-${m}` : "";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleModeChange(siteKey, m);
      });
      modeSelector.appendChild(btn);
    }

    const badge = el("span", {
      className: `site-badge ${activeCount === 0 ? "none" : ""}`,
      textContent: `${activeCount}/${config.toggles.length}`
    });
    badge.dataset.badgeFor = siteKey;

    headerRight.appendChild(modeSelector);
    headerRight.appendChild(badge);
    header.appendChild(headerLeft);
    header.appendChild(headerRight);

    header.addEventListener("click", (e) => {
      if (e.target.closest(".mode-selector")) return;
      section.classList.toggle("open");
    });

    const body = el("div", { className: "site-body" });

    for (const toggle of config.toggles) {
      const isOn = siteState[toggle.key] || false;
      const isGrayed = !isFilterMode;

      const row = el("div", { className: `toggle-row ${isGrayed ? "grayed" : ""}` });
      row.dataset.toggleRow = `${siteKey}:${toggle.key}`;

      const label = el("span", { className: "toggle-label", textContent: toggleLabel(toggle) });

      const switchLabel = el("label", { className: `switch ${isGrayed ? "disabled" : ""}` });
      switchLabel.dataset.switchFor = `${siteKey}:${toggle.key}`;
      const checkbox = el("input", { type: "checkbox", checked: isOn });
      checkbox.dataset.toggle = `${siteKey}:${toggle.key}`;
      const slider = el("span", { className: "slider" });

      checkbox.addEventListener("change", () => handleToggleChange(siteKey, toggle.key));

      switchLabel.appendChild(checkbox);
      switchLabel.appendChild(slider);
      row.appendChild(label);
      row.appendChild(switchLabel);
      body.appendChild(row);
    }

    section.appendChild(header);
    section.appendChild(body);
    siteTogglesContainer.appendChild(section);
  }
}

function updateSiteToggles() {
  for (const [siteKey, config] of Object.entries(SITE_CONFIG)) {
    const siteState = state.siteToggles[siteKey] || {};
    const mode = state.siteModes[siteKey] || "allow";
    const activeCount = config.toggles.filter((t) => siteState[t.key]).length;
    const isFilterMode = mode === "filter";

    const badge = siteTogglesContainer.querySelector(`[data-badge-for="${siteKey}"]`);
    if (badge) {
      badge.textContent = `${activeCount}/${config.toggles.length}`;
      badge.className = `site-badge ${activeCount === 0 ? "none" : ""}`;
    }

    const modeSelector = siteTogglesContainer.querySelector(`[data-mode-for="${siteKey}"]`);
    if (modeSelector) {
      for (const btn of modeSelector.children) {
        btn.className = mode === btn.dataset.mode ? `active-${btn.dataset.mode}` : "";
      }
    }

    for (const toggle of config.toggles) {
      const key = `${siteKey}:${toggle.key}`;
      const isOn = siteState[toggle.key] || false;
      const isGrayed = !isFilterMode;

      const row = siteTogglesContainer.querySelector(`[data-toggle-row="${key}"]`);
      if (row) row.className = `toggle-row ${isGrayed ? "grayed" : ""}`;

      const switchEl = siteTogglesContainer.querySelector(`[data-switch-for="${key}"]`);
      if (switchEl) switchEl.className = `switch ${isGrayed ? "disabled" : ""}`;

      const checkbox = siteTogglesContainer.querySelector(`[data-toggle="${key}"]`);
      if (checkbox) checkbox.checked = isOn;
    }
  }
}

// ============================================================
// Mode change
// ============================================================

function handleModeChange(siteKey, targetMode) {
  const currentMode = state.siteModes[siteKey] || "allow";
  if (targetMode === currentMode) return;

  const levels = { allow: 0, filter: 1, block: 2 };
  const isMoreRestrictive = levels[targetMode] >= levels[currentMode];
  const config = SITE_CONFIG[siteKey];

  const applyMode = () => {
    chrome.runtime.sendMessage({ type: "setSiteMode", siteKey, mode: targetMode }, (res) => {
      if (res) state.siteModes = res.siteModes;
      updateSiteToggles();
    });
  };

  if (isMoreRestrictive) {
    applyMode();
  } else {
    startCountdown(msg("countdown_changing_mode", [siteLabel(config), msg(MODE_KEYS[targetMode])]), applyMode);
  }
}

// ============================================================
// Toggle change
// ============================================================

function handleToggleChange(siteKey, toggleKey) {
  const siteState = state.siteToggles[siteKey] || {};
  const isOn = siteState[toggleKey] || false;

  if (!isOn) {
    // Turning ON — instant
    chrome.runtime.sendMessage({ type: "setToggle", siteKey, toggleKey, value: true }, (res) => {
      if (res) state.siteToggles = res.siteToggles;
      updateSiteToggles();
    });
  } else {
    // Turning OFF — countdown modal
    const config = SITE_CONFIG[siteKey];
    const toggleDef = config.toggles.find((t) => t.key === toggleKey);
    startCountdown(msg("countdown_disabling_toggle", [toggleLabel(toggleDef), siteLabel(config)]), () => {
      chrome.runtime.sendMessage({ type: "setToggle", siteKey, toggleKey, value: false }, (res) => {
        if (res) state.siteToggles = res.siteToggles;
        updateSiteToggles();
      });
    });
  }
}

// ============================================================
// Calendar Schedule
// ============================================================

const calendarEnabledToggle = document.getElementById("calendarEnabledToggle");
const calendarConfig = document.getElementById("calendarConfig");
const calendarDayCheckboxes = document.getElementById("calendarDayCheckboxes");
const calendarStartHourSelect = document.getElementById("calendarStartHour");
const calendarEndHourSelect = document.getElementById("calendarEndHour");
const saveCalendarBtn = document.getElementById("saveCalendarBtn");
const calendarStatus = document.getElementById("calendarStatus");
const calendarError = document.getElementById("calendarError");

let DAY_NAMES;
function getDayNames() {
  if (!DAY_NAMES) {
    DAY_NAMES = [
      msg("day_sun"), msg("day_mon"), msg("day_tue"), msg("day_wed"),
      msg("day_thu"), msg("day_fri"), msg("day_sat")
    ];
  }
  return DAY_NAMES;
}

function formatHour(h) {
  const d = new Date(2000, 0, 1, h, 0);
  return d.toLocaleTimeString(chrome.i18n.getUILanguage(), { hour: "numeric", minute: "2-digit" });
}

function renderCalendar() {
  calendarEnabledToggle.checked = state.calendarEnabled;
  calendarConfig.style.display = state.calendarEnabled ? "" : "none";

  // Day chips
  calendarDayCheckboxes.innerHTML = "";
  const days = state.calendarDays || [false,false,false,false,false,false,false];
  for (let i = 0; i < 7; i++) {
    const chip = el("span", { className: "day-chip" + (days[i] ? " active" : ""), textContent: getDayNames()[i] });
    chip.dataset.day = i;
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
    calendarDayCheckboxes.appendChild(chip);
  }

  // Hour selects
  calendarStartHourSelect.innerHTML = "";
  calendarEndHourSelect.innerHTML = "";
  for (let h = 0; h < 24; h++) {
    const label = formatHour(h);
    const opt1 = el("option", { value: h, textContent: label });
    const opt2 = el("option", { value: h, textContent: label });
    if (h === state.calendarStartHour) opt1.selected = true;
    if (h === state.calendarEndHour) opt2.selected = true;
    calendarStartHourSelect.appendChild(opt1);
    calendarEndHourSelect.appendChild(opt2);
  }

  calendarError.style.display = "none";
  calendarStatus.style.display = "none";
}

calendarEnabledToggle.addEventListener("change", () => {
  const wantOn = calendarEnabledToggle.checked;
  if (wantOn) {
    // More restrictive — instant
    chrome.runtime.sendMessage({ type: "setCalendarEnabled", value: true }, () => {
      if (chrome.runtime.lastError) return;
      state.calendarEnabled = true;
      renderCalendar();
    });
  } else {
    // Less restrictive — countdown
    calendarEnabledToggle.checked = true;
    startCountdown(msg("countdown_disabling_schedule"), () => {
      chrome.runtime.sendMessage({ type: "setCalendarEnabled", value: false }, () => {
        if (chrome.runtime.lastError) return;
        state.calendarEnabled = false;
        state.calendarControlling = false;
        renderCalendar();
      });
    });
  }
});

saveCalendarBtn.addEventListener("click", () => {
  const chips = calendarDayCheckboxes.querySelectorAll(".day-chip");
  const days = [];
  chips.forEach(c => days.push(c.classList.contains("active")));

  const startHour = parseInt(calendarStartHourSelect.value, 10);
  const endHour = parseInt(calendarEndHourSelect.value, 10);

  if (startHour >= endHour) {
    calendarError.textContent = msg("options_calendar_error_hours");
    calendarError.style.display = "";
    return;
  }

  calendarError.style.display = "none";
  chrome.runtime.sendMessage({
    type: "saveCalendarSchedule",
    calendarDays: days,
    calendarStartHour: startHour,
    calendarEndHour: endHour
  }, () => {
    if (chrome.runtime.lastError) return;
    state.calendarDays = days;
    state.calendarStartHour = startHour;
    state.calendarEndHour = endHour;
    calendarStatus.textContent = msg("options_schedule_saved");
    calendarStatus.style.display = "";
    setTimeout(() => { calendarStatus.style.display = "none"; }, 2000);
  });
});

// ============================================================
// Advanced — Custom Redirect URL
// ============================================================

const customRedirectInput = document.getElementById("customRedirectInput");
const saveRedirectBtn = document.getElementById("saveRedirectBtn");
const clearRedirectBtn = document.getElementById("clearRedirectBtn");

function renderAdvanced() {
  customRedirectInput.value = state.customRedirectUrl || "";
  timerClickOkToggle.checked = state.timerClickOk;
  timerFreezeToggle.checked = state.timerFreeze;
}

timerClickOkToggle.addEventListener("change", () => {
  const wantOn = timerClickOkToggle.checked;
  if (wantOn) {
    chrome.storage.local.set({ timerClickOk: true });
    state.timerClickOk = true;
  } else {
    timerClickOkToggle.checked = true;
    startCountdown(msg("countdown_disabling_confirm"), () => {
      chrome.storage.local.set({ timerClickOk: false });
      state.timerClickOk = false;
      timerClickOkToggle.checked = false;
    });
  }
});

timerFreezeToggle.addEventListener("change", () => {
  const wantOn = timerFreezeToggle.checked;
  if (wantOn) {
    chrome.storage.local.set({ timerFreeze: true });
    state.timerFreeze = true;
  } else {
    timerFreezeToggle.checked = true;
    startCountdown(msg("countdown_disabling_freeze"), () => {
      chrome.storage.local.set({ timerFreeze: false });
      state.timerFreeze = false;
      timerFreezeToggle.checked = false;
    });
  }
});

saveRedirectBtn.addEventListener("click", () => {
  const url = customRedirectInput.value.trim();
  const redirectError = document.getElementById("redirectError");
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        redirectError.textContent = msg("options_redirect_error_protocol");
        redirectError.style.display = "";
        return;
      }
    } catch {
      redirectError.textContent = msg("options_redirect_error_invalid");
      redirectError.style.display = "";
      return;
    }
  }
  redirectError.style.display = "none";
  chrome.runtime.sendMessage({ type: "saveCustomRedirectUrl", url }, () => {
    if (chrome.runtime.lastError) return;
    state.customRedirectUrl = url;
    renderAdvanced();
  });
});

clearRedirectBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "saveCustomRedirectUrl", url: "" }, () => {
    if (chrome.runtime.lastError) return;
    state.customRedirectUrl = "";
    renderAdvanced();
  });
});

// ============================================================
// Helpers
// ============================================================

function el(tag, props) {
  const elem = document.createElement(tag);
  if (props) Object.assign(elem, props);
  return elem;
}

// ============================================================
// Language Picker
// ============================================================

const languageSelect = document.getElementById("languageSelect");

function renderLanguageSelect() {
  languageSelect.innerHTML = "";
  const current = _currentLang || "auto";
  for (const lang of LANGUAGES) {
    const opt = el("option", {
      value: lang.code,
      textContent: lang.name
    });
    if (lang.code === current) opt.selected = true;
    languageSelect.appendChild(opt);
  }
}

languageSelect.addEventListener("change", () => {
  const lang = languageSelect.value;
  chrome.storage.local.set({ language: lang }, () => {
    location.reload();
  });
});

init();
