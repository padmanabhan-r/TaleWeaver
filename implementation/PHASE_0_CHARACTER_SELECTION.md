# Phase 0 — Landing Page & Character Selection

## Status: ✅ DONE

---

## What Was Built

### Landing Page (`frontend/src/screens/LandingPage.tsx`)
- Sky-blue → green full-screen gradient background
- Drifting cloud animations (CSS keyframes: `cloud-drift`, `cloud-drift-slow`)
- "TaleWeaver" title in Bangers font with rainbow gradient text shadow
- Tagline: "Where every child's story begins"
- Two mode cards side-by-side:
  - **Story Time** (purple/pink gradient) — "Let's Go!" yellow pill button
  - **Learn & Explore** (green/teal gradient) — "Let's Learn!" yellow pill button
- Cards have hover lift + scale, decorative emoji flowers at bottom
- Routes to `story-select` or `study-select`

### Story Character Select (`frontend/src/screens/CharacterSelect.tsx`)
- Title: "Who should tell your story today?"
- **Row 1**: 5 English storytellers in `grid-cols-5`
- **Indian Languages** divider badge (🇮🇳)
- **Row 2**: 5 Indian storytellers in `grid-cols-5`
- Back button → landing page
- Character cards: gradient background, hover lift, gold pulse ring on select, fade-out dismiss animation

### Study Character Select (`frontend/src/screens/StudyCharacterSelect.tsx`)
- Title: "Who will you learn with today?"
- 2×2 grid of 4 study characters
- Green/teal gradient background to distinguish from story mode
- Same card rendering pattern as CharacterSelect
- Back button → landing page

### App Routing (`frontend/src/App.tsx`)
```
landing → story-select → story
                ↓
        study-select → study
```
- 5 screens: `"landing" | "story-select" | "story" | "study-select" | "study"`
- Fade-out on selection → fade-in on story screen
- Back navigation throughout

### Character Registry (`frontend/src/characters/index.ts`)
- 14 characters total
- `isStudy?: boolean` flag to separate story vs study characters
- Story characters (10): grandma-rose, captain-leo, fairy-sparkle, professor-whiz, dragon-blaze, paati, dadi, ammamma, aaji, dida
- Study characters (4): count-cosmo, dr-luna, professor-pip, arty

### Character Portraits (`frontend/src/components/CharacterPortrait.tsx`)
- 14 hand-crafted inline SVG portraits
- English storytellers: rose/grandmother, captain, fairy, professor, dragon
- Indian grandmothers: paati (Tamil sari), dadi (Hindi), ammamma (Telugu), aaji (Marathi), dida (Bengali)
- Study characters: astronaut (cosmo), scientist (luna), owl (pip), paintbrush artist (arty)
- No animations (static SVGs) — Lottie/Rive not implemented

### Browser Tab
- `<title>TaleWeaver</title>`
- Book emoji favicon (inline SVG data URI)

---

## Differences from Original Plan

| Original Plan | What Was Built |
|---|---|
| 5 story characters | 14 characters (10 story + 4 study) |
| Character hover plays audio greeting | Not implemented |
| Lottie/Rive animated avatars | Static SVG portraits |
| Character expands and slides to story screen | Fade-out → fade-in transition |
| Single character select screen | Landing page + two separate select screens |

---

## What Remains

- Character hover sounds / greeting audio preview
- Avatar animations (idle breathing, wave on hover)
