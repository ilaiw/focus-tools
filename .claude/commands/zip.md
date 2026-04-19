Build a production zip of the Focus Tools extension for Chrome Web Store upload.

Steps:
1. Read the current version from manifest.json
2. Delete any previous zip file matching `focus-tools-*.zip` in the project root
3. Create a new zip named `focus-tools-v{version}.zip` (e.g. `focus-tools-v2.0.0.zip`) containing only the extension files:
   - manifest.json
   - background.js
   - content.js
   - site-config.js
   - i18n.js
   - quotes.js
   - popup.html, popup.js
   - options.html, options.js
   - blocked.html
   - css/ folder
   - icons/ folder
   - _locales/ folder (required by `default_locale` in manifest.json)
4. Do NOT include: .git, .claude, screenshots, README.md, CONTRIBUTING.md, LICENSE, PRIVACY_POLICY.md, STORE_LISTING.md, .gitignore, any .zip files
   Note: On Windows, the `zip` command may not be available — use PowerShell's `Compress-Archive` instead.
5. Print the final zip file name and its size
6. List the contents of the zip so the user can verify
