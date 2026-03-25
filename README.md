# Fuel — Macro Tracking App

A high-performance, zero-friction macro tracking tool built with **React Native (Expo)** for the frontend and **FastAPI** for the backend. Fuel is designed around the principle that logging food should take seconds, not minutes.

## Architecture

```
fuel-app/
├── fuel-backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # FastAPI application entry point
│   │   ├── database.py    # SQLAlchemy async engine & session
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routes/        # API route handlers
│   │   └── services/      # External API integrations
│   └── pyproject.toml
├── fuel-mobile/           # React Native (Expo) frontend
│   ├── app/               # Expo Router screens
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # React hooks & state management
│   │   ├── services/      # API client
│   │   ├── theme/         # Design system tokens
│   │   └── types/         # TypeScript type definitions
│   └── package.json
└── README.md
```

## Features

### Three-Mode Quick Logging
- **AI Scan** — Point camera at food, GPT-4 Vision identifies components and estimates macros per-item
- **Barcode Scanner** — Scan UPC codes for instant product lookup via OpenFoodFacts
- **Manual Search** — Query across USDA, OpenFoodFacts, and Nutritionix databases simultaneously

### Unified Food Search
Aggregates results from multiple data sources with deduplication and relevance ranking:
- USDA FoodData Central (branded + SR Legacy + Foundation)
- OpenFoodFacts (open-source product database)
- Nutritionix (restaurant menus + natural language parsing)

### Dashboard
- Animated circular progress rings for calories and each macro
- Horizontal progress bars with real-time fill animations
- Daily summary with remaining calories and entry count
- Recent log cards with swipe-to-delete

### Design System
Dark-mode-first palette with hand-picked colors:
- Deep navy backgrounds (#0A1628)
- Warm amber accent (#F5A623) for primary actions
- Distinct macro colors: Teal (protein), Coral (fat), Violet (carbs)
- 4px grid spacing system with consistent typography scale

## Backend Setup

```bash
cd fuel-backend

# Install dependencies
poetry install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
poetry run uvicorn app.main:app --reload --port 8000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `USDA_API_KEY` | No | USDA FoodData Central API key (defaults to DEMO_KEY) |
| `OPENAI_API_KEY` | For AI Scan | OpenAI API key for GPT-4 Vision food analysis |
| `NUTRITIONIX_APP_ID` | No | Nutritionix app ID for restaurant data |
| `NUTRITIONIX_API_KEY` | No | Nutritionix API key |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user profile |
| GET | `/api/users/{id}` | Get user profile |
| PUT | `/api/users/{id}/targets` | Update daily macro targets |
| POST | `/api/logs` | Log a food entry |
| GET | `/api/logs?user_id=&date=` | Get logs (filterable by date) |
| DELETE | `/api/logs/{id}` | Delete a log entry |
| GET | `/api/logs/summary?user_id=&date=` | Daily macro summary with progress |
| GET | `/api/search?q=` | Unified food search |
| GET | `/api/barcode/{upc}` | Barcode/UPC product lookup |
| POST | `/api/vision/analyze` | AI vision food image analysis |

## Frontend Setup

```bash
cd fuel-mobile

# Install dependencies
npm install

# Configure backend URL
cp .env.example .env

# Start Expo development server
npx expo start
```

### Screens
- **Dashboard** — Daily progress rings, macro bars, recent logs, Quick Log FAB
- **Search** — Debounced unified food search with tappable result cards
- **AI Scan** — Camera viewfinder → capture → AI analysis → log components
- **Barcode** — Real-time UPC scanner with instant product lookup
- **History** — Chronological log grouped by date with daily totals
- **Profile** — Edit name, configure daily macro targets

## Database Schema

SQLite with SQLAlchemy async ORM:

- **users** — Profile, email, daily macro targets
- **food_logs** — Logged entries with calories, protein, fat, carbs, source, meal type
- **food_items** — Cached food data from external APIs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | React Native (Expo SDK 55) |
| Navigation | Expo Router (file-based) |
| Animations | React Native Reanimated |
| Charts | react-native-svg |
| Camera | expo-camera |
| Backend | FastAPI (Python 3.12) |
| ORM | SQLAlchemy (async) |
| Database | SQLite (aiosqlite) |
| Vision AI | OpenAI GPT-4o |
| Food Data | USDA + OpenFoodFacts + Nutritionix |
