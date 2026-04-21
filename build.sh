#!/usr/bin/env bash
set -e

echo "Building React frontend..."
cd frontend
npm ci
npm run build
cd ..

echo "Copying build to Flask static folder..."
rm -rf backend/app/static/*
cp -r frontend/dist/* backend/app/static/

echo "Build complete."
