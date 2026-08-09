// ============================================================
// AI Credit Monitor
// Version: 0.2.2
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
// Fixes:
// - Safe text field handling
// - No text fields inside presentSheet()
// - Better empty catalog messages
// ============================================================


// ============================================================
// APP CONFIG
// ============================================================

const APP_NAME = "AI Credit Monitor"
const APP_VERSION = "0.2.2"

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

  refreshMinutes: 30
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
    await loadAllBalances()

  const widget =
    await createWidget(
      balances
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


  if (result === 0) {

    await showBalances()

  } else if (result === 1) {

    await installProviderFromCatalog()

  } else if (result === 2) {

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


  await table.present()
}


// ============================================================
// CATALOG URL SETUP
// ============================================================

async function configureCatalogUrl() {

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


  if (result === 0) {

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
    result === 1
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


  if (result !== 0) {
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


  if (result === 0) {

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
    result === 1
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
      "2026-03-10",

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


    if (result !== 0) {
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


    if (result === 0) {

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
      result === 1
    ) {

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


      if (result !== 0) {
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


    if (result !== 0) {
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
      result === 0
        ? "GET"
        : "POST"


    // ========================================================
    // STEP 4 - RESPONSE TYPE
    // ========================================================

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

    if (result === 0) {

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


      if (result !== 0) {
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
      result === 1
    ) {

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


      if (result !== 0) {
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


      if (result !== 0) {
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


    if (result !== 0) {
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


    if (installResult !== 0) {

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


        if (testResult === 0) {

          const balance =
            await fetchProviderBalance(
              provider
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


    if (testResult === 0) {

      const balance =
        await fetchProviderBalance(
          provider
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


  if (result !== 0) {

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


  if (result === 0) {

    if (
      provider.auth?.type !==
      "none"
    ) {

      await configureProviderKey(
        provider
      )
    }


  } else if (
    result === 1
  ) {

    const balance =
      await fetchProviderBalance(
        provider
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
    result === 2
  ) {

    await updateInstalledProvider(
      provider
    )


  } else if (
    result === 3
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


    installed[index] =
      newest


    saveInstalledProviders(
      installed
    )


    await showMessage(
      provider.name,
      `✅ Provider bijgewerkt naar versie ${newest.version}.`
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


  if (result !== 0) {
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


  await showMessage(
    provider.name,
    "Provider verwijderd."
  )
}


// ============================================================
// PROVIDER REQUEST ENGINE
// ============================================================

async function fetchProviderBalance(
  provider
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
      null
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


    return result


  } catch (error) {

    result.error =
      cleanError(
        error
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
          response.amountPath
        )
      )


    if (
      !Number.isFinite(
        amount
      )
    ) {

      throw new Error(
        "Saldo kon niet worden gelezen."
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
          response.totalPath
        )
      )


    const used =
      Number(
        readPath(
          json,
          response.usedPath
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
        "Creditgegevens konden niet worden gelezen."
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
        response.arrayPath
      )


    if (
      !Array.isArray(
        array
      )
    ) {

      throw new Error(
        "Saldo-array ontbreekt."
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

async function loadAllBalances() {

  const providers =
    loadInstalledProviders()

  const balances = []


  for (
    const provider
    of providers
  ) {

    balances.push(
      await fetchProviderBalance(
        provider
      )
    )
  }


  return balances
}


// ============================================================
// BALANCE SCREEN
// ============================================================

async function showBalances() {

  const providers =
    loadInstalledProviders()


  if (
    providers.length ===
    0
  ) {

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


    if (result === 0) {

      await installProviderFromCatalog()
    }

    return
  }


  const balances =
    await loadAllBalances()


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

      const cell =
        row.addText(
          balance.name,
          `${formatMoney(
            balance.amount,
            balance.currency
          )} • ${balance.label}`
        )


      cell.titleFont =
        Font.boldSystemFont(17)


      cell.subtitleColor =
        balanceColor(
          balance.amount
        )


    } else {

      const cell =
        row.addText(
          balance.name,
          balance.error
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


  await table.present()
}


// ============================================================
// WIDGET
// ============================================================

async function createWidget(
  balances
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


  const title =
    widget.addText(
      "AI Credits"
    )


  title.font =
    Font.boldSystemFont(17)

  title.textColor =
    COLORS.white


  widget.addSpacer(
    12
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

    for (
      const balance
      of balances
    ) {

      const row =
        widget.addStack()

      row.layoutHorizontally()


      const provider =
        row.addText(
          balance.name
        )


      provider.font =
        Font.semiboldSystemFont(13)

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
        Font.boldSystemFont(14)


      amount.textColor =
        balance.success
          ? balanceColor(
              balance.amount
            )
          : COLORS.red


      widget.addSpacer(
        7
      )
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


  return widget
}


// ============================================================
// DISCOVERY BACKEND
// ============================================================

async function configureDiscoveryUrl() {

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


  if (result === 0) {

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
    result === 1
  ) {

    cfg.discoveryUrl =
      ""


    saveConfig(
      cfg
    )
  }
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
  path
) {

  if (!path) {

    return undefined
  }


  return String(path)
    .split(".")
    .reduce(
      (
        value,
        key
      ) => {

        if (
          value ===
            undefined ||
          value ===
            null
        ) {

          return undefined
        }


        return value[
          key
        ]
      },

      object
    )
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


  return (
    prefix +
    (
      Number(amount) < 1
        ? Number(amount)
            .toFixed(4)
        : Number(amount)
            .toFixed(2)
    )
  )
}


function balanceColor(
  amount
) {

  if (
    amount === null ||
    amount === undefined
  ) {

    return COLORS.grey
  }


  if (
    amount <= 1
  ) {

    return COLORS.red
  }


  if (
    amount <= 5
  ) {

    return COLORS.orange
  }


  return COLORS.green
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
      /sk-[A-Za-z0-9_-]+/gi,
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
