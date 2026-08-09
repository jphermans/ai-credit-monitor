// ============================================================
// AI Credit Monitor
// Version: 0.3.0
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
const APP_VERSION = "0.3.0"

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

if (config.runsInWidget) {

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

    saveConfig(
      DEFAULT_CONFIG
    )
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

const HISTORY_LIMIT = 30

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


  for (
    const balance
    of balances
  ) {

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

async function mainMenu() {

  const ACT = {
    VIEW: 0,
    INSTALL: 1,
    SETUP: 2
  }

  const installed =
    loadInstalledProviders()

  const alert =
    new Alert()

  alert.title =
    APP_NAME

  alert.message =
    installed.length === 0
      ? "Er zijn nog geen providers geïnstalleerd."
      : `${installed.length} provider(s) geïnstalleerd.`

  alert.addAction(
    "💰 Credits bekijken"
  )

  alert.addAction(
    "➕ Provider installeren"
  )

  alert.addAction(
    "⚙️ Setup"
  )

  alert.addCancelAction(
    "Sluiten"
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
  }
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
    true


  // Header
  const header =
    new UITableRow()

  header.height =
    70

  const headerCell =
    header.addText(
      "⚙️ Setup",
      `${APP_NAME} v${APP_VERSION}`
    )

  headerCell.titleFont =
    Font.boldSystemFont(22)

  headerCell.subtitleColor =
    COLORS.grey

  table.addRow(header)


  // Catalog URL
  const catalogRow =
    new UITableRow()

  catalogRow.dismissOnSelect =
    false

  catalogRow.addText(
    "📚 Provider Catalog URL",
    cfg.catalogUrl ||
    "Niet ingesteld"
  )

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

  const repoText =
    cfg.githubOwner &&
    cfg.githubRepo
      ? `${cfg.githubOwner}/${cfg.githubRepo}`
      : "Niet ingesteld"

  repoRow.addText(
    "🐙 GitHub repository",
    repoText
  )

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

  tokenRow.addText(
    "🔐 GitHub token",
    hasGitHubToken()
      ? "✅ Ingesteld"
      : "❌ Niet ingesteld"
  )

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

  testGitHub.addText(
    "🧪 GitHub verbinding testen",
    "Controleer repository en providers.json"
  )

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

  addGitHub.addText(
    "➕ Provider toevoegen aan catalogus",
    "Voeg provider toe aan providers.json"
  )

  addGitHub.onSelect =
    async () => {

      await createProviderWizard()
    }

  table.addRow(
    addGitHub
  )


  // Refresh interval
  const refreshRow =
    new UITableRow()

  refreshRow.dismissOnSelect =
    false

  refreshRow.addText(
    "⏱ Verversingsinterval",
    `${cfg.refreshMinutes} minuten`
  )

  refreshRow.onSelect =
    async () => {

      await configureRefreshInterval()
    }

  table.addRow(
    refreshRow
  )


  // Installed providers
  if (installed.length > 0) {

    const section =
      new UITableRow()

    section.isHeader =
      true

    section.addText(
      "Geïnstalleerde providers"
    )

    table.addRow(
      section
    )


    for (
      const provider of installed
    ) {

      const row =
        new UITableRow()

      row.dismissOnSelect =
        false

      row.addText(
        provider.name,
        hasProviderKey(provider)
          ? `✅ v${provider.version}`
          : "⚠️ API-key ontbreekt"
      )

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


  // Discovery
  const discoveryRow =
    new UITableRow()

  discoveryRow.dismissOnSelect =
    false

  discoveryRow.addText(
    "🤖 Discovery Backend",
    cfg.discoveryUrl ||
    "Uitgeschakeld"
  )

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

  exportRow.addText(
    "📋 Config exporteren",
    "Kopieer configuratie-overzicht naar klembord"
  )

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
    "Gebruik de Raw GitHub URL naar providers.json."

  alert.addTextField(
    "https://raw.githubusercontent.com/...",
    cfg.catalogUrl
  )

  alert.addAction(
    "Test & opslaan"
  )

  alert.addDestructiveAction(
    "Verwijderen"
  )

  alert.addCancelAction(
    "Annuleren"
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
        "Ongeldige URL",
        "Alleen HTTPS URLs zijn toegestaan."
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
        `✅ Verbinding OK\n\n${catalog.providers.length} provider(s) gevonden.`
      )

    } catch (error) {

      await showMessage(
        "Catalogusfout",
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
    CANCEL: 1
  }

  const cfg =
    loadConfig()

  const alert =
    new Alert()

  alert.title =
    "GitHub repository"

  alert.message =
    "Repository waarin providers.json staat."

  alert.addTextField(
    "Owner / username",
    cfg.githubOwner
  )

  alert.addTextField(
    "Repository",
    cfg.githubRepo
  )

  alert.addTextField(
    "Branch",
    cfg.githubBranch
  )

  alert.addTextField(
    "providers.json",
    cfg.githubPath
  )

  alert.addAction(
    "Opslaan"
  )

  alert.addCancelAction(
    "Annuleren"
  )


  const result =
    await alert.presentAlert()


  if (result !== ACT.SAVE) {
    return
  }


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
      "Ontbrekende gegevens",
      "Vul alle GitHub-velden in."
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
    "Repository opgeslagen.\n\nDe Raw Catalog URL werd automatisch aangepast."
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
    "Verversingsinterval"

  alert.message =
    "Interval in minuten voor widget-verversing (5 - 1440).\n\nHuidig: " +
    `${cfg.refreshMinutes} minuten`

  alert.addTextField(
    "Minuten",
    String(
      cfg.refreshMinutes
    )
  )

  alert.addAction(
    "Opslaan"
  )

  alert.addCancelAction(
    "Annuleren"
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
      "Verversingsinterval",
      "Voer een getal in tussen 5 en 1440 minuten."
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
    "Verversingsinterval",
    `✅ Verversingsinterval ingesteld op ${cfg.refreshMinutes} minuten.`
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
      ? "Een token is ingesteld. De token wordt nooit weergegeven."
      : "Gebruik een fine-grained token met Contents: Read and write."

  alert.addAction(
    exists
      ? "🔄 Token wijzigen"
      : "➕ Token toevoegen"
  )


  if (exists) {

    alert.addDestructiveAction(
      "🗑 Token verwijderen"
    )
  }

  alert.addCancelAction(
    "Annuleren"
  )


  const result =
    await alert.presentSheet()


  if (result === ACT.CHANGE) {

    const input =
      new Alert()

    input.title =
      "GitHub token"

    input.message =
      "De token wordt uitsluitend in Scriptable Keychain opgeslagen."

    input.addSecureTextField(
      "github_pat_..."
    )

    input.addAction(
      "Opslaan"
    )

    input.addCancelAction(
      "Annuleren"
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
        "Geen token ingevoerd."
      )

      return
    }


    Keychain.set(
      KEYCHAIN_GITHUB,
      token
    )


    await showMessage(
      "GitHub",
      "Token veilig opgeslagen."
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
      "GitHub-token verwijderd."
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
        "GitHub-token niet ingesteld."
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
      "GitHub verbinding OK",
      "✅ HTTP " +
      status +
      "\n\nRepository:\n" +
      cfg.githubOwner +
      "/" +
      cfg.githubRepo +
      "\n\nBranch:\n" +
      cfg.githubBranch +
      "\n\nBestand:\n" +
      cfg.githubPath +
      "\n\nSHA:\n" +
      response.sha
    )


  } catch (error) {

    await showMessage(
      "GitHub fout",
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
      "GitHub-token niet ingesteld."
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
      "GitHub response bevat geen bestand of SHA."
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
      "providers.json kon niet uit Base64 worden gelezen."
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
      "GitHub-token ontbreekt."
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
      "Nieuwe provider"

    identity.message =
      "Algemene providerinformatie."


    identity.addTextField(
      "ID, bv. openrouter"
    )

    identity.addTextField(
      "Naam, bv. OpenRouter"
    )

    identity.addTextField(
      "Versie",
      "1.0.0"
    )

    identity.addTextField(
      "Beschrijving"
    )


    identity.addAction(
      "Volgende"
    )

    identity.addCancelAction(
      "Annuleren"
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
        "ID, naam en versie zijn verplicht."
      )
    }


    if (
      !/^[a-z0-9-_]+$/.test(
        id
      )
    ) {

      throw new Error(
        "Provider-ID mag alleen a-z, 0-9, - en _ bevatten."
      )
    }


    if (
      catalog.providers.some(
        p =>
          p.id === id
      )
    ) {

      throw new Error(
        `Provider '${id}' bestaat al.`
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
      "Authenticatie"

    authAlert.message =
      "Hoe wordt de API-key verstuurd?"


    authAlert.addAction(
      "Bearer token"
    )

    authAlert.addAction(
      "Custom header"
    )

    authAlert.addAction(
      "Geen authenticatie"
    )

    authAlert.addCancelAction(
      "Annuleren"
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
        "Geef de naam van de HTTP-header."


      headerAlert.addTextField(
        "Header",
        "X-API-Key"
      )

      headerAlert.addTextField(
        "Prefix",
        ""
      )


      headerAlert.addAction(
        "Volgende"
      )

      headerAlert.addCancelAction(
        "Annuleren"
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
          "Headernaam ontbreekt."
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
      "Geef het balance/credits endpoint van de provider."


    endpointAlert.addTextField(
      "https://api.example.com/balance",
      ""
    )


    endpointAlert.addAction(
      "Volgende"
    )

    endpointAlert.addCancelAction(
      "Annuleren"
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
        "API endpoint ontbreekt."
      )
    }


    if (!isHttpsUrl(apiUrl)) {

      throw new Error(
        "Het API-endpoint moet HTTPS gebruiken."
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
      "HTTP methode"

    methodAlert.message =
      apiUrl


    methodAlert.addAction(
      "GET"
    )

    methodAlert.addAction(
      "POST"
    )

    methodAlert.addCancelAction(
      "Annuleren"
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
      "Hoe staat het resterende bedrag in de JSON response?"


    modeAlert.addAction(
      "Eén saldo veld"
    )

    modeAlert.addAction(
      "Totaal minus gebruikt"
    )

    modeAlert.addAction(
      "Array met valuta"
    )

    modeAlert.addCancelAction(
      "Annuleren"
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
        "Saldo veld"

      responseAlert.message =
        "Voorbeeld JSON path: data.balance"


      responseAlert.addTextField(
        "JSON path",
        "data.balance"
      )

      responseAlert.addTextField(
        "Valuta",
        "USD"
      )

      responseAlert.addTextField(
        "Label",
        "Remaining credits"
      )


      responseAlert.addAction(
        "Volgende"
      )

      responseAlert.addCancelAction(
        "Annuleren"
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
        "Credit velden"

      responseAlert.message =
        "Het resterende saldo wordt berekend als totaal minus gebruikt."


      responseAlert.addTextField(
        "Total JSON path",
        "data.total_credits"
      )

      responseAlert.addTextField(
        "Used JSON path",
        "data.total_usage"
      )

      responseAlert.addTextField(
        "Valuta",
        "USD"
      )

      responseAlert.addTextField(
        "Label",
        "Remaining credits"
      )


      responseAlert.addAction(
        "Volgende"
      )

      responseAlert.addCancelAction(
        "Annuleren"
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
          "Total en Used JSON paths zijn verplicht."
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
        "Voor APIs die meerdere saldi of valuta teruggeven."


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
        "Volgende"
      )

      responseAlert.addCancelAction(
        "Annuleren"
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
          "Array path en amount field zijn verplicht."
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
      "Provider toevoegen?"


    preview.message =
      `${provider.name}\n\n` +
      `ID: ${provider.id}\n` +
      `Versie: ${provider.version}\n` +
      `Methode: ${provider.request.method}\n` +
      `Endpoint:\n${provider.request.url}\n\n` +
      `Response mode: ${provider.response.mode}`


    preview.addAction(
      "Toevoegen aan GitHub"
    )

    preview.addCancelAction(
      "Annuleren"
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
      "Provider toegevoegd"


    installAlert.message =
      `✅ ${provider.name} werd toegevoegd aan providers.json op GitHub.\n\nWil je deze provider nu ook op dit toestel installeren?`


    installAlert.addAction(
      "Installeren"
    )

    installAlert.addCancelAction(
      "Later"
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
          "✅ Provider geïnstalleerd en API-key veilig opgeslagen.\n\nWil je de verbinding nu testen?"

        testAlert.addAction(
          "Verbinding testen"
        )

        testAlert.addCancelAction(
          "Later"
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
              : `❌ Verbinding mislukt\n\n${balance.error}`
          )
        }

      } else {

        await showMessage(
          provider.name,
          "Provider geïnstalleerd.\n\nDe API-key is nog niet ingesteld. Je kunt die later toevoegen via Setup."
        )
      }

    } else {

      await showMessage(
        provider.name,
        "✅ Provider geïnstalleerd."
      )
    }


  } catch (error) {

    await showMessage(
      "Provider toevoegen mislukt",
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
      "Geen catalogus",
      "Stel eerst de Provider Catalog URL in via Setup."
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
        "De provider catalogus is leeg.\n\nVoeg eerst een provider toe via Setup → Provider toevoegen aan catalogus."
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
        "Alle providers uit de catalogus zijn reeds geïnstalleerd."
      )

      return
    }


    const alert =
      new Alert()


    alert.title =
      "Provider installeren"

    alert.message =
      "Kies een provider uit de GitHub catalogus."


    for (
      const provider
      of available
    ) {

      alert.addAction(
        provider.name
      )
    }

    alert.addCancelAction(
      "Annuleren"
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
          "Provider geïnstalleerd, maar de API-key is nog niet ingesteld."
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
      "Provider is geïnstalleerd.\n\nWil je de verbinding nu testen?"

    testAlert.addAction(
      "Verbinding testen"
    )

    testAlert.addCancelAction(
      "Later"
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
          : `❌ Verbinding mislukt\n\n${balance.error}`
      )
    }


  } catch (error) {

    await showMessage(
      "Installatie mislukt",
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
      ? "Voer een nieuwe key in. De oude key wordt vervangen."
      : "De API-key wordt veilig opgeslagen in Scriptable Keychain."


  alert.addSecureTextField(
    provider.auth.keyLabel ||
    "API Key"
  )


  alert.addAction(
    exists
      ? "Wijzigen"
      : "Opslaan"
  )


  alert.addCancelAction(
    "Annuleren"
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
      "Geen API-key ingevoerd."
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
        ? "🔑 API-key wijzigen"
        : "🔑 API-key toevoegen"
    )

  } else {

    alert.addAction(
      "🔓 Geen API-key nodig"
    )
  }


  alert.addAction(
    "🧪 Verbinding testen"
  )

  alert.addAction(
    "🔄 Module bijwerken"
  )

  alert.addDestructiveAction(
    "🗑 Provider verwijderen"
  )

  alert.addCancelAction(
    "Annuleren"
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
        ? `✅ Verbinding OK\n\nSaldo: ${formatMoney(
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
      "Provider Catalog URL ontbreekt."
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
        "Provider bestaat niet meer in de catalogus."
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
        "Lokale provider werd niet gevonden."
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
      `✅ Provider bijgewerkt.\n\n` +
      `Versie: v${provider.version} → v${newest.version}\n\n`

    if (changes.length > 0) {

      message +=
        "Wijzigingen:\n"

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
          `\n… en nog ${changes.length - shown.length} wijziging(en)`
      }

    } else {

      message +=
        "Geen veldwijzigingen."
    }


    await showMessage(
      provider.name,
      message
    )


  } catch (error) {

    await showMessage(
      "Update mislukt",
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
    "De lokale provider en API-key worden verwijderd. De provider blijft in de GitHub catalogus."


  alert.addDestructiveAction(
    "Verwijderen"
  )

  alert.addCancelAction(
    "Annuleren"
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
    "Provider verwijderd."
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
          "Geen API-key ingesteld."
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
        "Custom authenticatie-header ontbreekt."
      )
    }


    headers[
      auth.header
    ] =
      `${auth.prefix || ""}${apiKey}`

    return
  }


  throw new Error(
    `Authenticatietype '${auth.type}' wordt niet ondersteund.`
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
        `Saldo kon niet worden gelezen op pad '${response.amountPath}'.`
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
        `Creditgegevens konden niet worden gelezen ('${response.totalPath}' / '${response.usedPath}').`
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
        `Saldo-array ontbreekt op pad '${response.arrayPath}'.`
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
        "Geen saldo gevonden."
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
        "Saldo is geen geldig getal."
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
    "Onbekende response mode."
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


  for (
    const balance
    of balances
  ) {

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
        `⚠️ ${balance.name} saldo laag`

      notification.body =
        `Resterend saldo: ${formatMoney(
          balance.amount,
          balance.currency
        )}\n` +
        `Onder de drempel van ${thresholds.low}.`

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
      "Geen providers"

    alert.message =
      "Er zijn nog geen providers geïnstalleerd."

    alert.addAction(
      "Provider installeren"
    )

    alert.addCancelAction(
      "Annuleren"
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
        "Actueel resterend saldo"
      )


    headerCell.titleFont =
      Font.boldSystemFont(22)


    table.addRow(
      header
    )


    for (
      const balance
      of balances
    ) {

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
          balance.error

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
          COLORS.red
      }


      table.addRow(
        row
      )
    }


    const footer =
      new UITableRow()


    const footerCell =
      footer.addText(
        "Laatste controle",
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
      "🔄 Opnieuw ophalen",
      "Ververs alle saldi nu"
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
        "Geen providers ingesteld"
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


    for (
      const balance
      of shown
    ) {

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
          `+${balances.length - shown.length} meer`
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
    "Optionele toekomstige backend die provider-documentatie onderzoekt. API-keys worden nooit naar deze backend gestuurd."


  alert.addTextField(
    "https://...",
    cfg.discoveryUrl
  )


  alert.addAction(
    "Opslaan"
  )

  alert.addDestructiveAction(
    "Uitschakelen"
  )

  alert.addCancelAction(
    "Annuleren"
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
        "Alleen HTTPS URLs zijn toegestaan."
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
    "Config exporteren",
    "✅ Configuratie-overzicht gekopieerd naar klembord.\n\n" +
    "Bevat geen API-keys of GitHub-token."
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
      "Ongeldige catalogus."
    )
  }


  if (
    !Array.isArray(
      catalog.providers
    )
  ) {

    throw new Error(
      "providers[] ontbreekt."
    )
  }


  for (
    const provider
    of catalog.providers
  ) {

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
        "Provider ontbreekt."
    }
  }


  const required = [
    "id",
    "name",
    "version",
    "request",
    "response"
  ]


  for (
    const field
    of required
  ) {

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
        "Ongeldig provider ID."
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
        "API endpoint moet HTTPS zijn."
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
        "Alleen GET en POST zijn toegestaan."
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
        "Ongeldige response mode."
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
      "GitHub repository is niet volledig ingesteld."
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
        "JSON pad ontbreekt."
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


  for (
    const key
    of keys
  ) {

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
    "Onbekende fout"
  )
    .replace(
      /github_pat_[A-Za-z0-9_-]+/gi,
      "[GitHub token verborgen]"
    )
    .replace(
      /ghp_[A-Za-z0-9]+/gi,
      "[GitHub token verborgen]"
    )
    .replace(
      /gho_[A-Za-z0-9]+/gi,
      "[GitHub token verborgen]"
    )
    .replace(
      /ghu_[A-Za-z0-9]+/gi,
      "[GitHub token verborgen]"
    )
    .replace(
      /ghs_[A-Za-z0-9]+/gi,
      "[GitHub token verborgen]"
    )
    .replace(
      /ghr_[A-Za-z0-9]+/gi,
      "[GitHub token verborgen]"
    )
    .replace(
      /sk-[A-Za-z0-9_-]+/gi,
      "[API-key verborgen]"
    )
    .replace(
      /xox[baprs]-[A-Za-z0-9-]+/gi,
      "[API-key verborgen]"
    )
    .replace(
      /glpat-[A-Za-z0-9_-]+/gi,
      "[API-key verborgen]"
    )
    .replace(
      /AIza[A-Za-z0-9_-]{30,}/gi,
      "[API-key verborgen]"
    )
    .replace(
      /AKIA[A-Za-z0-9]{16}/gi,
      "[API-key verborgen]"
    )
    .replace(
      /ASIA[A-Za-z0-9]{16}/gi,
      "[API-key verborgen]"
    )
    .replace(
      /SG\.[A-Za-z0-9_-]{20,}/gi,
      "[API-key verborgen]"
    )
    .replace(
      /r8_[A-Za-z0-9_-]{20,}/gi,
      "[API-key verborgen]"
    )
    .replace(
      /hf_[A-Za-z0-9_-]{20,}/gi,
      "[API-key verborgen]"
    )
    .replace(
      /xvapi-[A-Za-z0-9_-]+/gi,
      "[API-key verborgen]"
    )
    .replace(
      /pplx-[A-Za-z0-9_-]+/gi,
      "[API-key verborgen]"
    )
    .replace(
      /key-[A-Za-z0-9_-]{20,}/gi,
      "[API-key verborgen]"
    )
    .replace(
      /\b[0-9a-f]{32,}\b/gi,
      "[API-key verborgen]"
    )
    .replace(
      /\b[A-Za-z0-9+/]{40,}\b/g,
      "[API-key verborgen]"
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
    "OK"
  )


  await alert.presentAlert()
}
