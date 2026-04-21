from __future__ import annotations

from src.parser.html_parser import extract_rightmove_listings

from .base_scraper import BaseScraper


class RentScraper(BaseScraper):
    def scrape(self) -> list[dict]:
        html = self.fetch(self.base_url, self.request_params)
        return extract_rightmove_listings(html, self.base_url, listing_type="rent")
