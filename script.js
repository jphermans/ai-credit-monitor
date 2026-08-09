// ============================================================
// AI Credit Monitor
// Version: 0.5.0
//
// Dynamic provider catalog for Scriptable
//
// Features:
// - Starts with zero providers
// - providers.json hosted on GitHub
// - Install only selected providers
// - Add providers from Scriptable to providers.json on GitHub
// - Immediately offer installation after adding to GitHub
// - Immediately request provider API key after installation
// - GitHub token stored in Keychain
// - Provider API keys stored in Keychain
// - JSON manifests only: no downloaded JavaScript execution
// - Optional future Discovery Backend
//
// v0.5.0 changes:
// - Apple Shortcuts integration (args.shortcutParameter)
// - Actions: balances, total, provider:NAME, refresh
//
// v0.4.1 changes:
// - About page (app info, version, features list)
// - Alert.alert() fix for Scriptable compatibility
//
// v0.4.0 changes:
// - i18n support: English (default) and Dutch
// - Simplified GitHub repo URL input (paste full URL)
//
// v0.3.0 changes:
// - Parallel balance fetching (Promise.all)
// - Thousands separators in formatMoney
// - readPath errors include the JSON path
// - Configurable balance color thresholds (provider + global)
// - Stronger API-key redaction in cleanError
// - Per-provider fetch cooldown (balances-cache.json)
// - Named alert action constants (ACT)
// - Low-balance notifications (Scriptable Notification)
// - Balance history + trend arrows (balances-history.json)
// - Widget family support (small/medium/large) + deep link
// - Refresh button on balance screen
// - Update changelog with field-level diff
// - Config export to clipboard
// - Configurable refresh interval
// - Stable GitHub API version 2022-11-28
// ============================================================


// ============================================================
// APP CONFIG
// ============================================================

const APP_NAME = "AI Credit Monitor"
const APP_VERSION = "0.5.0"

const fm = FileManager.local()

const ROOT_DIR = fm.joinPath(
  fm.documentsDirectory(),
  "AICreditMonitor"
)

const INSTALLED_FILE = fm.joinPath(
  ROOT_DIR,
  "installed.json"
)

const CONFIG_FILE = fm.joinPath(
  ROOT_DIR,
  "config.json"
)

const CACHE_FILE = fm.joinPath(
  ROOT_DIR,
  "balances-cache.json"
)

const HISTORY_FILE = fm.joinPath(
  ROOT_DIR,
  "balances-history.json"
)

const HISTORY_LIMIT = 30

// ============================================================
// TRANSLATIONS (English - default)
// ============================================================

const TRANSLATIONS = {
  "No providers installed yet.": "No providers installed yet.",
  "provider(s) installed.": "provider(s) installed.",
  "View credits": "\uD83D\uDCB0 View credits",
  "Install provider": "\u2795 Install provider",
  "Setup": "\u2699\uFE0F Setup",
  "Close": "Close",
  "OK": "OK",
  "Got it": "Got it",
  "Install from catalog": "Install from catalog",
  "Not configured": "Not configured",
  "Configured": "\u2705 Configured",
  "Provider Catalog URL": "\uD83D\uDCDA Provider Catalog URL",
  "GitHub repository": "\uD83D\uDD19 GitHub repository",
  "GitHub token": "\uD83D\uDD10 GitHub token",
  "Test GitHub connection": "\uD83E\uDDEA Test GitHub connection",
  "Check repository and providers.json": "Check repository and providers.json",
  "Add provider to catalog": "\u2795 Add provider to catalog",
  "Add provider to providers.json": "Add provider to providers.json",
  "Refresh interval": "\u23F1 Refresh interval",
  "minutes": "minutes",
  "Installed providers": "Installed providers",
  "API key missing": "\u26A0\uFE0F API key missing",
  "Discovery Backend": "\uD83E\uDD16 Discovery Backend",
  "Disabled": "Disabled",
  "Export config": "\uD83D\uDCCB Export config",
  "Copy configuration summary to clipboard": "Copy configuration summary to clipboard",
  "Language": "\uD83C\uDF10 Language",
  "English": "English",
  "Nederlands": "Nederlands",
  "Use the Raw GitHub URL to providers.json.": "Use the Raw GitHub URL to providers.json.",
  "Test & save": "Test & save",
  "Delete": "Delete",
  "Cancel": "Cancel",
  "Invalid URL": "Invalid URL",
  "Only HTTPS URLs are allowed.": "Only HTTPS URLs are allowed.",
  "Connection OK": "Connection OK",
  "provider(s) found.": "provider(s) found.",
  "Catalog error": "Catalog error",
  "Repository containing providers.json.": "Repository containing providers.json.",
  "Owner / username": "Owner / username",
  "Repository": "Repository",
  "Branch": "Branch",
  "Save": "Save",
  "Missing data": "Missing data",
  "Fill in all GitHub fields.": "Fill in all GitHub fields.",
  "Repository saved.": "Repository saved.",
  "The Raw Catalog URL was automatically adjusted.": "The Raw Catalog URL was automatically adjusted.",
  "Paste GitHub URL": "\uD83D\uDCCB Paste GitHub URL",
  "Enter a GitHub URL (e.g. https://github.com/owner/repo) or owner/repo": "Enter a GitHub URL (e.g. https://github.com/owner/repo) or owner/repo",
  "Could not parse GitHub URL.": "Could not parse GitHub URL.",
  "Enter at least owner and repository.": "Enter at least owner and repository.",
  "Parse & continue": "Parse & continue",
  "Interval in minutes for widget refresh (5 - 1440).\n\nCurrent: ": "Interval in minutes for widget refresh (5 - 1440).\n\nCurrent: ",
  "Minutes": "Minutes",
  "Enter a number between 5 and 1440 minutes.": "Enter a number between 5 and 1440 minutes.",
  "Refresh interval set to": "Refresh interval set to",
  "A token is set. The token is never displayed.": "A token is set. The token is never displayed.",
  "Use a fine-grained token with Contents: Read and write.": "Use a fine-grained token with Contents: Read and write.",
  "Change token": "\uD83D\uDD04 Change token",
  "Add token": "\u2795 Add token",
  "Remove token": "\uD83D\uDDD1 Remove token",
  "The token is stored exclusively in Scriptable Keychain.": "The token is stored exclusively in Scriptable Keychain.",
  "No token entered.": "No token entered.",
  "Token saved securely.": "Token saved securely.",
  "GitHub token deleted.": "GitHub token deleted.",
  "GitHub token not set.": "GitHub token not set.",
  "GitHub connection OK": "GitHub connection OK",
  "File": "File",
  "GitHub error": "GitHub error",
  "GitHub token missing.": "GitHub token missing.",
  "GitHub response does not contain a file or SHA.": "GitHub response does not contain a file or SHA.",
  "providers.json could not be read from Base64.": "providers.json could not be read from Base64.",
  "New provider": "New provider",
  "General provider information.": "General provider information.",
  "ID, e.g. openrouter": "ID, e.g. openrouter",
  "Name, e.g. OpenRouter": "Name, e.g. OpenRouter",
  "Version": "Version",
  "Description": "Description",
  "Next": "Next",
  "ID, name and version are required.": "ID, name and version are required.",
  "Provider ID can only contain a-z, 0-9, - and _.": "Provider ID can only contain a-z, 0-9, - and _.",
  "already exists.": "already exists.",
  "Authentication": "Authentication",
  "How is the API key sent?": "How is the API key sent?",
  "No authentication": "No authentication",
  "Custom header": "Custom header",
  "Enter the name of the HTTP header.": "Enter the name of the HTTP header.",
  "Header": "Header",
  "Prefix": "Prefix",
  "Header name missing.": "Header name missing.",
  "Enter the balance/credits endpoint of the provider.": "Enter the balance/credits endpoint of the provider.",
  "API endpoint missing.": "API endpoint missing.",
  "The API endpoint must use HTTPS.": "The API endpoint must use HTTPS.",
  "HTTP method": "HTTP method",
  "How is the remaining balance in the JSON response?": "How is the remaining balance in the JSON response?",
  "Single balance field": "Single balance field",
  "Total minus used": "Total minus used",
  "Array with currencies": "Array with currencies",
  "Balance field": "Balance field",
  "Example JSON path: data.balance": "Example JSON path: data.balance",
  "Currency": "Currency",
  "Label": "Label",
  "JSON path missing.": "JSON path missing.",
  "Credit fields": "Credit fields",
  "The remaining balance is calculated as total minus used.": "The remaining balance is calculated as total minus used.",
  "Total and Used JSON paths are required.": "Total and Used JSON paths are required.",
  "For APIs that return multiple balances or currencies.": "For APIs that return multiple balances or currencies.",
  "Array path and amount field are required.": "Array path and amount field are required.",
  "Add provider?": "Add provider?",
  "Add to GitHub": "Add to GitHub",
  "Provider added": "Provider added",
  "was added to providers.json on GitHub.\n\nDo you want to install this provider on this device now?": "was added to providers.json on GitHub.\n\nDo you want to install this provider on this device now?",
  "Install": "Install",
  "Provider installed and API key saved securely.\n\nDo you want to test the connection now?": "\u2705 Provider installed and API key saved securely.\n\nDo you want to test the connection now?",
  "Test connection": "Test connection",
  "Connection OK\n\nBalance:": "Connection OK\n\nBalance:",
  "Connection failed": "Connection failed",
  "Provider installed.\n\nThe API key is not set yet. You can add it later via Setup.": "Provider installed.\n\nThe API key is not set yet. You can add it later via Setup.",
  "Provider installed.": "\u2705 Provider installed.",
  "Adding provider failed": "Adding provider failed",
  "No catalog": "No catalog",
  "Set the Provider Catalog URL first via Setup.": "Set the Provider Catalog URL first via Setup.",
  "The provider catalog is empty.\n\nAdd a provider first via Setup \u2192 Add provider to catalog.": "The provider catalog is empty.\n\nAdd a provider first via Setup \u2192 Add provider to catalog.",
  "All providers from the catalog are already installed.": "All providers from the catalog are already installed.",
  "Choose a provider from the GitHub catalog.": "Choose a provider from the GitHub catalog.",
  "Provider installed, but the API key is not set yet.": "Provider installed, but the API key is not set yet.",
  "Provider is installed.\n\nDo you want to test the connection now?": "Provider is installed.\n\nDo you want to test the connection now?",
  "Installation failed": "Installation failed",
  "Enter a new key. The old key will be replaced.": "Enter a new key. The old key will be replaced.",
  "The API key is stored securely in Scriptable Keychain.": "The API key is stored securely in Scriptable Keychain.",
  "Change": "Change",
  "No API key entered.": "No API key entered.",
  "Change API key": "\uD83D\uDD11 Change API key",
  "Add API key": "\uD83D\uDD11 Add API key",
  "No API key needed": "\uD83D\uDD13 No API key needed",
  "Update provider": "\uD83D\uDD04 Update provider",
  "Remove provider": "\uD83D\uDDD1 Remove provider",
  "Provider Catalog URL missing.": "Provider Catalog URL missing.",
  "Provider no longer exists in the catalog.": "Provider no longer exists in the catalog.",
  "Local provider was not found.": "Local provider was not found.",
  "Provider updated.": "Provider updated.",
  "Changes:": "Changes:",
  "and": "and",
  "more change(s)": "more change(s)",
  "No field changes.": "No field changes.",
  "Update failed": "Update failed",
  "Remove": "Remove",
  "The local provider and API key will be removed. The provider remains in the GitHub catalog.": "The local provider and API key will be removed. The provider remains in the GitHub catalog.",
  "Provider deleted.": "Provider deleted.",
  "No API key set.": "No API key set.",
  "Custom authentication header missing.": "Custom authentication header missing.",
  "Authentication type not supported.": "Authentication type not supported.",
  "Balance could not be read at path": "Balance could not be read at path",
  "Credit data could not be read": "Credit data could not be read",
  "Balance array missing at path": "Balance array missing at path",
  "No balance found.": "No balance found.",
  "Balance is not a valid number.": "Balance is not a valid number.",
  "Unknown response mode.": "Unknown response mode.",
  "balance low": "balance low",
  "Remaining balance:": "Remaining balance:",
  "Below the threshold of": "Below the threshold of",
  "No providers": "No providers",
  "There are no providers installed yet.": "There are no providers installed yet.",
  "Current remaining balance": "Current remaining balance",
  "Last check": "Last check",
  "Refresh all balances now": "Refresh all balances now",
  "Refresh now": "\uD83D\uDD04 Refresh now",
  "No providers configured": "No providers configured",
  "more": "more",
  "Optional future backend that researches provider documentation. API keys are never sent to this backend.": "Optional future backend that researches provider documentation. API keys are never sent to this backend.",
  "Disable": "Disable",
  "Configuration summary copied to clipboard.": "Configuration summary copied to clipboard.",
  "Does not contain API keys or GitHub token.": "Does not contain API keys or GitHub token.",
  "Invalid catalog.": "Invalid catalog.",
  "providers[] missing.": "providers[] missing.",
  "Provider missing.": "Provider missing.",
  "Field missing.": "Field missing.",
  "Invalid provider ID.": "Invalid provider ID.",
  "API endpoint must be HTTPS.": "API endpoint must be HTTPS.",
  "Only GET and POST are allowed.": "Only GET and POST are allowed.",
  "Invalid response mode.": "Invalid response mode.",
  "GitHub repository is not fully configured.": "GitHub repository is not fully configured.",
  "JSON path missing.": "JSON path missing.",
  "Dynamic provider catalog via GitHub": "Dynamic provider catalog via GitHub",
  "API keys stored in Keychain": "API keys stored in Keychain",
  "Balance history & trend arrows": "Balance history & trend arrows",
  "Home screen widget support": "Home screen widget support",
  "i18n: English + Dutch": "i18n: English + Dutch",
  "JSON path not found in response.": "JSON path not found in response.",
  "Unknown error": "Unknown error",
  "[GitHub token hidden]": "[GitHub token hidden]",
  "[API key hidden]": "[API key hidden]",
  "Shortcuts: No action specified.": "Shortcuts: No action specified.",
  "Shortcuts: Unknown action.": "Shortcuts: Unknown action.",
  "Shortcuts: No providers installed.": "Shortcuts: No providers installed.",
  "Shortcuts: Provider not found.": "Shortcuts: Provider not found.",
  "Shortcuts: Widget refreshed.": "Shortcuts: Widget refreshed.",
  "Shortcuts: Total credits": "Shortcuts: Total credits",
  "Help & Guides": "Help & Guides",
  "Apple Shortcuts": "Apple Shortcuts",
  "Check All Balances": "Check All Balances",
  "Total Remaining": "Total Remaining",
  "Single Provider": "Single Provider",
  "Refresh Widget": "Refresh Widget",
  "Help": "Help",
  "Morning Check": "Morning Check",
  "Server Version": "Server Version",
  "What is it?": "What is it?",
  "Quick Start": "Quick Start",
  "API Keys": "API Keys",
  "API Endpoints": "API Endpoints",
  "Tips": "Tips",
  "Update Check": "Update Check",
  "Widget Setup": "Widget Setup",
  "shortcut_balances_help": "📋 How to create:\n\n1. Open Shortcuts → tap +\n2. Add Action → Run Script\n3. Select: ai-credit-monitor\n4. Text field: balances\n5. Add Action → Show Result\n6. Name it: AI Credits\n\n💡 Empty text field = balances (default)",
  "shortcut_total_help": "📋 How to create:\n\n1. Open Shortcuts → tap +\n2. Add Action → Run Script\n3. Select: ai-credit-monitor\n4. Text field: total\n5. Add Action → Show Result\n6. Name it: AI Total\n\nShows total remaining credits per currency.",
  "shortcut_provider_help": "📋 How to create:\n\n1. Open Shortcuts → tap +\n2. Add Action → Run Script\n3. Select: ai-credit-monitor\n4. Text field: provider:openrouter\n5. Add Action → Show Result\n\n💡 Replace 'openrouter' with any provider ID:\nopenrouter, deepseek, groq, anthropic, google, xai, mistral, cohere, fireworks, together, perplexity, openai, huggingface, stability, replicate, banana, moderation, cache, zhipu, venice",
  "shortcut_refresh_help": "📋 How to create:\n\n1. Open Shortcuts → tap +\n2. Add Action → Run Script\n3. Select: ai-credit-monitor\n4. Text field: refresh\n\nThis refreshes the home screen widget with latest data. No Show Result needed.",
  "shortcut_help_help": "📋 Shows available actions and usage info.",
  "shortcut_automation_help": "📋 Morning Check Automation:\n\n1. Shortcuts → Automation → +\n2. Time of Day → pick time (e.g. 08:00)\n3. Add Action → Run Script\n4. Select: ai-credit-monitor\n5. Text: balances\n6. Add Action → Show Notification\n7. Body: tap → select Script Result\n\nNow you get a daily push with your balances! 🔔",
  "server_what_help": "A Python/Flask server that monitors your AI credits automatically.\n\nRuns on your Pi or any server, fetches balances every 15-30 min, and shows them in a web dashboard.\n\nSame providers.json as the iOS app — shared config.",
  "server_quickstart_help": "1. pip install -r requirements.txt\n2. cp .env.example .env\n3. Edit .env — add your API keys\n4. python server.py\n5. Open http://localhost:8765\n\nDefault port: 8765. Configurable via PORT env var.",
  "server_keys_help": "In .env, set keys as:\nKEY_OPENROUTER=sk-or-...\nKEY_DEEPSEEK=sk-...\nKEY_GROQ=gsk_...\n\nFormat: KEY_{PROVIDER_ID_UPPER}\n\nProvider IDs in providers.json.",
  "server_api_help": "GET /api/balances — all current balances\nGET /api/balances/{id} — single provider\nPOST /api/refresh — force refresh all\nGET /api/total — total per currency\nGET /api/providers — provider catalog\nGET /api/status — server status\nGET /api/history/{id} — balance history\nGET / — web dashboard",
  "tips_update_help": "The app checks version.json from GitHub automatically (max 1x/day).\n\nIf a new version is found, you'll see an alert with changelog.\n\nTap 'View update' to open the GitHub page.",
  "tips_widget_help": "1. Long-press home screen → +\n2. Search 'Scriptable'\n3. Add small, medium, or large widget\n4. Tap widget → select ai-credit-monitor\n\nTap widget to open the app. Colors show balance health:🟢 green, 🟠 orange, 🔴 red"
}


