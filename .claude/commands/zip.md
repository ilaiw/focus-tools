Build a production zip of the Focus Tools extension for Chrome Web Store upload.

Steps:
1. Read the current version from manifest.json
2. Delete any previous zip file matching `focus-tools-*.zip` in the project root
3. Create a new zip named `focus-tools-v{version}.zip` (e.g. `focus-tools-v2.0.0.zip`) containing only the extension files:
   - manifest.json
   - background.js
   - content.js
   - site-config.js
   - popup.html, popup.js
   - options.html, options.js
   - blocked.html
   - css/ folder
   - icons/ folder
4. Do NOT include: .git, .claude, screenshots, README.md, CONTRIBUTING.md, LICENSE, PRIVACY_POLICY.md, .gitignore, any .zip files
5. Print the final zip file name and its size
6. List the contents of the zip so the user can verify
