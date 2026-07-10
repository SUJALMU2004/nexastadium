# NexaStadium AI Backend

FastAPI service for the no-auth NexaStadium AI platform. The backend exposes public FIFA World Cup 2026 stadium operations routes, cached local datasets, OpenRouter-backed AI responses with polished deterministic backup behavior, transit planning, crowd simulation, knowledge retrieval, and operations reports.

Target runtime: Python 3.11. Render-compatible runtime pin: `server/.python-version` contains `3.11.11`.

## Structure

- `app/api/routes`: Thin FastAPI route handlers.
- `app/core`: Environment configuration and prompt sanitization.
- `app/models`: Pydantic request and response models.
- `app/services`: Cached stadium, scenario, knowledge, simulation, report, OpenRouter AI, and transit services.
- `app/data`: Local stadium, scenario, knowledge base, playbook, rules, and multilingual safety JSON.
- `tests`: Pytest coverage for prompt guard, scenario engine, AI response contracts, transit, knowledge, simulation, reports, deployment safety, and security boundaries.

## Routes

- `GET /health`
- `POST /api/ai/fan-assistant`
- `POST /api/ai/navigation-guidance`
- `POST /api/ai/ops-recommendation`
- `POST /api/ai/pa-announcement`
- `POST /api/ai/match-day-briefing`
- `POST /api/ai/safety-support-pack`
- `GET /api/stadium/list`
- `GET /api/stadium/scenarios`
- `GET /api/stadium/scenarios/list`
- `GET /api/stadium/{stadium_id}`
- `GET /api/transit/options/{stadium_id}`
- `POST /api/transit/egress-plan`
- `POST /api/transit/route-recommendation`
- `GET /api/transit/alerts/{stadium_id}`
- `GET /api/knowledge/search`
- `POST /api/simulation/crowd-risk`
- `POST /api/simulation/scenario-compare`
- `POST /api/simulation/flow-control`
- `POST /api/reports/operations-summary`

## AI Provider: OpenRouter

The backend calls OpenRouter through `httpx` using the OpenAI-compatible chat completions endpoint. The API key stays in backend environment variables only. The frontend never calls OpenRouter directly.

Default model:

```bash
OPENROUTER_MODEL=poolside/laguna-xs-2.1:free
```

If the key is missing, a free model is rate-limited, or OpenRouter returns invalid JSON, the service still returns polished deterministic FIFA World Cup 2026 stadium guidance.

## AI Response Quality

NexaStadium AI uses carefully structured prompts and deterministic response builders so fan assistance, navigation, operations recommendations, PA announcements, briefings, and safety packs stay calm, clear, accessible, stadium-specific, and operations-ready.

## Start

```bash
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn app.main:app --reload
```

## Test

```bash
pytest
```

## Build And Deployment

Backend deployment target: Render, Railway, Fly.io, or a similar FastAPI host.

- Root directory: `server`
- Install dependencies from `requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `GET /health`
- Python runtime: keep `server/.python-version` at `3.11.11` and set Render `PYTHON_VERSION=3.11.11`.

The frontend should be deployed separately from the `client` directory and should call this backend through `VITE_API_BASE_URL`.

## Environment

Copy `server/.env.example` to `server/.env` only when local overrides are needed. Empty OpenRouter values are valid and produce startup warnings instead of crashes.

Required OpenRouter fields:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_APP_NAME`

Deployment fields:

- `ALLOWED_ORIGINS`
- `ENVIRONMENT`
- `RATE_LIMIT_PER_MINUTE`
- `PYTHON_VERSION=3.11.11`

## Integration Policy

OpenRouter is the only AI provider. The backend does not call provider-specific AI SDKs or external transit services during tests or deterministic response operation. NexaStadium AI uses local JSON data and deterministic backend services. No external database requirement. AI routes sanitize input, avoid logging prompt content, and return contextual FIFA World Cup 2026 responses.

## Submission Cleanup

Do not commit `server/.env`, `server/.venv`, `.pytest_cache`, `__pycache__`, logs, screenshots, or local runtime artifacts. Keep `server/.env.example`, `requirements.txt`, source files, tests, and JSON data in the submission.
