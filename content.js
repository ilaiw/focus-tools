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
  let styleEl = null;

  // CSS is injected via JS (not as static content_scripts CSS) so that when the
  // extension is popup-disabled, no stylesheets get added to the page at all.
  function ensureStyleInjected() {
    if (styleEl && styleEl.isConnected) return;
    const css = SITE_CSS[siteKey];
    if (!css) return;
    styleEl = document.createElement("style");
    styleEl.setAttribute("data-focus-tools", "");
    styleEl.textContent = css;
    document.documentElement.appendChild(styleEl);
  }

  function removeStyleElement() {
    if (styleEl) { styleEl.remove(); styleEl = null; }
  }

  // Apply CSS classes based on toggle state and mode
  function applyState(mode, toggles) {
    currentMode = mode || "allow";
    currentToggles = toggles || {};

    if (currentMode !== "filter") {
      // "allow" or "block": remove all CSS classes, stop JS features
      removeAllClasses();
      return;
    }

    ensureStyleInjected();

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

  // Shared SPA route change detection
  let urlWatcherActive = false;
  let lastWatchedPath = location.pathname;
  const blockedPageUrl = chrome.runtime.getURL("blocked.html");

  // Content scripts run in an isolated world, so patching history.pushState
  // here never sees the page's own calls. Navigation API events do reach the
  // isolated world, for pushState/replaceState and back/forward alike.
  function ensureHistoryPatched() {
    if (historyPatched) return;
    historyPatched = true;
    if (window.navigation) {
      navigation.addEventListener("currententrychange", onHistoryChange);
    } else {
      window.addEventListener("popstate", onHistoryChange);
    }
  }

  function onHistoryChange() {
    if (urlWatcherActive) checkUrlRules();
    if (feedRedirectActive) checkFacebookRedirect();
  }

  function startUrlWatcher() {
    if (urlWatcherActive) return;
    urlWatcherActive = true;
    lastWatchedPath = location.pathname;
    ensureHistoryPatched();
  }

  function stopUrlWatcher() {
    urlWatcherActive = false;
  }

  function checkUrlRules() {
    if (location.pathname === lastWatchedPath) return;
    lastWatchedPath = location.pathname;

    for (const def of toggleDefs) {
      if (!currentToggles[def.key]) continue;
      if (def.type !== "block-url" && def.type !== "redirect-url") continue;
      if (!urlMatchesToggle(def)) continue;

      // Background handles these via declarativeNetRequest for full navigations;
      // this catches SPA client-side route changes that don't trigger network requests.
      location.replace(def.type === "block-url" ? blockedPageUrl : def.redirectUrl);
      return;
    }
  }

  function urlMatchesToggle(def) {
    if (def.urlRegex) return new RegExp(def.urlRegex, "i").test(location.href);
    // Extract path portion from urlPattern like "||linkedin.com/feed^"
    const pathMatch = def.urlPattern.replace(/^\|\|[^/]*/, "");
    if (pathMatch.endsWith("^")) {
      // DNR separator: "/feed" and "/feed/..." match, "/feedback" doesn't
      const path = pathMatch.slice(0, -1);
      return location.pathname === path || location.pathname.startsWith(path + "/");
    }
    return !!pathMatch && location.pathname.startsWith(pathMatch);
  }

  function handleJsFeatures(toggles) {
    if (siteKey === "facebook.com") {
      // Both redirect "/"; the Marketplace one wins, matching its DNR rule on full loads.
      handleFacebookRedirect(toggles.forceRedirectFriends && !toggles.redirectHomeToMarketplace);
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
    if (classGuard) { classGuard.disconnect(); classGuard = null; }
  }

  function handleFacebookRedirect(enabled) {
    if (enabled) {
      if (location.pathname === "/" || location.pathname === "") {
        location.replace("/friends");
        return;
      }
      ensureHistoryPatched();
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


  // --- Storage: initial load ---
  chrome.storage.local.get(["siteToggles", "siteModes", "enabled"], (result) => {
    if (result.enabled === false) return;
    const mode = result.siteModes && result.siteModes[siteKey];
    const toggles = mergeTogglesWithDefaults(siteKey, result.siteToggles && result.siteToggles[siteKey]);
    applyState(mode, toggles);
  });

  // --- Storage: listen for real-time changes ---
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    if (changes.enabled) {
      if (changes.enabled.newValue === false) {
        removeAllClasses();
        removeStyleElement();
        return;
      }
      // Re-enabled
      chrome.storage.local.get(["siteToggles", "siteModes"], (result) => {
        applyState(
          result.siteModes && result.siteModes[siteKey],
          mergeTogglesWithDefaults(siteKey, result.siteToggles && result.siteToggles[siteKey])
        );
      });
      return;
    }

    if (changes.siteToggles || changes.siteModes) {
      chrome.storage.local.get(["siteToggles", "siteModes", "enabled"], (result) => {
        if (result.enabled === false) return;
        applyState(
          result.siteModes && result.siteModes[siteKey],
          mergeTogglesWithDefaults(siteKey, result.siteToggles && result.siteToggles[siteKey])
        );
      });
    }
  });
})();
