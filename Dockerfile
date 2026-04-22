FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend ./frontend
RUN cd frontend && npm ci && npm run build

FROM python:3.13-slim
WORKDIR /app
COPY . .
COPY --from=builder /app/frontend/dist ./frontend/dist
RUN mkdir -p backend/app/static && cp -r frontend/dist/* backend/app/static/
RUN pip install --no-cache-dir -r backend/requirements.txt
ENV FLASK_ENV=production
EXPOSE 8000
CMD ["python", "-m", "gunicorn", "wsgi:app", "--workers", "2", "--bind", "0.0.0.0:8000", "--chdir", "/app/backend"]
