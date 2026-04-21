import os
from dotenv import load_dotenv

# Load from the scraper's .env in development only
# On Railway/Render, env vars are injected directly via platform config
if os.environ.get("FLASK_ENV") != "production":
    _env_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "real_estate_scraper", ".env"
    )
    load_dotenv(_env_path)


class Config:
    MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.environ.get("MYSQL_PORT", 3306))
    MYSQL_USER = os.environ.get("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
    MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "h_db")
    STATIC_FOLDER = os.path.join(os.path.dirname(__file__), "static")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