// ============================================================
// TRANSLATIONS NL (Dutch)
// ============================================================

const TRANSLATIONS_NL = {
  "No providers installed yet.": "Er zijn nog geen providers ge\u00EFnstalleerd.",
  "provider(s) installed.": "provider(s) ge\u00EFnstalleerd.",
  "View credits": "\uD83D\uDCB0 Credits bekijken",
  "Install provider": "\u2795 Provider installeren",
  "Setup": "\u2699\uFE0F Setup",
  "Close": "Close",
  "OK": "OK",
  "Got it": "Begrepen",
  "Install from catalog": "Provider installeren",
  "Not configured": "Not configured",
  "Configured": "\u2705 Ingesteld",
  "Provider Catalog URL": "\uD83D\uDCDA Provider Catalog URL",
  "GitHub repository": "\uD83D\uDD19 GitHub repository",
  "GitHub token": "\uD83D\uDD10 GitHub token",
  "Test GitHub connection": "\uD83E\uDDEA GitHub verbinding testen",
  "Check repository and providers.json": "Check repository and providers.json",
  "Add provider to catalog": "\u2795 Provider toevoegen aan catalogus",
  "Add provider to providers.json": "Add provider to providers.json",
  "Refresh interval": "\u23F1 Verversingsinterval",
  "minutes": "minuten",
  "Installed providers": "Ge\u00EFnstalleerde providers",
  "API key missing": "\u26A0\uFE0F API-key ontbreekt",
  "Discovery Backend": "\uD83E\uDD16 Discovery Backend",
  "Disabled": "Disabled",
  "Export config": "\uD83D\uDCCB Config exporteren",
  "Copy configuration summary to clipboard": "Copy configuration summary to clipboard",
  "Language": "\uD83C\uDF10 Language",
  "English": "English",
  "Nederlands": "Nederlands",
  "Use the Raw GitHub URL to providers.json.": "Use the Raw GitHub URL to providers.json.",
  "Test & save": "Test & save",
  "Delete": "Delete",
  "Cancel": "Cancel",
  "Invalid URL": "Invalid URL",
  "Only HTTPS URLs are allowed.": "Only HTTPS URLs are allowed.",
  "Connection OK": "Verbinding OK",
  "provider(s) found.": "provider(s) gevonden.",
  "Catalog error": "Catalog error",
  "Repository containing providers.json.": "Repository containing providers.json.",
  "Owner / username": "Owner / username",
  "Repository": "Repository",
  "Branch": "Branch",
  "Save": "Save",
  "Missing data": "Missing data",
  "Fill in all GitHub fields.": "Fill in all GitHub fields.",
  "Repository saved.": "Repository opgeslagen.",
  "The Raw Catalog URL was automatically adjusted.": "De Raw Catalog URL werd automatisch aangepast.",
  "Paste GitHub URL": "\uD83D\uDCCB GitHub URL plakken",
  "Enter a GitHub URL (e.g. https://github.com/owner/repo) or owner/repo": "Voer een GitHub URL in (bijv. https://github.com/owner/repo) of owner/repo",
  "Could not parse GitHub URL.": "Kon GitHub URL niet verwerken.",
  "Enter at least owner and repository.": "Voer tenminste owner en repository in.",
  "Parse & continue": "Verwerken & doorgaan",
  "Interval in minutes for widget refresh (5 - 1440).\n\nCurrent: ": "Interval in minutes for widget refresh (5 - 1440).\\n\\nCurrent: ",
  "Minutes": "Minutes",
  "Enter a number between 5 and 1440 minutes.": "Enter a number between 5 and 1440 minutes.",
  "Refresh interval set to": "Verversingsinterval ingesteld op",
  "A token is set. The token is never displayed.": "A token is set. The token is never displayed.",
  "Use a fine-grained token with Contents: Read and write.": "Use a fine-grained token with Contents: Read and write.",
  "Change token": "\uD83D\uDD04 Token wijzigen",
  "Add token": "\u2795 Token toevoegen",
  "Remove token": "\uD83D\uDDD1 Token verwijderen",
  "The token is stored exclusively in Scriptable Keychain.": "The token is stored exclusively in Scriptable Keychain.",
  "No token entered.": "No token entered.",
  "Token saved securely.": "Token saved securely.",
  "GitHub token deleted.": "GitHub token deleted.",
  "GitHub token not set.": "GitHub token not set.",
  "GitHub connection OK": "GitHub connection OK",
  "File": "Bestand",
  "GitHub error": "GitHub error",
  "GitHub token missing.": "GitHub token missing.",
  "GitHub response does not contain a file or SHA.": "GitHub response does not contain a file or SHA.",
  "providers.json could not be read from Base64.": "providers.json could not be read from Base64.",
  "New provider": "New provider",
  "General provider information.": "General provider information.",
  "ID, e.g. openrouter": "ID, e.g. openrouter",
  "Name, e.g. OpenRouter": "Name, e.g. OpenRouter",
  "Version": "Version",
  "Description": "Description",
  "Next": "Next",
  "ID, name and version are required.": "ID, name and version are required.",
  "Provider ID can only contain a-z, 0-9, - and _.": "Provider ID can only contain a-z, 0-9, - and _.",
  "already exists.": "bestaat al.",
  "Authentication": "Authentication",
  "How is the API key sent?": "How is the API key sent?",
  "No authentication": "No authentication",
  "Custom header": "Custom header",
  "Enter the name of the HTTP header.": "Enter the name of the HTTP header.",
  "Header": "Header",
  "Prefix": "Prefix",
  "Header name missing.": "Header name missing.",
  "Enter the balance/credits endpoint of the provider.": "Enter the balance/credits endpoint of the provider.",
  "API endpoint missing.": "API endpoint missing.",
  "The API endpoint must use HTTPS.": "The API endpoint must use HTTPS.",
  "HTTP method": "HTTP method",
  "How is the remaining balance in the JSON response?": "How is the remaining balance in the JSON response?",
  "Single balance field": "E\u00E9n saldo veld",
  "Total minus used": "Total minus used",
  "Array with currencies": "Array with currencies",
  "Balance field": "Balance field",
  "Example JSON path: data.balance": "Example JSON path: data.balance",
  "Currency": "Currency",
  "Label": "Label",
  "JSON path missing.": "JSON path ontbreekt.",
  "Credit fields": "Credit fields",
  "The remaining balance is calculated as total minus used.": "The remaining balance is calculated as total minus used.",
  "Total and Used JSON paths are required.": "Total and Used JSON paths are required.",
  "For APIs that return multiple balances or currencies.": "For APIs that return multiple balances or currencies.",
  "Array path and amount field are required.": "Array path and amount field are required.",
  "Add provider?": "Add provider?",
  "Add to GitHub": "Add to GitHub",
  "Provider added": "Provider added",
  "was added to providers.json on GitHub.\n\nDo you want to install this provider on this device now?": "werd toegevoegd aan providers.json op GitHub.\n\nWil je deze provider nu ook op dit toestel installeren?",
  "Install": "Install",
  "Provider installed and API key saved securely.\n\nDo you want to test the connection now?": "\u2705 Provider ge\u00EFnstalleerd en API-key veilig opgeslagen.\n\nWil je de verbinding nu testen?",
  "Test connection": "Verbinding testen",
  "Connection OK\n\nBalance:": "Verbinding OK\n\nSaldo:",
  "Connection failed": "Verbinding mislukt",
  "Provider installed.\n\nThe API key is not set yet. You can add it later via Setup.": "Provider ge\u00EFnstalleerd.\n\nDe API-key is nog niet ingesteld. Je kunt die later toevoegen via Setup.",
  "Provider installed.": "\u2705 Provider ge\u00EFnstalleerd.",
  "Adding provider failed": "Adding provider failed",
  "No catalog": "No catalog",
  "Set the Provider Catalog URL first via Setup.": "Set the Provider Catalog URL first via Setup.",
  "The provider catalog is empty.\n\nAdd a provider first via Setup \u2192 Add provider to catalog.": "De provider catalogus is leeg.\n\nVoeg eerst een provider toe via Setup \u2192 Provider toevoegen aan catalogus.",
  "All providers from the catalog are already installed.": "Alle providers uit de catalogus zijn reeds ge\u00EFnstalleerd.",
  "Choose a provider from the GitHub catalog.": "Choose a provider from the GitHub catalog.",
  "Provider installed, but the API key is not set yet.": "Provider ge\u00EFnstalleerd, maar de API-key is nog niet ingesteld.",
  "Provider is installed.\n\nDo you want to test the connection now?": "Provider is ge\u00EFnstalleerd.\n\nWil je de verbinding nu testen?",
  "Installation failed": "Installation failed",
  "Enter a new key. The old key will be replaced.": "Enter a new key. The old key will be replaced.",
  "The API key is stored securely in Scriptable Keychain.": "The API key is stored securely in Scriptable Keychain.",
  "Change": "Change",
  "No API key entered.": "No API key entered.",
  "Change API key": "\uD83D\uDD11 API-key wijzigen",
  "Add API key": "\uD83D\uDD11 API-key toevoegen",
  "No API key needed": "\uD83D\uDD13 Geen API-key nodig",
  "Update provider": "\uD83D\uDD04 Module bijwerken",
  "Remove provider": "\uD83D\uDDD1 Provider verwijderen",
  "Provider Catalog URL missing.": "Provider Catalog URL missing.",
  "Provider no longer exists in the catalog.": "Provider no longer exists in the catalog.",
  "Local provider was not found.": "Local provider was not found.",
  "Provider updated.": "Provider bijgewerkt.",
  "Changes:": "Wijzigingen:",
  "and": "en",
  "more change(s)": "wijziging(en)",
  "No field changes.": "No field changes.",
  "Update failed": "Update failed",
  "Remove": "Delete",
  "The local provider and API key will be removed. The provider remains in the GitHub catalog.": "The local provider and API key will be removed. The provider remains in the GitHub catalog.",
  "Provider deleted.": "Provider deleted.",
  "No API key set.": "No API key set.",
  "Custom authentication header missing.": "Custom authentication header missing.",
  "Authentication type not supported.": "Authenticatietype wordt niet ondersteund.",
  "Balance could not be read at path": "Saldo kon niet worden gelezen op pad",
  "Credit data could not be read": "Creditgegevens konden niet worden gelezen",
  "Balance array missing at path": "Saldo-array ontbreekt op pad",
  "No balance found.": "No balance found.",
  "Balance is not a valid number.": "Balance is not a valid number.",
  "Unknown response mode.": "Unknown response mode.",
  "balance low": "saldo laag",
  "Remaining balance:": "Resterend saldo:",
  "Below the threshold of": "Onder de drempel van",
  "No providers": "No providers",
  "There are no providers installed yet.": "Er zijn nog geen providers ge\u00EFnstalleerd.",
  "Current remaining balance": "Current remaining balance",
  "Last check": "Last check",
  "Refresh all balances now": "Refresh all balances now",
  "Refresh now": "\uD83D\uDD04 Opnieuw ophalen",
  "No providers configured": "No providers configured",
  "more": "meer",
  "Optional future backend that researches provider documentation. API keys are never sent to this backend.": "Optional future backend that researches provider documentation. API keys are never sent to this backend.",
  "Disable": "Disable",
  "Configuration summary copied to clipboard.": "Configuratie-overzicht gekopieerd naar klembord.",
  "Does not contain API keys or GitHub token.": "Bevat geen API-keys of GitHub-token.",
  "Invalid catalog.": "Invalid catalog.",
  "providers[] missing.": "providers[] missing.",
  "Provider missing.": "Provider missing.",
  "Field missing.": "Veld",
  "Invalid provider ID.": "Invalid provider ID.",
  "API endpoint must be HTTPS.": "API endpoint must be HTTPS.",
  "Only GET and POST are allowed.": "Only GET and POST are allowed.",
  "Invalid response mode.": "Invalid response mode.",
  "GitHub repository is not fully configured.": "GitHub repository is not fully configured.",
  "JSON path missing.": "JSON path missing.",
  "Dynamic provider catalog via GitHub": "Dynamische providercatalogus via GitHub",
  "API keys stored in Keychain": "API-keys opgeslagen in Keychain",
  "Balance history & trend arrows": "Saldohistorie & trendpijlen",
  "Home screen widget support": "Bureaubladwidget-ondersteuning",
  "i18n: English + Dutch": "i18n: Engels + Nederlands",
  "JSON path not found in response.": "JSON path not found in response.",
  "Unknown error": "Unknown error",
  "[GitHub token hidden]": "[GitHub token hidden]",
  "[API key hidden]": "[API key hidden]",
  "Shortcuts: No action specified.": "Shortcuts: Geen actie opgegeven.",
  "Shortcuts: Unknown action.": "Shortcuts: Onbekende actie.",
  "Shortcuts: No providers installed.": "Shortcuts: Geen providers geïnstalleerd.",
  "Shortcuts: Provider not found.": "Shortcuts: Provider niet gevonden.",
  "Shortcuts: Widget refreshed.": "Shortcuts: Widget ververst.",
  "Shortcuts: Total credits": "Shortcuts: Totaal credits",
  "Unknown error": "Onbekende fout",
  "Help & Guides": "Help & Gidsen",
  "Apple Shortcuts": "Apple Shortcuts",
  "Check All Balances": "Alle saldos controleren",
  "Total Remaining": "Totaal resterend",
  "Single Provider": "Enkele provider",
  "Refresh Widget": "Widget vernieuwen",
  "Morning Check": "Ochtendcontrole",
  "Server Version": "Server Versie",
  "What is it?": "Wat is het?",
  "Quick Start": "Snel Starten",
  "API Keys": "API Sleutels",
  "API Endpoints": "API Endpoints",
  "Tips": "Tips",
  "Update Check": "Update Controle",
  "Widget Setup": "Widget Instellen",
  "shortcut_balances_help": "Aanmaken:\n1. Shortcuts - tik +\n2. Add Action - Run Script\n3. Selecteer: ai-credit-monitor\n4. Tekstveld: balances\n5. Add Action - Show Result\n6. Noem het: AI Credits",
  "shortcut_total_help": "Aanmaken:\n1. Shortcuts - tik +\n2. Add Action - Run Script\n3. Selecteer: ai-credit-monitor\n4. Tekstveld: total\n5. Add Action - Show Result\n6. Noem het: AI Totaal",
  "shortcut_provider_help": "Aanmaken:\n1. Shortcuts - tik +\n2. Add Action - Run Script\n3. Selecteer: ai-credit-monitor\n4. Tekstveld: provider:openrouter\nVervang openrouter door een provider ID.",
  "shortcut_refresh_help": "Aanmaken:\n1. Shortcuts - tik +\n2. Add Action - Run Script\n3. Selecteer: ai-credit-monitor\n4. Tekstveld: refresh\nVernieuwt de widget met laatste gegevens.",
  "shortcut_help_help": "Toont beschikbare acties en gebruiksinformatie.",
  "shortcut_automation_help": "Ochtendcontrole Automatisering:\n1. Shortcuts - Automatisering - +\n2. Tijdstip - kies tijd (bijv. 08:00)\n3. Add Action - Run Script\n4. Selecteer: ai-credit-monitor\n5. Tekst: balances\n6. Add Action - Show Notification\n7. Body: tik - selecteer Script Result",
  "server_what_help": "Een Python/Flask server die automatisch je AI-saldo's controleert. Draait op je Pi, haalt saldos elke 15-30 min op.",
  "server_quickstart_help": "1. pip install -r requirements.txt\n2. cp .env.example .env\n3. Bewerk .env met je API sleutels\n4. python server.py\n5. Open http://localhost:8765",
  "server_keys_help": "In .env: KEY_OPENROUTER=sk-or-... KEY_DEEPSEEK=sk-...\nFormaat: KEY_provider_ID",
  "server_api_help": "GET /api/balances - alle saldos\nGET /api/total - totaal per valuta\nGET /api/providers - catalogus\nGET / - web dashboard",
  "tips_update_help": "De app controleert automatisch version.json. Nieuwe versie = alert met changelog.",
  "tips_widget_help": "1. Houd bureaublad ingedrukt - +\\n2. Zoek Scriptable\\n3. Voeg widget toe\\n4. Tik - selecteer ai-credit-monitor"
}


