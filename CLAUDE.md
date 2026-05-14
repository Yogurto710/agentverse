# CLAUDE.md — AgentVerse Project Context

## What This Is

AgentVerse is a pixel-art social simulation web app. AI agents roam a town square map,
hold conversations with the player, post to a shared bulletin board, and interact with
each other autonomously. The player meets NPCs, and after 7 encounters an AI-generated
social report analyses all their relationships.

Live deployment: https://agentverse-kohl.vercel.app
GitHub repo: https://github.com/Yogurto710/agentverse

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (SPA) |
| All logic | `src/App.jsx` (single large file) |
| Personality engine | `src/personality.js` |
| LLM proxy | Vercel serverless functions (`api/npc-chat.js`) |
| LLM provider | DeepSeek (`deepseek-v4-flash` model) via `/api/npc-chat` |
| Hosting | Vercel |
| Env var | `DEEPSEEK_API_KEY` |

All LLM calls route through `/api/npc-chat` (the DeepSeek proxy). The legacy Moonshot
endpoint (`api/chat.js`, `MOONSHOT_API_KEY`) is kept for reference but not used.

---

## Project File Structure

```
agentverse-deploy/
  api/
    npc-chat.js     # Active: DeepSeek proxy (all LLM calls)
    chat.js         # Legacy: Moonshot/Kimi proxy (inactive, reference only)
  src/
    App.jsx         # All simulation logic and UI — primary working file
    main.jsx        # React entry point
    personality.js  # MBTI/zodiac compatibility + behavioral prompt generator
  public/
    avatars/        # Sprite PNGs: 0-ma.png, 0-fe.png (player), 1.png–8.png (NPCs)
    map.png         # Pixel-art town square map
    icon.png        # Favicon
  index.html
  package.json
  vite.config.js
  vercel.json
```

**Important:** `src/App.jsx` is intentionally monolithic. All game state, simulation
logic, and JSX live in one file. Do not split into separate components unless explicitly asked.

---

## Agents / NPCs

8 characters defined in `NPC_DATA` (top of App.jsx):

| ID | Name | Role | MBTI | Element | Notes |
|---|---|---|---|---|---|
| 1 | 小红 | 岩壁精灵 | ENFP | pyro | Rock climber, fantasy novelist |
| 2 | 大明 | 桌游教主 | ESTP | geo | Board game master, homemade hot sauce |
| 3 | 阿树 | 植物房东 | ISFP | dendro | 47 named plants, cyclist |
| 4 | 雅雅 | 中古女王 | ENTP | electro | Vintage hunter, electronic DJ |
| 5 | 老陈 | 追星星的人 | INTJ | cryo | Astrophotographer, Go player |
| 6 | 彦彦 | 毛孩妈妈 | ISFJ | hydro | Marathon runner, stray animal rescuer |
| 7 | 风哥 | 滑板少年 | ESFP | pyro | 32-year-old skater, street food obsessive |
| 8 | 团子 | 广场神猫 | INTP | stellar | The town cat — special interaction mode |

Player avatar is gender-specific (`0-ma.png` / `0-fe.png`). Player chooses name, MBTI,
zodiac, and gender on the intro screen.

---

## Simulation Parameters

- **`MAX_ENC = 7`** — encounters before end-screen triggers
- **Walkable area** — center 70% of map: `isWalkable(x, y)`: x ∈ [15, 85], y ∈ [15, 85]
- **NPC movement** — 8-directional (`D8`) with momentum (lerp via `SPEED = 0.05`),
  separation steering, quadrant pressure to prevent clustering
- **Proximity trigger** — player within distance 8 of NPC triggers conversation
- **Bulletin cooldown** — global 30s cooldown (`lastNpcPostR` ref); reactions fire
  12–28s after a post
- **Cat petting** — does not count toward `MAX_ENC`

---

## LLM Call Temperatures

| Feature | Temperature |
|---|---|
| NPC conversation lines | 0.9 |
| NPC closing lines | 0.85 |
| Bulletin posts | 1.1 |
| Bulletin reactions | 1.0 |
| Cat interactions | 1.0 |
| End-screen report | 0.7 |

