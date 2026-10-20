# DevRecall – An AI-Powered Revision Platform for Developers

MERN stack (MongoDB, Express, React, Node.js) + **free LLM APIs** (Google Gemini, Groq, OpenRouter).

**Features:** secure signup/login (JWT) · topic-wise revision content (JavaScript, Python, DBMS, Operating Systems, DSA) ·
add ANY subject with AI · AI tutor chatbot (English / Hinglish) · auto-generated quizzes graded on the server ·
dashboard with progress, daily streak, weekly activity and score trend · dark/light theme · mobile responsive.

```
devrecall/
├── backend/           Node + Express + MongoDB API
├── frontend/          React (Vite) web app
├── PROJECT_GUIDE.md   ← read this to understand everything (also useful for viva)
└── README.md
```

## Run it on your computer

**You need:** Node.js 18 or newer (https://nodejs.org), a MongoDB database (free Atlas cluster **or** local MongoDB),
and **at least one free AI key** (see below).

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```
Open `backend/.env` and fill in:

| Variable | What to put |
|---|---|
| `MONGO_URI` | Atlas: Create free cluster → Connect → Drivers → copy the string, put your password, add `/devrecall` before the `?`. Local MongoDB: `mongodb://127.0.0.1:27017/devrecall` |
| `JWT_SECRET` | Any long random text |
| `GEMINI_API_KEY` **or** `GROQ_API_KEY` **or** `OPENROUTER_API_KEY` | At least one free key (next section) |

```bash
npm run dev
```
You should see: `MongoDB connected`, `Seeded 5 starter subject(s)`, `DevRecall API running on http://localhost:5000`.

### 2. Frontend (open a new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**, sign up, and start revising.

## Free AI models (no credit card)

The app can use three free providers and **automatically switches to the next one when a free quota is finished**
(order is set by `AI_PROVIDERS`). One key is enough; two or three make it more reliable for a live demo.

| Provider | Get a free key | Default models used |
|---|---|---|
| Google Gemini | https://aistudio.google.com/apikey | `gemini-flash-latest`, `gemini-2.5-flash` |
| Groq (very fast Llama) | https://console.groq.com/keys | `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` |
| OpenRouter (free models) | https://openrouter.ai/keys | `openrouter/free` (auto-picks an available free model) |

Free limits and model names change often. If a model is retired, change `GEMINI_MODELS`, `GROQ_MODELS` or
`OPENROUTER_MODELS` in `.env` (comma separated; they are tried in order). Set `AI_DEBUG=true` to see in the
backend terminal which provider answered each request.

## Deploy (free)

1. **Backend → Render.com**: New Web Service from your GitHub repo, root directory `backend`, build command `npm install`, start command `npm start`.
   Add the same environment variables as your `.env`.
2. **Frontend → Netlify**: base directory `frontend`, build command `npm run build`, publish directory `dist`.
   Add environment variable `VITE_API_URL = https://<your-render-app>.onrender.com/api`.
   (`frontend/public/_redirects` is already included so page refresh works with React Router.)
3. Copy the Netlify URL into Render's `CLIENT_URL` variable and redeploy the backend.

> Render's free plan sleeps after inactivity, so the first request can take ~30 seconds. Open the site once before your viva.

## If the AI shows an error

| Message | Meaning / fix |
|---|---|
| "AI is not configured yet" | No key in `backend/.env`. Add one of the three keys and restart the backend. |
| "API key is invalid or not allowed" | Wrong/old key. Create a new key and restart the backend. |
| "The free AI quota is used up" | Every configured provider hit its free limit. Wait a minute, or add a second provider key. |
| "AI took too long" | Free models can be slow. Try again. |

## Useful commands

| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | start API with auto-restart |
| backend | `npm run seed` | add any missing starter subjects (never overwrites) |
| frontend | `npm run dev` | start the website in development |
| frontend | `npm run build` | create the production build in `dist/` |