// ============================================================
// TRANSLATION FUNCTION
// ============================================================

const t = (
  key
) => {

  const currentCfg =
    loadConfig()

  const lang =
    currentCfg.language || "en"

  if (
    lang === "nl"
  ) {

    return TRANSLATIONS_NL[key]
      || TRANSLATIONS[key]
      || key
  }

  return TRANSLATIONS[key]
    || key
}





// ============================================================
// KEYCHAIN
// ============================================================

const KEYCHAIN_GITHUB =
  "ai-credit-monitor.github-token"

const PROVIDER_KEY_PREFIX =
  "ai-credit-monitor.provider."


// ============================================================
// DEFAULT CONFIG
// ============================================================

const DEFAULT_CONFIG = {
  catalogUrl: "",

  githubOwner: "",
  githubRepo: "",
  githubBranch: "main",
  githubPath: "providers.json",

  discoveryUrl: "",

  refreshMinutes: 30,
  cooldownSeconds: 30,

  lowBalanceThreshold: 1,
  redBalanceThreshold: 5
}


// ============================================================
// COLORS
// ============================================================

const COLORS = {
  backgroundTop: new Color("#102030"),
  backgroundBottom: new Color("#07111B"),
  card: new Color("#182938"),
  primary: new Color("#5AC8FA"),
  secondary: new Color("#A9C7D8"),
  green: new Color("#30D158"),
  orange: new Color("#FF9F0A"),
  red: new Color("#FF453A"),
  white: Color.white(),
  grey: new Color("#8E8E93")
}


// ============================================================
// START
// ============================================================

initializeStorage()

// Apple Shortcuts: handle shortcut parameter
// before widget/app UI checks
if (
  await handleShortcuts()
) {

  // Shortcut handled, exit early
  // Script.complete() already called

} else if (
  !config.runsInWidget &&
  !config.catalogUrl &&
  !(
    config.githubOwner &&
    config.githubRepo
  ) &&
  !(
    config.githubOwner === "jphermans" &&
    config.githubRepo === "ai-credit-monitor"
  )
) {

  const gate =
    new Alert()

  gate.title =
    "⚠️ Setup Recommended"

  gate.message =
    "No GitHub repository configured yet. " +
    "Go to Setup to add your repo and providers.\n\n" +
    "A default catalog is available at:\n" +
    "github.com/jphermans/ai-credit-monitor"

  gate.addAction(
    t("OK")
  )

  await gate.presentSheet()

  // Check for updates (max once per day)
  await checkForUpdates()

  await mainMenu()

} else if (config.runsInWidget) {

  const balances =
    await loadAllBalances(
      false
    )

  const widget =
    await createWidget(
      balances,
      config.widgetFamily
    )

  Script.setWidget(widget)
  Script.complete()

} else {

  await mainMenu()
}


// ============================================================
// STORAGE INIT
// ============================================================

function initializeStorage() {

  if (!fm.fileExists(ROOT_DIR)) {

    fm.createDirectory(
      ROOT_DIR,
      true
    )
  }


  if (!fm.fileExists(CONFIG_FILE)) {

    saveConfig({
      ...DEFAULT_CONFIG,

      githubOwner: "jphermans",
      githubRepo: "ai-credit-monitor"
    })
  }


  if (!fm.fileExists(INSTALLED_FILE)) {

    saveInstalledProviders([])
  }


  if (!fm.fileExists(CACHE_FILE)) {

    saveCache({})
  }


  if (!fm.fileExists(HISTORY_FILE)) {

    saveHistory({})
  }
}


// ============================================================
// APPLE SHORTCUTS INTEGRATION
// ============================================================

async function handleShortcuts() {

  const param =
    args.shortcutParameter

  if (
    param === null ||
    param === undefined
  ) {

    return false
  }

  const action = String(
    param
  ).trim().toLowerCase()


  // "balances" or empty → fetch all, output summary
  if (
    action === "" ||
    action === "balances"
  ) {

    const providers =
      loadInstalledProviders()

    if (
      providers.length === 0
    ) {

      Script.setShortcutOutput(
        t("Shortcuts: No providers installed.")
      )

      Script.complete()
      return true
    }

    const balances =
      await loadAllBalances(
        true
      )

    let lines = []

    for (const balance of balances) {

      if (
        balance.success
      ) {

        lines.push(
          `${balance.name}: ${formatMoney(
            balance.amount,
            balance.currency
          )}`
        )

      } else {

        lines.push(
          `${balance.name}: ${t("Connection failed")}`
        )
      }
    }

    Script.setShortcutOutput(
      lines.join("\n")
    )

    Script.complete()
    return true
  }


  // "total" → return total remaining credits
  if (
    action === "total"
  ) {

    const providers =
      loadInstalledProviders()

    if (
      providers.length === 0
    ) {

      Script.setShortcutOutput(
        t("Shortcuts: No providers installed.")
      )

      Script.complete()
      return true
    }

    const balances =
      await loadAllBalances(
        true
      )

    let total = 0

    for (const balance of balances) {

      if (
        balance.success &&
        balance.amount !== null
      ) {

        total +=
          balance.amount
      }
    }

    Script.setShortcutOutput(
      `${t("Shortcuts: Total credits")}: ${formatMoney(
        total
      )}`
    )

    Script.complete()
    return true
  }


  // "provider:NAME" → single provider balance
  if (
    action.startsWith("provider:")
  ) {

    const providerName =
      action
        .substring(9)
        .trim()

    if (
      !providerName
    ) {

      Script.setShortcutOutput(
        t("Shortcuts: No action specified.")
      )

      Script.complete()
      return true
    }

    const providers =
      loadInstalledProviders()

    const match =
      providers.find(
        p =>
          p.id.toLowerCase() ===
            providerName.toLowerCase() ||
          p.name.toLowerCase() ===
            providerName.toLowerCase()
      )

    if (!match) {

      Script.setShortcutOutput(
        t("Shortcuts: Provider not found.") +
          " " + providerName
      )

      Script.complete()
      return true
    }

    const balance =
      await fetchProviderBalance(
        match,
        true
      )

    if (
      balance.success
    ) {

      Script.setShortcutOutput(
        `${balance.name}: ${formatMoney(
          balance.amount,
          balance.currency
        )}`
      )

    } else {

      Script.setShortcutOutput(
        `${balance.name}: ${t("Connection failed")}`
      )
    }

    Script.complete()
    return true
  }


  // "refresh" → refresh widget
  if (
    action === "refresh"
  ) {

    const balances =
      await loadAllBalances(
        true
      )

    const widget =
      await createWidget(
        balances,
        "medium"
      )

    Script.setWidget(
      widget
    )

    Script.setShortcutOutput(
      t("Shortcuts: Widget refreshed.")
    )

    Script.complete()
    return true
  }


  // Unknown action
  Script.setShortcutOutput(
    t("Shortcuts: Unknown action.") +
      " " + action
  )

  Script.complete()
  return true
}


// ============================================================
// CONFIG
// ============================================================

function loadConfig() {

  try {

    const cfg =
      JSON.parse(
        fm.readString(
          CONFIG_FILE
        )
      )

    return {
      ...DEFAULT_CONFIG,
      ...cfg
    }

  } catch {

    return {
      ...DEFAULT_CONFIG
    }
  }
}


function saveConfig(
  cfg
) {

  fm.writeString(
    CONFIG_FILE,
    JSON.stringify(
      cfg,
      null,
      2
    )
  )
}


// ============================================================
// INSTALLED PROVIDERS
// ============================================================

function loadInstalledProviders() {

  try {

    const data =
      JSON.parse(
        fm.readString(
          INSTALLED_FILE
        )
      )

    return Array.isArray(data)
      ? data
      : []

  } catch {

    return []
  }
}


function saveInstalledProviders(
  providers
) {

  fm.writeString(
    INSTALLED_FILE,
    JSON.stringify(
      providers,
      null,
      2
    )
  )
}


// ============================================================
// BALANCE CACHE (rate limiting / cooldown)
// ============================================================

function loadCache() {

  try {

    const data =
      JSON.parse(
        fm.readString(
          CACHE_FILE
        )
      )

    return (
      data &&
      typeof data === "object"
    )
      ? data
      : {}

  } catch {

    return {}
  }
}


function saveCache(
  cache
) {

  fm.writeString(
    CACHE_FILE,
    JSON.stringify(
      cache,
      null,
      2
    )
  )
}


// ============================================================
// BALANCE HISTORY (trend)
// ============================================================

function loadHistory() {

  try {

    const data =
      JSON.parse(
        fm.readString(
          HISTORY_FILE
        )
      )

    return (
      data &&
      typeof data === "object"
    )
      ? data
      : {}

  } catch {

    return {}
  }
}


function saveHistory(
  history
) {

  fm.writeString(
    HISTORY_FILE,
    JSON.stringify(
      history,
      null,
      2
    )
  )
}


function recordBalanceHistory(
  balances
) {

  const history =
    loadHistory()

  const now =
    Date.now()

  let changed =
    false


  for (const balance of balances) {

    if (
      !balance.success ||
      balance.cached
    ) {

      continue
    }

    const list =
      history[balance.id] || []

    list.push({
      t: now,
      amount:
        balance.amount
    })

    while (
      list.length >
      HISTORY_LIMIT
    ) {

      list.shift()
    }

    history[balance.id] =
      list

    changed =
      true
  }


  if (changed) {

    saveHistory(
      history
    )
  }
}


// ============================================================
// SAFE TEXT FIELD HELPER
// ============================================================
// UTILITIES
// ============================================================

function truncateMiddle(
  str,
  max
) {

  if (
    str.length <= max
  ) {

    return str
  }

  const half =
    Math.floor(
      (max - 3) / 2
    )

  return (
    str.slice(0, half) +
    "..." +
    str.slice(-half)
  )
}


function fieldValue(
  alert,
  index
) {

  const value =
    alert.textFieldValue(index)

  if (
    value === null ||
    value === undefined
  ) {

    return ""
  }
  return String(value).trim()
}


// ============================================================
// MAIN MENU
// ============================================================



// ============================================================
// UPDATE CHECK
// ============================================================

async function checkForUpdates() {

  if (config.runsInWidget) {

    return false
  }

  const LAST_CHECK_KEY =
    "lastUpdateCheck"

  const now =
    Date.now()

  const lastCheck =
    fm.fileExists(LAST_CHECK_KEY)
      ? Number(
          fm.readString(
            LAST_CHECK_KEY
          )
        ) || 0
      : 0

  const ONE_DAY =
    86400000

  if (now - lastCheck < ONE_DAY) {

    return false
  }

  const owner =
    config.githubOwner

  const repo =
    config.githubRepo

  if (!owner || !repo) {

    return false
  }

  try {

    const url =
      `https://raw.githubusercontent.com/${owner}/${repo}/main/version.json`

    const req =
      new Request(url)

    const response =
      await req.loadJSON()

    if (response.statusCode && response.statusCode !== 200) {

      return false
    }

    fm.writeString(
      LAST_CHECK_KEY,
      String(now)
    )

    const remote =
      response.version

    if (!remote) {

      return false
    }

    if (
      compareVersions(
        remote,
        APP_VERSION
      ) <= 0
    ) {

      return false
    }

    let message =
      `v${APP_VERSION} → v${remote}\n\n`

    if (response.changelog) {

      for (const entry of response.changelog) {

        if (
          compareVersions(
            entry.version,
            APP_VERSION
          ) <= 0
        ) {

          continue
        }

        message +=
          `📦 v${entry.version}:\n`

        for (const change of entry.changes) {

          message +=
            `  • ${change}\n`
        }

        message += "\n"
      }
    }

    const alert =
      new Alert()

    alert.title =
      "🎉 " + t("Update available")

    alert.message = message.trim()

    alert.addAction(
      t("View update")
    )

    alert.addCancelAction(
      t("Later")
    )

    const result =
      await alert.presentAlert()

    if (result === 0) {

      Safari.open(
        `https://github.com/${owner}/${repo}/releases`
      )
    }

    return true

  } catch (e) {

    return false
  }
}


function compareVersions(
  a,
  b
) {

  const pa =
    a.split(".")

  const pb =
    b.split(".")

  for (let i = 0; i < 3; i++) {

    const na =
      Number(pa[i]) || 0

    const nb =
      Number(pb[i]) || 0

    if (na > nb) return 1

    if (na < nb) return -1
  }

  return 0
}

async function mainMenu() {

  // Warn if using the default shared repo
  if (
    config.githubOwner === "jphermans" &&
    config.githubRepo === "ai-credit-monitor" &&
    !config.ownRepoDismissed
  ) {

    const warn =
      new Alert()

    warn.title =
      "ℹ️ Using Default Catalog"

    warn.message =
      "You're using the shared demo catalog. " +
      "It's recommended to use your own GitHub repo " +
      "to manage your providers independently.\n\n" +
      "Setup → 🐙 GitHub Repository to change it."

    warn.addAction(
      t("Got it")
    )

    await warn.presentSheet()

    config.ownRepoDismissed =
      true

    saveConfig()
  }

  const ACT = {
    VIEW: 0,
    INSTALL: 1,
    SETUP: 2,
    ABOUT: 3,
    HELP: 4
  }

  const installed =
    loadInstalledProviders()

  const alert =
    new Alert()

  alert.title =
    APP_NAME

  alert.message =
    installed.length === 0
      ? t("No providers installed yet.")
      : `${installed.length} ${t("provider(s) installed.")}`

  alert.addAction(
    t("View credits")
  )

  alert.addAction(
    t("Install provider")
  )

  alert.addAction(
    "⚙️ Setup"
  )

  alert.addAction(
    "ℹ️ About"
  )

  alert.addAction(
    "❓ " + t("Help")
  )

  alert.addCancelAction(
    t("Close")
  )


  const result =
    await alert.presentSheet()


  if (result === ACT.VIEW) {

    await showBalances()

  } else if (
    result === ACT.INSTALL
  ) {

    await installProviderFromCatalog()

  } else if (
    result === ACT.SETUP
  ) {

    await setupPage()

  } else if (
    result === ACT.ABOUT
  ) {

    await aboutPage()
  } else if (
    result === ACT.HELP
  ) {

    await helpPage()
  }
}


// ============================================================
// ABOUT PAGE
// ============================================================

