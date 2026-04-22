FROM python:3.13-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy entire project
COPY . .

# Build React frontend
RUN cd frontend && npm ci && npm run build && cd ..

# Copy built frontend to Flask static folder
RUN rm -rf backend/app/static/* && cp -r frontend/dist/* backend/app/static/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Set Flask environment
ENV FLASK_ENV=production
ENV PORT=8000

# Start Flask app
CMD ["sh", "-c", "cd backend && gunicorn wsgi:app --workers 2 --bind 0.0.0.0:$PORT"]
