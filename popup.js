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

let state = { enabled: true, blockedSites: [], disabling: false, disableAt: null };
let currentTabUrl = "";
let currentTabDomain = "";
let timerInterval = null;

// --- Init ---
function init() {
  chrome.runtime.sendMessage({ type: "getState" }, (res) => {
    if (res) {
      state = res;
      renderMain();
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
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
}

// --- Render ---
function renderMain() {
  if (state.disabling) {
    statusDot.className = "status-dot pending";
    statusText.textContent = "Disabling...";
    toggleBtn.textContent = "Cancel";
    toggleBtn.className = "btn-cancel";
    timerSection.style.display = "block";
    startTimer();
  } else if (state.enabled) {
    statusDot.className = "status-dot on";
    statusText.textContent = "Active";
    toggleBtn.textContent = "Disable";
    toggleBtn.className = "btn-disable";
    timerSection.style.display = "none";
    stopTimer();
  } else {
    statusDot.className = "status-dot off";
    statusText.textContent = "Disabled";
    toggleBtn.textContent = "Enable";
    toggleBtn.className = "btn-enable";
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
  blockUrlBtn.title = urlBlocked ? "Already blocked" : `Block ${currentTabUrl}`;
  blockDomainBtn.title = domainBlocked ? "Already blocked" : `Block ${currentTabDomain}`;
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
  const seconds = Math.ceil(remaining / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  timerDisplay.textContent = `${m}:${String(s).padStart(2, "0")}`;
  if (remaining <= 0) {
    stopTimer();
    state.enabled = false;
    state.disabling = false;
    renderMain();
  }
}

// --- Toggle button ---
toggleBtn.addEventListener("click", () => {
  if (state.disabling) {
    chrome.runtime.sendMessage({ type: "cancelDisable" }, () => {
      state.disabling = false;
      state.disableAt = null;
      renderMain();
    });
  } else if (state.enabled) {
    chrome.runtime.sendMessage({ type: "requestDisable" }, (res) => {
      if (res) {
        state.disabling = res.disabling;
        state.disableAt = res.disableAt;
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

// --- Quick block ---
blockUrlBtn.addEventListener("click", () => {
  if (blockUrlBtn.classList.contains("already-blocked") || !currentTabUrl) return;
  chrome.runtime.sendMessage({ type: "addSite", site: currentTabUrl }, (res) => {
    if (res && res.blockedSites) {
      state.blockedSites = res.blockedSites;
      renderBlockButtons();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: chrome.runtime.getURL("blocked.html") });
      });
    }
  });
});

blockDomainBtn.addEventListener("click", () => {
  if (blockDomainBtn.classList.contains("already-blocked") || !currentTabDomain) return;
  chrome.runtime.sendMessage({ type: "addSite", site: currentTabDomain }, (res) => {
    if (res && res.blockedSites) {
      state.blockedSites = res.blockedSites;
      renderBlockButtons();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.tabs.update(tabs[0].id, { url: chrome.runtime.getURL("blocked.html") });
      });
    }
  });
});

// --- Settings button: open options page ---
settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// --- Listen for background ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "disabled") {
    state.enabled = false;
    state.disabling = false;
    renderMain();
  }
});

init();
