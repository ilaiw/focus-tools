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
