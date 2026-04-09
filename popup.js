// Focus Tools — Popup (simplified: status + quick block)

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const toggleBtn = document.getElementById("toggleBtn");
const timerSection = document.getElementById("timerSection");
const timerDisplay = document.getElementById("timerDisplay");
const blockUrlBtn = document.getElementById("blockUrlBtn");
const blockUrlValue = document.getElementById("blockUrlValue");
const blockDomainBtn = document.getElementById("blockDomainBtn");
const blockDomainValue = document.getElementById("blockDomainValue");
const settingsBtn = document.getElementById("settingsBtn");
const lockScreen = document.getElementById("lockScreen");
const mainContent = document.getElementById("mainContent");
const lockPasswordInput = document.getElementById("lockPasswordInput");
const lockUnlockBtn = document.getElementById("lockUnlockBtn");
const lockError = document.getElementById("lockError");
const lockStatusDot = document.getElementById("lockStatusDot");
const lockStatusText = document.getElementById("lockStatusText");
const lockCalendarIndicator = document.getElementById("lockCalendarIndicator");
const calendarIndicator = document.getElementById("calendarIndicator");
const popupConfirmBtns = document.getElementById("popupConfirmBtns");
const popupOk = document.getElementById("popupOk");
const popupConfirmCancel = document.getElementById("popupConfirmCancel");

let state = { enabled: true, blockedSites: [], disabling: false, disableAt: null, timerClickOk: false, disableWaitingConfirm: false, calendarEnabled: false, calendarControlling: false, timerFreeze: false, disablePaused: false, passwordHash: "" };

lockUnlockBtn.addEventListener("click", () => {
  tryUnlock(lockPasswordInput, lockError, state.passwordHash, () => {
    lockScreen.style.display = "none";
    mainContent.style.display = "";
  });
});

lockPasswordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") lockUnlockBtn.click();
});
let currentTabUrl = "";
let currentTabDomain = "";
let timerInterval = null;
let countdownPort = null;

// --- Init ---
async function init() {
  await i18nReady;
  chrome.runtime.sendMessage({ type: "getState" }, (res) => {
    if (res) {
      state = res;
      if (state.passwordHash) {
        lockScreen.style.display = "";
        mainContent.style.display = "none";
        renderLockStatus();
      } else {
        lockScreen.style.display = "none";
        mainContent.style.display = "";
      }
      if (state.timerFreeze && (state.disabling || state.disableWaitingConfirm)) {
        setupFreezePort();
      }
      renderMain();
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) return;
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          if (url.protocol === "http:" || url.protocol === "https:") {
            currentTabDomain = url.hostname.replace(/^www\./, "");
            currentTabUrl = currentTabDomain + url.pathname.replace(/\/+$/, "");
          }
        } catch (e) {}
      }
      renderBlockButtons();
    });
  });
}

// --- Lock screen status ---
function renderLockStatus() {
  const calendarActive = state.calendarEnabled && state.calendarControlling;
  lockCalendarIndicator.style.display = calendarActive ? "" : "none";
  if (state.enabled) {
    lockStatusDot.className = "status-dot on";
    lockStatusText.textContent = calendarActive ? msg("popup_status_active_scheduled") : msg("popup_status_active");
  } else {
    lockStatusDot.className = "status-dot off";
    lockStatusText.textContent = calendarActive ? msg("popup_status_disabled_scheduled") : msg("popup_status_disabled");
  }
}

// --- Render ---
function renderMain() {
  popupConfirmBtns.style.display = "none";
  const calendarActive = state.calendarEnabled && state.calendarControlling;
  calendarIndicator.style.display = calendarActive ? "" : "none";

  if (state.disableWaitingConfirm) {
    statusDot.className = "status-dot pending";
    statusText.textContent = msg("popup_confirm_disable");
    toggleBtn.style.display = "none";
    timerSection.style.display = "block";
    timerDisplay.textContent = "0:00";
    popupConfirmBtns.style.display = "block";
    stopTimer();
  } else if (state.disabling) {
    statusDot.className = "status-dot pending";
    statusText.textContent = msg("popup_disabling");
    toggleBtn.style.display = "";
    toggleBtn.textContent = msg("popup_btn_cancel");
    toggleBtn.className = "btn-cancel";
    timerSection.style.display = "block";
    startTimer();
  } else if (state.enabled) {
    statusDot.className = "status-dot on";
    statusText.textContent = calendarActive ? msg("popup_status_active_scheduled") : msg("popup_status_active");
    toggleBtn.style.display = "";
    toggleBtn.textContent = msg("popup_btn_disable");
    toggleBtn.className = "btn-disable";
    toggleBtn.disabled = calendarActive;
    toggleBtn.style.opacity = calendarActive ? "0.3" : "";
    timerSection.style.display = "none";
    stopTimer();
  } else {
    statusDot.className = "status-dot off";
    statusText.textContent = calendarActive ? msg("popup_status_disabled_scheduled") : msg("popup_status_disabled");
    toggleBtn.style.display = "";
    toggleBtn.textContent = msg("popup_btn_enable");
    toggleBtn.className = "btn-enable";
    toggleBtn.disabled = calendarActive;
    toggleBtn.style.opacity = calendarActive ? "0.3" : "";
    timerSection.style.display = "none";
    stopTimer();
  }
  renderBlockButtons();
}

