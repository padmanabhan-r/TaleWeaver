# Phase 7.4 — Achievement Badge System ✅ DONE

Gemini awards virtual badges for genuine creative contributions during the session.

---

## Badge Criteria

| Badge | Emoji | Trigger |
|---|---|---|
| Story Spark | ⭐ | Child verbally suggests a story idea or character |
| Active Hero | 🏃 | Child completes the movement challenge |
| Story Finisher | 🌟 | Child chooses to end the story themselves |
| Super Creative | 🎨 | Child says something especially imaginative |

**Prohibited triggers:** turning on the camera, random movement, being quiet, joining the session, just being present.

**Max 2 badges per session.**

---

## Tool Declaration (`characters.py`)
```python
{
    "name": "award_badge",
    "description": "Award an achievement badge to the child (max 2 per session).",
    "parameters": {
        "type": "object",
        "properties": {
            "emoji":   { "type": "string", "description": "Single emoji" },
            "name":    { "type": "string", "description": "Short badge name (max 4 words)" },
            "reason":  { "type": "string", "description": "Why the child earned it (max 8 words)" },
        },
        "required": ["emoji", "name", "reason"],
    },
}
```

Gemini says it warmly first ("Oh! You just earned a special badge!") then calls the tool.

---

## BadgePopup Component

- **Position:** `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` — centred on screen
- **Animation:** Framer Motion scale in from 0.5, fade in → auto-dismiss after **3 seconds**
- **Content:** large emoji, badge name, reason text, dismiss button
- **Initial:** `{ opacity: 0, scale: 0.5 }` (no y offset — drops in from centre)

---

## Handler (`useLiveAPI.ts`)
```typescript
if (fn.name === "award_badge") {
  onBadgeAwarded?.({
    emoji: fn.args.emoji,
    name: fn.args.name,
    reason: fn.args.reason,
  });
  // Send toolResponse so Gemini continues
  ws.send(JSON.stringify({
    toolResponse: { functionResponses: [{ id: fn.id, response: { output: "Badge awarded." } }] }
  }));
}
```

---

## Files Changed
- `backend/characters.py` — `award_badge` tool declaration + ACHIEVEMENT BADGES prompt section
- `frontend/src/hooks/useLiveAPI.ts` — `award_badge` toolCall handler
- `frontend/src/screens/StoryScreen.tsx` — `activeBadge` state, wires `onBadgeAwarded`
- `frontend/src/components/BadgePopup.tsx` — new component: centred animated badge popup, 3s auto-dismiss
