# Phase 7.2 — Movement Challenges (Hero's Tasks) ✅ DONE

Physical challenges woven into the story narrative — the hero needs the child's help right now.

---

## How It Works

Once per story (~3-4 minutes in), the character embeds a physical challenge into the plot. The challenge feels urgent — like the story depends on the child doing it immediately.

**Examples:**
- "Quick! The dragon needs you to ROAR as loud as you can and jump three times — go go go!"
- "The magic spell needs five big star jumps RIGHT NOW! Jump! Jump! Jump!"
- "Spin around twice like a wizard casting a spell — whooooosh!"
- "Stamp your feet like thunder to scare away the storm clouds!"

---

## Camera Verification

If the camera is on (Phase 7.1), Gemini watches for movement and reacts:
- **Movement detected:** "YES! I saw you! You did it! The hero is saved!"
- **Camera off:** trusts the child — "I KNEW you could do it! You are so brave!"
- **No response after ~20s:** continues warmly — "The hero found another clever way — and off they went!"

---

## Badge

Completing a movement challenge awards the **🏃 Active Hero** badge (via `award_badge` tool).

---

## Implementation

Pure system prompt change in `backend/characters.py` — no frontend or backend code changes.

Updated `MOVEMENT CHALLENGES (Hero's Tasks)` section in `SYSTEM_PROMPT_BASE`:
- Removed: "NEVER ask the child to stand up, jump, spin" restriction
- Added: rich examples of physical challenges with story integration
- Added: camera-on / camera-off / no-response behaviour
- Badge criteria updated: "Active Listener" → "Active Hero 🏃"

---

## Files Changed
- `backend/characters.py` — `SYSTEM_PROMPT_BASE` INTERACTIVE MOMENTS → MOVEMENT CHALLENGES section; badge criteria update
