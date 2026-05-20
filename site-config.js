// Focus Tools — Shared Site Configuration
// Loaded by: content.js, options.js (via <script>), background.js (via importScripts)

// Site modes: "allow" | "filter" | "block"
//  - allow:  site works normally, sub-toggles ignored (but selections preserved)
//  - filter: sub-toggles take effect (hide feed, grayscale, etc.)
//  - block:  site is fully blocked (redirected to blocked.html)

const SITE_CONFIG = {
  "facebook.com": {
    label: "Facebook",
    labelKey: "site_facebook",
    matches: ["facebook.com"],
    toggles: [
      { key: "hideMessenger",        label: "Hide Messenger link",        labelKey: "toggle_facebook_hide_messenger",       type: "css", cssClass: "ft-hide-messenger" },
      { key: "forceRedirectFriends", label: "Redirect to Friends feed",   labelKey: "toggle_facebook_redirect_friends",     type: "js" },
      { key: "hideLikesComments",    label: "Hide Likes and Comments",    labelKey: "toggle_facebook_hide_likes_comments",  type: "css", cssClass: "ft-hide-likes-comments" },
      { key: "hideChatSidebar",      label: "Hide Chat Sidebar",          labelKey: "toggle_facebook_hide_chat_sidebar",    type: "css", cssClass: "ft-hide-chat" },
      { key: "hideMarketplace",      label: "Hide Marketplace link",      labelKey: "toggle_facebook_hide_marketplace",     type: "css", cssClass: "ft-hide-marketplace" },
      { key: "hideVideoReels",       label: "Hide Video & Reels links",   labelKey: "toggle_facebook_hide_video_reels",     type: "css", cssClass: "ft-hide-reels" },
      { key: "blockReels",           label: "Block Reels pages",          labelKey: "toggle_facebook_block_reels",          type: "block-url", urlPattern: "||facebook.com/reel" },
      { key: "hideGaming",           label: "Hide Gaming link",           labelKey: "toggle_facebook_hide_gaming",          type: "css", cssClass: "ft-hide-gaming" },
      { key: "blockGaming",          label: "Block Gaming pages",         labelKey: "toggle_facebook_block_gaming",         type: "block-url", urlPattern: "||facebook.com/gaming" },
      { key: "removeColors",         label: "Remove Colors (grayscale)",  labelKey: "toggle_remove_colors",                 type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "youtube.com": {
    label: "YouTube",
    labelKey: "site_youtube",
    matches: ["youtube.com"],
    toggles: [
      { key: "hideHomeFeed",   label: "Hide Home Feed / Recommendations", labelKey: "toggle_youtube_hide_home_feed",  type: "css", cssClass: "ft-hide-home-feed" },
      { key: "hideShorts",     label: "Hide Shorts button & shelf",      labelKey: "toggle_youtube_hide_shorts",      type: "css", cssClass: "ft-hide-shorts" },
      { key: "blockShorts",    label: "Block Shorts pages",              labelKey: "toggle_youtube_block_shorts",      type: "block-url", urlPattern: "||youtube.com/shorts" },
      { key: "hideComments",   label: "Hide Comments",                   labelKey: "toggle_youtube_hide_comments",     type: "css", cssClass: "ft-hide-comments" },
      { key: "hideSidebar",    label: "Hide Sidebar Suggestions",        labelKey: "toggle_youtube_hide_sidebar",      type: "css", cssClass: "ft-hide-sidebar" },
      { key: "hideEndCards",   label: "Hide End Screen Cards",           labelKey: "toggle_youtube_hide_end_cards",    type: "css", cssClass: "ft-hide-end-cards" },
      { key: "removeColors",   label: "Remove Colors (grayscale)",       labelKey: "toggle_remove_colors",             type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "instagram.com": {
    label: "Instagram",
    labelKey: "site_instagram",
    matches: ["instagram.com"],
    toggles: [
      { key: "hideFeed",     label: "Hide Feed",                  labelKey: "toggle_instagram_hide_feed",     type: "css", cssClass: "ft-hide-feed" },
      { key: "hideReels",    label: "Hide Reels link",             labelKey: "toggle_instagram_hide_reels",    type: "css", cssClass: "ft-hide-reels" },
      { key: "hideExplore",  label: "Hide Explore link",          labelKey: "toggle_instagram_hide_explore",  type: "css", cssClass: "ft-hide-explore" },
      { key: "hideStories",  label: "Hide Stories",               labelKey: "toggle_instagram_hide_stories",  type: "css", cssClass: "ft-hide-stories" },
      { key: "blockReels",   label: "Block Reels pages",          labelKey: "toggle_instagram_block_reels",   type: "block-url", urlPattern: "||instagram.com/reels" },
      { key: "removeColors", label: "Remove Colors (grayscale)",  labelKey: "toggle_remove_colors",           type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "x.com": {
    label: "X / Twitter",
    labelKey: "site_x_twitter",
    matches: ["x.com", "twitter.com"],
    toggles: [
      { key: "hideFeed",        label: "Hide Feed / Timeline",          labelKey: "toggle_x_hide_feed",           type: "css", cssClass: "ft-hide-feed" },
      { key: "hideTrending",    label: "Hide Trending / Explore",       labelKey: "toggle_x_hide_trending",       type: "css", cssClass: "ft-hide-trending" },
      { key: "hideWhoToFollow", label: "Hide Who to Follow",            labelKey: "toggle_x_hide_who_to_follow",  type: "css", cssClass: "ft-hide-who-to-follow" },
      { key: "blockExplore",    label: "Block Explore page",            labelKey: "toggle_x_block_explore",       type: "block-url", urlPattern: "||x.com/explore" },
      { key: "removeColors",    label: "Remove Colors (grayscale)",     labelKey: "toggle_remove_colors",         type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "reddit.com": {
    label: "Reddit",
    labelKey: "site_reddit",
    matches: ["reddit.com"],
    toggles: [
      { key: "hideFeed",     label: "Hide Feed",                 labelKey: "toggle_reddit_hide_feed",     type: "css", cssClass: "ft-hide-feed" },
      { key: "hidePopular",  label: "Hide Popular / All links",  labelKey: "toggle_reddit_hide_popular",  type: "css", cssClass: "ft-hide-popular" },
      { key: "hideAwards",   label: "Hide Awards",               labelKey: "toggle_reddit_hide_awards",   type: "css", cssClass: "ft-hide-awards" },
      { key: "removeColors", label: "Remove Colors (grayscale)", labelKey: "toggle_remove_colors",        type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "linkedin.com": {
    label: "LinkedIn",
    labelKey: "site_linkedin",
    matches: ["linkedin.com"],
    toggles: [
      { key: "redirectHome",       label: "Redirect Feed to My Network", labelKey: "toggle_linkedin_redirect_feed",       type: "redirect-url", urlPattern: "||linkedin.com/feed", redirectUrl: "https://www.linkedin.com/mynetwork/" },
      { key: "blockFeed",         label: "Block Feed page entirely",    labelKey: "toggle_linkedin_block_feed",           type: "block-url", urlPattern: "||linkedin.com/feed" },
      { key: "blockGames",        label: "Block Games / Puzzles",       labelKey: "toggle_linkedin_block_games",          type: "block-url", urlPattern: "||linkedin.com/games" },
      { key: "hideHome",          label: "Hide Home button",            labelKey: "toggle_linkedin_hide_home",            type: "css", cssClass: "ft-hide-home" },
      { key: "hideNews",          label: "Hide News Sidebar",           labelKey: "toggle_linkedin_hide_news",            type: "css", cssClass: "ft-hide-news" },
      { key: "hideNotifications", label: "Hide Notifications Badge",    labelKey: "toggle_linkedin_hide_notifications",   type: "css", cssClass: "ft-hide-notifications" },
      { key: "removeColors",      label: "Remove Colors (grayscale)",   labelKey: "toggle_remove_colors",                 type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "tiktok.com": {
    label: "TikTok",
    labelKey: "site_tiktok",
    matches: ["tiktok.com"],
    toggles: [
      { key: "removeColors", label: "Remove Colors (grayscale)", labelKey: "toggle_remove_colors", type: "css", cssClass: "ft-remove-colors" }
    ]
  }
};

// Default site modes
const DEFAULT_SITE_MODES = {};
for (const siteKey of Object.keys(SITE_CONFIG)) {
  DEFAULT_SITE_MODES[siteKey] = "allow";
}

// Build default toggles (all false)
const DEFAULT_SITE_TOGGLES = {};
for (const [siteKey, config] of Object.entries(SITE_CONFIG)) {
  DEFAULT_SITE_TOGGLES[siteKey] = {};
  for (const toggle of config.toggles) {
    DEFAULT_SITE_TOGGLES[siteKey][toggle.key] = false;
  }
}

// Match a hostname (e.g. "www.facebook.com") to a site config key
function getSiteConfigForHostname(hostname) {
  const clean = hostname.replace(/^www\./, "");
  for (const [siteKey, config] of Object.entries(SITE_CONFIG)) {
    if (config.matches.includes(clean)) {
      return { siteKey, ...config };
    }
  }
  return null;
}

// --- Shared constants ---

const DEFAULT_COUNTDOWN_SECONDS = 5;

const BLOCKLIST_CATEGORIES = {
  porn:     { label: "Porn",      labelKey: "blocklist_cat_porn",     description: "Adult content websites",      descriptionKey: "blocklist_cat_porn_desc",     url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts" },
  gambling: { label: "Gambling",  labelKey: "blocklist_cat_gambling", description: "Gambling and betting sites",  descriptionKey: "blocklist_cat_gambling_desc", url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling-only/hosts" },
  fakenews: { label: "Fake News", labelKey: "blocklist_cat_fakenews", description: "Misinformation sources",      descriptionKey: "blocklist_cat_fakenews_desc", url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-only/hosts" }
};

const DEFAULT_BLOCKLIST_CATEGORIES = {};
for (const catKey of Object.keys(BLOCKLIST_CATEGORIES)) {
  DEFAULT_BLOCKLIST_CATEGORIES[catKey] = { enabled: false, lastUpdated: null, domainCount: 0 };
}

// --- Safe Search engines ---
// Each entry compiles to one declarativeNetRequest session rule (IDs 100-199).
// All use query-param injection: forcesafesearch.google.com and strict.bing.com
// reject direct HTTP requests (they require Host: www.google.com / Host: www.bing.com
// via DNS CNAME), so url-level redirects to them 404. Param injection is what
// actually works in a browser extension context.
// Chrome DNR no-ops the redirect when the post-transform URL equals the original,
// so a request that already carries the param does not loop.
// Match shape: either `requestDomains` (exact host list) or `regexFilter` (covers
// all TLDs in one rule — used for Google).
const SAFE_SEARCH_ENGINES = [
  {
    id: 100,
    regexFilter: "^https?://(?:www|images)\\.google\\.[a-z]{2,}(?:\\.[a-z]{2})?/",
    param: { key: "safe", value: "active" }
  },
  {
    id: 110,
    // Bing opens image/video tabs via target=_blank. Chrome's DNR redirect strands new popup
    // tabs at about:blank, so we can't safely inject adlt= into those URLs. Instead: param-inject
    // on /search only, and BLOCK image/video search outright (redirects to blocked.html, which
    // works on popups because it's an extension-page redirect). Users can use Google image search
    // when SafeSearch is on; it's verified to filter properly.
    regexFilter: "^https?://(?:www\\.)?bing\\.com/search\\?",
    param: { key: "adlt", value: "strict" },
    blockUrls: [
      { id: 111, urlFilter: "||bing.com/images/search" },
      { id: 112, urlFilter: "||bing.com/videos/search" }
    ]
  },
  {
    id: 120,
    // DuckDuckGo uses ?iar=images on the same URL for image search, so kp=1 covers it.
    requestDomains: ["duckduckgo.com", "www.duckduckgo.com"],
    param: { key: "kp", value: "1" }
  },
  {
    id: 130,
    requestDomains: ["search.yahoo.com"],
    param: { key: "vm", value: "r" },
    blockUrls: [
      { id: 131, urlFilter: "||images.search.yahoo.com/" },
      { id: 132, urlFilter: "||video.search.yahoo.com/" }
    ]
  },
  {
    id: 140,
    requestDomains: ["yandex.com", "www.yandex.com", "yandex.ru", "www.yandex.ru"],
    param: { key: "family", value: "yes" },
    blockUrls: [
      { id: 141, urlFilter: "||yandex.com/images" },
      { id: 142, urlFilter: "||yandex.ru/images" },
      { id: 143, urlFilter: "||yandex.com/video" },
      { id: 144, urlFilter: "||yandex.ru/video" }
    ]
  },
  {
    id: 150,
    // Same-tab nav for image/video tabs (verified) — param injection on requestDomains
    // covers /images and /videos paths inline. No block rules needed.
    requestDomains: ["search.brave.com"],
    param: { key: "safesearch", value: "strict" }
  },
  {
    id: 160,
    requestDomains: ["ecosia.org", "www.ecosia.org"],
    param: { key: "safesearch", value: "strict" }
  },
  {
    id: 170,
    requestDomains: ["startpage.com", "www.startpage.com"],
    param: { key: "qadf", value: "heavy" }
  }
];

const YOUTUBE_RESTRICTED_RULE_ID = 200;
const YOUTUBE_RESTRICTED_DOMAINS = [
  "youtube.com", "www.youtube.com", "m.youtube.com",
  "youtu.be", "www.youtu.be",
  "youtube-nocookie.com", "www.youtube-nocookie.com"
];

// Per-site CSS. Injected at runtime by content.js via a <style> element only
// when `enabled !== false`. NOT declared as static content_scripts CSS in
// manifest.json so that popup-disable truly puts zero stylesheets in the page
// (matches chrome://extensions disable behavior). Edit these strings to change
// site styling — the css/*.css files in the repo are kept for reference only.
const SITE_CSS = {
  "facebook.com": `
html.ft-hide-messenger a[href*="messenger.com"],
html.ft-hide-messenger a[aria-label="Messenger"],
html.ft-hide-messenger a[href="/messages/"] {
  display: none !important;
}
html.ft-hide-chat div[aria-label="Chats"],
html.ft-hide-chat div[aria-label="Chat"],
html.ft-hide-chat div[aria-label*="Messenger"] {
  display: none !important;
}
html.ft-hide-marketplace a[href="/marketplace/"],
html.ft-hide-marketplace a[href*="/marketplace"],
html.ft-hide-marketplace a[aria-label="Marketplace"] {
  display: none !important;
}
html.ft-hide-reels a[href="/reel/"],
html.ft-hide-reels a[href*="/reel"],
html.ft-hide-reels a[aria-label="Reels"],
html.ft-hide-reels a[href*="reel"][role="link"],
html.ft-hide-reels div[aria-label="Reels"],
html.ft-hide-reels a[href="/watch/reels/"],
html.ft-hide-reels a[href="/watch/"],
html.ft-hide-reels a[href*="/watch"],
html.ft-hide-reels a[aria-label="Watch"],
html.ft-hide-reels a[aria-label="Video"] {
  display: none !important;
}
html.ft-hide-gaming a[href="/gaming/"],
html.ft-hide-gaming a[href*="/gaming"],
html.ft-hide-gaming a[aria-label="Gaming"],
html.ft-hide-gaming a[aria-label="Gaming video"] {
  display: none !important;
}
html.ft-hide-likes-comments span[aria-label*="Like"],
html.ft-hide-likes-comments span[aria-label*="like"],
html.ft-hide-likes-comments span[aria-label*="reaction"],
html.ft-hide-likes-comments span[aria-label*="Reaction"],
html.ft-hide-likes-comments div[aria-label*="reactions"],
html.ft-hide-likes-comments div[aria-label*="Reactions"],
html.ft-hide-likes-comments span[aria-label*="others"],
html.ft-hide-likes-comments div[aria-label*="Leave a comment"],
html.ft-hide-likes-comments div[aria-label*="Write a comment"],
html.ft-hide-likes-comments div[aria-label*="Comment"],
html.ft-hide-likes-comments form[aria-label*="Comment"],
html.ft-hide-likes-comments ul[aria-label*="Comment"],
html.ft-hide-likes-comments div[aria-label*="Like"][role="button"],
html.ft-hide-likes-comments div[aria-label*="Comment"][role="button"],
html.ft-hide-likes-comments div[aria-label*="Share"][role="button"] {
  display: none !important;
}
html.ft-remove-colors {
  filter: grayscale(100%) !important;
}
`,
  "youtube.com": `
html.ft-hide-home-feed ytd-rich-grid-renderer,
html.ft-hide-home-feed ytd-two-column-browse-results-renderer,
html.ft-hide-home-feed ytd-shelf-renderer,
html.ft-hide-home-feed ytd-rich-section-renderer,
html.ft-hide-home-feed ytd-browse[page-subtype="home"] #contents {
  display: none !important;
}
html.ft-hide-shorts ytd-reel-shelf-renderer,
html.ft-hide-shorts ytd-rich-section-renderer[is-shorts],
html.ft-hide-shorts a[title="Shorts"],
html.ft-hide-shorts a[href="/shorts"],
html.ft-hide-shorts ytd-mini-guide-entry-renderer a[title="Shorts"],
html.ft-hide-shorts ytd-guide-entry-renderer a[title="Shorts"],
html.ft-hide-shorts ytd-reel-item-renderer,
html.ft-hide-shorts ytd-video-renderer a[href*="/shorts/"],
html.ft-hide-shorts ytd-grid-video-renderer a[href*="/shorts/"] {
  display: none !important;
}
html.ft-hide-comments ytd-comments#comments,
html.ft-hide-comments #comments,
html.ft-hide-comments ytd-item-section-renderer#sections,
html.ft-hide-comments ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"] {
  display: none !important;
}
html.ft-hide-sidebar #related,
html.ft-hide-sidebar #secondary,
html.ft-hide-sidebar #secondary-inner,
html.ft-hide-sidebar ytd-watch-next-secondary-results-renderer,
html.ft-hide-sidebar ytd-compact-video-renderer,
html.ft-hide-sidebar ytd-compact-playlist-renderer {
  display: none !important;
}
html.ft-hide-end-cards .ytp-endscreen-content,
html.ft-hide-end-cards .ytp-ce-element,
html.ft-hide-end-cards .ytp-ce-covering-overlay,
html.ft-hide-end-cards .ytp-ce-element-shadow {
  display: none !important;
}
html.ft-remove-colors {
  filter: grayscale(100%) !important;
}
`,
  "instagram.com": `
html.ft-hide-feed main[role="main"] article,
html.ft-hide-feed div[role="feed"],
html.ft-hide-feed main[role="main"] > div > div > div:has(article) {
  display: none !important;
}
html.ft-hide-reels a[href="/reels/"],
html.ft-hide-reels a[href*="/reels"],
html.ft-hide-reels a[aria-label*="Reels"],
html.ft-hide-reels div[aria-label*="Reels"],
html.ft-hide-reels svg[aria-label*="Reels"] {
  display: none !important;
}
html.ft-hide-explore a[href="/explore/"],
html.ft-hide-explore a[href*="/explore"],
html.ft-hide-explore a[aria-label*="Explore"],
html.ft-hide-explore svg[aria-label*="Explore"] {
  display: none !important;
}
html.ft-hide-stories div[aria-label="Stories"],
html.ft-hide-stories div[aria-label*="Stories"],
html.ft-hide-stories div[role="menu"][aria-label*="Stories"],
html.ft-hide-stories canvas[aria-label*="story" i],
html.ft-hide-stories div[role="presentation"]:has(canvas[aria-label*="story" i]) {
  display: none !important;
}
html.ft-remove-colors {
  filter: grayscale(100%) !important;
}
`,
  "x.com": `
html.ft-hide-feed div[data-testid="primaryColumn"] section[role="region"],
html.ft-hide-feed div[aria-label="Timeline: Your Home Timeline"],
html.ft-hide-feed div[aria-label*="Timeline"]:not([aria-label*="Trending"]),
html.ft-hide-feed div[data-testid="cellInnerDiv"] {
  display: none !important;
}
html.ft-hide-trending div[aria-label="Trending"],
html.ft-hide-trending div[aria-label*="trending"],
html.ft-hide-trending a[href="/explore"],
html.ft-hide-trending a[href*="/explore"],
html.ft-hide-trending a[data-testid="AppTabBar_Explore_Link"],
html.ft-hide-trending section[aria-labelledby*="accessible-list"],
html.ft-hide-trending div[data-testid="sidebarColumn"] section[role="region"] {
  display: none !important;
}
html.ft-hide-who-to-follow aside[aria-label="Who to follow"],
html.ft-hide-who-to-follow div[aria-label="Who to follow"],
html.ft-hide-who-to-follow aside[aria-label*="Who to follow"],
html.ft-hide-who-to-follow div[data-testid="UserCell"] {
  display: none !important;
}
html.ft-remove-colors {
  filter: grayscale(100%) !important;
}
`,
  "reddit.com": `
html.ft-hide-feed shreddit-post,
html.ft-hide-feed article[data-testid="post-container"],
html.ft-hide-feed div[data-testid="post-container"],
html.ft-hide-feed shreddit-feed,
html.ft-hide-feed faceplate-batch:has(shreddit-post),
html.ft-hide-feed main article {
  display: none !important;
}
html.ft-hide-popular a[href*="/r/popular"],
html.ft-hide-popular a[href*="/r/all"],
html.ft-hide-popular a[href="/r/popular/"],
html.ft-hide-popular a[href="/r/all/"],
html.ft-hide-popular a[href="/popular/"],
html.ft-hide-popular a[href="/popular"],
html.ft-hide-popular faceplate-tracker a[href*="/popular"],
html.ft-hide-popular faceplate-tracker a[href*="/all"],
html.ft-hide-popular nav a[href*="popular"],
html.ft-hide-popular nav a[href*="/all"],
html.ft-hide-popular li:has(> a[href*="/r/popular"]),
html.ft-hide-popular li:has(> a[href*="/r/all"]),
html.ft-hide-popular faceplate-tracker:has(a[href*="/popular"]),
html.ft-hide-popular faceplate-tracker:has(a[href*="/all"]) {
  display: none !important;
}
html.ft-hide-awards [data-testid="award-button"],
html.ft-hide-awards .awardings-bar,
html.ft-hide-awards shreddit-post-award-button,
html.ft-hide-awards button[aria-label*="award" i],
html.ft-hide-awards button[aria-label*="Award"] {
  display: none !important;
}
html.ft-remove-colors {
  filter: grayscale(100%) !important;
}
`,
  "linkedin.com": `
html.ft-hide-home a[href*="/feed"],
html.ft-hide-home a[data-link-to="feed"],
html.ft-hide-home li:has(a[href*="/feed"]),
html.ft-hide-home span:has(> a[href*="/feed"]),
html.ft-hide-home nav a[href*="/feed"],
html.ft-hide-home header a[href*="/feed"] {
  display: none !important;
}
html.ft-hide-home li.global-nav__primary-item:has(a[href*="/feed"]) {
  width: 0 !important;
  overflow: hidden !important;
  padding: 0 !important;
  margin: 0 !important;
}
html.ft-hide-news aside[aria-label*="News"],
html.ft-hide-news aside[aria-label*="LinkedIn News"],
html.ft-hide-news .news-module,
html.ft-hide-news aside .ad-banner-container,
html.ft-hide-news div[data-view-name="news-module"] {
  display: none !important;
}
html.ft-hide-notifications .notification-badge,
html.ft-hide-notifications .notification-badge__count,
html.ft-hide-notifications span[class*="notification-badge"],
html.ft-hide-notifications .nav-item__badge-count {
  display: none !important;
}
html.ft-remove-colors {
  filter: grayscale(100%) !important;
}
`,
  "tiktok.com": `
html.ft-remove-colors {
  filter: grayscale(100%) !important;
}
`
};

// --- Shared utilities ---

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function mergeTogglesWithDefaults(siteKey, storedToggles) {
  return { ...(DEFAULT_SITE_TOGGLES[siteKey] || {}), ...(storedToggles || {}) };
}

async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    console.error("hashPassword failed:", err);
    return "";
  }
}

async function tryUnlock(passwordInput, errorEl, storedHash, onSuccess) {
  const input = passwordInput.value;
  if (!input) return;
  const hash = await hashPassword(input);
  if (hash && hash === storedHash) {
    errorEl.style.display = "none";
    passwordInput.value = "";
    onSuccess();
  } else {
    errorEl.style.display = "";
  }
}
