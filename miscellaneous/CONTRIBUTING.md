# Contributing to TaleWeaver

Thanks for your interest in contributing! TaleWeaver is a voice-first AI storytelling app for children aged 4–10. Every contribution — bug fix, feature, or documentation improvement — helps make story time better for kids.

Please read this guide before opening a pull request.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Content & Safety Standards](#content--safety-standards)

---

## Getting Started

1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes, following the guidelines below
4. Open a pull request against `main`

---

## Project Structure

```
TaleWeaver/
├── frontend/          # React + Vite + TypeScript
│   └── src/
│       ├── screens/   # LandingPage → CharacterSelect → ThemeSelect → StoryScreen
│       ├── hooks/     # useLiveAPI (core), useStoryImages
│       ├── components/
│       └── characters/index.ts
├── backend/           # Python FastAPI
│   ├── main.py        # Routes and WebSocket endpoint
│   ├── proxy.py       # Gemini Live API WebSocket proxy
│   ├── characters.py  # Character configs, system prompts, Gemini setup
│   └── image_gen.py   # Image generation via Gemini
├── architecture/      # SVG architecture diagrams
└── implementation/    # Phase planning docs
```

---

## Development Setup

### Prerequisites
- Node 22+
- Python 3.13+
- A GCP project with Vertex AI and Gemini APIs enabled

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Create `frontend/.env.local`:
```
VITE_WS_URL=ws://localhost:8000/ws/story
VITE_API_URL=http://localhost:8000
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Create `backend/.env` (see `backend/.env.example`):
```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
```

The Vite dev server proxies `/ws` and `/api` to `http://localhost:8000` automatically.

---

## Making Changes

### General principles

- **Keep it simple.** Make the smallest change that solves the problem. Don't refactor surrounding code, add extra features, or over-engineer.
- **Minimal impact.** Touch only what's necessary. Avoid introducing unrelated changes in the same PR.
- **No test suite exists** — there are no automated tests. Verify your changes manually before submitting.
- **TailwindCSS v3** — use existing utility classes; don't add custom CSS unless unavoidable.
- **Path alias** — use `@/` for imports within `frontend/src/`.

### Frontend

- Components live in `frontend/src/components/`
- Screens (full-page views) live in `frontend/src/screens/`
- The core state machine is `frontend/src/hooks/useLiveAPI.ts` — be careful here; it manages audio, WebSocket, and session lifecycle
- Audio worklet files must stay in `frontend/public/audio-processors/` (not `src/`) — `AudioWorklet.addModule()` requires a URL

### Backend

- Character definitions (system prompts, voices, image styles) are in `backend/characters.py`
- System prompt changes affect the live AI behavior directly — test thoroughly with real sessions
- The proxy in `backend/proxy.py` is a bidirectional pass-through — keep it lightweight
- Image generation logic is in `backend/image_gen.py`

### Adding a character

1. Add the character to `backend/characters.py` — define `id`, `name`, `voice_name`, `image_style`, `system_prompt`, `language`
2. Add the matching entry to `frontend/src/characters/index.ts` — include `id`, `name`, `language`, `image` (portrait asset path)
3. Add the portrait image to `frontend/public/characters/` or `frontend/src/assets/`
4. Test the character end-to-end in a real session

---

## Pull Request Guidelines

- **One PR per concern.** Don't bundle unrelated changes.
- **Descriptive title.** Be specific: `fix: prevent story restart after generate_illustration tool response` rather than `fix bug`.
- **Describe what and why** in the PR body — not just what the code does, but why the change is needed.
- **No Co-Authored-By lines** in commit messages.
- Link any related issues with `Fixes #123` or `Closes #123`.

### Commit style

Use a short, descriptive imperative sentence. Emoji prefixes are welcome:

```
❗ fix story restart triggered by generate_illustration tool response
✨ add Mandarin storyteller character Yé Ye
🐛 fix audio worklet buffer overflow on slow connections
📝 update system prompt to prevent repeated exclamations
```

---

## Reporting Bugs

Open a GitHub issue and include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser, OS, and device (audio bugs are often platform-specific)
- Any console errors or backend logs

For issues involving the AI storyteller's behavior (repetition, wrong language, inappropriate content), include a description of what was said and the character being used.

---

## Content & Safety Standards

TaleWeaver is used by children aged 4–10. All contributions must uphold this.

- **No harmful content** — nothing violent, frightening, or inappropriate for young children, in code, prompts, or assets
- **System prompt changes** are especially sensitive — a poorly worded prompt can cause the AI to behave unsafely. Test changes extensively.
- **Image generation prompts** must never depict real people, violence, or anything unsuitable for children
- If you're unsure whether something is appropriate, err on the side of caution and ask in the issue before building it

---

By contributing, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).