async function aboutPage() {

  const installed =
    loadInstalledProviders()

  const table =
    new UITable()

  table.showSeparators =
    false


  // ── APP HEADER ──
  const header =
    new UITableRow()

  header.height =
    80

  const headerCell =
    header.addText(
      "🤖  " + APP_NAME,
      "v" + APP_VERSION
    )

  headerCell.titleFont =
    Font.boldSystemFont(24)

  headerCell.subtitleFont =
    Font.systemFont(14)

  headerCell.subtitleColor =
    new Color("#8E8E93")

  header.cellSpacing =
    0

  table.addRow(header)


  // ── DESCRIPTION ──
  const descRow =
    new UITableRow()

  descRow.height =
    60

  const descCell =
    descRow.addText(
      t("Monitor AI provider balances")
    )

  descCell.titleFont =
    Font.systemFont(15)

  descCell.titleColor =
    new Color("#8E8E93")

  descCell.cellSpacing =
    0

  table.addRow(descRow)


  // ── STATS ──
  const statsRow =
    new UITableRow()

  statsRow.height =
    50

  const provCell =
    statsRow.addText(
      installed.length +
        " " +
        t("provider(s) installed.")
    )

  provCell.titleFont =
    Font.systemFont(14)

  provCell.titleColor =
    Color.dynamic(
      new Color("#3C3C43"),
      new Color("#EBEBF5")
    )

  provCell.cellSpacing =
    0

  table.addRow(statsRow)


  // ── FEATURES SECTION ──
  const featSection =
    new UITableRow()

  featSection.height =
    32

  const featSectionCell =
    featSection.addText(
      "  " + t("Features").toUpperCase()
    )

  featSectionCell.titleFont =
    Font.boldSystemFont(12)

  featSectionCell.titleColor =
    new Color("#8E8E93")

  featSection.cellSpacing =
    0

  table.addRow(featSection)


  const features = [
    "📡  " + t("Dynamic provider catalog via GitHub"),
    "🔑  " + t("API keys stored in Keychain"),
    "📊  " + t("Balance history & trend arrows"),
    "📱  " + t("Home screen widget support"),
    "🌍  " + t("i18n: English + Dutch"),
    "🛡️  " + t("Your own repo, your own data")
  ]

  for (const feature of features) {

    const row =
      new UITableRow()

    row.height =
      44

    const cell =
      row.addText(feature)

    cell.titleFont =
      Font.systemFont(15)

    cell.titleColor =
      Color.dynamic(
        new Color("#3C3C43"),
        new Color("#EBEBF5")
      )

    cell.cellSpacing =
      0

    table.addRow(row)
  }


  // ── LINK ──
  const linkRow =
    new UITableRow()

  linkRow.height =
    44

  linkRow.dismissOnSelect =
    false

  const linkCell =
    linkRow.addText(
      "🔗  github.com/jphermans/ai-credit-monitor"
    )

  linkCell.titleFont =
    Font.systemFont(13)

  linkCell.titleColor =
    Color.dynamic(
      new Color("#007AFF"),
      new Color("#0A84FF")
    )

  linkCell.cellSpacing =
    0

  linkRow.onSelect =
    async () => {

      Safari.open(
        "https://github.com/jphermans/ai-credit-monitor"
      )
    }

  table.addRow(linkRow)


  // ── FOOTER ──
  const footerRow =
    new UITableRow()

  footerRow.height =
    70

  const footerCell =
    footerRow.addText(
      "Created by @jphermans\n" +
      "with Hermes AI Agent\n" +
      "Scriptable iOS • MIT License"
    )

  footerCell.titleFont =
    Font.systemFont(12)

  footerCell.titleColor =
    new Color("#8E8E93")

  footerCell.cellSpacing =
    0

  table.addRow(footerRow)


  await table.present()
}


// Helper: add a section header row to a UITable
function addTableSection(
  table,
  emoji,
  title
) {

  const sectionRow =
    new UITableRow()

  sectionRow.height =
    32

  const sectionCell =
    sectionRow.addText(
      "  " +
        emoji +
        " " +
        title.toUpperCase()
    )

  sectionCell.titleFont =
    Font.boldSystemFont(12)

  sectionCell.titleColor =
    new Color("#8E8E93")

  sectionRow.cellSpacing =
    0

  table.addRow(sectionRow)
}


// ============================================================
// HELP PAGE
// ============================================================

async function helpPage() {

  const table =
    new UITable()

  table.showSeparators =
    false


  // ── HEADER ──
  const header =
    new UITableRow()

  header.height =
    50

  const hCell =
    header.addText(
      "❓  " + t("Help & Guides")
    )

  hCell.titleFont =
    Font.boldSystemFont(20)

  table.addRow(header)


  // ── SECTION: SHORTCUTS ──
  addTableSection(
    table,
    "⚡",
    t("Apple Shortcuts")
  )

  const shortcuts = [
    ["💰", "Check All Balances", "shortcut_balances_help"],
    ["📊", "Total Remaining", "shortcut_total_help"],
    ["🔍", t("Single Provider"), "shortcut_provider_help"],
    ["🔄", "Refresh Widget", "shortcut_refresh_help"],
    ["❓", "Help", "shortcut_help_help"],
    ["🔔", t("Morning Check"), "shortcut_automation_help"]
  ]

  for (const sc of shortcuts) {
    const row = new UITableRow()
    row.addText(sc[0], sc[1])
    row.onSelect = async () => {
      await showHelpDetail(sc[1], t(sc[2]))
    }
    table.addRow(row)
  }


  // ── SECTION: SERVER VERSION ──
  addTableSection(
    table,
    "🖥",
    t("Server Version")
  )

  const server = [
    ["📋", t("What is it?"), "server_what_help"],
    ["🚀", t("Quick Start"), "server_quickstart_help"],
    ["🔑", t("API Keys"), "server_keys_help"],
    ["📡", "API Endpoints", "server_api_help"]
  ]

  for (const item of server) {
    const row = new UITableRow()
    row.addText(item[0], item[1])
    row.onSelect = async () => {
      await showHelpDetail(item[1], t(item[2]))
    }
    table.addRow(row)
  }


  // ── SECTION: TIPS ──
  addTableSection(
    table,
    "💡",
    t("Tips")
  )

  const tips = [
    ["🔄", t("Update Check"), "tips_update_help"],
    ["📡", t("Widget Setup"), "tips_widget_help"]
  ]

  for (const tip of tips) {
    const row = new UITableRow()
    row.addText(tip[0], tip[1])
    row.onSelect = async () => {
      await showHelpDetail(tip[1], t(tip[2]))
    }
    table.addRow(row)
  }


  table.present()
}


async function showHelpDetail(
  title,
  body
) {

  const alert =
    new Alert()

  alert.title = title

  alert.message = body

  alert.addAction(
    t("OK")
  )

  await alert.presentAlert()
}


// ============================================================
// SETUP PAGE
// ============================================================

async function setupPage() {

  const cfg =
    loadConfig()

  const installed =
    loadInstalledProviders()

  const table =
    new UITable()

  table.showSeparators =
    false

  const BG =
    Color.dynamic(
      new Color("#F2F2F7"),
      new Color("#1C1C1E")
    )

  const CARD_BG =
    Color.dynamic(
      Color.white(),
      new Color("#2C2C2E")
    )

  table.backgroundColor =
    BG


  // Header
  const header =
    new UITableRow()

  header.height =
    60

  header.backgroundColor =
    BG

  const headerCell =
    header.addText(
      t("Setup"),
      `${APP_NAME} v${APP_VERSION}`
    )

  headerCell.titleFont =
    Font.boldSystemFont(26)

  headerCell.subtitleFont =
    Font.systemFont(13)

  headerCell.subtitleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))

  header.cellSpacing =
    0

  table.addRow(header)


  // ── GITHUB SECTION ──
  const ghSection =
    new UITableRow()

  ghSection.height =
    32

  ghSection.backgroundColor =
    BG

  const ghSectionCell =
    ghSection.addText(
      "  GITHUB"
    )

  ghSectionCell.titleFont =
    Font.boldSystemFont(12)

  ghSectionCell.titleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))

  ghSection.cellSpacing =
    0

  table.addRow(ghSection)


  // Language row
  const languageRow =
    new UITableRow()

  languageRow.dismissOnSelect =
    false

  languageRow.backgroundColor =
    CARD_BG

  const langCell =
    languageRow.addText(
      "🌐  " + t("Language"),
      cfg.language === "nl"
        ? "Nederlands"
        : "English"
    )

  langCell.subtitleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))



  languageRow.onSelect =
    async () => {

      await configureLanguage()
    }

  table.addRow(
    languageRow
  )


  // Provider Catalog URL
  const catalogRow =
    new UITableRow()

  catalogRow.dismissOnSelect =
    false

  catalogRow.backgroundColor =
    CARD_BG

  const catalogCell =
    catalogRow.addText(
      "📚  " + t("Provider Catalog URL"),
      cfg.catalogUrl
        ? truncateMiddle(
            cfg.catalogUrl,
            40
          )
        : t("Not configured")
    )

  catalogCell.subtitleColor =
    cfg.catalogUrl
      ? Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))
      : Color.orange()



  catalogRow.onSelect =
    async () => {

      await configureCatalogUrl()
    }

  table.addRow(
    catalogRow
  )


  // GitHub repository
  const repoRow =
    new UITableRow()

  repoRow.dismissOnSelect =
    false

  repoRow.backgroundColor =
    CARD_BG

  const repoText =
    cfg.githubOwner &&
    cfg.githubRepo
      ? `${cfg.githubOwner}/${cfg.githubRepo}`
      : t("Not configured")

  const repoCell =
    repoRow.addText(
      "🐙  " + t("GitHub repository"),
      repoText
    )

  repoCell.subtitleColor =
    (cfg.githubOwner && cfg.githubRepo)
      ? Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))
      : Color.orange()



  repoRow.onSelect =
    async () => {

      await configureGitHubRepository()
    }

  table.addRow(
    repoRow
  )


  // GitHub token
  const tokenRow =
    new UITableRow()

  tokenRow.dismissOnSelect =
    false

  tokenRow.backgroundColor =
    CARD_BG

  const tokenStatus =
    hasGitHubToken()
      ? "✅  " + t("Configured")
      : "⚠️  " + t("Not configured")

  const tokenCell =
    tokenRow.addText(
      "🔑  " + t("GitHub token"),
      tokenStatus
    )

  tokenCell.subtitleColor =
    hasGitHubToken()
      ? Color.green()
      : Color.orange()



  tokenRow.onSelect =
    async () => {

      await configureGitHubToken()
    }

  table.addRow(
    tokenRow
  )


  // GitHub test
  const testGitHub =
    new UITableRow()

  testGitHub.dismissOnSelect =
    false

  testGitHub.backgroundColor =
    CARD_BG

  const testCell =
    testGitHub.addText(
      "🧪  " + t("Test GitHub connection"),
      t("Check repository and providers.json")
    )

  testCell.subtitleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))



  testGitHub.onSelect =
    async () => {

      await testGitHubConfiguration()
    }

  table.addRow(
    testGitHub
  )


  // Add provider to catalog
  const addGitHub =
    new UITableRow()

  addGitHub.dismissOnSelect =
    false

  addGitHub.backgroundColor =
    CARD_BG

  const addCell =
    addGitHub.addText(
      "➕  " + t("Add provider to catalog"),
      t("Add provider to providers.json")
    )

  addCell.subtitleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))



  addGitHub.onSelect =
    async () => {

      await createProviderWizard()
    }

  table.addRow(
    addGitHub
  )


  // ── REFRESH SECTION ──
  const refreshSection =
    new UITableRow()

  refreshSection.height =
    32

  refreshSection.backgroundColor =
    BG

  const refreshSectionCell =
    refreshSection.addText(
      "  " + t("Refresh interval").toUpperCase()
    )

  refreshSectionCell.titleFont =
    Font.boldSystemFont(12)

  refreshSectionCell.titleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))

  refreshSection.cellSpacing =
    0

  table.addRow(refreshSection)


  const refreshRow =
    new UITableRow()

  refreshRow.dismissOnSelect =
    false

  refreshRow.backgroundColor =
    CARD_BG

  const refreshCell =
    refreshRow.addText(
      "⏱️  " + t("Refresh interval"),
      `${cfg.refreshMinutes} ${t("minutes")}`
    )

  refreshCell.subtitleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))



  refreshRow.onSelect =
    async () => {

      await configureRefreshInterval()
    }

  table.addRow(
    refreshRow
  )


  // ── INSTALLED PROVIDERS SECTION ──
  if (installed.length > 0) {

    const provSection =
      new UITableRow()

    provSection.height =
      32

    provSection.backgroundColor =
      BG

    const provSectionCell =
      provSection.addText(
        "  " + t("Installed providers").toUpperCase()
      )

    provSectionCell.titleFont =
      Font.boldSystemFont(12)

    provSectionCell.titleColor =
      Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))

    provSection.cellSpacing =
      0

    table.addRow(provSection)


    for (const provider of installed) {

      const row =
        new UITableRow()

      row.dismissOnSelect =
        false

      row.backgroundColor =
        CARD_BG

      const hasKey =
        hasProviderKey(provider)

      const provCell =
        row.addText(
          provider.name,
          hasKey
            ? `✅  v${provider.version}`
            : "⚠️  " + t("API key missing")
        )

      provCell.subtitleColor =
        hasKey
          ? Color.green()
          : Color.orange()



      row.onSelect =
        async () => {

          await providerSetup(
            provider
          )
        }

      table.addRow(
        row
      )
    }
  }


  // ── SYSTEM SECTION ──
  const sysSection =
    new UITableRow()

  sysSection.height =
    32

  sysSection.backgroundColor =
    BG

  const sysSectionCell =
    sysSection.addText(
      "  SYSTEM"
    )

  sysSectionCell.titleFont =
    Font.boldSystemFont(12)

  sysSectionCell.titleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))

  sysSection.cellSpacing =
    0

  table.addRow(sysSection)


  // Discovery Backend
  const discoveryRow =
    new UITableRow()

  discoveryRow.dismissOnSelect =
    false

  discoveryRow.backgroundColor =
    CARD_BG

  const discoveryCell =
    discoveryRow.addText(
      "🔍  " + t("Discovery Backend"),
      cfg.discoveryUrl
        ? truncateMiddle(
            cfg.discoveryUrl,
            30
          )
        : "⏸️  " + t("Disabled")
    )

  discoveryCell.subtitleColor =
    cfg.discoveryUrl
      ? Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))
      : Color.dynamic(new Color("#C7C7CC"), new Color("#48484A"))



  discoveryRow.onSelect =
    async () => {

      await configureDiscoveryUrl()
    }

  table.addRow(
    discoveryRow
  )


  // Export config
  const exportRow =
    new UITableRow()

  exportRow.dismissOnSelect =
    false

  exportRow.backgroundColor =
    CARD_BG

  const exportCell =
    exportRow.addText(
      "📋  " + t("Export config"),
      t("Copy configuration summary to clipboard")
    )

  exportCell.subtitleColor =
    Color.dynamic(new Color("#3C3C43"), new Color("#EBEBF5"))



  exportRow.onSelect =
    async () => {

      await exportConfigSummary()
    }

  table.addRow(
    exportRow
  )


  await table.present()
}


// ============================================================
// LANGUAGE SETUP
// ============================================================

async function configureLanguage() {

  const cfg =
    loadConfig()

  const alert =
    new Alert()

  alert.title =
    t("Language")

  alert.message =
    "English\nNederlands"

  alert.addAction(
    "English"
  )

  alert.addAction(
    "Nederlands"
  )

  alert.addCancelAction(
    t("Cancel")
  )

  const choice =
    await alert.present()

  if (
    choice !== -1
  ) {

    cfg.language =
      choice === 1
        ? "nl"
        : "en"

    saveConfig(
      cfg
    )
  }
}


// ============================================================
// CATALOG URL SETUP
// ============================================================

async function configureCatalogUrl() {

  const ACT = {
    SAVE: 0,
    DELETE: 1,
    CANCEL: 2
  }

  const cfg =
    loadConfig()

  const alert =
    new Alert()

  alert.title =
    "Provider Catalog"

  alert.message =
    t("Use the Raw GitHub URL to providers.json.")

  alert.addTextField(
    "https://raw.githubusercontent.com/...",
    cfg.catalogUrl
  )

  alert.addAction(
    t("Test & save")
  )

  alert.addDestructiveAction(
    t("Delete")
  )

  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentAlert()


  if (result === ACT.SAVE) {

    const url =
      fieldValue(
        alert,
        0
      )


    if (!isHttpsUrl(url)) {

      await showMessage(
        t("Invalid URL"),
        t("Only HTTPS URLs are allowed.")
      )

      return
    }


    try {

      const catalog =
        await fetchJSON(
          url
        )

      validateCatalog(
        catalog
      )


      cfg.catalogUrl =
        url

      saveConfig(
        cfg
      )


      await showMessage(
        "Provider Catalog",
        `✅ ${t("Connection OK")}\n\n${catalog.providers.length} ${t("provider(s) found.")}`
      )

    } catch (error) {

      await showMessage(
        t("Catalog error"),
        cleanError(
          error
        )
      )
    }

  } else if (
    result === ACT.DELETE
  ) {

    cfg.catalogUrl =
      ""

    saveConfig(
      cfg
    )
  }
}


