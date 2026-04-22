#!/bin/sh
exec gunicorn wsgi:app --workers 2 --bind 0.0.0.0:${PORT:-8000}