DeepSeek's `deepseek-v4-flash` supports temperatures up to 2.0 and replaces the
deprecated `deepseek-chat` name. Do not route high-temperature calls through the
legacy Moonshot proxy — it caps at 1.0 and will throw an API error.

Temperatures were lowered from the original "exuberant" pass (e.g. posts 1.3,
conv 1.1) after live testing showed outputs were too disjointed/creative.

---

## Key State and Refs (App.jsx)

```javascript
// Core game state
agS          // agents array (player + 7 NPCs + cat), mutated via agR ref
panelTab     // "conv" | "log" | "bulletin" — which panel tab is visible
activeConv   // current player-NPC conversation object, or null
bulletin     // array of { id, author, content, reactions[], timestamp }
convLog      // completed conversations (shown in Records tab)

// Refs
agR          // mutable ref to agents array (used in game loop)
lastNpcPostR // timestamp of last NPC bulletin post (global 30s cooldown)
bulletinR    // mirror of `bulletin` state, kept in sync via useEffect — used
             // inside async fetch callbacks to avoid stale closures

// Per-NPC memory fields (initialized in initAgents)
_metNpcs     // { [otherId]: { count, lastTs } } — NPC-to-NPC encounter map
_lastPost    // { content, ts } — this NPC's most recent bulletin post
```

`panelTab` auto-switches: "conv" when `activeConv` is set, "log" when it clears.

---

## Conversation System

### Player-NPC flow (`doConv` → `fetchNpcLine` → `fetchNpcClosing`)

1. Player walks into proximity of NPC
2. `generateDynamics(player, npc)` from `personality.js` builds a compatibility prompt
3. A random **approach mode** is injected (6 options: curious question, playful tease,
   sharing a thought, philosophical opener, distracted aside, enthusiastic opener)
4. **Social awareness context** is appended — names of NPCs the player has already met
5. `fetchNpcLine` calls DeepSeek (temp 1.1), returns JSON:
   ```json
   { "line": "...", "warm": "...", "cold": "...", "wild": "...", "vibe": 1-5 }
   ```
6. Three reply buttons shown: 💛 温暖, ⚡ 出奇 (wildcard). Cold option is hidden
   (code preserved, commented out in JSX).
7. `vibe` (1–5) drives the live heart indicator (♥♥♥♥♥) in the conversation header
8. After player reply, `fetchNpcClosing` generates the NPC's closing line (temp 1.0)

### personality.js

- Maps each MBTI type to Big Five traits (`MBTI_TO_BIG5`)
- Computes compatibility score: 65% MBTI + 35% zodiac
- Predicts conversation energy and conflict points
- `generateDynamics(a1, a2)` → `{ prompt, compatScore, energy, conflictRisk }`
- `generateReportContext(personas, conversations)` → MBTI pair analysis for end-screen

---

## Bulletin Board System

NPCs post when they walk within proximity 10 of each other (subject to 30s global
cooldown). Poster is selected randomly (50/50 between the two).

### `doNpcPost(poster, other)` — temp 1.3

System prompt instructs 6 style modes (randomly chosen):
吐槽日常 | 分享兴趣冷知识 | 发表争议性观点 | 碎碎念 | 讲一个冷笑话 | 对某件事的真实感受

Includes poster's bio, MBTI, zodiac, interests, and the name of the NPC they crossed paths with.

### `doNpcReact(reactor, postId)` — temp 1.2

Reactor may agree, disagree, joke, ask follow-up, pivot to their own interests, or go
completely off-topic. Includes reactor's interests in the prompt.

### Card layout

Each bulletin post shows: element icon, author name, MBTI badge, timestamp (`timeAgo`),
post content. Reactions expand below as a threaded list.

---

## Shared Awareness System

A lightweight context-injection layer that gives every LLM call a small window
into the NPC's social world. Built to address the "every call is a cold start"
problem and the "NPCs only ever monologue about their own interests" symptom.

### Data model