// ============================================================
// GITHUB REPOSITORY SETUP
// ============================================================

async function configureGitHubRepository() {

  const ACT = {
    SAVE: 0,
    CANCEL: 1,
    PASTE_URL: 2
  }

  const cfg =
    loadConfig()

  const alert =
    new Alert()

  alert.title =
    t("GitHub repository")

  alert.message =
    t("Repository containing providers.json.")

  alert.addTextField(
    "Owner / username",
    cfg.githubOwner
  )

  alert.addTextField(
    t("Repository"),
    cfg.githubRepo
  )

  alert.addTextField(
    t("Branch"),
    cfg.githubBranch
  )

  alert.addTextField(
    "providers.json",
    cfg.githubPath
  )

  alert.addAction(
    t("Save")
  )

  alert.addAction(
    t("Paste GitHub URL")
  )

  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentAlert()


  if (result === ACT.CANCEL) {
    return
  }


  // ---- Paste URL flow ----
  if (result === ACT.PASTE_URL) {

    await pasteGitHubUrl()
    return
  }


  // ---- Manual save flow ----
  const owner =
    fieldValue(
      alert,
      0
    )

  const repo =
    fieldValue(
      alert,
      1
    )

  const branch =
    fieldValue(
      alert,
      2
    )

  const path =
    fieldValue(
      alert,
      3
    )


  if (
    !owner ||
    !repo ||
    !branch ||
    !path
  ) {

    await showMessage(
      t("Missing data"),
      t("Fill in all GitHub fields.")
    )

    return
  }


  cfg.githubOwner =
    owner

  cfg.githubRepo =
    repo

  cfg.githubBranch =
    branch

  cfg.githubPath =
    path

  cfg.catalogUrl =
    buildRawGitHubUrl(
      cfg
    )


  saveConfig(
    cfg
  )


  await showMessage(
    "GitHub",
    t("Repository saved.") + "\n\n" +
      t("The Raw Catalog URL was automatically adjusted.")
  )
}


// ============================================================
// PASTE GITHUB URL SETUP
// ============================================================

async function pasteGitHubUrl() {

  const cfg =
    loadConfig()

  const alert =
    new Alert()

  alert.title =
    t("Paste GitHub URL")

  alert.message =
    t("Enter a GitHub URL (e.g. https://github.com/owner/repo) or owner/repo")

  alert.addTextField(
    "https://github.com/owner/repo",
    ""
  )

  alert.addAction(
    t("Parse & continue")
  )

  alert.addCancelAction(
    t("Cancel")
  )


  const ACT = {
    PARSE: 0,
    CANCEL: 1
  }

  const result =
    await alert.presentAlert()


  if (result === ACT.CANCEL) {
    return
  }


  const raw =
    fieldValue(
      alert,
      0
    ).trim()


  if (!raw) {

    await showMessage(
      t("Missing data"),
      t("Enter at least owner and repository.")
    )

    return
  }


  // Parse the input
  let owner = ""
  let repo = ""

  // Full URL: https://github.com/owner/repo
  // Short: github.com/owner/repo
  // Shortest: owner/repo
  const urlMatch =
    raw.match(
      /(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/\s]+)/i
    )

  if (urlMatch) {

    owner = urlMatch[1]
    repo = urlMatch[2]
  } else if (
    raw.includes("/")
    && !raw.includes("://")
    && !raw.includes(".")
  ) {

    // owner/repo format
    const parts =
      raw.split("/")

    owner = parts[0]
    repo = parts[1]
  }


  if (
    !owner ||
    !repo
  ) {

    await showMessage(
      t("Could not parse GitHub URL."),
      t("Enter at least owner and repository.")
    )

    return
  }


  cfg.githubOwner =
    owner

  cfg.githubRepo =
    repo

  if (
    !cfg.githubBranch
  ) {

    cfg.githubBranch =
      "main"
  }

  if (
    !cfg.githubPath
  ) {

    cfg.githubPath =
      "providers.json"
  }

  cfg.catalogUrl =
    buildRawGitHubUrl(
      cfg
    )

  saveConfig(
    cfg
  )


  await showMessage(
    "GitHub",
    t("Repository saved.") + "\n\n" +
      `${owner}/${repo} → ${cfg.catalogUrl}`
  )
}


// ============================================================
// REFRESH INTERVAL SETUP
// ============================================================

async function configureRefreshInterval() {

  const ACT = {
    SAVE: 0,
    CANCEL: 1
  }

  const cfg =
    loadConfig()

  const alert =
    new Alert()

  alert.title =
    t("Refresh interval")

  alert.message =
    t("Interval in minutes for widget refresh (5 - 1440).\n\nCurrent: ") +
    `${cfg.refreshMinutes} ${t("minutes")}`

  alert.addTextField(
    t("Minutes"),
    String(
      cfg.refreshMinutes
    )
  )

  alert.addAction(
    t("Save")
  )

  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentAlert()


  if (result !== ACT.SAVE) {
    return
  }


  const value =
    Number(
      fieldValue(
        alert,
        0
      )
    )


  if (
    !Number.isFinite(
      value
    ) ||
    value < 5 ||
    value > 1440
  ) {

    await showMessage(
      t("Refresh interval"),
      t("Enter a number between 5 and 1440 minutes.")
    )

    return
  }


  cfg.refreshMinutes =
    Math.round(
      value
    )

  saveConfig(
    cfg
  )


  await showMessage(
    t("Refresh interval"),
    `✅ ${t("Refresh interval set to")} ${cfg.refreshMinutes} ${t("minutes")}.`
  )
}


// ============================================================
// BUILD RAW GITHUB URL
// ============================================================

function buildRawGitHubUrl(
  cfg
) {

  return (
    "https://raw.githubusercontent.com/" +
    `${cfg.githubOwner}/` +
    `${cfg.githubRepo}/` +
    `${cfg.githubBranch}/` +
    `${cfg.githubPath}`
  )
}


// ============================================================
// GITHUB TOKEN
// ============================================================

function hasGitHubToken() {

  return Keychain.contains(
    KEYCHAIN_GITHUB
  )
}


function getGitHubToken() {

  if (!hasGitHubToken()) {
    return null
  }


  return Keychain.get(
    KEYCHAIN_GITHUB
  )
}


async function configureGitHubToken() {

  const ACT = {
    CHANGE: 0,
    DELETE: 1
  }

  const exists =
    hasGitHubToken()

  const alert =
    new Alert()

  alert.title =
    "GitHub token"

  alert.message =
    exists
      ? t("A token is set. The token is never displayed.")
      : t("Use a fine-grained token with Contents: Read and write.")

  alert.addAction(
    exists
      ? t("Change token")
      : t("Add token")
  )


  if (exists) {

    alert.addDestructiveAction(
      t("Remove token")
    )
  }

  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentSheet()


  if (result === ACT.CHANGE) {

    const input =
      new Alert()

    input.title =
      "GitHub token"

    input.message =
      t("The token is stored exclusively in Scriptable Keychain.")

    input.addSecureTextField(
      "github_pat_..."
    )

    input.addAction(
      t("Save")
    )

    input.addCancelAction(
      t("Cancel")
    )


    const saveResult =
      await input.presentAlert()


    if (saveResult !== 0) {
      return
    }


    const token =
      fieldValue(
        input,
        0
      )


    if (!token) {

      await showMessage(
        "GitHub",
        t("No token entered.")
      )

      return
    }


    Keychain.set(
      KEYCHAIN_GITHUB,
      token
    )


    await showMessage(
      "GitHub",
      t("Token saved securely.")
    )


  } else if (
    exists &&
    result === ACT.DELETE
  ) {

    Keychain.remove(
      KEYCHAIN_GITHUB
    )


    await showMessage(
      "GitHub",
      t("GitHub token deleted.")
    )
  }
}


// ============================================================
// GITHUB API URL
// ============================================================

function githubContentsApiUrl(
  cfg
) {

  return (
    "https://api.github.com/repos/" +
    encodeURIComponent(
      cfg.githubOwner
    ) +
    "/" +
    encodeURIComponent(
      cfg.githubRepo
    ) +
    "/contents/" +
    cfg.githubPath
      .split("/")
      .map(
        encodeURIComponent
      )
      .join("/")
  )
}


// ============================================================
// GITHUB HEADERS
// ============================================================

function githubHeaders(
  token
) {

  return {
    "Accept":
      "application/vnd.github+json",

    "Authorization":
      `Bearer ${token}`,

    "X-GitHub-Api-Version":
      "2022-11-28",

    "User-Agent":
      "AI-Credit-Monitor-Scriptable"
  }
}


// ============================================================
// TEST GITHUB
// ============================================================

async function testGitHubConfiguration() {

  try {

    const cfg =
      loadConfig()

    validateGitHubSettings(
      cfg
    )


    const token =
      getGitHubToken()


    if (!token) {

      throw new Error(
        t("GitHub token not set.")
      )
    }


    const apiUrl =
      githubContentsApiUrl(
        cfg
      ) +
      "?ref=" +
      encodeURIComponent(
        cfg.githubBranch
      )


    const request =
      new Request(
        apiUrl
      )

    request.method =
      "GET"

    request.headers =
      githubHeaders(
        token
      )

    request.timeoutInterval =
      20


    const response =
      await request.loadJSON()


    const status =
      request.response
        ?.statusCode


    if (
      status < 200 ||
      status >= 300
    ) {

      await showMessage(
        "GitHub Debug",
        "Status: " +
        status +
        "\n\nURL:\n" +
        apiUrl +
        "\n\nMessage:\n" +
        (
          response?.message ||
          JSON.stringify(
            response
          )
        )
      )

      return
    }


    await showMessage(
      t("GitHub connection OK"),
      "✅ HTTP " +
      status +
      "\n\nRepository:\n" +
      cfg.githubOwner +
      "/" +
      cfg.githubRepo +
      "\n\nBranch:\n" +
      cfg.githubBranch +
      `\n\n${t("File")}:\n` +
      cfg.githubPath +
      "\n\nSHA:\n" +
      response.sha
    )


  } catch (error) {

    await showMessage(
      t("GitHub error"),
      cleanError(
        error
      )
    )
  }
}


// ============================================================
// GET CATALOG VIA GITHUB API
// ============================================================

async function githubGetCatalog() {

  const cfg =
    loadConfig()

  validateGitHubSettings(
    cfg
  )


  const token =
    getGitHubToken()


  if (!token) {

    throw new Error(
      t("GitHub token not set.")
    )
  }


  const url =
    githubContentsApiUrl(
      cfg
    ) +
    "?ref=" +
    encodeURIComponent(
      cfg.githubBranch
    )


  const request =
    new Request(
      url
    )

  request.method =
    "GET"

  request.headers =
    githubHeaders(
      token
    )

  request.timeoutInterval =
    20


  const response =
    await request.loadJSON()


  const status =
    request.response
      ?.statusCode


  if (
    status < 200 ||
    status >= 300
  ) {

    throw new Error(
      getApiError(
        response,
        status
      )
    )
  }


  if (
    !response.content ||
    !response.sha
  ) {

    throw new Error(
      t("GitHub response does not contain a file or SHA.")
    )
  }


  const content =
    String(
      response.content
    ).replace(
      /\n/g,
      ""
    )


  const data =
    Data.fromBase64String(
      content
    )


  if (!data) {

    throw new Error(
      t("providers.json could not be read from Base64.")
    )
  }


  const jsonText =
    data.toRawString()


  const catalog =
    JSON.parse(
      jsonText
    )


  return {
    catalog,
    sha:
      response.sha,
    config:
      cfg
  }
}


// ============================================================
// SAVE CATALOG TO GITHUB
// ============================================================

async function githubSaveCatalog(
  catalog,
  sha,
  commitMessage
) {

  const cfg =
    loadConfig()

  validateGitHubSettings(
    cfg
  )


  const token =
    getGitHubToken()


  if (!token) {

    throw new Error(
      t("GitHub token missing.")
    )
  }


  const json =
    JSON.stringify(
      catalog,
      null,
      2
    ) + "\n"


  const encoded =
    Data
      .fromString(
        json
      )
      .toBase64String()


  const body = {
    message:
      commitMessage,

    content:
      encoded,

    sha:
      sha,

    branch:
      cfg.githubBranch
  }


  const request =
    new Request(
      githubContentsApiUrl(
        cfg
      )
    )


  request.method =
    "PUT"


  request.headers = {
    ...githubHeaders(
      token
    ),

    "Content-Type":
      "application/json"
  }


  request.body =
    JSON.stringify(
      body
    )


  request.timeoutInterval =
    30


  const response =
    await request.loadJSON()


  const status =
    request.response
      ?.statusCode


  if (
    status < 200 ||
    status >= 300
  ) {

    throw new Error(
      getApiError(
        response,
        status
      )
    )
  }


  return response
}


// ============================================================
// PROVIDER CREATION WIZARD
// ============================================================