function renderBlockButtons() {
  if (!currentTabUrl) {
    blockUrlBtn.style.display = "none";
    blockDomainBtn.style.display = "none";
    return;
  }

  blockUrlBtn.style.display = "flex";
  blockDomainBtn.style.display = "flex";
  blockUrlValue.textContent = currentTabUrl;
  blockDomainValue.textContent = currentTabDomain;

  const urlBlocked = state.blockedSites.some(
    (s) => currentTabUrl === s || currentTabUrl.startsWith(s + "/")
  );
  const domainBlocked = state.blockedSites.includes(currentTabDomain);

  blockUrlBtn.classList.toggle("already-blocked", urlBlocked);
  blockDomainBtn.classList.toggle("already-blocked", domainBlocked);
  blockUrlBtn.title = urlBlocked ? msg("popup_already_blocked") : msg("popup_block_url_title", [currentTabUrl]);
  blockDomainBtn.title = domainBlocked ? msg("popup_already_blocked") : msg("popup_block_domain_title", [currentTabDomain]);
}

// --- Timer ---
function startTimer() {
  stopTimer();
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 200);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function updateTimerDisplay() {
  if (!state.disableAt) return;
  const remaining = Math.max(0, state.disableAt - Date.now());
  timerDisplay.textContent = formatTime(Math.ceil(remaining / 1000));
  if (remaining <= 0) {
    stopTimer();
    if (state.timerClickOk) {
      // Background alarm will set disableWaitingConfirm — wait for message
      return;
    }
    state.enabled = false;
    state.disabling = false;
    renderMain();
  }
}

// --- Toggle button ---
toggleBtn.addEventListener("click", () => {
  if (state.calendarEnabled && state.calendarControlling) return;
  if (state.disabling) {
    chrome.runtime.sendMessage({ type: "cancelDisable" }, () => {
      state.disabling = false;
      state.disableAt = null;
      renderMain();
    });
  } else if (state.enabled) {
    chrome.runtime.sendMessage({ type: "requestDisable" }, (res) => {
      if (res && res.rejected) return;
      if (res) {
        state.disabling = res.disabling;
        state.disableAt = res.disableAt;
        if (state.timerFreeze) setupFreezePort();
        renderMain();
      }
    });
  } else {
    chrome.runtime.sendMessage({ type: "enable" }, () => {
      state.enabled = true;
      state.disabling = false;
      renderMain();
    });
  }
});

// --- Timer freeze port ---
function setupFreezePort() {
  if (countdownPort) return;
  countdownPort = chrome.runtime.connect({ name: "popupCountdown" });
}

window.addEventListener("blur", () => {
  if (!state.timerFreeze || !state.disabling) return;
  chrome.runtime.sendMessage({ type: "pauseDisable" }, (res) => {
    if (res && res.paused) {
      state.disablePaused = true;
      stopTimer();
      timerDisplay.textContent = msg("timer_paused", [formatTime(Math.ceil(res.remaining / 1000))]);
    }
  });
});

window.addEventListener("focus", () => {
  if (!state.timerFreeze || !state.disablePaused) return;
  chrome.runtime.sendMessage({ type: "resumeDisable" }, (res) => {
    if (res && res.disableAt) {
      state.disablePaused = false;
      state.disableAt = res.disableAt;
      startTimer();
    }
  });
});

// --- Quick block ---
function quickBlock(btn, site) {
  if (btn.classList.contains("already-blocked") || !site) return;
  chrome.runtime.sendMessage({ type: "addSite", site }, (res) => {
    if (res && res.blockedSites) {
      state.blockedSites = res.blockedSites;
      renderBlockButtons();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) return;
        if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: chrome.runtime.getURL("blocked.html") });
      });
    }
  });
}

blockUrlBtn.addEventListener("click", () => quickBlock(blockUrlBtn, currentTabUrl));
blockDomainBtn.addEventListener("click", () => quickBlock(blockDomainBtn, currentTabDomain));

// --- Settings button: open options page ---
settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// --- Confirm disable (click-OK mode) ---
popupOk.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "confirmDisable" }, () => {
    state.enabled = false;
    state.disableWaitingConfirm = false;
    state.disabling = false;
    renderMain();
  });
});

popupConfirmCancel.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "cancelDisable" }, () => {
    state.disabling = false;
    state.disableAt = null;
    state.disableWaitingConfirm = false;
    renderMain();
  });
});

// --- Listen for background ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "disabled") {
    state.enabled = false;
    state.disabling = false;
    state.disableWaitingConfirm = false;
    renderMain();
  }
  if (message.type === "waitingConfirm") {
    state.disabling = false;
    state.disableWaitingConfirm = true;
    renderMain();
  }
});

init();
