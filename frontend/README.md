# HMS Frontend

Hospital Management System - React + TypeScript + Vite

## Getting Started

Before doing anything else, you must define the necessary API keys using the `.env.example` file.
```bash
cp .env.example .env.local
```
Fill in `.env.local` with your valid Google Maps API Key to enable map features.

```bash
cd frontend
npm install
npm run dev
```

Server runs on: http://localhost:3000
Backend proxy: http://localhost:8080/api

## Project Structure

```
src/
├── api/          # Axios instance & API configuration
├── auth/         # Authentication context & routes
├── components/   # Reusable UI components
├── layout/       # Layout wrappers
├── pages/        # Page components
├── services/     # API service functions
├── types/        # TypeScript interfaces
├── App.tsx       # Main app with routing
└── main.tsx      # Entry point
```

## Features

✅ Centralized Axios API with JWT interceptor
✅ Role-based routing (ADMIN, DOCTOR, PATIENT)
✅ Protected private routes
✅ Material-UI components
✅ TypeScript support
✅ Hot reload with Vite
