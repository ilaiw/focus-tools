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
const countdownCancel = document.getElementById("countdownCancel");

let state = {
  enabled: true,
  blockedSites: [],
  blockedKeywords: [],
  countdownSeconds: DEFAULT_COUNTDOWN_SECONDS,
  siteToggles: {},
  siteModes: {},
  blockExtensionsPage: false,
  blocklistCategories: {},
  customRedirectUrl: ""
};

let searchFilter = "";
let keywordSearchFilter = "";
let blocklistExpanded = false;
let keywordListExpanded = false;

// Countdown modal state
let countdownTimer = null;
let countdownEndAt = null;
let pendingAction = null;

// ============================================================
// Init
// ============================================================

function init() {
  chrome.runtime.sendMessage({ type: "getState" }, (res) => {
    if (!res) return;
    state = res;
    renderGeneral();
    renderBlockExtToggle();
    renderBlocklist();
    renderKeywords();
    renderBlocklistCategories();
    renderSiteToggles();
    renderAdvanced();
  });
}

// ============================================================
// Countdown Modal — THE ONLY countdown mechanism
// ============================================================

function startCountdown(label, onComplete) {
  pendingAction = { label, action: onComplete };
  countdownLabel.textContent = label;
  countdownEndAt = Date.now() + state.countdownSeconds * 1000;
  countdownModal.classList.add("open");
  updateCountdownDisplay();

  countdownTimer = setInterval(() => {
    const remaining = Math.max(0, countdownEndAt - Date.now());
    countdownDisplay.textContent = formatTime(Math.ceil(remaining / 1000));

    if (remaining <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      countdownModal.classList.remove("open");
      if (pendingAction) {
        pendingAction.action();
        pendingAction = null;
      }
    }
  }, 100);
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
  countdownModal.classList.remove("open");
  pendingAction = null;
  renderBlockExtToggle();
  updateSiteToggles();
  renderBlocklist();
  renderKeywords();
  renderBlocklistCategories();
}

