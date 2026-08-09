<div align="center">

# 💳 AI Credit Monitor

### A dynamic AI provider credit monitor for iOS using Scriptable

Monitor your remaining prepaid AI credits directly from your iPhone or iPad.

<br>

![iOS](https://img.shields.io/badge/iOS-Scriptable-0A84FF?style=for-the-badge&logo=apple&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![GitHub](https://img.shields.io/badge/Provider_Catalog-GitHub-181717?style=for-the-badge&logo=github)
![Security](https://img.shields.io/badge/API_Keys-Keychain-30D158?style=for-the-badge&logo=apple&logoColor=white)

<br>

**Dynamic providers • Secure API keys • GitHub catalog • iOS widget**

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
        └── 💰 Balance APIs
                └── Remaining credits