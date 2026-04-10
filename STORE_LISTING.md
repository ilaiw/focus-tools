# Chrome Web Store Listing — Focus Tools

Reference file for managing the Chrome Web Store listing.
Update this file when the extension changes, then copy the relevant sections
into the Chrome Web Store Developer Dashboard.

---

## Store Info

**Item ID:** ghihkfkjelphchgaceckeddnofkoonjh

**Extension name:** Focus Tools

**Category:** Productivity

**Privacy policy URL:** https://github.com/ilaiw/focus-tools/blob/main/PRIVACY_POLICY.md

---

## Description

I built Focus Tools for myself because I needed help staying focused — then figured, why not share it? Completely free, no ads, no tracking. Just a tool that does what it says.

Block distracting websites and take control of your social media experience. Focus Tools lets you block any website — manually, by keyword, or using community-maintained blocklists. For popular social media sites, you can selectively hide distracting elements like feeds, recommendations, shorts, and comments without fully blocking the site.

Key features:
- Block any website by URL, domain, or keyword
- Community blocklists for adult content, gambling, and misinformation (powered by StevenBlack/hosts)
- Filter mode: hide specific UI elements on social media — feeds, reels, comments, sidebars, and more (40+ toggles across 7 platforms)
- Three modes per site: Allow, Filter, or Block
- Grayscale mode to make sites less appealing
- Weekly schedule: automatically enable/disable blocking by day and time
- Anti-impulse countdown timer that delays disabling — with optional confirmation step and timer freeze when the popup closes
- Password lock to protect your settings and popup from being changed
- Block the extensions page to prevent quick-disabling the extension
- Custom redirect URL — send blocked sites to any page you choose
- Motivational quotes on the blocked page to keep you inspired
- Available in 8 languages: English, Spanish, French, Italian, Russian, Arabic, Hebrew, and auto-detect — with full RTL support
- All data stored locally — no accounts, no tracking, no data collection

Works on Chrome, Edge, and other Chromium-based browsers.

---

## Single Purpose Description

Blocks distracting websites, hides addictive UI elements on social media, and provides scheduled focus sessions to help users stay focused.

---

## Permission Justifications

**activeTab**
Used to detect the current tab's URL so the user can quickly block the current website or domain from the popup.

**alarms**
Powers the disable countdown timer — when the user requests to disable the extension, an alarm fires after the configured delay to prevent impulsive toggling.

**declarativeNetRequest**
Blocks websites that the user has added to their blocklist, keyword blocklist, or community blocklists by redirecting matching URLs to a local blocked page.

**storage**
Stores all user settings locally, including blocked sites, blocked keywords, per-site filter preferences, site modes, and countdown timer configuration.

**tabs**
Used to redirect the current tab to the blocked page when a site is blocked, and to detect when a user navigates to the browser extensions page (if that protection is enabled).

**Host permissions (all URLs)**
The extension needs broad host access because users can block any website of their choosing. Content scripts also inject CSS on supported social media sites to hide distracting UI elements.

**Remote code justification**
The extension does not execute remote code. The only external requests are fetching plaintext domain lists from StevenBlack/hosts on GitHub, which are parsed as data (domain strings) and used to populate blocking rules — no code is downloaded or executed.

---

## Data Use Certification

- The extension does not collect or transmit any user data
- All settings are stored locally via chrome.storage.local
- No analytics, telemetry, or tracking of any kind
- Certify compliance with Developer Program Policies: YES