countdownCancel.addEventListener("click", cancelCountdown);

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
      state.blockExtensionsPage = true;
    });
  } else {
    // Turning OFF (less restrictive) — countdown
    blockExtToggle.checked = true; // revert visually until countdown completes
    startCountdown("Disabling extensions page block...", () => {
      chrome.runtime.sendMessage({ type: "setBlockExtensionsPage", value: false }, () => {
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
  const unlockBtn = el("button", { className: "btn-unlock", textContent: "Unlock to edit" });
  unlockBtn.addEventListener("click", () => {
    startCountdown("Unlocking countdown setting...", () => {
      countdownInput.disabled = false;
      countdownActions.innerHTML = "";
      const saveBtn = el("button", { className: "btn-save", textContent: "Save" });
      saveBtn.addEventListener("click", saveCountdown);
      countdownActions.appendChild(saveBtn);
    });
  });
  countdownActions.appendChild(unlockBtn);
}

function saveCountdown() {
  const val = Math.max(1, Math.min(3600, parseInt(countdownInput.value, 10) || DEFAULT_COUNTDOWN_SECONDS));
  chrome.runtime.sendMessage({ type: "saveCountdown", countdownSeconds: val }, () => {
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
    ? `${total} blocked site${total !== 1 ? "s" : ""} — click to view`
    : "No blocked sites yet";

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
      textContent: searchFilter ? "No matching sites" : "No blocked sites yet. Click + Add to get started."
    }));
  } else {
    for (const site of filtered) {
      const item = el("div", { className: "blocklist-item" });

      const removeBtn = el("button", {
        className: "blocklist-remove",
        textContent: "\u00d7",
        title: "Remove (requires countdown)"
      });
      removeBtn.addEventListener("click", () => {
        startCountdown(`Removing "${site}" from blocklist...`, () => {
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
    ? `${filtered.length} of ${total} sites shown`
    : `${total} site${total !== 1 ? "s" : ""} blocked`;
}

blocklistSearch.addEventListener("focus", () => {
  blocklistExpanded = true;
  blocklistSearch.placeholder = "Search blocked sites...";
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
    ? `${total} blocked keyword${total !== 1 ? "s" : ""} — click to view`
    : "No blocked keywords yet";

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
      textContent: keywordSearchFilter ? "No matching keywords" : "No blocked keywords yet. Click + Add to get started."
    }));
  } else {
    for (const keyword of filtered) {
      const item = el("div", { className: "blocklist-item" });

      const removeBtn = el("button", {
        className: "blocklist-remove",
        textContent: "\u00d7",
        title: "Remove (requires countdown)"
      });
      removeBtn.addEventListener("click", () => {
        startCountdown(`Removing "${keyword}" from keywords...`, () => {
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
    ? `${filtered.length} of ${total} keywords shown`
    : `${total} keyword${total !== 1 ? "s" : ""} blocked`;
}

keywordSearch.addEventListener("focus", () => {
  keywordListExpanded = true;
  keywordSearch.placeholder = "Search blocked keywords...";
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
    const name = el("div", { className: "blocklist-cat-name", textContent: display.label });
    const meta = el("div", { className: "blocklist-cat-meta" });
    if (catState.enabled && catState.lastUpdated) {
      const date = new Date(catState.lastUpdated);
      meta.textContent = `${catState.domainCount.toLocaleString()} domains \u00b7 Updated ${date.toLocaleDateString()}`;
    } else {
      meta.textContent = display.description;
    }
    info.appendChild(name);
    info.appendChild(meta);

    // Actions
    const actions = el("div", { className: "blocklist-cat-actions" });

    if (catState.enabled) {
      const refreshBtn = el("button", { className: "btn-refresh", textContent: "Refresh" });
      refreshBtn.addEventListener("click", () => {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "Fetching...";
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
    if (meta) meta.textContent = "Fetching...";
    chrome.runtime.sendMessage({ type: "enableBlocklistCategory", category }, (res) => {
      if (res && res.ok) {
        state.blocklistCategories = res.blocklistCategories;
      } else {
        // Fetch failed — revert
        checkbox.checked = false;
        if (meta) meta.textContent = (res && res.error) || "Fetch failed";
      }
      renderBlocklistCategories();
    });
  } else {
    // Disabling (less restrictive) — countdown required
    checkbox.checked = true;
    const label = BLOCKLIST_CATEGORIES[category]?.label || category;
    startCountdown(`Disabling ${label} blocklist...`, () => {
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
    headerLeft.innerHTML = `<span class="arrow">&#9658;</span> ${config.label}`;

    const headerRight = el("div", { className: "site-header-right" });

    const modeSelector = el("div", { className: "mode-selector" });
    modeSelector.dataset.modeFor = siteKey;

    for (const m of ["allow", "filter", "block"]) {
      const btn = el("button", { textContent: m.charAt(0).toUpperCase() + m.slice(1) });
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

      const label = el("span", { className: "toggle-label", textContent: toggle.label });

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
    startCountdown(`Changing ${config.label} to "${targetMode}"...`, applyMode);
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
    startCountdown(`Disabling "${toggleDef.label}" on ${config.label}...`, () => {
      chrome.runtime.sendMessage({ type: "setToggle", siteKey, toggleKey, value: false }, (res) => {
        if (res) state.siteToggles = res.siteToggles;
        updateSiteToggles();
      });
    });
  }
}

// ============================================================
// Advanced — Custom Redirect URL
// ============================================================

const customRedirectInput = document.getElementById("customRedirectInput");
const saveRedirectBtn = document.getElementById("saveRedirectBtn");
const clearRedirectBtn = document.getElementById("clearRedirectBtn");

function renderAdvanced() {
  customRedirectInput.value = state.customRedirectUrl || "";
}

saveRedirectBtn.addEventListener("click", () => {
  const url = customRedirectInput.value.trim();
  if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
    alert("Please enter a valid URL starting with http:// or https://");
    return;
  }
  chrome.runtime.sendMessage({ type: "saveCustomRedirectUrl", url }, () => {
    state.customRedirectUrl = url;
    renderAdvanced();
  });
});

clearRedirectBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "saveCustomRedirectUrl", url: "" }, () => {
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

init();
