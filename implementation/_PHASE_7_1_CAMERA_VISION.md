# Phase 7.1 — Camera Vision ✅ DONE

Live webcam feed piped into the Gemini Live session alongside audio at 1 FPS, letting the storyteller react to what the child is doing.

---

## What It Enables

- Storyteller reacts to what the child is wearing, holding, or doing
- Notices expressions ("You look surprised! Should I make it funnier?")
- Visual verification for Movement Challenges (Phase 7.2)

---

## Implementation

### Hook: `useLiveAPI.ts`

```typescript
// Camera stream management
const cameraStreamRef = useRef<MediaStream | null>(null);
const cameraIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false,
  });
  cameraStreamRef.current = stream;
  // 1 FPS interval: canvas resize → JPEG → base64 → WebSocket
  cameraIntervalRef.current = setInterval(() => {
    const canvas = document.createElement("canvas");
    // resize to max 512px
    canvas.toBlob((blob) => {
      // convert to base64, strip prefix
      ws.send(JSON.stringify({
        realtime_input: {
          media_chunks: [{ mime_type: "image/jpeg", data: base64 }]
        }
      }));
    }, "image/jpeg", 0.6);
  }, 1000);
}

function stopCamera() {
  clearInterval(cameraIntervalRef.current);
  cameraStreamRef.current?.getTracks().forEach(t => t.stop());
  cameraStreamRef.current = null;
}
```

- Frame rate: 1 FPS (balance between Gemini context and bandwidth)
- Resolution: max 512px on longest side
- Quality: JPEG @ 0.6
- `disconnect()` calls `stopCamera()` to release tracks

### StoryScreen.tsx

- Camera toggle button in left panel (opt-in, **off by default**)
- Shows "📷 Share Camera" / "📷 Camera On"
- Mirrored `<video>` preview below the button (child sees selfie view; Gemini receives unmirrored frame)

---

## Files Changed
- `frontend/src/hooks/useLiveAPI.ts` — `startCamera`, `stopCamera`, 1 FPS interval, `isCameraOn` state
- `frontend/src/screens/StoryScreen.tsx` — camera toggle button + mirrored video preview
