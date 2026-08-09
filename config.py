"""Configuration loader for AI Credit Monitor server."""

import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
PROVIDERS_FILE = BASE_DIR / "providers.json"
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "balances.db"


def load_env_bool(key: str, default: bool = False) -> bool:
    return os.environ.get(key, "").strip().lower() in ("1", "true", "yes")


def load_env_int(key: str, default: int = 0) -> int:
    try:
        return int(os.environ.get(key, default))
    except (ValueError, TypeError):
        return default


REFRESH_INTERVAL_MINUTES = load_env_int("REFRESH_INTERVAL_MINUTES", 15)
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = load_env_int("PORT", 5000)
DEBUG = load_env_bool("DEBUG", False)


def load_providers() -> list[dict]:
    """Load provider manifests from providers.json."""
    if not PROVIDERS_FILE.exists():
        raise FileNotFoundError(f"providers.json not found at {PROVIDERS_FILE}")
    with open(PROVIDERS_FILE) as f:
        data = json.load(f)
    providers = data.get("providers", [])
    if not providers:
        raise ValueError("providers.json contains no providers")
    return providers


def get_api_key(provider_id: str) -> str | None:
    """Get API key from environment: KEY_{PROVIDER_ID.upper()}."""
    env_key = f"KEY_{provider_id.upper().replace('-', '_')}"
    return os.environ.get(env_key)


def get_enabled_providers() -> list[dict]:
    """Return providers that have an API key configured."""
    return [p for p in load_providers() if get_api_key(p["id"])]