- `_metNpcs[otherId] = { count, lastTs }` — tracks NPC-to-NPC encounters. Logged
  in `logEncounter()` whenever a bulletin post fires (poster ↔ proximity partner)
  or a reaction fires (reactor ↔ original poster).
- `_lastPost = { content, ts }` — the NPC's most recent bulletin post content.
- `bulletinR.current` — recent global feed, surfaced as shared context.

### `getAwarenessContext(npc)` helper

Returns a compact block injected into every LLM call (cat, bulletin posts,
reactions, player-NPC conversations). Three possible lines:
- *你最近发过：「{lastPost}」*
- *你认识的人：{name1}（刚刚/之前碰过N次）、{name2}…*
- *广场最近的动态：{author}刚发过「...」*

Data-only — directives live at the call site, not in the helper.

### `pickPostMode(poster)` — gossip bias

Pre-picks a bulletin post's style mode in JS instead of leaving it to the LLM.
When the poster has `_metNpcs` entries, **22% of posts switch to "gossip" mode**
with a specific named target injected into the prompt. Otherwise rolls one of
the six standard modes (吐槽日常, 分享兴趣冷知识, etc.). The 22% knob is the
single dial for tuning gossip frequency in posts.

### Conversation anchor (`fetchNpcLine`)

When the bulletin has a non-self post, **~40% of opening turns** include a soft
hook surfacing the latest post as conversation material. The hook is suggestive
("如果合适，可以顺嘴提一句; 不合适就忽略"), not prescriptive. Continuation
turns skip the hook to avoid every reply becoming gossip. This is the structural
fix for "disjointed conversations" — the bulletin board becomes the shared
topical surface NPCs converge on, since they otherwise have no overlapping
interests.

---

## Cat Interaction System

When player approaches 团子 (agent 8), a DeepSeek call generates a 4-line scripted scene:
- Lines 1 & 3: cat (meows and action descriptions only, no human speech)
- Lines 2 & 4: human NPC (personality-driven, based on the NPC who is also nearby,
  or the player if no NPC is close)

Speaker identity is **post-parse enforced** in code — cat lines forced to `cat.name`,
human lines forced to `human.name` — to prevent identity confusion bugs from the LLM.

---

## Layout System

**Portrait mobile (iPhone):** map `flex: "0 0 40%"`, panel `flex: 1`
**Landscape / desktop:** map `flex: 1`, panel `flex: 1` (side by side)

Panel overflow pattern — all three panels use:
```javascript
display: "flex", flexDirection: "column", flex: 1, minHeight: 0
```
This is critical. `height: "100%"` does NOT work correctly here — it ignores sibling
(tab bar) height in a flex column and causes content to overflow/clip.

Three panel tabs:
- **conv** — active player-NPC conversation (or idle state)
- **log** — scrollable `convLog` history (ConvCard components, collapsible)
- **bulletin** — NPC social feed with reactions

---

## End-Screen Social Report

Triggers after `MAX_ENC` (7) player-NPC encounters. Calls DeepSeek (temp 0.7) with:
- All conversation data
- `generateReportContext` MBTI pair analysis
- Player's own MBTI/zodiac

Returns a Chinese-language narrative analysing relationships, best matches, and impressions.

---

## Color Palette (`C` constant)

```javascript
bg: "#0e1526"        // deep navy background
surface: "#141e34"   // card/panel surface
border: "#2a3f66"    // borders
gold: "#d4aa44"      // primary accent (headings, highlights)
goldBright: "#f0cc60" // high-vibe hearts, top scores
accent: "#6fd4e8"    // interactive elements, wildcard button
text: "#e8e0d4"      // primary text
textDim: "#8a9ab4"   // secondary text
textMuted: "#4a5a74" // timestamps, labels
```

Element colors follow Genshin-inspired palette (pyro=orange-red, hydro=blue, etc.)

---

## Design Philosophy

- **Emergent over scripted** — behavior comes from LLM prompts shaped by personality
  data, not hardcoded dialogue trees
- **Personality-first** — every LLM call includes MBTI style, zodiac flavor, and
  interests. The system is only as interesting as the personality data it's fed
- **Asynchronous social world** — bulletin board fills up independently of the player;
  the world feels alive even when you're not interacting with it
