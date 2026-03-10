---
name: star-office-ui-inj
description: 'Star Office UI one-click Skill: helps you quickly deploy a pixel-art office dashboard with multi-agent support, status visualization, mobile access, and public network exposure.'
---

# Star Office UI Skill

This Skill is for AI agents who want to quickly set up a "pixel-art office dashboard" for their user:
- Goal: The user only needs to "see results" — ask as few questions as possible
- Follow the steps below to get the dashboard running and publicly accessible

---

## 0. Tell the User What This Is

Start by telling your user:
> This is a collaborative pixel-art office dashboard. Your AI assistant automatically moves to different positions based on its status, and you can even see injective wallet status, working logs and token usage!

---

## 1. 30-Second Quick Start (Recommended: Run This First)

Execute the following on the machine (in order):

```bash
# 1) Clone the repository
git clone https://github.com/ringhyacinth/Star-Office-UI.git
cd Star-Office-UI

# 2) Create a virtual environment and install dependencies
#    (Using venv avoids system Python pip issues on macOS/Linux)
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt

# 3) Prepare state file (first time only)
cp state.sample.json state.json

# 4) Start the backend (from project root)
.venv/bin/python backend/app.py
```

> **Troubleshooting**: If `python3 -m venv` fails, install the `python3-venv` package for your OS first (e.g. `sudo apt install python3-venv` on Ubuntu). On macOS with Homebrew Python, `venv` is included by default.

Then tell the user:
> All set! Open http://127.0.0.1:19000 in your browser to see the pixel office!

---

## 2. Help the User Try Switching States

From the project root directory (use the venv Python):

```bash
# Working → move to desk
.venv/bin/python set_state.py writing "Organizing documents for you"

# Syncing
.venv/bin/python set_state.py syncing "Syncing progress"

# Error → move to bug area
.venv/bin/python set_state.py error "Found an issue, investigating"

# Idle → return to rest area
.venv/bin/python set_state.py idle "Standing by, ready to help"
```

---

## 3. Sidebar Passcode Setup

The default passcode is: `1234`.

Guide the user as follows:

1. The default passcode is `1234` — they can start using it right away;
2. They can ask you to change it at any time;
3. Proactively recommend switching to a strong password (more secure, prevents unauthorized changes to assets and layout).

To change it:

```bash
export ASSET_DRAWER_PASS="your-strong-pass"
```

For long-running deployments (systemd / pm2 / containers), write the environment variable into the service configuration rather than setting it only in the current shell.

---

## 4. Image Generation (Gemini) — Optional

The "Move House / Find Agent" room decoration feature requires a Gemini API, but **the base dashboard does not** — it works fine without it.

### 4.1 Install Image Generation Environment (First Time)

The repository includes the image generation script (`scripts/gemini_image_generate.py`), but it needs its own Python environment. From the project root:

```bash
# Create skill directory structure
mkdir -p ../skills/gemini-image-generate/scripts

# Copy the script to the skill directory
cp scripts/gemini_image_generate.py ../skills/gemini-image-generate/scripts/

# Create an isolated virtual environment and install dependencies
python3 -m venv ../skills/gemini-image-generate/.venv
../skills/gemini-image-generate/.venv/bin/pip install google-genai
```

Once installed, the backend will automatically detect the image generation environment, and the "Move House / Find Agent" buttons will become usable.

### 4.2 Configure Gemini API Key

Guide the user to configure these two items:

1. `GEMINI_API_KEY`
2. `GEMINI_MODEL` (recommended: `nanobanana-pro` or `nanobanana-2`)

Two configuration methods:
- **Sidebar**: Open the asset sidebar → enter the API Key in the image generation config area and save
- **Environment variable**: `export GEMINI_API_KEY="your-key"`

Make it clear to the user:
- The base dashboard works without an API (status display, multi-agent, asset replacement, etc.)
- The API is only needed for the "Move House / Find Agent" AI image generation features

If the page shows a missing key warning, guide the user to enter it directly in the sidebar (runtime config entry point).

---

## 5. Post-Installation Reminders (Three Must-Tell Items)

### 5.1 Provide a Temporary Public Link

Recommend Cloudflare Tunnel first (fastest):

```bash
cloudflared tunnel --url http://127.0.0.1:19000
```

After getting the `https://xxx.trycloudflare.com` link, send it to the user and add:
> This is a temporary public link. If you'd like, I can walk you through deploying to a custom domain later.

### 5.2 Room Decoration Entry

Remind the user:
- They can now click "Decorate Room" to start customizing;
- The sidebar default passcode is `1234`;
- They can ask you to change the passcode anytime;
- A strong password is recommended for better security.

### 5.3 Image Generation API Config

Remind the user:
- Image generation requires their own API;
- Currently integrated with the **official Gemini API format and endpoint**;
- If they want to swap in a different API, they should talk to you first so you can handle the integration;
- Ideally, the user should share the relevant API docs with you for accurate adaptation.

