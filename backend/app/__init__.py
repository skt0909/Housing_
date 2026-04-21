import os
from flask import Flask, send_from_directory, request, jsonify
from .config import config_map
from .database import close_db


def create_app(env: str = None) -> Flask:
    if env is None:
        env = os.environ.get("FLASK_ENV", "development")

    cfg = config_map.get(env, config_map["development"])

    app = Flask(__name__, static_folder=cfg.STATIC_FOLDER, static_url_path="/static-assets")
    app.config.from_object(cfg)

    # Teardown: close DB connections after each request
    app.teardown_appcontext(close_db)

    # Debug logging
    @app.before_request
    def log_request():
        print(f"[{app.debug_id}] {request.method} {request.path}", flush=True)

    # Register API blueprints BEFORE the catch-all
    from .routes.status import bp as status_bp
    from .routes.listings import bp as listings_bp
    from .routes.boroughs import bp as boroughs_bp
    from .routes.analytics import bp as analytics_bp
    from .routes.filters import bp as filters_bp
    from .routes.transport import bp as transport_bp

    app.register_blueprint(status_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(boroughs_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(filters_bp)
    app.register_blueprint(transport_bp)
    import uuid
    app.debug_id = str(uuid.uuid4())[:8]
    print(f"[INIT] App {app.debug_id} initialized with {len(list(app.url_map.iter_rules()))} routes", flush=True)

    # Catch-all: serve React's index.html for all non-API routes
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        # Don't intercept API routes — blueprints should handle them first
        print(f"[SERVE_REACT] path={path}, starts with api/: {path.startswith('api/')}", flush=True)
        if path.startswith("api/"):
            return {"error": "API endpoint not found"}, 404
        static_folder = app.static_folder or ""
        if path and os.path.exists(os.path.join(static_folder, path)):
            return send_from_directory(static_folder, path)
        index = os.path.join(static_folder, "index.html")
        if os.path.exists(index):
            return send_from_directory(static_folder, "index.html")
        return {"message": "React build not found. Run: bash build.sh"}, 404

    return app
