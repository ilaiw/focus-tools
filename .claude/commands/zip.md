Build a production zip of the Focus Tools extension for Chrome Web Store upload.

Steps:
1. Read the current version from manifest.json
2. Delete any previous zip file matching `focus-tools-*.zip` in the project root
3. Create a new zip named `focus-tools-v{version}.zip` containing only the extension files:
   - manifest.json
   - background.js
   - content.js
   - site-config.js
   - i18n.js
   - quotes.js
   - popup.html, popup.js
   - options.html, options.js
   - blocked.html, blocked.js
   - css/ folder
   - icons/ folder
   - _locales/ folder (required by `default_locale` in manifest.json)
4. Do NOT include: .git, .claude, screenshots, README.md, CONTRIBUTING.md, LICENSE, PRIVACY_POLICY.md, STORE_LISTING.md, .gitignore, any .zip files
   Note: On Windows, the `zip` command may not be available — use PowerShell's `Compress-Archive` instead.
5. Print the final zip file name and its size
6. List the contents of the zip so the user can verify.
   Note: PowerShell's `Compress-Archive` has no list flag; use `[System.IO.Compression.ZipFile]::OpenRead($zipPath).Entries` (requires `Add-Type -AssemblyName System.IO.Compression.FileSystem`) and dispose the handle when done.
7. Print Chrome Web Store submission guidance for the review dialog:
   - Skip-review checkbox ("update only contains changes to safe static rules for declarativeNetRequest"): tell the user to LEAVE IT UNCHECKED. That option only applies to static rulesets declared under `declarative_net_request.rule_resources` in manifest.json — Focus Tools has none; all its rules are dynamic/session rules built at runtime in background.js, so every update contains code changes and can never qualify. Falsely checking it gets the update rejected or flagged. (Only re-evaluate this if manifest.json ever gains a `declarative_net_request.rule_resources` section AND the diff since the last store release touches nothing but those static rule JSON files.)
   - Auto-publish checkbox: fine to enable unless the user wants to stage the release.
   - Review time: `<all_urls>` host permission + `tabs` puts the extension in the full-review lane (up to several weeks, typically days); this is inherent to a blocker and cannot be narrowed away.