async function createProviderWizard() {

  try {

    const github =
      await githubGetCatalog()

    const catalog =
      github.catalog

    validateCatalog(
      catalog
    )


    // ========================================================
    // STEP 1 - IDENTITY
    // ========================================================

    const ACT_IDENTITY = {
      NEXT: 0,
      CANCEL: 1
    }

    const identity =
      new Alert()


    identity.title =
      t("New provider")

    identity.message =
      t("General provider information.")


    identity.addTextField(
      t("ID, e.g. openrouter")
    )

    identity.addTextField(
      t("Name, e.g. OpenRouter")
    )

    identity.addTextField(
      t("Version"),
      "1.0.0"
    )

    identity.addTextField(
      t("Description")
    )


    identity.addAction(
      t("Next")
    )

    identity.addCancelAction(
      t("Cancel")
    )


    let result =
      await identity.presentAlert()


    if (result !== ACT_IDENTITY.NEXT) {
      return
    }


    const id =
      fieldValue(
        identity,
        0
      ).toLowerCase()


    const name =
      fieldValue(
        identity,
        1
      )


    const version =
      fieldValue(
        identity,
        2
      )


    const description =
      fieldValue(
        identity,
        3
      )


    if (
      !id ||
      !name ||
      !version
    ) {

      throw new Error(
        t("ID, name and version are required.")
      )
    }


    if (
      !/^[a-z0-9-_]+$/.test(
        id
      )
    ) {

      throw new Error(
        t("Provider ID can only contain a-z, 0-9, - and _.")
      )
    }


    if (
      catalog.providers.some(
        p =>
          p.id === id
      )
    ) {

      throw new Error(
        `Provider '${id}' ${t("already exists.")}`
      )
    }


    // ========================================================
    // STEP 2 - AUTH TYPE
    // ========================================================

    const ACT_AUTH = {
      BEARER: 0,
      HEADER: 1,
      NONE: 2
    }

    const authAlert =
      new Alert()


    authAlert.title =
      t("Authentication")

    authAlert.message =
      t("How is the API key sent?")


    authAlert.addAction(
      "Bearer token"
    )

    authAlert.addAction(
      "Custom header"
    )

    authAlert.addAction(
      t("No authentication")
    )

    authAlert.addCancelAction(
      t("Cancel")
    )


    result =
      await authAlert.presentSheet()


    if (result < 0) {
      return
    }


    let auth


    if (result === ACT_AUTH.BEARER) {

      auth = {
        type:
          "bearer",

        keyLabel:
          `${name} API Key`,

        header:
          "Authorization",

        prefix:
          "Bearer "
      }


    } else if (
      result === ACT_AUTH.HEADER
    ) {

      const ACT_HEADER = {
        NEXT: 0,
        CANCEL: 1
      }

      const headerAlert =
        new Alert()


      headerAlert.title =
        "Custom header"

      headerAlert.message =
        t("Enter the name of the HTTP header.")


      headerAlert.addTextField(
        "Header",
        "X-API-Key"
      )

      headerAlert.addTextField(
        "Prefix",
        ""
      )


      headerAlert.addAction(
        t("Next")
      )

      headerAlert.addCancelAction(
        t("Cancel")
      )


      result =
        await headerAlert.presentAlert()


      if (result !== ACT_HEADER.NEXT) {
        return
      }


      const headerName =
        fieldValue(
          headerAlert,
          0
        )


      if (!headerName) {

        throw new Error(
          t("Header name missing.")
        )
      }


      auth = {
        type:
          "header",

        keyLabel:
          `${name} API Key`,

        header:
          headerName,

        prefix:
          fieldValue(
            headerAlert,
            1
          )
      }

    } else {

      auth = {
        type:
          "none"
      }
    }


    // ========================================================
    // STEP 3A - API ENDPOINT
    // ========================================================

    const ACT_ENDPOINT = {
      NEXT: 0,
      CANCEL: 1
    }

    const endpointAlert =
      new Alert()


    endpointAlert.title =
      "API Endpoint"

    endpointAlert.message =
      t("Enter the balance/credits endpoint of the provider.")


    endpointAlert.addTextField(
      "https://api.example.com/balance",
      ""
    )


    endpointAlert.addAction(
      t("Next")
    )

    endpointAlert.addCancelAction(
      t("Cancel")
    )


    result =
      await endpointAlert.presentAlert()


    if (result !== ACT_ENDPOINT.NEXT) {
      return
    }


    const apiUrl =
      fieldValue(
        endpointAlert,
        0
      )


    if (!apiUrl) {

      throw new Error(
        t("API endpoint missing.")
      )
    }


    if (!isHttpsUrl(apiUrl)) {

      throw new Error(
        t("The API endpoint must use HTTPS.")
      )
    }


    // ========================================================
    // STEP 3B - HTTP METHOD
    // ========================================================

    const ACT_METHOD = {
      GET: 0,
      POST: 1
    }

    const methodAlert =
      new Alert()


    methodAlert.title =
      t("HTTP method")

    methodAlert.message =
      apiUrl


    methodAlert.addAction(
      "GET"
    )

    methodAlert.addAction(
      "POST"
    )

    methodAlert.addCancelAction(
      t("Cancel")
    )


    result =
      await methodAlert.presentSheet()


    if (result < 0) {
      return
    }


    const method =
      result === ACT_METHOD.GET
        ? "GET"
        : "POST"


    // ========================================================
    // STEP 4 - RESPONSE TYPE
    // ========================================================

    const ACT_MODE = {
      SINGLE: 0,
      DIFFERENCE: 1,
      ARRAY: 2
    }

    const modeAlert =
      new Alert()


    modeAlert.title =
      "Response type"

    modeAlert.message =
      t("How is the remaining balance in the JSON response?")


    modeAlert.addAction(
      t("Single balance field")
    )

    modeAlert.addAction(
      t("Total minus used")
    )

    modeAlert.addAction(
      t("Array with currencies")
    )

    modeAlert.addCancelAction(
      t("Cancel")
    )


    result =
      await modeAlert.presentSheet()


    if (result < 0) {
      return
    }


    let response


    // ========================================================
    // SINGLE
    // ========================================================

    if (result === ACT_MODE.SINGLE) {

      const ACT_RESPONSE = {
        NEXT: 0,
        CANCEL: 1
      }

      const responseAlert =
        new Alert()


      responseAlert.title =
        t("Balance field")

      responseAlert.message =
        t("Example JSON path: data.balance")


      responseAlert.addTextField(
        "JSON path",
        "data.balance"
      )

      responseAlert.addTextField(
        t("Currency"),
        "USD"
      )

      responseAlert.addTextField(
        "Label",
        "Remaining credits"
      )


      responseAlert.addAction(
        t("Next")
      )

      responseAlert.addCancelAction(
        t("Cancel")
      )


      result =
        await responseAlert.presentAlert()


      if (result !== ACT_RESPONSE.NEXT) {
        return
      }


      const amountPath =
        fieldValue(
          responseAlert,
          0
        )


      if (!amountPath) {

        throw new Error(
          "JSON path ontbreekt."
        )
      }


      response = {
        mode:
          "single",

        amountPath,

        currency:
          fieldValue(
            responseAlert,
            1
          ) || "USD",

        label:
          fieldValue(
            responseAlert,
            2
          ) ||
          "Remaining credits",

        errorPath:
          "error.message"
      }


    // ========================================================
    // DIFFERENCE
    // ========================================================

    } else if (
      result === ACT_MODE.DIFFERENCE
    ) {

      const ACT_RESPONSE = {
        NEXT: 0,
        CANCEL: 1
      }

      const responseAlert =
        new Alert()


      responseAlert.title =
        t("Credit fields")

      responseAlert.message =
        t("The remaining balance is calculated as total minus used.")


      responseAlert.addTextField(
        "Total JSON path",
        "data.total_credits"
      )

      responseAlert.addTextField(
        "Used JSON path",
        "data.total_usage"
      )

      responseAlert.addTextField(
        t("Currency"),
        "USD"
      )

      responseAlert.addTextField(
        "Label",
        "Remaining credits"
      )


      responseAlert.addAction(
        t("Next")
      )

      responseAlert.addCancelAction(
        t("Cancel")
      )


      result =
        await responseAlert.presentAlert()


      if (result !== ACT_RESPONSE.NEXT) {
        return
      }


      const totalPath =
        fieldValue(
          responseAlert,
          0
        )


      const usedPath =
        fieldValue(
          responseAlert,
          1
        )


      if (
        !totalPath ||
        !usedPath
      ) {

        throw new Error(
          t("Total and Used JSON paths are required.")
        )
      }


      response = {
        mode:
          "difference",

        totalPath,

        usedPath,

        currency:
          fieldValue(
            responseAlert,
            2
          ) || "USD",

        label:
          fieldValue(
            responseAlert,
            3
          ) ||
          "Remaining credits",

        errorPath:
          "error.message"
      }


    // ========================================================
    // ARRAY
    // ========================================================

    } else {

      const ACT_RESPONSE = {
        NEXT: 0,
        CANCEL: 1
      }

      const responseAlert =
        new Alert()


      responseAlert.title =
        "Array response"

      responseAlert.message =
        t("For APIs that return multiple balances or currencies.")


      responseAlert.addTextField(
        "Array JSON path",
        "balance_infos"
      )

      responseAlert.addTextField(
        "Amount field",
        "total_balance"
      )

      responseAlert.addTextField(
        "Currency field",
        "currency"
      )

      responseAlert.addTextField(
        "Preferred currency",
        "USD"
      )


      responseAlert.addAction(
        t("Next")
      )

      responseAlert.addCancelAction(
        t("Cancel")
      )


      result =
        await responseAlert.presentAlert()


      if (result !== ACT_RESPONSE.NEXT) {
        return
      }


      const arrayPath =
        fieldValue(
          responseAlert,
          0
        )


      const amountField =
        fieldValue(
          responseAlert,
          1
        )


      if (
        !arrayPath ||
        !amountField
      ) {

        throw new Error(
          t("Array path and amount field are required.")
        )
      }


      response = {
        mode:
          "array",

        arrayPath,

        amountField,

        currencyField:
          fieldValue(
            responseAlert,
            2
          ) || "currency",

        preferredCurrency:
          fieldValue(
            responseAlert,
            3
          ) || "USD",

        label:
          "Account balance",

        errorPath:
          "error.message"
      }
    }


    // ========================================================
    // BUILD PROVIDER
    // ========================================================

    const provider = {
      id,
      name,
      version,
      description,

      auth,

      request: {
        method,
        url:
          apiUrl
      },

      response
    }


    // ========================================================
    // VALIDATE
    // ========================================================

    const validation =
      validateProvider(
        provider
      )


    if (!validation.ok) {

      throw new Error(
        validation.error
      )
    }


    // ========================================================
    // PREVIEW
    // ========================================================

    const ACT_PREVIEW = {
      ADD: 0,
      CANCEL: 1
    }

    const preview =
      new Alert()


    preview.title =
      t("Add provider?")


    preview.message =
      `${provider.name}\n\n` +
      `ID: ${provider.id}\n` +
      `Versie: ${provider.version}\n` +
      `Methode: ${provider.request.method}\n` +
      `Endpoint:\n${provider.request.url}\n\n` +
      `Response mode: ${provider.response.mode}`


    preview.addAction(
      t("Add to GitHub")
    )

    preview.addCancelAction(
      t("Cancel")
    )


    result =
      await preview.presentAlert()


    if (result !== ACT_PREVIEW.ADD) {
      return
    }


    // ========================================================
    // WRITE TO GITHUB
    // ========================================================

    catalog.providers.push(
      provider
    )


    catalog.updated =
      new Date()
        .toISOString()
        .substring(
          0,
          10
        )


    await githubSaveCatalog(
      catalog,
      github.sha,
      `Add ${provider.name} provider`
    )


    // ========================================================
    // OFFER LOCAL INSTALLATION
    // ========================================================

    const ACT_INSTALL = {
      INSTALL: 0,
      LATER: 1
    }

    const installAlert =
      new Alert()


    installAlert.title =
      t("Provider added")


    installAlert.message =
      `✅ ${provider.name} ${t("was added to providers.json on GitHub.\n\nDo you want to install this provider on this device now?")}`


    installAlert.addAction(
      t("Install")
    )

    installAlert.addCancelAction(
      t("Later")
    )


    const installResult =
      await installAlert.presentAlert()


    if (installResult !== ACT_INSTALL.INSTALL) {

      return
    }


    // ========================================================
    // INSTALL LOCALLY
    // ========================================================

    const installed =
      loadInstalledProviders()


    const alreadyInstalled =
      installed.some(
        p =>
          p.id ===
          provider.id
      )


    if (!alreadyInstalled) {

      installed.push(
        provider
      )


      saveInstalledProviders(
        installed
      )
    }


    // ========================================================
    // REQUEST API KEY
    // ========================================================

    if (
      provider.auth?.type !==
      "none"
    ) {

      const keySaved =
        await configureProviderKey(
          provider
        )


      if (keySaved) {

        const ACT_TEST = {
          TEST: 0,
          LATER: 1
        }

        const testAlert =
          new Alert()

        testAlert.title =
          `${provider.name} geïnstalleerd`

        testAlert.message =
          t("Provider installed and API key saved securely.\n\nDo you want to test the connection now?")

        testAlert.addAction(
          "Verbinding testen"
        )

        testAlert.addCancelAction(
          t("Later")
        )


        const testResult =
          await testAlert.presentAlert()


        if (testResult === ACT_TEST.TEST) {

          const balance =
            await fetchProviderBalance(
              provider,
              true
            )


          await showMessage(
            provider.name,

            balance.success
              ? `✅ ${t("Connection OK")}\n\n${t("Balance:")}: ${formatMoney(
                  balance.amount,
                  balance.currency
                )}`
              : `❌ ${t("Connection failed")}\n\n${balance.error}`
          )
        }

      } else {

        await showMessage(
          provider.name,
          t("Provider installed.\n\nThe API key is not set yet. You can add it later via Setup.")
        )
      }

    } else {

      await showMessage(
        provider.name,
        t("Provider installed.")
      )
    }


  } catch (error) {

    await showMessage(
      t("Adding provider failed"),
      cleanError(
        error
      )
    )
  }
}


// ============================================================
// INSTALL PROVIDER FROM CATALOG
// ============================================================

async function installProviderFromCatalog() {

  const cfg =
    loadConfig()


  if (!cfg.catalogUrl) {

    await showMessage(
      t("No catalog"),
      t("Set the Provider Catalog URL first via Setup.")
    )

    return
  }


  try {

    const catalog =
      await fetchJSON(
        cfg.catalogUrl
      )


    validateCatalog(
      catalog
    )


    if (
      catalog.providers.length ===
      0
    ) {

      await showMessage(
        "Provider Catalog",
        t("The provider catalog is empty.\n\nAdd a provider first via Setup → Add provider to catalog.")
      )

      return
    }


    const installed =
      loadInstalledProviders()


    const installedIds =
      installed.map(
        p =>
          p.id
      )


    const available =
      catalog.providers.filter(
        p =>
          !installedIds.includes(
            p.id
          )
      )


    if (
      available.length ===
      0
    ) {

      await showMessage(
        "Provider Catalog",
        t("All providers from the catalog are already installed.")
      )

      return
    }


    const alert =
      new Alert()


    alert.title =
      t("Install from catalog")

    alert.message =
      t("Choose a provider from the GitHub catalog.")


    for (const provider of available) {

      alert.addAction(
        provider.name
      )
    }

    alert.addCancelAction(
      t("Cancel")
    )


    const result =
      await alert.presentSheet()


    if (
      result < 0 ||
      result >=
        available.length
    ) {

      return
    }


    const provider =
      available[result]


    const validation =
      validateProvider(
        provider
      )


    if (!validation.ok) {

      throw new Error(
        validation.error
      )
    }


    installed.push(
      provider
    )


    saveInstalledProviders(
      installed
    )


    if (
      provider.auth?.type !==
      "none"
    ) {

      const keySaved =
        await configureProviderKey(
          provider
        )


      if (!keySaved) {

        await showMessage(
          provider.name,
          t("Provider installed, but the API key is not set yet.")
        )

        return
      }
    }


    const ACT_TEST = {
      TEST: 0,
      LATER: 1
    }

    const testAlert =
      new Alert()

    testAlert.title =
      `${provider.name} geïnstalleerd`

    testAlert.message =
      t("Provider is installed.\n\nDo you want to test the connection now?")

    testAlert.addAction(
      "Verbinding testen"
    )

    testAlert.addCancelAction(
      t("Later")
    )


    const testResult =
      await testAlert.presentAlert()


    if (testResult === ACT_TEST.TEST) {

      const balance =
        await fetchProviderBalance(
          provider,
          true
        )


      await showMessage(
        provider.name,

        balance.success
          ? `✅ Verbinding OK\n\nSaldo: ${formatMoney(
              balance.amount,
              balance.currency
            )}`
          : `❌ ${t("Connection failed")}\n\n${balance.error}`
      )
    }


  } catch (error) {

    await showMessage(
      t("Installation failed"),
      cleanError(
        error
      )
    )
  }
}


// ============================================================
// PROVIDER KEYCHAIN
// ============================================================

function providerKeychainName(
  provider
) {

  return (
    PROVIDER_KEY_PREFIX +
    provider.id +
    ".key"
  )
}


function hasProviderKey(
  provider
) {

  if (
    provider.auth?.type ===
    "none"
  ) {

    return true
  }


  return Keychain.contains(
    providerKeychainName(
      provider
    )
  )
}


function getProviderKey(
  provider
) {

  const name =
    providerKeychainName(
      provider
    )


  if (
    !Keychain.contains(
      name
    )
  ) {

    return null
  }


  return Keychain.get(
    name
  )
}


// ============================================================
// PROVIDER API KEY SETUP
// ============================================================

async function configureProviderKey(
  provider
) {

  if (
    provider.auth?.type ===
    "none"
  ) {

    return true
  }


  const ACT = {
    SAVE: 0,
    CANCEL: 1
  }

  const exists =
    hasProviderKey(
      provider
    )


  const alert =
    new Alert()


  alert.title =
    `${provider.name} API-key`


  alert.message =
    exists
      ? t("Enter a new key. The old key will be replaced.")
      : t("The API key is stored securely in Scriptable Keychain.")


  alert.addSecureTextField(
    provider.auth.keyLabel ||
    "API Key"
  )


  alert.addAction(
    exists
      ? t("Change")
      : t("Save")
  )


  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentAlert()


  if (result !== ACT.SAVE) {

    return false
  }


  const key =
    fieldValue(
      alert,
      0
    )


  if (!key) {

    await showMessage(
      provider.name,
      t("No API key entered.")
    )

    return false
  }


  Keychain.set(
    providerKeychainName(
      provider
    ),
    key
  )


  return true
}


// ============================================================
// PROVIDER SETUP
// ============================================================

async function providerSetup(
  provider
) {

  const ACT = {
    KEY: 0,
    TEST: 1,
    UPDATE: 2,
    DELETE: 3
  }

  const alert =
    new Alert()


  alert.title =
    provider.name


  alert.message =
    `v${provider.version}\n\n${provider.description || ""}`


  if (
    provider.auth?.type !==
    "none"
  ) {

    alert.addAction(
      hasProviderKey(provider)
        ? t("Change API key")
        : t("Add API key")
    )

  } else {

    alert.addAction(
      t("No API key needed")
    )
  }


  alert.addAction(
    "🧪 Verbinding testen"
  )

  alert.addAction(
    t("Update provider")
  )

  alert.addDestructiveAction(
    t("Remove provider")
  )

  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentSheet()


  if (result === ACT.KEY) {

    if (
      provider.auth?.type !==
      "none"
    ) {

      await configureProviderKey(
        provider
      )
    }


  } else if (
    result === ACT.TEST
  ) {

    const balance =
      await fetchProviderBalance(
        provider,
        true
      )


    await showMessage(
      provider.name,

      balance.success
        ? `✅ ${t("Connection OK")}\n\n${t("Balance:")}: ${formatMoney(
            balance.amount,
            balance.currency
          )}`
        : `❌ ${balance.error}`
    )


  } else if (
    result === ACT.UPDATE
  ) {

    await updateInstalledProvider(
      provider
    )


  } else if (
    result === ACT.DELETE
  ) {

    await removeInstalledProvider(
      provider
    )
  }
}


