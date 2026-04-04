# Privacy Policy — Focus Tools

**Last updated:** April 2026

## Data Storage

All user settings and preferences are stored **locally on your device** using the browser's `chrome.storage.local` API. No data is stored on external servers.

## Data Collection

Focus Tools does **not** collect, transmit, or share any personal data. There is no analytics, telemetry, or tracking of any kind.

## Network Requests

The only external network requests the extension makes are to fetch publicly available blocklists from [StevenBlack/hosts](https://github.com/StevenBlack/hosts) on GitHub. These requests are only made when you explicitly enable a community blocklist. No user data is sent in these requests.

## Permissions

The extension requests the following browser permissions:

- **storage** — to save your settings locally
- **declarativeNetRequest** — to block URLs based on your blocklist
- **alarms** — for the disable countdown timer
- **activeTab / tabs** — to interact with the current tab (e.g. blocking the current site)
- **webNavigation** — to enforce blocking before pages load
- **Host permissions (all URLs)** — required because the extension supports blocking any user-specified website and injects content scripts into supported social media sites

## Contact

If you have questions about this privacy policy, please open an [issue](../../issues) on the GitHub repository.
