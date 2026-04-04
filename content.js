// Focus Tools — Content Script
// Runs at document_start on all target social media sites.
// site-config.js is loaded before this file.

(function () {
  const siteInfo = getSiteConfigForHostname(location.hostname);
  if (!siteInfo) return;

  const { siteKey, toggles: toggleDefs } = siteInfo;

  let currentToggles = {};
  let currentMode = "allow";
  let feedRedirectActive = false;
  let historyPatched = false;

  // Apply CSS classes based on toggle state and mode
  function applyState(mode, toggles) {
    currentMode = mode || "allow";
    currentToggles = toggles || {};

    if (currentMode !== "filter") {
      // "allow" or "block": remove all CSS classes, stop JS features
      removeAllClasses();
      return;
    }

    // Mode is "filter": apply toggles
    for (const def of toggleDefs) {
      if (def.cssClass) {
        if (currentToggles[def.key]) {
          document.documentElement.classList.add(def.cssClass);
        } else {
          document.documentElement.classList.remove(def.cssClass);
        }
      }
    }

    handleJsFeatures(currentToggles);

    // Watch for frameworks stripping our classes from <html>
    ensureClassGuard();
  }

  let classGuard = null;
  function ensureClassGuard() {
    if (classGuard) return;
    classGuard = new MutationObserver(() => {
      if (currentMode !== "filter") return;
      for (const def of toggleDefs) {
        if (def.cssClass && currentToggles[def.key]) {
          if (!document.documentElement.classList.contains(def.cssClass)) {
            document.documentElement.classList.add(def.cssClass);
          }
        }
      }
    });
    classGuard.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }

  function removeAllClasses() {
    for (const def of toggleDefs) {
      if (def.cssClass) {
        document.documentElement.classList.remove(def.cssClass);
      }
    }
    cleanupJsFeatures();
  }

  // --- JS Feature Handlers ---

  // Generic SPA URL watcher for block-url and redirect-url toggles
  let urlWatcher = null;
  let lastWatchedPath = location.pathname;
  const blockedPageUrl = chrome.runtime.getURL("blocked.html");

  function startUrlWatcher() {
    if (urlWatcher) return;
    lastWatchedPath = location.pathname;
    urlWatcher = setInterval(checkUrlRules, 300);
  }

  function stopUrlWatcher() {
    if (urlWatcher) { clearInterval(urlWatcher); urlWatcher = null; }
  }

  function checkUrlRules() {
    if (location.pathname === lastWatchedPath) return;
    lastWatchedPath = location.pathname;

    for (const def of toggleDefs) {
      if (!currentToggles[def.key]) continue;

      if (def.type === "block-url" && def.urlPattern) {
        // Extract path portion from urlPattern like "||linkedin.com/feed"
        const pathMatch = def.urlPattern.replace(/^\|\|[^/]*/, "");
        if (pathMatch && location.pathname.startsWith(pathMatch)) {
          location.replace(blockedPageUrl);
          return;
        }
      }

      if (def.type === "redirect-url" && def.urlPattern && def.redirectUrl) {
        const pathMatch = def.urlPattern.replace(/^\|\|[^/]*/, "");
        if (pathMatch && location.pathname.startsWith(pathMatch)) {
          location.replace(def.redirectUrl);
          return;
        }
      }
    }
  }

  function handleJsFeatures(toggles) {
    if (siteKey === "facebook.com") {
      handleFacebookRedirect(toggles.forceRedirectFriends);
    }
    // Start URL watcher if any block-url or redirect-url toggles are active
    const hasUrlToggles = toggleDefs.some(
      (d) => (d.type === "block-url" || d.type === "redirect-url") && toggles[d.key]
    );
    if (hasUrlToggles) {
      startUrlWatcher();
      checkUrlRules();
    } else {
      stopUrlWatcher();
    }
  }

  function cleanupJsFeatures() {
    feedRedirectActive = false;
    stopUrlWatcher();
  }

  function handleFacebookRedirect(enabled) {
    if (enabled) {
      if (location.pathname === "/" || location.pathname === "") {
        location.replace("/friends");
        return;
      }

      if (!historyPatched) {
        historyPatched = true;
        const origPushState = history.pushState.bind(history);
        const origReplaceState = history.replaceState.bind(history);

        history.pushState = function (state, title, url) {
          origPushState(state, title, url);
          checkFacebookRedirect();
        };
        history.replaceState = function (state, title, url) {
          origReplaceState(state, title, url);
          checkFacebookRedirect();
        };

        window.addEventListener("popstate", checkFacebookRedirect);
      }
      feedRedirectActive = true;
    } else {
      feedRedirectActive = false;
    }
  }

  function checkFacebookRedirect() {
    if (!feedRedirectActive) return;
    if (location.pathname === "/" || location.pathname === "") {
      location.replace("/friends");
    }
  }


  // Merge stored toggles with defaults so new keys are always present
  function mergeToggles(stored) {
    const defaults = {};
    for (const def of toggleDefs) defaults[def.key] = false;
    return { ...defaults, ...(stored || {}) };
  }

  // --- Storage: initial load ---
  chrome.storage.local.get(["siteToggles", "siteModes", "enabled"], (result) => {
    if (result.enabled === false) return;
    const mode = result.siteModes && result.siteModes[siteKey];
    const toggles = mergeToggles(result.siteToggles && result.siteToggles[siteKey]);
    applyState(mode, toggles);
  });

  // --- Storage: listen for real-time changes ---
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    if (changes.enabled) {
      if (changes.enabled.newValue === false) {
        removeAllClasses();
        return;
      }
      // Re-enabled
      chrome.storage.local.get(["siteToggles", "siteModes"], (result) => {
        applyState(
          result.siteModes && result.siteModes[siteKey],
          mergeToggles(result.siteToggles && result.siteToggles[siteKey])
        );
      });
      return;
    }

    if (changes.siteToggles || changes.siteModes) {
      chrome.storage.local.get(["siteToggles", "siteModes", "enabled"], (result) => {
        if (result.enabled === false) return;
        applyState(
          result.siteModes && result.siteModes[siteKey],
          mergeToggles(result.siteToggles && result.siteToggles[siteKey])
        );
      });
    }
  });
})();