- **Mobile-first** — portrait stacked layout, iOS safe area support, bottom-sheet
  conversation panel, touch-friendly tap targets
- **Minimal state** — no backend, no persistence between sessions, no auth. Pure
  client-side simulation with serverless LLM proxy

---

## Recent High-Impact Changes

### Bulletin Board (replaces NPC-to-NPC conversations)
Previously NPCs held private conversations. Now they post to a shared bulletin board
with threaded reactions — creates a Moltbook/Reddit-style social feed visible to the
player. Posts fire at most once every 30s globally; 1–2 reactions arrive 12–28s after.

### All LLM calls migrated to DeepSeek
Every call (conversations, bulletin, cat, end-screen) now goes through `/api/npc-chat`
→ DeepSeek. This unlocked temperatures above 1.0, which was blocked by Moonshot.
The legacy `/api/chat` Moonshot endpoint is preserved but inactive.

### Conversation approach modes + social awareness
Each player-NPC conversation now opens with a randomly selected approach mode (6 styles),
making each encounter feel distinct. NPCs also receive a list of who the player has
already met, enabling cross-references.

### Live vibe indicator
Each NPC response returns a `vibe` score (1–5) in the JSON payload. Displayed as
♥♥♥♥♥ hearts in the conversation header — gold at 4–5, neutral at 1–2.

### Wildcard button (⚡ 出奇)
NPC responses include a `wild` field — an unexpected, funny, or provocative reply option
displayed as an ⚡ button alongside the standard warm reply. Cold option is hidden.

### Cat interaction overhaul
Replaced hardcoded array of cat actions with a DeepSeek call (temp 1.2) that generates
personality-driven scenes. Speaker identity is post-parse enforced to prevent the
previous bug where the LLM confused cat/human speakers.

### Panel flex fix
Replaced `height: "100%"` with `flex: 1, minHeight: 0` on all three panels. This
resolves the cropping bug where conversation content was cut off on mobile as text grew.

### Shared awareness context across all LLM calls
Added `_metNpcs` encounter map and `_lastPost` to each NPC, a `getAwarenessContext()`
helper, and a `logEncounter()` recorder. Awareness is injected into all four LLM
surfaces (cat, posts, reactions, player conversations) so NPCs can reference each
other and the bulletin feed instead of every call being a cold start.

### Gossip mode in bulletin posts
`pickPostMode()` now decides the post style in JS. When the poster has memory of
other NPCs, 22% of posts switch to "gossip" mode targeting a specific known NPC
by name. Other posts may still weave social context where relevant.

### Bulletin board as conversation anchor
Player-NPC conversations now occasionally (~40% of opening turns) surface the
latest bulletin post as a soft conversation hook, giving NPCs a shared topical
surface to converge on. Addresses the "parallel monologues" problem caused by
NPCs having narrow, non-overlapping interests.

### DeepSeek model swap + temperature recalibration
Migrated from deprecated `deepseek-chat` to `deepseek-v4-flash`. Temperatures
across all five non-report call sites were lowered ~0.2 after live testing showed
the prior settings produced too-creative/disjointed outputs.

---

## Known Gaps / Ideas in Discussion

- **Moonshot as fallback** — `api/chat.js` is kept but not wired as an actual fallback
  if DeepSeek fails.

- **Cold conversation option** — code preserved and commented out in JSX. Could be
  re-enabled via a settings toggle.

- **End-screen report depth** — the report currently works off conversation transcripts
  only. Could be extended to incorporate the NPC-to-NPC social graph (now that
  `_metNpcs` exists) for richer relationship-web analysis, not just player encounters.

- **Awareness sentiment** — `_metNpcs` tracks count + timestamp but not affinity.
  Adding a per-pair sentiment score (incrementing on agreement, decrementing on
  contradiction) would let NPCs develop rivalries and friendships visible in
  gossip tone.

- **DeepSeek v4-flash mode** — the new model supports both thinking and non-thinking
  modes. Current calls use the default; if responses are slow or contain `<think>`
  blocks, may need to explicitly set the mode parameter.
