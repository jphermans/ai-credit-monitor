"""AI Credit Monitor — Flask server with embedded dashboard.

Monitors remaining prepaid credits across AI API providers using
provider manifests from providers.json and API keys from environment.
"""

import json
import logging
import sqlite3
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import requests
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, g, jsonify, request

from config import (
    DATA_DIR,
    DB_PATH,
    DEBUG,
    HOST,
    PORT,
    REFRESH_INTERVAL_MINUTES,
    get_api_key,
    get_enabled_providers,
    load_providers,
)

logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Credit Monitor</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #1C1C1E; color: #E5E5EA; min-height: 100vh;
}
.container { max-width: 720px; margin: 0 auto; padding: 16px; }
h1 { text-align: center; font-size: 1.4rem; padding: 20px 0 4px; color: #F2F2F7; }
.header-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0 16px; border-bottom: 1px solid #3A3A3C; margin-bottom: 16px;
}
.timestamp { font-size: 0.8rem; color: #8E8E93; }
.refresh-btn {
  background: #0A84FF; color: #fff; border: none; border-radius: 8px;
  padding: 6px 14px; font-size: 0.8rem; cursor: pointer;
}
.refresh-btn:hover { background: #0070E0; }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.summary {
  background: #2C2C2E; border-radius: 12px; padding: 14px 16px;
  margin-bottom: 16px;
}
.summary h2 { font-size: 0.85rem; color: #8E8E93; margin-bottom: 8px; }
.summary-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.summary-item {
  background: #3A3A3C; border-radius: 8px; padding: 10px 16px;
  min-width: 100px; text-align: center;
}
.summary-item .amount { font-size: 1.3rem; font-weight: 600; color: #30D158; }
.summary-item .currency { font-size: 0.75rem; color: #8E8E93; }
.provider {
  background: #2C2C2E; border-radius: 12px; padding: 14px 16px;
  margin-bottom: 10px; display: flex; justify-content: space-between;
  align-items: center; transition: background 0.2s;
}
.provider:hover { background: #3A3A3C; }
.provider-info { flex: 1; }
.provider-name { font-size: 0.95rem; font-weight: 500; color: #F2F2F7; }
.provider-label { font-size: 0.75rem; color: #8E8E93; margin-top: 2px; }
.provider-balance { text-align: right; }
.provider-amount { font-size: 1.1rem; font-weight: 600; }
.provider-currency { font-size: 0.75rem; color: #8E8E93; }
.provider-error {
  font-size: 0.75rem; color: #FF453A; text-align: right; margin-top: 2px;
  max-width: 200px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap;
}
.color-green { color: #30D158; }
.color-orange { color: #FF9F0A; }
.color-red { color: #FF453A; }
.color-grey { color: #8E8E93; }
.no-providers { text-align: center; color: #8E8E93; padding: 40px; }
.spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #fff;
  border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 480px) {
  .container { padding: 10px; }
  h1 { font-size: 1.2rem; }
  .summary-grid { flex-direction: column; }
}
</style>
</head>
<body>
<div class="container">
  <h1>&#x1F4B3; AI Credit Monitor</h1>
  <div class="header-bar">
    <span class="timestamp" id="timestamp">—</span>
    <button class="refresh-btn" id="refreshBtn" onclick="refresh()">Refresh</button>
  </div>
  <div class="summary" id="summary"></div>
  <div id="providers"></div>
</div>
<script>
async function fetchBalances() {
  try {
    const res = await fetch('/api/balances');
    return await res.json();
  } catch(e) { console.error(e); return null; }
}

function colorFor(amount, thresholds) {
  if (amount === null) return 'grey';
  if (amount <= thresholds.red) return 'red';
  if (amount <= thresholds.orange) return 'orange';
  return 'green';
}

function fmtAmount(n) {
  if (n === null || n === undefined) return '—';
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  return n.toFixed(2);
}

function render(data) {
  const ts = document.getElementById('timestamp');
  ts.textContent = data.last_check ? new Date(data.last_check).toLocaleString() : '—';

  // Summary totals
  const totals = {};
  data.providers.forEach(p => {
    if (p.success && p.amount != null) {
      const c = p.currency;
      totals[c] = (totals[c] || 0) + p.amount;
    }
  });
  const summaryEl = document.getElementById('summary');
  if (Object.keys(totals).length) {
    summaryEl.innerHTML = '<h2>Total Remaining</h2><div class="summary-grid">' +
      Object.entries(totals).map(([c, a]) =>
        `<div class="summary-item"><div class="amount">${fmtAmount(a)}</div><div class="currency">${c}</div></div>`
      ).join('') + '</div>';
  } else {
    summaryEl.style.display = 'none';
  }

  // Providers
  const el = document.getElementById('providers');
  if (!data.providers.length) {
    el.innerHTML = '<div class="no-providers">No providers configured. Set API keys in .env</div>';
    return;
  }
  el.innerHTML = data.providers.map(p => {
    const cls = p.success ? ('color-' + colorFor(p.amount, p.alerts || {red:0,orange:0})) : 'color-red';
    const errHtml = (!p.success && p.error) ? `<div class="provider-error" title="${p.error.replace(/"/g,'&quot;')}">${p.error}</div>` : '';
    return `<div class="provider">
      <div class="provider-info">
        <div class="provider-name">${p.name}</div>
        <div class="provider-label">${p.label || 'Balance'}</div>
      </div>
      <div class="provider-balance">
        <div class="provider-amount ${cls}">${fmtAmount(p.amount)}</div>
        <div class="provider-currency">${p.currency || ''}</div>
        ${errHtml}
      </div>
    </div>`;
  }).join('');
}

async function refresh() {
  const btn = document.getElementById('refreshBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Refreshing...';
  await fetch('/api/refresh', {method:'POST'});
  const data = await fetchBalances();
  if (data) render(data);
  btn.disabled = false;
  btn.textContent = 'Refresh';
}

// Auto-refresh every 60s
setInterval(async () => {
  const data = await fetchBalances();
  if (data) render(data);
}, 60000);

// Initial load
fetchBalances().then(data => { if (data) render(data); });
</script>
</body>
</html>"""


# ─── Database ───────────────────────────────────────────────────────────────


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(str(DB_PATH))
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS balances (
            provider_id TEXT NOT NULL,
            amount REAL,
            currency TEXT,
            timestamp TEXT NOT NULL,
            success INTEGER NOT NULL DEFAULT 0,
            error TEXT
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_balances_provider_ts
        ON balances(provider_id, timestamp DESC)
    """)
    conn.commit()
    conn.close()


# ─── Balance fetching ───────────────────────────────────────────────────────


def _resolve_path(data: dict, path: str):
    """Resolve a dot-notation JSON path like 'data.balance'."""
    for key in path.split("."):
        if not isinstance(data, dict) or key not in data:
            raise KeyError(f"Path '{path}' not found")
        data = data[key]  # type: ignore[assignment]
    return data


def fetch_provider_balance(provider: dict) -> dict:
    """Fetch balance for a single provider. Returns result dict."""
    pid = provider["id"]
    api_key = get_api_key(pid)

    if not api_key and provider["auth"]["type"] != "none":
        return {
            "id": pid,
            "name": provider["name"],
            "label": provider["response"].get("label", "Balance"),
            "currency": provider["response"].get("currency", "USD"),
            "amount": None,
            "success": False,
            "error": "No API key configured",
            "alerts": provider.get("alerts", {"redThreshold": 0, "orangeThreshold": 0}),
        }

    req = provider["request"]
    headers = {}
    auth = provider["auth"]

    if auth["type"] == "bearer":
        headers[auth["header"]] = f"{auth.get('prefix', 'Bearer ')}{api_key}"
    elif auth["type"] == "header":
        headers[auth["header"]] = f"{auth.get('prefix', '')}{api_key}"

    # Merge any extra headers from request config
    if "headers" in req:
        headers.update(req["headers"])

    try:
        resp = requests.request(
            method=req.get("method", "GET"),
            url=req["url"],
            headers=headers,
            timeout=15,
        )
        data = resp.json()
    except requests.exceptions.Timeout:
        return _error_result(provider, "Request timed out")
    except requests.exceptions.ConnectionError:
        return _error_result(provider, "Connection failed")
    except json.JSONDecodeError:
        return _error_result(provider, "Invalid JSON response")
    except Exception as e:
        return _error_result(provider, str(e))

    resp_config = provider["response"]
    mode = resp_config["mode"]

    # Check for error in response
    error_path = resp_config.get("errorPath")
    if error_path:
        try:
            err_val = _resolve_path(data, error_path)
            if err_val:
                return _error_result(provider, str(err_val))
        except KeyError:
            pass  # No error field present — continue

    try:
        if mode == "single":
            raw = _resolve_path(data, resp_config["amountPath"])
            amount = float(raw) if not isinstance(raw, (int, float)) else raw
            currency = resp_config.get("currency", "USD")

        elif mode == "difference":
            raw_total = _resolve_path(data, resp_config["totalPath"])
            raw_used = _resolve_path(data, resp_config["usedPath"])
            total = float(raw_total) if not isinstance(raw_total, (int, float)) else raw_total
            used = float(raw_used) if not isinstance(raw_used, (int, float)) else raw_used
            amount = round(total - used, 6)
            currency = resp_config.get("currency", "USD")

        elif mode == "array":
            arr = _resolve_path(data, resp_config["arrayPath"])
            if not isinstance(arr, list):
                return _error_result(provider, f"Expected array at {resp_config['arrayPath']}")
            preferred = resp_config.get("preferredCurrency", "USD")
            amount = None
            currency = preferred
            for item in arr:
                item_currency = item.get(resp_config["currencyField"], "")
                if item_currency == preferred:
                    amount = float(item[resp_config["amountField"]])
                    break
            if amount is None and arr:
                first = arr[0]
                amount = float(first[resp_config["amountField"]])
                currency = first.get(resp_config["currencyField"], "USD")
            if amount is None:
                return _error_result(provider, "No matching currency in array")
        else:
            return _error_result(provider, f"Unknown response mode: {mode}")

        return {
            "id": pid,
            "name": provider["name"],
            "label": resp_config.get("label", "Balance"),
            "currency": currency,
            "amount": amount,
            "success": True,
            "error": None,
            "alerts": provider.get("alerts", {"redThreshold": 0, "orangeThreshold": 0}),
        }

    except (KeyError, TypeError, ValueError) as e:
        return _error_result(provider, f"Parse error: {e}")


def _error_result(provider: dict, error: str) -> dict:
    return {
        "id": provider["id"],
        "name": provider["name"],
        "label": provider["response"].get("label", "Balance"),
        "currency": provider["response"].get("currency", "USD"),
        "amount": None,
        "success": False,
        "error": error,
        "alerts": provider.get("alerts", {"redThreshold": 0, "orangeThreshold": 0}),
    }


def fetch_all_balances() -> list[dict]:
    """Fetch balances for all enabled providers in parallel."""
    providers = get_enabled_providers()
    results = []

    with ThreadPoolExecutor(max_workers=8) as pool:
        future_to_pid = {pool.submit(fetch_provider_balance, p): p["id"] for p in providers}
        for future in as_completed(future_to_pid):
            try:
                results.append(future.result())
            except Exception as e:
                pid = future_to_pid[future]
                logger.exception("Failed to fetch %s", pid)
                results.append({
                    "id": pid,
                    "name": pid,
                    "label": "Balance",
                    "currency": "USD",
                    "amount": None,
                    "success": False,
                    "error": str(e),
                    "alerts": {"redThreshold": 0, "orangeThreshold": 0},
                })

    # Sort by provider name
    results.sort(key=lambda r: r["name"])

    # Persist to DB
    now = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(str(DB_PATH))
    try:
        conn.execute("BEGIN")
        for r in results:
            conn.execute(
                "INSERT INTO balances (provider_id, amount, currency, timestamp, success, error) VALUES (?, ?, ?, ?, ?, ?)",
                (r["id"], r["amount"], r["currency"], now, int(r["success"]), r["error"]),
            )
        conn.commit()
    finally:
        conn.close()

    logger.info("Fetched %d providers in %.1fs", len(results), 0)
    return results


def get_latest_balances() -> list[dict]:
    """Read the most recent balance row per provider from the DB."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT b.* FROM balances b
        INNER JOIN (
            SELECT provider_id, MAX(timestamp) as ts
            FROM balances GROUP BY provider_id
        ) latest ON b.provider_id = latest.provider_id AND b.timestamp = latest.ts
        ORDER BY b.provider_id
    """).fetchall()
    conn.close()

    providers_by_id = {p["id"]: p for p in load_providers()}
    results = []
    for row in rows:
        pid = row["provider_id"]
        p = providers_by_id.get(pid, {})
        results.append({
            "id": pid,
            "name": p.get("name", pid),
            "label": p.get("response", {}).get("label", "Balance"),
            "currency": row["currency"] or "USD",
            "amount": row["amount"],
            "success": bool(row["success"]),
            "error": row["error"],
            "alerts": p.get("alerts", {"redThreshold": 0, "orangeThreshold": 0}),
        })
    return results


# ─── Routes ──────────────────────────────────────────────────────────────────


@app.route("/")
def dashboard():
    return DASHBOARD_HTML, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/api/balances")
def api_balances():
    """Return latest cached balances."""
    results = get_latest_balances()

    # Find the most recent timestamp across all providers
    conn = sqlite3.connect(str(DB_PATH))
    row = conn.execute("SELECT MAX(timestamp) as ts FROM balances").fetchone()
    conn.close()

    return jsonify({
        "providers": results,
        "last_check": row[0] if row and row[0] else None,
    })


@app.route("/api/refresh", methods=["POST"])
def api_refresh():
    """Force-refresh all provider balances."""
    results = fetch_all_balances()
    return jsonify({"refreshed": len(results), "providers": results})


@app.route("/api/providers")
def api_providers():
    """List all providers with their key status."""
    all_providers = load_providers()
    enabled_ids = {p["id"] for p in get_enabled_providers()}
    return jsonify({
        "providers": [
            {
                "id": p["id"],
                "name": p["name"],
                "description": p.get("description", ""),
                "enabled": p["id"] in enabled_ids,
            }
            for p in all_providers
        ]
    })


@app.route("/api/history/<provider_id>")
def api_history(provider_id):
    """Return balance history for a provider (last 100 readings)."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT amount, currency, timestamp, success, error FROM balances WHERE provider_id = ? ORDER BY timestamp DESC LIMIT 100",
        (provider_id,),
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


# ─── Scheduler ───────────────────────────────────────────────────────────────


def scheduled_refresh():
    """Job executed by APScheduler at regular intervals."""
    logger.info("Scheduled refresh starting...")
    fetch_all_balances()


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_executor("threadpool", {"max_workers": 4})
    scheduler.add_job(
        scheduled_refresh,
        "interval",
        minutes=REFRESH_INTERVAL_MINUTES,
        id="balance_refresh",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — refresh every %d min", REFRESH_INTERVAL_MINUTES)


# ─── Main ───────────────────────────────────────────────────────────────────


def main():
    init_db()
    start_scheduler()
    # Do an initial fetch so there's data on first load
    fetch_all_balances()
    logger.info(
        "AI Credit Monitor starting on %s:%d (debug=%s, refresh=%d min)",
        HOST, PORT, DEBUG, REFRESH_INTERVAL_MINUTES,
    )
    app.run(host=HOST, port=PORT, debug=DEBUG)


if __name__ == "__main__":
    main()
