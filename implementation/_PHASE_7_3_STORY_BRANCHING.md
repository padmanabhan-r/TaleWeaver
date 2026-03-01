# Phase 7.3 — Story Branching (Choice Buttons) ✅ DONE

At a key story moment, Gemini presents 2–3 choices and the child decides what happens next — by tapping or speaking.

---

## User Experience

```
Gemini: "Now little one — should the dragon fly into the dark cave,
         or swim across the silver lake?"

UI renders (top of scene canvas):
  [ 🐉 Fly into the cave ]    [ 🌊 Swim the silver lake ]

Child taps OR says anything → overlay dismisses → story continues that branch
```

---

## Architecture

### Tool Declaration (`characters.py`)
```python
{
    "name": "showChoice",
    "description": "Present 2-3 story choice buttons to the child at a key story moment.",
    "parameters": {
        "type": "object",
        "properties": {
            "options": {
                "type": "array",
                "items": { "type": "string" },
                "description": "2-3 short, exciting story choices (max 8 words each)",
            }
        },
        "required": ["options"],
    },
}
```

### Timing Fix (`useLiveAPI.ts`)
Naïve implementation shows overlay while character is still speaking. Fixed with `pendingChoiceRef`:

```typescript
// On toolCall for showChoice → store, don't dispatch
pendingChoiceRef.current = { options, callId };

// On turnComplete → dispatch after 700ms audio drain
if (pendingChoiceRef.current) {
  setTimeout(() => {
    onShowChoice?.(pendingChoiceRef.current);
    pendingChoiceRef.current = null;
  }, 700);
}
```

### Answering (`useLiveAPI.ts`)
Both `toolResponse` AND `client_content` must be sent — without `client_content`, Gemini waits for audio before resuming:

```typescript
function answerChoice(choice: string, callId: string) {
  ws.send(JSON.stringify({
    toolResponse: { functionResponses: [{ id: callId, response: { output: choice } }] }
  }));
  ws.send(JSON.stringify({
    client_content: {
      turns: [{ role: "user", parts: [{ text: choice }] }],
      turn_complete: true
    }
  }));
}
```

### Voice Dismissal
`onChildSpoke` callback fires on `sc.interrupted` or `sc.inputTranscription.finished` → `setActiveChoice(null)` in `StoryScreen`.

### System Prompt Rule
`AT MOST ONCE per entire session. Do NOT call it again after it has been used once.`

---

## Files Changed
- `backend/characters.py` — `showChoice` tool declaration + STORY CHOICES prompt section
- `frontend/src/hooks/useLiveAPI.ts` — `pendingChoiceRef`, turnComplete dispatch, `answerChoice`, `onChildSpoke`
- `frontend/src/screens/StoryScreen.tsx` — `activeChoice` state, `handleChildSpoke`, wires `onShowChoice` + `onChildSpoke`
- `frontend/src/components/ChoiceOverlay.tsx` — new component: animated choice buttons at top of canvas
