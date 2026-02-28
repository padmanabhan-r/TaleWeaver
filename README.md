# TaleWeaver

A kid-friendly, voice-first interactive storytelling app powered by Google Gemini Live API. Children pick a storyteller character and have a real-time voice conversation to co-create magical tales.

## Features

- **10 storyteller characters** — 5 English (Grandma Rose, Captain Leo, Fairy Sparkle, Professor Whiz, Dragon Blaze) and 5 Indian language grandmothers (Paati/Tamil, Dadi/Hindi, Ammamma/Telugu, Aaji/Marathi, Dida/Bengali)
- **Real-time voice conversation** via WebSocket + Gemini Live API
- **AI-generated scene images** synced to the story narrative
- **Kid-safe content** — all characters are tuned to be warm, age-appropriate, and engaging for children aged 4–10

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Python (FastAPI + WebSocket)
- **AI**: Google Gemini Live API (multimodal, real-time audio)
- **Image generation**: Imagen via Vertex AI

## Future Plans

### Learn & Explore Mode

A dedicated educational mode with four subject-specialist characters designed to teach through storytelling and interactive adventures:

- **Count Cosmo** (Maths) — A friendly astronaut who teaches counting, shapes, and patterns through space adventures
- **Dr. Luna** (Science & Nature) — A warm scientist who sparks wonder about animals, plants, weather, and the universe
- **Professor Pip** (Words & Reading) — A wise bookworm owl who makes letters, phonics, and vocabulary feel magical
- **Arty** (Art & Colours) — A creative art teacher who explores colour mixing, shapes, and famous artworks

This mode would have a distinct green/teal theme, a separate character selection screen, and a specialised session UI with concept panels and end-of-session summaries.
