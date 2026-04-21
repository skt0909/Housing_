# Housing Int - London Property Market Analytics

A full-stack web application for scraping, analyzing, and visualizing London real estate market data. Built with Flask (backend), React (frontend), and MySQL (database).

## Overview

**Housing Int** aggregates property listings from Rightmove, performs data cleaning and analysis, and provides an interactive map and analytics dashboard to explore London's rental and purchase markets by borough, area, and property type.

### Tech Stack

- **Backend**: Flask (Python 3.13) with PyMySQL
- **Frontend**: React 19 + Vite with React Router, Recharts, React Leaflet
- **Database**: MySQL
- **Deployment**: Railway (see [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md))

## Project Structure

```
.
├── backend/                    # Flask API
│   ├── app/
│   │   ├── __init__.py        # App factory
│   │   ├── config.py          # Configuration (MySQL, Flask)
│   │   ├── database.py        # MySQL connection pool
│   │   ├── static/            # Built React app (generated)
│   │   └── routes/            # API endpoints
│   │       ├── listings.py    # GET /api/listings, /api/listings/map
│   │       ├── boroughs.py    # Borough data & statistics
│   │       ├── analytics.py   # Analytics endpoints
│   │       ├── filters.py     # Filter options
│   │       ├── transport.py   # Transport data
│   │       └── status.py      # Health check
│   ├── wsgi.py                # Gunicorn entry point
│   ├── requirements.txt        # Flask dependencies
│   └── .env.example           # Env vars template
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page layouts
│   │   └── App.jsx            # Main app
│   ├── dist/                  # Built output (generated)
│   ├── vite.config.js         # Vite config with dev proxy
│   ├── package.json
│   └── index.html
│
├── real_estate_scraper/       # Data ingestion pipeline
│   ├── main.py                # Scraper entry point
│   ├── requirements.txt        # Scraper dependencies
│   ├── sql/
│   │   ├── mysql_schema.sql   # Database schema
│   │   └── clean_data_queries.sql
│   ├── database/              # SQLite files (local dev)
│   └── src/
│       ├── scraper/           # Rightmove scrapers (rent/buy)
│       ├── storage/           # DB handlers
│       ├── parser/            # Data parsing
│       ├── pipeline/          # Data cleaning
│       └── utils/             # Helpers & config
│
├── build.sh                   # Full build script (React + install deps)
├── railway.toml               # Railway deploy config
├── nixpacks.toml              # Nixpacks runtime config
├── render.yaml                # Render.com config (legacy)
└── RAILWAY_DEPLOYMENT.md      # Railway setup guide
```

## Local Development

### Prerequisites

- Python 3.13 with pip
- Node.js 18+ with npm
- MySQL 8.0+ (local or Docker)

### Setup

1. **Clone & install dependencies**
   ```bash
   git clone <repo>
   cd Housing\ Int
   
   # Backend
   cd backend
   pip install -r requirements.txt
   cd ..
   
   # Frontend
   cd frontend
   npm install
   cd ..
   ```

2. **Configure MySQL**
   - Create a database: `CREATE DATABASE h_db;`
   - Load schema: `mysql h_db < real_estate_scraper/sql/mysql_schema.sql`
   - Create `.env` in `real_estate_scraper/`:
     ```
     MYSQL_HOST=localhost
     MYSQL_PORT=3306
     MYSQL_USER=root
     MYSQL_PASSWORD=your_password
     MYSQL_DATABASE=h_db
     ```

3. **Run locally**
   
   Terminal 1 (React dev server):
   ```bash
   cd frontend
   npm run dev
   ```
   
   Terminal 2 (Flask API):
   ```bash
   cd backend
   export FLASK_ENV=development
   python wsgi.py  # Runs on http://localhost:5000
   ```
   
   Visit http://localhost:5173 (Vite dev server with proxy to /api on Flask)

### Running the Scraper

The scraper is a separate process that pulls data from Rightmove and populates the database:

```bash
cd real_estate_scraper
python main.py
```

Configure scraper behavior via `src/utils/config.py` or environment variables:
- `SCRAPER_MODE` - "rent", "buy", or "both"
- `RIGHTMOVE_MAX_PAGES` - Pages to scrape (default 5)
- `RIGHTMOVE_AREA_NAMES` - Specific areas to target
- `RIGHTMOVE_PROPERTY_TYPES` - Filter by property type (flat, terraced, etc.)

## Database Schema

Three main tables:

- **`rightmove_listings`** — Raw scraped data from Rightmove (VARCHAR/TEXT fields)
- **`clean_listings`** — Cleaned & typed data ready for analysis (BIGINT price, INT beds/baths, DOUBLE lat/lng)
- **`borough_data`** — London borough statistics (crime, population, amenities)

See `real_estate_scraper/sql/mysql_schema.sql` for full schema definition.

## Deployment

### Railway (Recommended)

Production deployment to Railway with auto-deploys on git push.

**Setup**: Follow [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for step-by-step instructions.

**Key files**:
- `railway.toml` — Build & deploy commands
- `nixpacks.toml` — Runtime versions (Python 3.13, Node 22)

After setup, just push to GitHub and Railway auto-deploys.

### Local Testing

Build and test locally before deploying:

```bash
bash build.sh  # Builds React, copies to Flask static/
cd backend && pip install -r requirements.txt
cd backend && python wsgi.py
```

Visit http://localhost:5000 — the Flask server will serve the built React app and API.

## API Endpoints

### Data

- `GET /api/listings` — All listings with filters
- `GET /api/listings/map` — Map marker data
- `GET /api/boroughs/<code>` — Borough statistics
- `GET /api/analytics/<type>` — Analytics (price distribution, etc.)
- `GET /api/filters` — Available filter options (property types, price ranges, etc.)
- `GET /api/transport/<postcode>` — Transport info

### Health

- `GET /api/status` — Health check

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `FLASK_ENV` | Flask mode (development/production) | development |
| `MYSQL_HOST` | Database host | localhost |
| `MYSQL_PORT` | Database port | 3306 |
| `MYSQL_USER` | Database user | root |
| `MYSQL_PASSWORD` | Database password | (empty) |
| `MYSQL_DATABASE` | Database name | h_db |
| `PORT` | HTTP port (set by Railway) | 5000 |

See `backend/.env.example` and `real_estate_scraper/.env` for more options.

## Development Workflow

1. **Create a feature branch** from `main`
2. **Make changes** — backend, frontend, or scraper
3. **Test locally** — both the web app and scraper
4. **Push to GitHub** — Railway auto-deploys to production
5. **Verify on Railway** — check health endpoint and data endpoints

## Troubleshooting

- **MySQL connection error**: Verify `MYSQL_*` vars are set correctly
- **React build fails**: Ensure Node 18+ installed, try `npm ci`
- **API returns 500**: Check Flask logs for exceptions
- **Scraper stuck**: Set `SCRAPER_TIMEOUT` env var higher, check Rightmove site is accessible

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for Railway-specific troubleshooting.

## License

MIT