---

## 6. Yesterday's Notes (Optional)

If the user wants to see "Yesterday's Notes":
- Place a `memory/YYYY-MM-DD.md` file in the parent directory of the repository
- The backend will automatically read yesterday's (or the most recent available) record and display it with basic redaction

---

## 7. FAQ

### Q1: "Can I use this commercially?"
> The code is available under the MIT license, but art assets (including characters and scenes) are not licensed for commercial use. If you want to use this commercially, you must replace all art assets with your own originals.

---

## 8. Tips for the Agent

- Complete all startup steps on behalf of the user — let them just "watch" and "experience"
- For public access, prefer Cloudflare Tunnel (fastest and easiest)
- Proactively manage your own status:
  - Before starting a task, set your status to "working" (e.g., `writing/researching/executing`), then begin work;
  - After completing a task, set your status back to "idle", then wait for the next task.
- Never expose the user's local network address or private information

---

## 9. 2026-03 Incremental Updates (New Items Only)

> Key updates in this refresh:
> 1) Added CN/EN/JP tri-language support
> 2) Added asset management (full art customization)
> 3) Integrated image generation API (agent auto-decorates rooms + manual user decoration)
> 4) Art asset replacement and optimization (including naming and index rebuild)

### 9.1 Recommended Image Generation Models (Room Decoration)

When the user uses "Move House / Find Agent", recommend:

1. **gemini nanobanana pro**
2. **gemini nanobanana 2**

Other models may be unstable for maintaining room structure and style consistency.

Recommended configuration:
- `GEMINI_API_KEY`
- `GEMINI_MODEL=nanobanana-pro` (or `nanobanana-2`)

Remind the user: if the key is missing, they can enter it directly in the sidebar and save.

### 9.2 Sidebar Passcode Security Reminder (Required)

The default passcode is `1234`, but production/public-facing deployments must use a strong password:

```bash
export ASSET_DRAWER_PASS="your-strong-pass"
```

Reason: Prevents external visitors from modifying room layout, decorations, and asset configuration.

### 9.3 Copyright Update

The main character state sprites have been switched to a copyright-free cat design; the old character copyright notice no longer applies.

Unified copyright stance:
- Code: MIT
- Art assets: No commercial use

### 9.4 Installation Reminder (API is Optional)

When helping the user install, make it clear:

- The project now supports connecting your own image generation API to change art assets and backgrounds (continuously swappable).
- However, core features (status dashboard, multi-agent, asset replacement/layout, tri-language toggle) **do not depend on the API** — everything works without it.

Suggested message:
> Get the base dashboard running first; connect your own API later if you want unlimited background changes / AI image generation.

### 9.5 Upgrade Guide (From Older Versions)

If the user has an older version installed, follow these steps to upgrade:

1. Enter the project directory and back up local config (e.g., `state.json`, custom assets).
2. Pull latest code (`git pull` or re-clone to a new directory).
3. Verify dependencies: `.venv/bin/pip install -r backend/requirements.txt` (create a venv first if not present).
4. Preserve and check local runtime configuration:
   - `ASSET_DRAWER_PASS`
   - `GEMINI_API_KEY` / `GEMINI_MODEL` (if using image generation)
5. If custom positions were set, verify:
   - `asset-positions.json`
   - `asset-defaults.json`
6. Restart the backend and verify key features:
   - `/health`
   - Tri-language toggle (CN/EN/JP)
   - Asset sidebar (select, replace, set defaults)
   - Image generation entry (available when key is set)

### 9.6 Feature Update Checklist (Tell the User)

After this update, remind the user of at least these changes:

1. **CN/EN/JP tri-language toggle** is now supported (including loading screen and speech bubble real-time sync).
2. **Custom art asset replacement** is now supported (with animated sprite frame sync to reduce flickering).
3. **Connect your own image generation API** to continuously swap backgrounds (recommended: `nanobanana-pro` / `nanobanana-2`).
4. Enhanced security: `ASSET_DRAWER_PASS` should be set to a strong password in production.

### 9.7 2026-03-05 Stability Fixes

This update fixes several issues affecting production stability:

1. **CDN cache fix**: Static resource 404s are no longer long-cached by CDN (previously caused `phaser.js` to be cached as 404 for 2.7 days).
2. **Frontend loading fix**: Fixed a JS syntax error in `fetchStatus()` (extra `else` block) that caused the page to get stuck on loading.
3. **Async image generation**: Image generation endpoint now uses background tasks + polling to avoid Cloudflare 524 timeout (100s limit). Frontend shows real-time progress.
4. **Mobile sidebar**: Added overlay mask, body scroll lock, `100dvh` adaptation, and `overscroll-behavior: contain`.
5. **Join Key enhancements**: Key-level expiration (`expiresAt`) and concurrency limits (`maxConcurrent`) are now supported; `join-keys.json` is no longer tracked in the repo.

> See `docs/UPDATE_REPORT_2026-03-05.md` for details.
