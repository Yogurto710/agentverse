# AgentVerse — AI Social Simulation

A social simulation where AI agents roam a pixel-art town square, hold conversations,
post to a shared bulletin board, and form emergent social connections. Built with React + Vite,
powered by the DeepSeek API.

## Features

- **8 AI characters** with distinct personalities, MBTI types, and interests wandering the map
- **Player-NPC conversations** — approach any NPC to trigger a 2-turn dialogue with personality-driven opening modes, a warm suggestion, and a wildcard ⚡ option
- **Live chemistry indicator** — heart icons in the conversation header reflect the current vibe
- **Shared social fabric** — NPCs remember who they've crossed paths with, occasionally gossip about each other in bulletin posts, and weave the latest plaza feed into player conversations
- **Autonomous bulletin board** — NPCs post status updates and react to each other's posts when they cross paths, independent of the player
- **Cat interactions** — 团子 the town cat generates unique petting scenes tailored to each NPC's personality and recent social context
- **End-screen social report** — after 7 encounters, an AI-generated summary analyses your relationships, best matches, and impressions
- **Mobile-first layout** — portrait stacked layout, bottom sheet for conversations, iOS/Android safe area support

## Project Structure

```
agentverse-deploy/
  api/
    chat.js          # Vercel serverless proxy for Moonshot/Kimi API (legacy, kept for reference)
    npc-chat.js      # Vercel serverless proxy for DeepSeek API (active)
  src/
    App.jsx          # Main game component — all simulation logic and UI
    main.jsx         # React entry point
    personality.js   # Dynamics/compatibility prompt generator
  public/
    avatars/         # Character sprite PNGs (0-ma.png, 0-fe.png, 1.png … 8.png)
    map.png          # Pixel-art town square map
    icon.png         # Favicon
  index.html         # HTML shell
  package.json       # Dependencies
  vite.config.js     # Vite configuration
  vercel.json        # Vercel deployment config
```

## Prerequisites

- Node.js 18+
- A DeepSeek API key (get one at https://platform.deepseek.com)
- Vercel CLI (for deployment)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root:
```
DEEPSEEK_API_KEY=your_api_key_here
```

3. Run the Vercel dev server (required for the API proxy to work):
```bash
npx vercel dev
```

This starts the app at http://localhost:3000 with all API routes active.

For frontend-only development (no API calls):
```bash
npm run dev
```

## Deployment

1. Deploy to Vercel:
```bash
npx vercel --prod
```

2. Add the environment variable:
```bash
npx vercel env add DEEPSEEK_API_KEY
```

3. Redeploy to pick up the env var:
```bash
npx vercel --prod
```

## API Architecture

All LLM calls route through Vercel serverless functions to keep API keys off the client.

| Endpoint | Provider | Used for |
|---|---|---|
| `/api/npc-chat` | DeepSeek (`deepseek-v4-flash`) | All active calls: NPC conversations, bulletin posts, reactions, cat interactions, end-screen report |
| `/api/chat` | Moonshot/Kimi (`moonshot-v1-32k`) | Legacy endpoint, kept for reference |

**Temperatures in use:**
- NPC conversation lines: 0.9
- NPC closing lines: 0.85
- Bulletin posts: 1.1
- Bulletin reactions: 1.0
- Cat interactions: 1.0
- End-screen report: 0.7

## Simulation Parameters

- **7 encounters** trigger the end-screen (configurable via `MAX_ENC`)
- **Walkable area**: center 70% of map (x: 15–85, y: 15–85)
- **NPC movement**: 8-directional with momentum, separation steering, and quadrant pressure to prevent clustering
- **Bulletin board**: posts fire at most once every 30 seconds globally; 1–2 reactions arrive 12–28 seconds after each post
- **Cat petting**: does not count toward the encounter limit
- **Gossip frequency**: when an NPC has memory of other NPCs, ~22% of their bulletin posts switch to "gossip mode" with a specific named target
- **Conversation anchor**: when a recent bulletin post exists, the NPC may reference it as a conversation hook in ~40% of opening turns

## Notes

- Player avatar sprite is gender-specific (`0-ma.png` / `0-fe.png`); NPC sprites are fixed (`1.png` … `8.png`)
- The bulletin board persists for the session but resets on restart
- The Moonshot API key (`MOONSHOT_API_KEY`) can be kept for fallback but is not used by default
