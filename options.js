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
const siteTogglesContainer = document.getElementById("siteTogglesContainer");
const blocklistCategoriesContainer = document.getElementById("blocklistCategoriesContainer");
const countdownModal = document.getElementById("countdownModal");
const countdownLabel = document.getElementById("countdownLabel");
const countdownDisplay = document.getElementById("countdownDisplay");
const countdownCancel = document.getElementById("countdownCancel");

let state = {
  enabled: true,
  blockedSites: [],
  countdownSeconds: 2,
  siteToggles: {},
  siteModes: {},
  blockExtensionsPage: false,
  blocklistCategories: {}
};

let searchFilter = "";

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
    renderBlocklistCategories();
    renderSiteToggles();
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
  const val = Math.max(1, Math.min(3600, parseInt(countdownInput.value, 10) || 2));
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

  const total = state.blockedSites.length;
  blocklistCount.textContent = searchFilter
    ? `${filtered.length} of ${total} sites shown`
    : `${total} site${total !== 1 ? "s" : ""} blocked`;
}

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
// Blocklist Categories
// ============================================================

const BLOCKLIST_CAT_LABELS = {
  porn:     { label: "Porn",      description: "Adult content websites" },
  gambling: { label: "Gambling",  description: "Gambling and betting sites" },
  fakenews: { label: "Fake News", description: "Misinformation sources" }
};

function renderBlocklistCategories() {
  blocklistCategoriesContainer.innerHTML = "";
  const cats = state.blocklistCategories || {};

  for (const [catKey, display] of Object.entries(BLOCKLIST_CAT_LABELS)) {
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
    const label = BLOCKLIST_CAT_LABELS[category]?.label || category;
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
// Helpers
// ============================================================

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function el(tag, props) {
  const elem = document.createElement(tag);
  if (props) Object.assign(elem, props);
  return elem;
}

init();
