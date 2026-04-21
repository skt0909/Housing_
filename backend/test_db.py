from app import create_app

app = create_app()

with app.app_context():
    from app.database import query_one

    try:
        result = query_one('SELECT 1 as test')
        print("Database connection successful:", result)
    except Exception as e:
        print("Database connection failed:", e)