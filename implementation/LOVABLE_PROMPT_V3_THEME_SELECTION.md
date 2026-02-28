# Lovable Prompt — Theme Selection Screen (v3)

---

## Context

This is for the TaleWeaver app — a magical AI storytelling app for kids. The existing flow is:

**Landing → Character Select → Story**

We are inserting a new screen between Character Select and Story:

**Landing → Character Select → 🆕 Theme Select → Story**

The existing design system uses:
- Dark blue-purple night sky background (`bg-sky-gradient`)
- Gold/amber primary colour (`--primary: 42 100% 62%`)
- Purple secondary, teal accent
- Fonts: Baloo 2 (display/headings), Quicksand (body)
- Framer Motion for all animations
- Floating stars, sparkles, and clouds in the background (`<FloatingElements />`)

The route for the new screen is `/theme/:characterId`. It navigates to `/story/:characterId` when the child confirms their theme.

---

## The New Screen: Theme Selection

**Headline:** "What's Your Story About?"
**Subheadline:** "Choose how you want to spark your adventure ✨"

The screen has **3 large, card-style options** arranged prominently — think of them as big glowing portals a child chooses between. Each card is at least 200px tall, with a large emoji/illustration, a bold title, and a short fun description. Tapping a card expands it in-place (accordion or smooth reveal) to show the interaction for that mode.

---

## Option 1 — "Pick a Theme" 🎨

**Card title:** Pick a Theme
**Card emoji/art:** 🎨 (or a colourful palette illustration)
**Card description:** "Choose from magical worlds or make up your own!"

When expanded, shows two things:

### A) Fixed Theme Grid

A grid of **theme tiles** — large, colourful, rounded squares with a big emoji and a label underneath. Tap one to select it (it lights up with a gold glow ring). Only one can be selected at a time.

Use these themes (feel free to add complementary ones that would appeal to kids):

| Emoji | Theme |
|---|---|
| 🦁 | Animals |
| 🚀 | Space |
| 🏰 | Kingdoms |
| 🌊 | Ocean |
| 🍕 | Food |
| 🌳 | Jungle |
| 🦄 | Magic |
| 🤖 | Robots |
| 🎃 | Spooky |
| 🏔️ | Adventure |
| 🎪 | Circus |
| 🦕 | Dinosaurs |

The grid should be scrollable horizontally on mobile (or wrap on desktop). Each tile has a unique gradient background — make them colourful and distinct, not all the same colour.

### B) Type Your Own

Below the grid, a clearly separated section:

**Label:** "Or dream up your own! 💭"

A large, friendly text input (rounded, with a glowing border on focus) where the child (or parent) can type anything — e.g. "a panda who loves pizza" or "my dog Biscuit". Keep the placeholder text playful: *"Type anything... a dragon chef? A moon princess?"*

### Confirm Button

A big gold "Let's Go! 🪄" button (disabled until a theme tile is selected or text is typed). When clicked → navigate to `/story/:characterId` passing the chosen theme.

---

## Option 2 — "Show Your Prop" 📸

**Card title:** Show Your Prop
**Card emoji/art:** 📸 (or a camera with sparkles illustration)
**Card description:** "Hold up a toy or anything — we'll make it the star of the story!"

When expanded, shows a **live camera viewfinder** — a rounded rectangle (like a phone camera UI) that activates the device camera via `getUserMedia`. Overlay a subtle scanning animation on top (a horizontal scan line sweeping up and down, or corner bracket reticles that pulse — make it feel magical not clinical, so use gold/purple colours not green).

Below the viewfinder:

- A "✨ Use This!" button — tapping it captures the current frame as a still image (show a brief flash animation), displays a thumbnail of the captured image, and shows a status message like *"Got it! Your story will be all about what you're holding!"*
- Once captured, the button changes to "🪄 Start the Story!" which navigates to `/story/:characterId` with the captured image data as the theme context.

Add a small "Allow camera access" helper message that shows only if camera permission is denied, with a friendly emoji (not a scary error message).

**Important UX note:** The camera should only activate when this card is expanded, and should stop when the card collapses or another option is chosen.

---

## Option 3 — "Sketch a Theme" ✏️ *(Coming Soon)*

**Card title:** Sketch a Theme
**Card emoji/art:** ✏️ or a drawing tablet illustration
**Card description:** "Draw what you imagine — coming very soon!"

This card is **visually present but locked** — it has a "Coming Soon ✨" badge in the top-right corner. The card should look slightly desaturated/dimmed (but still beautiful, not broken). Tapping it does nothing (or shows a tiny playful tooltip: *"We're still painting this one! 🎨"*). Do NOT make it look like an error — it should feel like something exciting to look forward to.

---

## Layout & Navigation

- **Back button** top-left: "← Back" → navigates to `/characters`
- **Header** centre: TaleWeaver logo (same as other screens)
- The selected character's portrait (small, circular, ~48px) and name should appear somewhere subtle — e.g. top-right of the header or as a small chip below the headline — so the child remembers which storyteller they picked.
- The three option cards stack vertically on mobile, or can be side-by-side on wide desktop (but the expanded interaction always takes the full width below).

---

## Animation & Polish

- Page entrance: cards slide in from bottom with staggered delays (card 1 first, then 2, then 3)
- Card expand/collapse: smooth height animation, not a jump
- Selected theme tile: gold glow ring + slight scale-up + a tiny sparkle burst
- "Coming Soon" card: a subtle shimmer/shimmer-wave effect across it to hint at magic being brewed
- Camera viewfinder border: animated dashed gold border that rotates slowly
- The scan line in the camera should be a gradient sweep (gold → transparent → gold) not a harsh line

---

## Route Changes Needed in App.tsx

Add:
```
/theme/:characterId  →  ThemeSelect page
```

Update CharacterSelect so that selecting a character navigates to `/theme/:characterId` instead of `/story/:characterId`.

---

## What to Pass to the Story Screen

When navigating from ThemeSelect to StoryPage, pass the theme as a URL query param or route state:

- Fixed tile: `?theme=Animals`
- Custom text: `?theme=a+panda+who+loves+pizza`
- Camera prop: pass as route state (the captured image base64 or a description placeholder like `?theme=camera_prop`)

The StoryPage currently reads `characterId` from `useParams`. It should also read the `theme` and display it somewhere subtle (e.g. a small chip in the header: "🦁 Animals story").

---

## Summary of Files to Create/Modify

| File | Action |
|---|---|
| `src/pages/ThemeSelect.tsx` | **Create** — the new screen |
| `src/App.tsx` | **Modify** — add `/theme/:characterId` route |
| `src/pages/CharacterSelect.tsx` | **Modify** — navigate to `/theme/` instead of `/story/` |
| `src/pages/StoryPage.tsx` | **Modify** — read and display the theme param |

---

*This screen should feel like opening a treasure chest — full of possibility, colour, and wonder. Make it the most visually exciting screen in the app.*