// ============================================================
// UPDATE INSTALLED PROVIDER
// ============================================================

async function updateInstalledProvider(
  provider
) {

  const cfg =
    loadConfig()


  if (!cfg.catalogUrl) {

    await showMessage(
      "Update",
      t("Provider Catalog URL missing.")
    )

    return
  }


  try {

    const catalog =
      await fetchJSON(
        cfg.catalogUrl
      )


    validateCatalog(
      catalog
    )


    const newest =
      catalog.providers.find(
        p =>
          p.id ===
          provider.id
      )


    if (!newest) {

      throw new Error(
        t("Provider no longer exists in the catalog.")
      )
    }


    const installed =
      loadInstalledProviders()


    const index =
      installed.findIndex(
        p =>
          p.id ===
          provider.id
      )


    if (index < 0) {

      throw new Error(
        t("Local provider was not found.")
      )
    }


    // ========================================================
    // CHANGELOG: OLD vs NEW
    // ========================================================

    const changes =
      diffObjects(
        provider,
        newest
      )


    installed[index] =
      newest


    saveInstalledProviders(
      installed
    )


    let message =
      `✅ ${t("Provider updated.")}\n\n` +
      `Version: v${provider.version} → v${newest.version}\n\n`

    if (changes.length > 0) {

      message +=
        `${t("Changes:")}:\n`

      const shown =
        changes.slice(
          0,
          12
        )

      message +=
        shown.join(
          "\n"
        )

      if (
        changes.length >
        shown.length
      ) {

        message +=
          `\n… ${t("and")} ${changes.length - shown.length} ${t("more change(s)")}`
      }

    } else {

      message +=
        t("No field changes.")
    }


    await showMessage(
      provider.name,
      message
    )


  } catch (error) {

    await showMessage(
      t("Update failed"),
      cleanError(
        error
      )
    )
  }
}


// ============================================================
// REMOVE INSTALLED PROVIDER
// ============================================================

async function removeInstalledProvider(
  provider
) {

  const ACT = {
    DELETE: 0,
    CANCEL: 1
  }

  const alert =
    new Alert()


  alert.title =
    `${provider.name} verwijderen?`


  alert.message =
    t("The local provider and API key will be removed. The provider remains in the GitHub catalog.")


  alert.addDestructiveAction(
    t("Delete")
  )

  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentAlert()


  if (result !== ACT.DELETE) {
    return
  }


  const installed =
    loadInstalledProviders()
      .filter(
        p =>
          p.id !==
          provider.id
      )


  saveInstalledProviders(
    installed
  )


  const keyName =
    providerKeychainName(
      provider
    )


  if (
    Keychain.contains(
      keyName
    )
  ) {

    Keychain.remove(
      keyName
    )
  }


  // Clean cache + history for this provider
  const cache =
    loadCache()

  if (cache[provider.id]) {

    delete cache[provider.id]

    saveCache(
      cache
    )
  }


  const history =
    loadHistory()

  if (history[provider.id]) {

    delete history[provider.id]

    saveHistory(
      history
    )
  }


  await showMessage(
    provider.name,
    t("Provider deleted.")
  )
}


// ============================================================
// PROVIDER REQUEST ENGINE
// ============================================================

async function fetchProviderBalance(
  provider,
  force
) {

  const result = {

    id:
      provider.id,

    name:
      provider.name,

    success:
      false,

    amount:
      null,

    currency:
      provider.response
        ?.currency ||
      "",

    label:
      provider.response
        ?.label ||
      "Remaining",

    error:
      null,

    cached:
      false,

    provider
  }


  // ========================================================
  // RATE LIMIT / COOLDOWN CHECK
  // ========================================================

  const cfg =
    loadConfig()

  const cooldownSeconds =
    cfg.cooldownSeconds ??
    30

  const cache =
    loadCache()

  const cachedEntry =
    cache[provider.id]


  if (
    !force &&
    cachedEntry &&
    cachedEntry.lastFetch
  ) {

    const elapsed =
      (Date.now() -
        cachedEntry.lastFetch) /
      1000


    if (
      elapsed <
      cooldownSeconds
    ) {

      result.success =
        cachedEntry.success

      result.amount =
        cachedEntry.amount

      result.currency =
        cachedEntry.currency ||
        result.currency

      result.label =
        cachedEntry.label ||
        result.label

      result.error =
        cachedEntry.error

      result.cached =
        true


      return result
    }
  }


  try {

    let apiKey =
      null


    if (
      provider.auth?.type !==
      "none"
    ) {

      apiKey =
        getProviderKey(
          provider
        )


      if (!apiKey) {

        throw new Error(
          t("No API key set.")
        )
      }
    }


    const request =
      new Request(
        provider.request.url
      )


    request.method =
      (
        provider.request.method ||
        "GET"
      ).toUpperCase()


    request.timeoutInterval =
      provider.request.timeout ||
      20


    const headers = {

      "Accept":
        "application/json",

      ...(provider.request.headers || {})
    }


    applyProviderAuthentication(
      headers,
      provider,
      apiKey
    )


    request.headers =
      headers


    if (
      request.method ===
        "POST" &&
      provider.request.body
    ) {

      request.body =
        JSON.stringify(
          provider.request.body
        )

      request.headers[
        "Content-Type"
      ] =
        "application/json"
    }


    const json =
      await request.loadJSON()


    const status =
      request.response
        ?.statusCode


    if (
      status < 200 ||
      status >= 300
    ) {

      const apiError =
        readPath(
          json,
          provider.response
            ?.errorPath ||
          "error.message"
        )


      throw new Error(
        apiError ||
        `HTTP ${status}`
      )
    }


    const parsed =
      parseProviderResponse(
        provider,
        json
      )


    result.amount =
      parsed.amount

    result.currency =
      parsed.currency ||
      result.currency

    result.label =
      parsed.label ||
      result.label

    result.success =
      true


    // ========================================================
    // STORE CACHE ENTRY
    // ========================================================

    cache[provider.id] = {
      lastFetch:
        Date.now(),

      success:
        true,

      amount:
        result.amount,

      currency:
        result.currency,

      label:
        result.label,

      error:
        null,

      alerted:
        cachedEntry?.alerted ||
        false
    }

    saveCache(
      cache
    )


    return result


  } catch (error) {

    result.error =
      cleanError(
        error
      )


    cache[provider.id] = {
      lastFetch:
        Date.now(),

      success:
        false,

      amount:
        null,

      currency:
        result.currency,

      label:
        result.label,

      error:
        result.error,

      alerted:
        cachedEntry?.alerted ||
        false
    }

    saveCache(
      cache
    )


    return result
  }
}


// ============================================================
// AUTHENTICATION ENGINE
// ============================================================

function applyProviderAuthentication(
  headers,
  provider,
  apiKey
) {

  const auth =
    provider.auth || {
      type:
        "none"
    }


  if (
    auth.type ===
    "none"
  ) {

    return
  }


  if (
    auth.type ===
    "bearer"
  ) {

    headers[
      auth.header ||
      "Authorization"
    ] =
      `${auth.prefix || "Bearer "}${apiKey}`

    return
  }


  if (
    auth.type ===
    "header"
  ) {

    if (!auth.header) {

      throw new Error(
        t("Custom authentication header missing.")
      )
    }


    headers[
      auth.header
    ] =
      `${auth.prefix || ""}${apiKey}`

    return
  }


  throw new Error(
    `Authentication type '${auth.type}' ${t("Authentication type not supported.")}`
  )
}


// ============================================================
// RESPONSE PARSER
// ============================================================

function parseProviderResponse(
  provider,
  json
) {

  const response =
    provider.response


  // SINGLE
  if (
    response.mode ===
    "single"
  ) {

    const amount =
      Number(
        readPath(
          json,
          response.amountPath,
          true
        )
      )


    if (
      !Number.isFinite(
        amount
      )
    ) {

      throw new Error(
        `${t("Balance could not be read at path")} '${response.amountPath}'.`
      )
    }


    return {
      amount,

      currency:
        response.currency,

      label:
        response.label
    }
  }


  // DIFFERENCE
  if (
    response.mode ===
    "difference"
  ) {

    const total =
      Number(
        readPath(
          json,
          response.totalPath,
          true
        )
      )


    const used =
      Number(
        readPath(
          json,
          response.usedPath,
          true
        )
      )


    if (
      !Number.isFinite(
        total
      ) ||
      !Number.isFinite(
        used
      )
    ) {

      throw new Error(
        `${t("Credit data could not be read")} ('${response.totalPath}' / '${response.usedPath}').`
      )
    }


    return {

      amount:
        Math.max(
          0,
          total - used
        ),

      currency:
        response.currency,

      label:
        response.label
    }
  }


  // ARRAY
  if (
    response.mode ===
    "array"
  ) {

    const array =
      readPath(
        json,
        response.arrayPath,
        true
      )


    if (
      !Array.isArray(
        array
      )
    ) {

      throw new Error(
        `${t("Balance array missing at path")} '${response.arrayPath}'.`
      )
    }


    let item


    if (
      response.preferredCurrency &&
      response.currencyField
    ) {

      item =
        array.find(
          x =>
            x[
              response.currencyField
            ] ===
            response.preferredCurrency
        )
    }


    if (!item) {

      item =
        array[0]
    }


    if (!item) {

      throw new Error(
        t("No balance found.")
      )
    }


    const amount =
      Number(
        item[
          response.amountField
        ]
      )


    if (
      !Number.isFinite(
        amount
      )
    ) {

      throw new Error(
        t("Balance is not a valid number.")
      )
    }


    return {

      amount,

      currency:
        response.currencyField
          ? item[
              response.currencyField
            ]
          : response.currency,

      label:
        response.label
    }
  }


  throw new Error(
    t("Unknown response mode.")
  )
}


// ============================================================
// LOAD BALANCES
// ============================================================

async function loadAllBalances(
  force
) {

  const providers =
    loadInstalledProviders()

  const balances =
    await Promise.all(
      providers.map(
        provider =>
          fetchProviderBalance(
            provider,
            force
          )
      )
    )


  recordBalanceHistory(
    balances
  )


  const cfg =
    loadConfig()

  await notifyLowBalances(
    balances,
    cfg
  )


  return balances
}


// ============================================================
// LOW BALANCE NOTIFICATIONS
// ============================================================

async function notifyLowBalances(
  balances,
  cfg
) {

  // No notifications from widget refreshes
  if (config.runsInWidget) {

    return
  }

  const cache =
    loadCache()

  let changed =
    false


  for (const balance of balances) {

    if (!balance.success) {

      continue
    }

    const thresholds =
      alertThresholds(
        balance.provider,
        cfg
      )

    const below =
      balance.amount <=
      thresholds.low

    const entry =
      cache[balance.id] || {}


    if (
      below &&
      !entry.alerted
    ) {

      const notification =
        new Notification()

      notification.title =
        `⚠️ ${balance.name} ${t("balance low")}`

      notification.body =
        `${t("Remaining balance:")} ${formatMoney(
          balance.amount,
          balance.currency
        )}\n` +
        `${t("Below the threshold of")} ${thresholds.low}.`

      notification.sound =
        "default"

      await notification.schedule()


      cache[balance.id] = {
        ...entry,
        alerted:
          true
      }

      changed =
        true

    } else if (
      !below &&
      entry.alerted
    ) {

      cache[balance.id] = {
        ...entry,
        alerted:
          false
      }

      changed =
        true
    }
  }


  if (changed) {

    saveCache(
      cache
    )
  }
}


// ============================================================
// BALANCE SCREEN
// ============================================================

async function showBalances(
  force
) {

  const providers =
    loadInstalledProviders()


  if (
    providers.length ===
    0
  ) {

    const ACT = {
      INSTALL: 0,
      CANCEL: 1
    }

    const alert =
      new Alert()

    alert.title =
      t("No providers")

    alert.message =
      t("No providers installed yet.")

    alert.addAction(
      t("Install from catalog")
    )

    alert.addCancelAction(
      t("Cancel")
    )


    const result =
      await alert.presentAlert()


    if (result === ACT.INSTALL) {

      await installProviderFromCatalog()
    }

    return
  }


  let firstRun =
    true

  let refreshRequested =
    false


  while (
    firstRun ||
    refreshRequested
  ) {

    refreshRequested =
      false

    firstRun =
      false


    const balances =
      await loadAllBalances(
        force
      )

    force =
      false


    const table =
      new UITable()

    table.showSeparators =
      true


    const header =
      new UITableRow()


    const headerCell =
      header.addText(
        "💰 AI Credits",
        t("Current remaining balance")
      )


    headerCell.titleFont =
      Font.boldSystemFont(22)


    table.addRow(
      header
    )


    for (const balance of balances) {

      const row =
        new UITableRow()

      row.height =
        70


      if (
        balance.success
      ) {

        const trend =
          trendSymbol(
            balance
          )

        let subtitle =
          `${trend} ${formatMoney(
            balance.amount,
            balance.currency
          )} • ${balance.label}`

        if (balance.cached) {

          subtitle +=
            " • (cached)"
        }

        const cell =
          row.addText(
            balance.name,
            subtitle
          )


        cell.titleFont =
          Font.boldSystemFont(17)


        cell.subtitleColor =
          balanceColor(
            balance.amount,
            balance.provider
          )


      } else {

        let subtitle =
          "⚠️ " +
          (balance.error
            || t("Unknown error"))

        if (balance.cached) {

          subtitle +=
            " • (cached)"
        }

        const cell =
          row.addText(
            "❌ " + balance.name,
            subtitle
          )


        cell.titleFont =
          Font.boldSystemFont(17)

        cell.titleColor =
          COLORS.red

        cell.subtitleColor =
          COLORS.red

        row.dismissOnSelect =
          false

        row.onSelect =
          async () => {

            const errAlert =
              new Alert()

            errAlert.title =
              "❌ " + balance.name

            errAlert.message =
              t("Error") + ": " +
              (balance.error
                || t("Unknown error"))

            errAlert.addAction(
              t("Retry")
            )

            errAlert.addCancelAction(
              t("OK")
            )

            const action =
              await errAlert.presentAlert()

            if (
              action === 0
            ) {

              refreshRequested =
                true
            }
          }
      }


      table.addRow(
        row
      )
    }


    // ── TOTAL SUMMARY ──
    const successful =
      balances.filter(
        b => b.success
      )

    if (
      successful.length > 1
    ) {

      const totals =
        {}

      for (const b of successful) {

        const cur =
          b.currency || "USD"

        totals[cur] =
          (totals[cur] || 0) +
          b.amount
      }

      const totalParts =
        Object.entries(
          totals
        ).map(
          ([cur, amt]) =>
            formatMoney(amt, cur)
        )

      const totalText =
        totalParts.join(" + ")

      const totalRow =
        new UITableRow()

      totalRow.height =
        50

      const totalCell =
        totalRow.addText(
          "📊 " +
            t("Total remaining"),
          totalText
        )

      totalCell.titleFont =
        Font.boldSystemFont(16)

      totalCell.titleColor =
        Color.dynamic(
          new Color("#3C3C43"),
          new Color("#EBEBF5")
        )

      totalCell.subtitleFont =
        Font.boldSystemFont(16)

      totalCell.subtitleColor =
        Color.green()

      table.addRow(
        totalRow
      )
    }


    const footer =
      new UITableRow()


    const footerCell =
      footer.addText(
        t("Last check"),
        formatDate(
          new Date()
        )
      )


    footerCell.titleColor =
      COLORS.grey

    footerCell.subtitleColor =
      COLORS.grey


    table.addRow(
      footer
    )


    // Refresh button row
    const refreshBtn =
      new UITableRow()

    refreshBtn.dismissOnSelect =
      true

    refreshBtn.addText(
      t("Refresh now"),
      t("Refresh all balances now")
    )

    refreshBtn.onSelect =
      async () => {

        refreshRequested =
          true
      }

    table.addRow(
      refreshBtn
    )


    await table.present()
  }
}


// ============================================================
// WIDGET
// ============================================================

