<div align="center">

# 💳 AI Credit Monitor

### A dynamic AI provider credit monitor for iOS using Scriptable

Monitor your remaining prepaid AI credits directly from your iPhone or iPad.

<br>

![iOS](https://img.shields.io/badge/iOS-Scriptable-0A84FF?style=for-the-badge&logo=apple&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![GitHub](https://img.shields.io/badge/Provider_Catalog-GitHub-181717?style=for-the-badge&logo=github)
![Security](https://img.shields.io/badge/API_Keys-Keychain-30D158?style=for-the-badge&logo=apple&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-EN%20%2F%20NL-4A90D9?style=for-the-badge)

<br>

**Dynamic providers • Secure API keys • GitHub catalog • iOS widget • Balance trends • Shortcuts • Multi-language**

</div>

---

## 📱 About

**AI Credit Monitor** is a Scriptable application for iOS and iPadOS that displays the remaining prepaid balance of AI API providers.

Instead of hardcoding providers into the application, AI Credit Monitor uses a **dynamic provider catalog** stored in a `providers.json` file.

Providers can be added, installed, updated, or removed without modifying the main application code.

```text
AI Credit Monitor
        │
        ├── 📚 providers.json
        │       │
        │       ├── OpenRouter
        │       ├── DeepSeek
        │       └── Future providers...
        │
        ├── 🔐 iOS Keychain
        │       └── API keys
        │
        ├── 📊 Balance history
        │       └── Last 30 readings per provider
        │
        └── 💰 Balance APIs
                └── Remaining credits
```

---

## ✨ Features

### Core

- **Dynamic provider catalog** — add providers via GitHub without touching the script
- **Secure storage** — GitHub token and API keys stored in iOS Keychain
- **No code execution** — only JSON manifests are downloaded, never JavaScript
- **GitHub integration** — add providers to the catalog directly from your device
- **iOS Home Screen widget** — small, medium, and large widget sizes with tap-to-open
- **Apple Shortcuts** — headless balance queries from Shortcuts app (balances, total, provider, refresh)
- **Multi-language** — English (default) and Dutch (Nederlands), switchable in Setup

### Monitoring

- **Parallel fetching** — all provider balances fetched simultaneously
- **Balance history** — stores last 30 readings per provider with trend indicators (↑↓→)
- **Configurable alerts** — per-provider or global low-balance thresholds with push notifications
- **Smart caching** — configurable cooldown prevents API rate limiting
- **Three response modes** — single value, total-minus-used, or multi-currency array

### Management

- **Provider wizard** — guided setup for API endpoint, authentication, and response parsing
- **Version tracking** — update providers from the catalog with changelog display
- **Export/backup** — copy config summary to clipboard for device migration
- **Configurable refresh** — set widget refresh interval from 5 to 120 minutes
- **About page** — app info, version, feature list, and credits

### Setup & Onboarding

- **First-run gate** — prompts for GitHub repo setup before first use
- **Paste GitHub URL** — paste `owner/repo`, `github.com/owner/repo`, or full URL; auto-parses
- **Default repo warning** — one-time alert if using the shared demo catalog (recommends own repo)

---

## 🚀 Setup

1. Install the [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) app
2. Copy `script.js` into Scriptable
3. Run the script → **Setup** → configure your GitHub repository
4. Install providers from the catalog
5. Add your API keys when prompted
6. Add a home screen widget (small / medium / large)

> **Tip:** Use your own GitHub repo with a `providers.json` file. The app will guide you through setup on first run.

### GitHub Setup

The catalog (`providers.json`) lives in your GitHub repository. You need:

- A GitHub personal access token (fine-grained) with **Contents: Read and write**
- The repository URL configured in the Setup page

The app accepts multiple URL formats:
- `owner/repo`
- `github.com/owner/repo`
- `https://github.com/owner/repo`

The app will automatically build the Raw GitHub URL from your repository settings.

---

## 🌐 Language

Switch between English and Dutch in **Setup → 🌐 Language**.

English is the default. Dutch translations cover all UI strings. Missing translations fall back to English automatically.

---

## 📦 Provider Format

Each provider in `providers.json` follows this structure:

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "version": "1.0.0",
  "description": "AI model router",
  "auth": {
    "type": "bearer",
    "keyLabel": "OpenRouter API Key",
    "header": "Authorization",
    "prefix": "Bearer "
  },
  "request": {
    "method": "GET",
    "url": "https://openrouter.ai/api/v1/credits"
  },
  "response": {
    "mode": "difference",
    "totalPath": "data.total_credits",
    "usedPath": "data.total_usage",
    "currency": "USD",
    "label": "Remaining credits",
    "errorPath": "error.message"
  },
  "alerts": {
    "redThreshold": 1,
    "orangeThreshold": 5
  }
}
```

### Auth types

| Type | Description |
|------|-------------|
| `bearer` | Standard `Authorization: Bearer ***` header |
| `header` | Custom header name with optional prefix |
| `none` | No authentication required |

### Response modes

| Mode | Fields | Description |
|------|--------|-------------|
| `single` | `amountPath`, `currency` | Read balance from a single JSON path |
| `difference` | `totalPath`, `usedPath`, `currency` | Calculate remaining as total minus used |
| `array` | `arrayPath`, `amountField`, `currencyField`, `preferredCurrency` | Multi-currency array, pick preferred |

---

## 🎨 Widget

The widget supports three sizes:

- **Small** — total balance count and first provider
- **Medium** — all providers with amounts and trend arrows
- **Large** — all providers with amounts, trends, and last update time

Tap the widget to open the Scriptable app directly.

Widget colors:
- 🟢 Green — healthy balance
- 🟠 Orange — getting low
- 🔴 Red — critically low
- ⚪ Grey — unknown or no data

---

## ⚡ Apple Shortcuts

AI Credit Monitor can be triggered from **Apple Shortcuts** using the "Run Script" action in Scriptable.

### Setup

1. Open the **Shortcuts** app
2. Tap **+** to create a new shortcut
3. Add the **Scriptable > Run Script** action
4. Select **AI Credit Monitor** as the script
5. Set the **Text** input parameter (see actions below)
6. Add a **Show Result** action to display the output

### Actions

| Parameter | Description | Output |
|-----------|-------------|--------|
| `balances` or *(empty)* | Fetch all provider balances | Formatted list: `Provider: $amount` |
| `total` | Sum of all remaining credits | Single total amount |
| `provider:NAME` | Single provider balance (by ID or name) | `Provider: $amount` |
| `refresh` | Force-refresh all balances and update widget | Confirmation message |

### Examples

- **"Check all balances" shortcut** → parameter: `balances`
- **"Total credits remaining" shortcut** → parameter: `total`
- **"OpenRouter balance" shortcut** → parameter: `provider:openrouter`
- **"Refresh widget" shortcut** → parameter: `refresh`

### Tips

- The script runs headlessly when called from Shortcuts (no UI)
- All API keys remain in Keychain — nothing is exposed to the Shortcut
- Balance results use the app's configured language
- The `refresh` action also calls `Script.setWidget()` to update the home screen widget

---

## 🔒 Security

- All API keys stored in **iOS Keychain** (never in files)
- GitHub token stored in **iOS Keychain**
- Only JSON manifests fetched from GitHub (no executable code)
- API keys are **never** sent to any third-party server
- Error messages automatically strip leaked credentials
- Configurable request cooldown prevents accidental API flooding

---

## 📁 Local Storage

All data is stored inside Scriptable's sandbox:

```
AICreditMonitor/
  ├── config.json         — App settings (GitHub repo, thresholds, refresh, language)
  ├── installed.json      — List of installed provider manifests
  ├── balances-cache.json — Cached balance results with timestamps
  └── balances-history.json — Last 30 balance readings per provider
```

---

## 📋 Changelog

### v0.5.0
- **Apple Shortcuts integration** — trigger from Shortcuts app via "Run Script" action
- Actions: `balances`, `total`, `provider:NAME`, `refresh`
- Returns formatted text output via `Script.setShortcutOutput()`

### v0.4.1
- Added **About page** (ℹ️ main menu) — app info, version, features, credits
- Fixed `Alert.alert()` → `new Alert()` for Scriptable compatibility
- Fixed temporal dead zone: removed `t()` calls from `TRANSLATIONS_NL` (107 replaced)

### v0.4.0
- **i18n system** — English (default) + Dutch translations (~288 strings)
- **Language selector** — Setup → 🌐 Language (English / Nederlands)
- **Paste GitHub URL** — accept full URL or owner/repo shorthand, auto-parses
- **First-run gate** — setup required before first use
- **Default repo warning** — one-time alert recommending own repo

### v0.3.0
- Parallel balance fetching (`Promise.all`)
- Thousands separators in `formatMoney`
- Configurable balance color thresholds (per-provider + global)
- Stronger API-key redaction in `cleanError`
- Per-provider fetch cooldown (`balances-cache.json`)
- Named alert action constants (`ACT`)
- Low-balance notifications (Scriptable Notification)
- Balance history + trend arrows (`balances-history.json`)
- Widget family support (small/medium/large) + deep link
- Refresh button on balance screen
- Provider catalog expanded to 20 providers

---

## Credits

- **Created by** [@jphermans](https://github.com/jphermans)
- **v0.4.0+** i18n refactor & features built with [Hermes AI Agent](https://hermes-agent.nousresearch.com)

---

## License

MIT
