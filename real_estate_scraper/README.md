# Real Estate Scraper

A starter project for collecting, parsing, validating, and storing Rightmove listing data for rent and buy workflows.

## Quick Start

```bash
pip install -r requirements.txt
python main.py
```

## Rightmove Usage

Set a Rightmove search results URL in `.env`.

```env
SCRAPER_MODE=rent
RENT_URL=https://www.rightmove.co.uk/property-to-rent/CV.html
SCRAPER_TIMEOUT=30
RIGHTMOVE_MAX_PAGES=5
```

For buying results, switch to a Rightmove sale URL and set `SCRAPER_MODE=buy`.

You can also drive Rightmove searches with named areas and filters instead of building the query URL yourself:

```env
SCRAPER_MODE=both
RIGHTMOVE_MAX_PAGES=5
RIGHTMOVE_AREA_NAMES=London,Central London,Wimbledon,North London,South London,Bromley,Beckenham,Hampstead,Romford,Walthamstow
RIGHTMOVE_PROPERTY_TYPES=flat,terraced
RIGHTMOVE_MUST_HAVE=parking,garden
```

Supported named areas:

- `London`
- `Central London`
- `Wimbledon`
- `North London`
- `South London`
- `Bromley`
- `Beckenham`
- `Hampstead`
- `Romford`
- `Walthamstow`

Supported property types:

- `flat`
- `terraced`
- `semi-detached`
- `detached`
- `bungalow`
- `maisonette`
- `house`
- `cottage`
- `park-home`

Supported `RIGHTMOVE_MUST_HAVE` values:

- `parking`
- `garden`
- `garage`

Stored listing rows now include `latitude` and `longitude` when Rightmove exposes them in the page payload.

## Notes

- The scraper currently targets Rightmove search-result pages.
- It now requests up to `RIGHTMOVE_MAX_PAGES` pages per search target.
- It first tries embedded structured data and then falls back to HTML card parsing.
- Page structure changes on Rightmove may require parser updates.
