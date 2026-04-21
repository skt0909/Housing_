# Railway Deployment Guide

## Files Created

- **`railway.toml`** - Railway build & deploy configuration
- **`nixpacks.toml`** - Specifies Python 3.13 and Node 22 runtime
- **`backend/.env.example`** - Updated with all required MySQL vars (documentation)
- **`backend/app/config.py`** - Fixed to load `.env` only in development

## Setup Steps

### 1. Connect GitHub to Railway
1. Go to [railway.app](https://railway.app)
2. Create a new project → "Deploy from GitHub repo"
3. Select your GitHub repo for this project

### 2. Provision MySQL Database
1. In Railway dashboard, click "+ Add Service"
2. Select "MySQL" from the marketplace
3. Railway will auto-generate credentials and set environment variables:
   - `MYSQLHOST` / `MYSQL_HOST` 
   - `MYSQLPORT` / `MYSQL_PORT`
   - `MYSQLUSER` / `MYSQL_USER`
   - `MYSQLPASSWORD` / `MYSQL_PASSWORD`
   - `MYSQLDATABASE` / `MYSQL_DATABASE`

### 3. Configure Environment Variables
In your web service settings, set:
```
FLASK_ENV=production
```

**Note**: MySQL vars will be auto-set by the MySQL plugin. If Railway uses `MYSQLHOST` instead of `MYSQL_HOST`, you can either:
- Create aliases in Railway's "Variable References"
- Or update `backend/app/config.py` to read both formats

### 4. Run Database Schema
Before first deploy, run the schema migration:
1. In Railway, open the MySQL service terminal
2. Connect via the provided credentials
3. Run:
   ```sql
   source /path/to/real_estate_scraper/sql/mysql_schema.sql
   ```
   Or copy/paste the schema from that file directly into Railway's MySQL console

### 5. Deploy
Push to GitHub. Railway will:
1. Clone the repo
2. Run `bash build.sh` (builds React + copies to Flask static)
3. Run `pip install -r backend/requirements.txt`
4. Start `cd backend && gunicorn wsgi:app --workers 2 --bind 0.0.0.0:$PORT`

### 6. Verify Deployment
- **Health check**: Visit `https://<your-app>.railway.app/api/status` → Should return `{"status": "ok"}`
- **SPA loads**: Visit `https://<your-app>.railway.app/` → Should load React app
- **Data endpoints**: Visit `https://<your-app>.railway.app/api/listings` → Should return data from MySQL

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails: "npm: command not found" | Nixpacks should auto-detect Node. Check that `nixpacks.toml` exists and lists `nodejs_22` |
| MySQL connection refused | Verify `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD` are set in Railway dashboard |
| 404 on `/api/status` | Check that Flask app started. Look at deploy logs for errors |
| React SPA doesn't load | Verify `build.sh` ran successfully. Check that `frontend/dist/` exists after build |
| "Can't find real_estate_scraper/.env" in logs | This is expected — config.py only loads it in dev. Ignore if `FLASK_ENV=production` is set |

## Local Development

No changes needed for local dev. Continue using:
```bash
# Terminal 1: React dev server
cd frontend && npm run dev

# Terminal 2: Flask server
cd backend && python wsgi.py
```

Local Flask will auto-load `../../real_estate_scraper/.env` since `FLASK_ENV=development` by default.

## Scraper (Separate Service)

The `real_estate_scraper/main.py` is a separate data ingestion process, not part of the web server. To run it on Railway:
1. Create a second Railway service for the scraper
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `cd real_estate_scraper && python main.py`
4. Link it to the same MySQL plugin
5. Set scraper-specific env vars: `SCRAPER_MODE`, `RIGHTMOVE_MAX_PAGES`, etc.

(Or run the scraper locally and just deploy the web server to Railway.)
