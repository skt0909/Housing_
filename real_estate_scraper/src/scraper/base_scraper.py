from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

import requests


class BaseScraper(ABC):
    """Shared HTTP scraper behaviour."""

    def __init__(self, base_url: str, timeout: int = 30, request_params: dict[str, Any] | None = None) -> None:
        self.base_url = base_url
        self.timeout = timeout
        self.request_params = request_params or {}
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept-Language": "en-GB,en;q=0.9",
            }
        )

    def fetch(self, url: str, params: dict[str, Any] | None = None) -> str:
        response = self.session.get(url, params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.text

    def fetch_json(self, url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        response = self.session.get(url, params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    @abstractmethod
    def scrape(self) -> list[dict[str, Any]]:
        """Return a list of scraped records."""
