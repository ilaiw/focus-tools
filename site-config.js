// Focus Tools — Shared Site Configuration
// Loaded by: content.js, options.js (via <script>), background.js (via importScripts)

// Site modes: "allow" | "filter" | "block"
//  - allow:  site works normally, sub-toggles ignored (but selections preserved)
//  - filter: sub-toggles take effect (hide feed, grayscale, etc.)
//  - block:  site is fully blocked (redirected to blocked.html)

const SITE_CONFIG = {
  "facebook.com": {
    label: "Facebook",
    matches: ["facebook.com"],
    toggles: [
      { key: "hideMessenger",        label: "Hide Messenger link",        type: "css", cssClass: "ft-hide-messenger" },
      { key: "forceRedirectFriends", label: "Redirect to Friends feed",   type: "js" },
      { key: "hideLikesComments",    label: "Hide Likes and Comments",    type: "css", cssClass: "ft-hide-likes-comments" },
      { key: "hideChatSidebar",      label: "Hide Chat Sidebar",          type: "css", cssClass: "ft-hide-chat" },
      { key: "hideMarketplace",      label: "Hide Marketplace link",      type: "css", cssClass: "ft-hide-marketplace" },
      { key: "hideVideoReels",       label: "Hide Video & Reels links",   type: "css", cssClass: "ft-hide-reels" },
      { key: "blockReels",           label: "Block Reels pages",          type: "block-url", urlPattern: "||facebook.com/reel" },
      { key: "hideGaming",           label: "Hide Gaming link",           type: "css", cssClass: "ft-hide-gaming" },
      { key: "blockGaming",          label: "Block Gaming pages",         type: "block-url", urlPattern: "||facebook.com/gaming" },
      { key: "removeColors",         label: "Remove Colors (grayscale)",  type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "youtube.com": {
    label: "YouTube",
    matches: ["youtube.com"],
    toggles: [
      { key: "hideHomeFeed",   label: "Hide Home Feed / Recommendations", type: "css", cssClass: "ft-hide-home-feed" },
      { key: "hideShorts",     label: "Hide Shorts button & shelf",      type: "css", cssClass: "ft-hide-shorts" },
      { key: "blockShorts",    label: "Block Shorts pages",              type: "block-url", urlPattern: "||youtube.com/shorts" },
      { key: "hideComments",   label: "Hide Comments",                   type: "css", cssClass: "ft-hide-comments" },
      { key: "hideSidebar",    label: "Hide Sidebar Suggestions",        type: "css", cssClass: "ft-hide-sidebar" },
      { key: "hideEndCards",   label: "Hide End Screen Cards",           type: "css", cssClass: "ft-hide-end-cards" },
      { key: "removeColors",   label: "Remove Colors (grayscale)",       type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "instagram.com": {
    label: "Instagram",
    matches: ["instagram.com"],
    toggles: [
      { key: "hideFeed",     label: "Hide Feed",                  type: "css", cssClass: "ft-hide-feed" },
      { key: "hideReels",    label: "Hide Reels link",             type: "css", cssClass: "ft-hide-reels" },
      { key: "hideExplore",  label: "Hide Explore link",          type: "css", cssClass: "ft-hide-explore" },
      { key: "hideStories",  label: "Hide Stories",               type: "css", cssClass: "ft-hide-stories" },
      { key: "blockReels",   label: "Block Reels pages",          type: "block-url", urlPattern: "||instagram.com/reels" },
      { key: "removeColors", label: "Remove Colors (grayscale)",  type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "x.com": {
    label: "X / Twitter",
    matches: ["x.com", "twitter.com"],
    toggles: [
      { key: "hideFeed",        label: "Hide Feed / Timeline",          type: "css", cssClass: "ft-hide-feed" },
      { key: "hideTrending",    label: "Hide Trending / Explore",       type: "css", cssClass: "ft-hide-trending" },
      { key: "hideWhoToFollow", label: "Hide Who to Follow",            type: "css", cssClass: "ft-hide-who-to-follow" },
      { key: "blockExplore",    label: "Block Explore page",            type: "block-url", urlPattern: "||x.com/explore" },
      { key: "removeColors",    label: "Remove Colors (grayscale)",     type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "reddit.com": {
    label: "Reddit",
    matches: ["reddit.com"],
    toggles: [
      { key: "hideFeed",     label: "Hide Feed",                 type: "css", cssClass: "ft-hide-feed" },
      { key: "hidePopular",  label: "Hide Popular / All links",  type: "css", cssClass: "ft-hide-popular" },
      { key: "hideAwards",   label: "Hide Awards",               type: "css", cssClass: "ft-hide-awards" },
      { key: "removeColors", label: "Remove Colors (grayscale)", type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "linkedin.com": {
    label: "LinkedIn",
    matches: ["linkedin.com"],
    toggles: [
      { key: "redirectHome",       label: "Redirect Feed to My Network", type: "redirect-url", urlPattern: "||linkedin.com/feed", redirectUrl: "https://www.linkedin.com/mynetwork/" },
      { key: "blockFeed",         label: "Block Feed page entirely",    type: "block-url", urlPattern: "||linkedin.com/feed" },
      { key: "blockGames",        label: "Block Games / Puzzles",       type: "block-url", urlPattern: "||linkedin.com/games" },
      { key: "hideHome",          label: "Hide Home button",            type: "css", cssClass: "ft-hide-home" },
      { key: "hideNews",          label: "Hide News Sidebar",           type: "css", cssClass: "ft-hide-news" },
      { key: "hideNotifications", label: "Hide Notifications Badge",    type: "css", cssClass: "ft-hide-notifications" },
      { key: "removeColors",      label: "Remove Colors (grayscale)",   type: "css", cssClass: "ft-remove-colors" }
    ]
  },
  "tiktok.com": {
    label: "TikTok",
    matches: ["tiktok.com"],
    toggles: [
      { key: "removeColors", label: "Remove Colors (grayscale)", type: "css", cssClass: "ft-remove-colors" }
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
