FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend ./frontend
RUN cd frontend && npm ci && npm run build

FROM python:3.13-slim
WORKDIR /app

# Copy entire project
COPY . .

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built frontend to Flask static folder
RUN mkdir -p backend/app/static && rm -rf backend/app/static/* && cp -r frontend/dist/* backend/app/static/

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Set Flask environment
ENV FLASK_ENV=production
ENV PORT=8000

# Start Flask app from backend directory
WORKDIR /app/backend
EXPOSE 8000
CMD ["python", "-m", "gunicorn", "wsgi:app", "--workers", "2", "--bind", "0.0.0.0:8000"]
