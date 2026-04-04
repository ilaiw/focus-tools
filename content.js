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
  let shortsBlockActive = false;
  let likesObserver = null;
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

  function handleJsFeatures(toggles) {
    if (siteKey === "facebook.com") {
      handleFacebookRedirect(toggles.forceRedirectFriends);
      handleFacebookLikesComments(toggles.hideLikesComments);
    }
    if (siteKey === "youtube.com") {
      handleYoutubeShortsBlock(toggles.blockShorts);
    }
  }

  function cleanupJsFeatures() {
    feedRedirectActive = false;
    shortsBlockActive = false;
    if (likesObserver) {
      likesObserver.disconnect();
      likesObserver = null;
    }
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

  function handleFacebookLikesComments(enabled) {
    if (enabled && !likesObserver) {
      likesObserver = new MutationObserver(() => {
        const selectors = [
          'div[aria-label*="reactions"]',
          'div[aria-label*="Reactions"]',
          'span[aria-label*="others"]'
        ];
        for (const sel of selectors) {
          document.querySelectorAll(sel).forEach((el) => {
            if (el.offsetParent !== null) {
              el.style.display = "none";
            }
          });
        }
      });

      if (document.body) {
        likesObserver.observe(document.body, { childList: true, subtree: true });
      } else {
        document.addEventListener("DOMContentLoaded", () => {
          if (likesObserver && document.body) {
            likesObserver.observe(document.body, { childList: true, subtree: true });
          }
        });
      }
    } else if (!enabled && likesObserver) {
      likesObserver.disconnect();
      likesObserver = null;
    }
  }

  // YouTube: block /shorts/* pages by redirecting away
  function handleYoutubeShortsBlock(enabled) {
    if (enabled) {
      // Redirect if already on a shorts page
      if (location.pathname.startsWith("/shorts")) {
        location.replace("/");
        return;
      }

      // Patch navigation to intercept SPA routing to /shorts
      if (!historyPatched) {
        historyPatched = true;
        const origPushState = history.pushState.bind(history);
        const origReplaceState = history.replaceState.bind(history);

        history.pushState = function (s, t, url) {
          origPushState(s, t, url);
          checkShortsRedirect();
        };
        history.replaceState = function (s, t, url) {
          origReplaceState(s, t, url);
          checkShortsRedirect();
        };
        window.addEventListener("popstate", checkShortsRedirect);
      }
      shortsBlockActive = true;
    } else {
      shortsBlockActive = false;
    }
  }

  function checkShortsRedirect() {
    if (!shortsBlockActive) return;
    if (location.pathname.startsWith("/shorts")) {
      location.replace("/");
    }
  }

  // --- Storage: initial load ---
  chrome.storage.local.get(["siteToggles", "siteModes", "enabled"], (result) => {
    if (result.enabled === false) return;
    const mode = result.siteModes && result.siteModes[siteKey];
    const toggles = result.siteToggles && result.siteToggles[siteKey];
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
          result.siteToggles && result.siteToggles[siteKey]
        );
      });
      return;
    }

    if (changes.siteToggles || changes.siteModes) {
      chrome.storage.local.get(["siteToggles", "siteModes", "enabled"], (result) => {
        if (result.enabled === false) return;
        applyState(
          result.siteModes && result.siteModes[siteKey],
          result.siteToggles && result.siteToggles[siteKey]
        );
      });
    }
  });
})();