async function createWidget(
  balances,
  family
) {

  const widget =
    new ListWidget()


  widget.setPadding(
    14,
    14,
    14,
    14
  )


  const gradient =
    new LinearGradient()


  gradient.colors = [
    COLORS.backgroundTop,
    COLORS.backgroundBottom
  ]


  gradient.locations =
    [0, 1]


  widget.backgroundGradient =
    gradient


  const size =
    family === "small"
      ? "small"
      : family === "large"
        ? "large"
        : "medium"


  const maxProviders =
    size === "small"
      ? 3
      : size === "medium"
        ? 6
        : 10

  const titleFontSize =
    size === "small"
      ? 15
      : 17

  const nameFontSize =
    size === "small"
      ? 11
      : 13

  const amountFontSize =
    size === "small"
      ? 12
      : 14


  const title =
    widget.addText(
      "AI Credits"
    )


  title.font =
    Font.boldSystemFont(
      titleFontSize
    )

  title.textColor =
    COLORS.white


  widget.addSpacer(
    size === "small"
      ? 8
      : 12
  )


  if (
    balances.length ===
    0
  ) {

    const text =
      widget.addText(
        t("No providers configured")
      )

    text.textColor =
      COLORS.grey

    text.font =
      Font.systemFont(13)

  } else {

    const shown =
      balances.slice(
        0,
        maxProviders
      )


    for (const balance of shown) {

      const row =
        widget.addStack()

      row.layoutHorizontally()


      const provider =
        row.addText(
          balance.success
            ? `${balance.name} ${trendSymbol(balance)}`
            : balance.name
        )


      provider.font =
        Font.semiboldSystemFont(
          nameFontSize
        )

      provider.textColor =
        COLORS.white


      row.addSpacer()


      const amount =
        row.addText(
          balance.success
            ? formatMoney(
                balance.amount,
                balance.currency
              )
            : "⚠️"
        )


      amount.font =
        Font.boldSystemFont(
          amountFontSize
        )


      amount.textColor =
        balance.success
          ? balanceColor(
              balance.amount,
              balance.provider
            )
          : COLORS.red


      widget.addSpacer(
        size === "small"
          ? 5
          : 7
      )
    }


    if (
      balances.length >
      shown.length
    ) {

      const more =
        widget.addText(
          `+${balances.length - shown.length} ${t("more")}`
        )

      more.font =
        Font.systemFont(10)

      more.textColor =
        COLORS.grey
    }
  }


  widget.addSpacer()


  const time =
    widget.addText(
      `Updated ${formatTime(
        new Date()
      )}`
    )


  time.font =
    Font.systemFont(9)

  time.textColor =
    COLORS.grey


  const cfg =
    loadConfig()


  widget.refreshAfterDate =
    new Date(
      Date.now() +
      cfg.refreshMinutes *
      60000
    )


  // Deep link: tap widget to open the script
  try {

    const scriptName =
      Script.name()

    if (scriptName) {

      widget.url =
        "scriptable:///run/" +
        encodeURIComponent(
          scriptName
        )
    }

  } catch {

    // Script.name() not available; skip deep link
  }


  return widget
}


// ============================================================
// DISCOVERY BACKEND
// ============================================================

async function configureDiscoveryUrl() {

  const ACT = {
    SAVE: 0,
    DISABLE: 1,
    CANCEL: 2
  }

  const cfg =
    loadConfig()


  const alert =
    new Alert()


  alert.title =
    "Discovery Backend"


  alert.message =
    t("Optional future backend that researches provider documentation. API keys are never sent to this backend.")


  alert.addTextField(
    "https://...",
    cfg.discoveryUrl
  )


  alert.addAction(
    t("Save")
  )

  alert.addDestructiveAction(
    t("Disable")
  )

  alert.addCancelAction(
    t("Cancel")
  )


  const result =
    await alert.presentAlert()


  if (result === ACT.SAVE) {

    const url =
      fieldValue(
        alert,
        0
      )


    if (
      url &&
      !isHttpsUrl(
        url
      )
    ) {

      await showMessage(
        "Discovery",
        t("Only HTTPS URLs are allowed.")
      )

      return
    }


    cfg.discoveryUrl =
      url


    saveConfig(
      cfg
    )


  } else if (
    result === ACT.DISABLE
  ) {

    cfg.discoveryUrl =
      ""


    saveConfig(
      cfg
    )
  }
}


// ============================================================
// EXPORT CONFIG SUMMARY
// ============================================================

async function exportConfigSummary() {

  const cfg =
    loadConfig()

  const installed =
    loadInstalledProviders()

  const summary = {

    app:
      APP_NAME,

    version:
      APP_VERSION,

    exportedAt:
      new Date()
        .toISOString(),

    config: {

      catalogUrl:
        cfg.catalogUrl,

      githubOwner:
        cfg.githubOwner,

      githubRepo:
        cfg.githubRepo,

      githubBranch:
        cfg.githubBranch,

      githubPath:
        cfg.githubPath,

      discoveryUrl:
        cfg.discoveryUrl,

      refreshMinutes:
        cfg.refreshMinutes,

      cooldownSeconds:
        cfg.cooldownSeconds,

      lowBalanceThreshold:
        cfg.lowBalanceThreshold,

      redBalanceThreshold:
        cfg.redBalanceThreshold
    },

    installedProviders:
      installed.map(
        provider => ({

          id:
            provider.id,

          name:
            provider.name,

          version:
            provider.version,

          description:
            provider.description || "",

          authType:
            provider.auth?.type ||
            "none",

          hasApiKey:
            hasProviderKey(
              provider
            ),

          method:
            provider.request?.method ||
            "GET",

          url:
            provider.request?.url || "",

          responseMode:
            provider.response?.mode ||
            "",

          currency:
            provider.response?.currency ||
            "",

          alertsThreshold:
            provider.alerts?.threshold ||
            null
        })
      ),

    counts: {

      installed:
        installed.length,

      withKey:
        installed.filter(
          hasProviderKey
        ).length
    }
  }


  Pasteboard.copy(
    JSON.stringify(
      summary,
      null,
      2
    )
  )


  await showMessage(
    t("Export config"),
    `✅ ${t("Configuration summary copied to clipboard.")}\n\n${t("Does not contain API keys or GitHub token.")}`
  )
}


// ============================================================
// VALIDATE CATALOG
// ============================================================

function validateCatalog(
  catalog
) {

  if (
    !catalog ||
    typeof catalog !==
      "object"
  ) {

    throw new Error(
      t("Invalid catalog.")
    )
  }


  if (
    !Array.isArray(
      catalog.providers
    )
  ) {

    throw new Error(
      t("providers[] missing.")
    )
  }


  for (const provider of catalog.providers) {

    const validation =
      validateProvider(
        provider
      )


    if (!validation.ok) {

      throw new Error(
        `${provider.name || provider.id || "Provider"}: ${validation.error}`
      )
    }
  }


  return true
}


// ============================================================
// VALIDATE PROVIDER
// ============================================================

function validateProvider(
  provider
) {

  if (
    !provider ||
    typeof provider !==
      "object"
  ) {

    return {
      ok:
        false,

      error:
        t("Provider missing.")
    }
  }


  const required = [
    "id",
    "name",
    "version",
    "request",
    "response"
  ]


  for (const field of required) {

    if (!provider[field]) {

      return {
        ok:
          false,

        error:
          `Veld '${field}' ontbreekt.`
      }
    }
  }


  if (
    !/^[a-z0-9-_]+$/.test(
      provider.id
    )
  ) {

    return {
      ok:
        false,

      error:
        t("Invalid provider ID.")
    }
  }


  if (
    !isHttpsUrl(
      provider.request.url
    )
  ) {

    return {
      ok:
        false,

      error:
        t("API endpoint must be HTTPS.")
    }
  }


  const method =
    (
      provider.request.method ||
      "GET"
    ).toUpperCase()


  if (
    ![
      "GET",
      "POST"
    ].includes(
      method
    )
  ) {

    return {
      ok:
        false,

      error:
        t("Only GET and POST are allowed.")
    }
  }


  if (
    ![
      "single",
      "difference",
      "array"
    ].includes(
      provider.response.mode
    )
  ) {

    return {
      ok:
        false,

      error:
        t("Invalid response mode.")
    }
  }


  return {
    ok:
      true
  }
}


// ============================================================
// VALIDATE GITHUB SETTINGS
// ============================================================

function validateGitHubSettings(
  cfg
) {

  if (
    !cfg.githubOwner ||
    !cfg.githubRepo ||
    !cfg.githubBranch ||
    !cfg.githubPath
  ) {

    throw new Error(
      t("GitHub repository is not fully configured.")
    )
  }
}


// ============================================================
// NETWORK
// ============================================================

async function fetchJSON(
  url
) {

  const request =
    new Request(
      url
    )


  request.method =
    "GET"


  request.headers = {
    "Accept":
      "application/json"
  }


  request.timeoutInterval =
    20


  const result =
    await request.loadJSON()


  const status =
    request.response
      ?.statusCode


  if (
    status < 200 ||
    status >= 300
  ) {

    throw new Error(
      `HTTP ${status}`
    )
  }


  return result
}


// ============================================================
// JSON PATH
// ============================================================

function readPath(
  object,
  path,
  strict
) {

  if (!path) {

    if (strict) {

      throw new Error(
        t("JSON path missing.")
      )
    }

    return undefined
  }


  const value =
    String(path)
      .split(".")
      .reduce(
        (
          current,
          key
        ) => {

          if (
            current ===
              undefined ||
            current ===
              null
          ) {

            return undefined
          }


          return current[
            key
          ]
        },

        object
      )


  if (
    strict &&
    (
      value ===
        undefined ||
      value ===
        null
    )
  ) {

    throw new Error(
      `JSON pad '${path}' niet gevonden in response.`
    )
  }


  return value
}


// ============================================================
// HELPERS
// ============================================================

function isHttpsUrl(
  value
) {

  return (
    typeof value ===
      "string" &&
    value.startsWith(
      "https://"
    )
  )
}


function getApiError(
  response,
  status
) {

  if (
    response?.message
  ) {

    return (
      `GitHub HTTP ${status}: ` +
      response.message
    )
  }


  return (
    `GitHub HTTP ${status}`
  )
}


function formatMoney(
  amount,
  currency
) {

  if (
    amount === null ||
    amount === undefined
  ) {

    return "—"
  }


  let prefix =
    currency
      ? `${currency} `
      : ""


  if (
    currency ===
    "USD"
  ) {

    prefix = "$"
  }


  if (
    currency ===
    "EUR"
  ) {

    prefix = "€"
  }


  if (
    currency ===
    "GBP"
  ) {

    prefix = "£"
  }


  if (
    currency ===
    "CNY"
  ) {

    prefix = "¥"
  }


  const value =
    Number(amount) < 1
      ? Number(amount)
          .toFixed(4)
      : Number(amount)
          .toFixed(2)


  const parts =
    String(value)
      .split(".")


  const grouped =
    parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    )


  return (
    prefix +
    grouped +
    (
      parts.length > 1
        ? "." + parts[1]
        : ""
    )
  )
}


// ============================================================
// BALANCE COLOR THRESHOLDS
// ============================================================

function alertThresholds(
  provider,
  cfg
) {

  const fallback = {

    low:
      cfg?.lowBalanceThreshold ??
      1,

    red:
      cfg?.redBalanceThreshold ??
      5
  }


  const custom =
    provider?.alerts?.threshold


  if (
    custom &&
    typeof custom ===
      "object"
  ) {

    return {

      low:
        typeof custom.low ===
          "number"
          ? custom.low
          : fallback.low,

      red:
        typeof custom.red ===
          "number"
          ? custom.red
          : fallback.red
    }
  }


  return fallback
}


function balanceColor(
  amount,
  provider
) {

  if (
    amount === null ||
    amount === undefined
  ) {

    return COLORS.grey
  }


  const thresholds =
    alertThresholds(
      provider,
      loadConfig()
    )


  if (
    amount <=
    thresholds.low
  ) {

    return COLORS.red
  }


  if (
    amount <=
    thresholds.red
  ) {

    return COLORS.orange
  }


  return COLORS.green
}


// ============================================================
// TREND SYMBOL
// ============================================================

function trendSymbol(
  balance
) {

  if (!balance.success) {

    return ""
  }


  const history =
    loadHistory()

  const list =
    history[balance.id] || []


  if (list.length < 2) {

    return "→"
  }


  const previous =
    list[list.length - 2]

  const current =
    list[list.length - 1]


  if (
    previous.amount ===
    current.amount
  ) {

    return "→"
  }


  return (
    current.amount >
    previous.amount
  )
    ? "↑"
    : "↓"
}


// ============================================================
// OBJECT DIFF (update changelog)
// ============================================================

function diffObjects(
  oldObject,
  newObject,
  prefix
) {

  const lines = []

  const keys =
    new Set([
      ...Object.keys(
        oldObject || {}
      ),
      ...Object.keys(
        newObject || {}
      )
    ])


  for (const key of keys) {

    const path =
      prefix
        ? `${prefix}.${key}`
        : key

    const oldValue =
      oldObject?.[key]

    const newValue =
      newObject?.[key]

    const oldJson =
      JSON.stringify(
        oldValue
      )

    const newJson =
      JSON.stringify(
        newValue
      )


    if (
      oldJson ===
      newJson
    ) {

      continue
    }


    if (
      oldValue &&
      newValue &&
      typeof oldValue ===
        "object" &&
      typeof newValue ===
        "object" &&
      !Array.isArray(
        oldValue
      ) &&
      !Array.isArray(
        newValue
      )
    ) {

      lines.push(
        ...diffObjects(
          oldValue,
          newValue,
          path
        )
      )

    } else {

      const oldText =
        oldJson ??
        "—"

      const newText =
        newJson ??
        "—"

      const limit =
        80

      lines.push(
        `${path}: ` +
        `${oldText.length > limit ? oldText.substring(0, limit) + "…" : oldText}` +
        " → " +
        `${newText.length > limit ? newText.substring(0, limit) + "…" : newText}`
      )
    }
  }


  return lines
}


function formatDate(
  date
) {

  const formatter =
    new DateFormatter()


  formatter.useMediumDateStyle()

  formatter.useShortTimeStyle()


  return formatter.string(
    date
  )
}


function formatTime(
  date
) {

  const formatter =
    new DateFormatter()


  formatter.useNoDateStyle()

  formatter.useShortTimeStyle()


  return formatter.string(
    date
  )
}


function cleanError(
  error
) {

  return String(
    error?.message ||
    error ||
    t("Unknown error")
  )
    .replace(
      /github_pat_[A-Za-z0-9_-]+/gi,
      t("[GitHub token hidden]")
    )
    .replace(
      /ghp_[A-Za-z0-9]+/gi,
      t("[GitHub token hidden]")
    )
    .replace(
      /gho_[A-Za-z0-9]+/gi,
      t("[GitHub token hidden]")
    )
    .replace(
      /ghu_[A-Za-z0-9]+/gi,
      t("[GitHub token hidden]")
    )
    .replace(
      /ghs_[A-Za-z0-9]+/gi,
      t("[GitHub token hidden]")
    )
    .replace(
      /ghr_[A-Za-z0-9]+/gi,
      t("[GitHub token hidden]")
    )
    .replace(
      /sk-[A-Za-z0-9_-]+/gi,
      t("[API key hidden]")
    )
    .replace(
      /xox[baprs]-[A-Za-z0-9-]+/gi,
      t("[API key hidden]")
    )
    .replace(
      /glpat-[A-Za-z0-9_-]+/gi,
      t("[API key hidden]")
    )
    .replace(
      /AIza[A-Za-z0-9_-]{30,}/gi,
      t("[API key hidden]")
    )
    .replace(
      /AKIA[A-Za-z0-9]{16}/gi,
      t("[API key hidden]")
    )
    .replace(
      /ASIA[A-Za-z0-9]{16}/gi,
      t("[API key hidden]")
    )
    .replace(
      /SG\.[A-Za-z0-9_-]{20,}/gi,
      t("[API key hidden]")
    )
    .replace(
      /r8_[A-Za-z0-9_-]{20,}/gi,
      t("[API key hidden]")
    )
    .replace(
      /hf_[A-Za-z0-9_-]{20,}/gi,
      t("[API key hidden]")
    )
    .replace(
      /xvapi-[A-Za-z0-9_-]+/gi,
      t("[API key hidden]")
    )
    .replace(
      /pplx-[A-Za-z0-9_-]+/gi,
      t("[API key hidden]")
    )
    .replace(
      /key-[A-Za-z0-9_-]{20,}/gi,
      t("[API key hidden]")
    )
    .replace(
      /\b[0-9a-f]{32,}\b/gi,
      t("[API key hidden]")
    )
    .replace(
      /\b[A-Za-z0-9+/]{40,}\b/g,
      t("[API key hidden]")
    )
    .substring(
      0,
      300
    )
}


async function showMessage(
  title,
  message
) {

  const alert =
    new Alert()


  alert.title =
    title

  alert.message =
    message


  alert.addAction(
    t("OK")
  )


  await alert.presentAlert()
}
