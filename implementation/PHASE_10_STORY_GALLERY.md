# Phase 10 — Story Gallery & Cloud Storage ⬜ PLANNED

Persist story sessions so children can revisit past adventures. Requires Cloud Storage for images and a gallery UI.

---

## Current State

Sessions are ephemeral — images disappear on page refresh. The "Your Stories" section was built and then removed from the landing page because without persistence it showed stale/empty data.

---

## Part A — Cloud Storage for Images

### Problem
Images are currently returned as base64 in the HTTP response body. Fine for a single session, but they vanish on refresh and can't be linked to a gallery entry.

### Target
```
Image generated
  → backend uploads to gs://taleweaver-images/{session_id}/{scene_id}.png
  → generates signed URL (1 hour TTL)
  → returns { signed_url, scene_description } to frontend
  → frontend renders <img src={signedUrl} />
```

### Implementation
- GCS bucket: `taleweaver-images` (private, signed URL access)
- Backend: `google-cloud-storage` SDK, `storage.blob.generate_signed_url(expiration=3600)`
- Frontend: `StorySceneCard` renders `<img src={signedUrl}>` instead of `data:image/...`
- Cloud Run service account needs `roles/storage.objectAdmin` on the bucket

### Files to Change
- `backend/image_gen.py` — upload to GCS, return signed URL instead of base64
- `backend/requirements.txt` — add `google-cloud-storage`
- `frontend/src/components/StorySceneCard.tsx` — render from URL instead of base64
- `frontend/src/hooks/useStoryImages.ts` — store `signedUrl` in scene state instead of `imageData`

---

## Part B — Story Gallery

### Target
After a session ends, the story is saved and shown on the landing page.

```
Session ends (child says "stop" or presses End Story)
  → prompt Gemini: "Give this story a 5-word title"
  → save to localStorage:
      { id, title, characterId, characterName, imageUrls[], timestamp }
  → LandingPage shows "Your Stories" grid of story cards
  → tap a card → shows images in a lightbox or scrollable view
```

### Story Card UI
- Character portrait thumbnail
- Story title (5 words from Gemini)
- Date + character name
- First scene image as cover

### Data Model (localStorage)
```typescript
interface StoryEntry {
  id: string;           // session_id
  title: string;        // "The Dragon Who Found Home"
  characterId: string;  // "dragon"
  characterName: string;// "Draco the Dragon"
  coverImageUrl: string;// first scene signed URL
  imageUrls: string[];  // all scene signed URLs
  timestamp: number;    // Date.now()
}
```

### Prerequisite
Part A (Cloud Storage) — signed URLs must outlive the session for the gallery to show images. Without GCS, images disappear before the child returns.

### Files to Change
- `frontend/src/screens/LandingPage.tsx` — "Your Stories" section (was built and removed; restore)
- `frontend/src/screens/StoryScreen.tsx` — on session end, request title from Gemini, save to localStorage
- `frontend/src/hooks/useLiveAPI.ts` — expose session end callback with final title
- New `frontend/src/components/StoryGallery.tsx` — gallery grid component

---

## Effort vs Impact

| Part | Effort | Impact |
|---|---|---|
| Cloud Storage | Medium | Medium — enables gallery, reduces memory pressure |
| Story Gallery | Low–Medium | Medium — delightful for returning kids |

**Dependency:** Gallery requires Cloud Storage. Can't do B without A.
