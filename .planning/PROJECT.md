# Longform AI Explainers

## Vision
A web app that generates professional explainer videos from a topic prompt, using AI to create scripts, voice narration, and talking-head videos.

## Core Flow
1. User submits topic → stored in Supabase
2. AI generates segmented script (OpenRouter/Gemini)
3. TTS creates voice narration (Fish Audio)
4. Video generation creates talking-head segments (WaveSpeed InfiniteTalk)
5. B-roll prompts generated for enhancement
6. User can view progress and download final segments

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **APIs**:
  - OpenRouter (Gemini) - Script generation
  - Fish Audio - TTS
  - WaveSpeed AI - Video generation

## Status Pipeline
Create → Scripting → Voice → Video → B-Roll → Done

## Key Decisions
- Server actions for API calls (keep keys secure)
- Real-time updates via Supabase subscriptions
- Segment-based architecture (each video split into segments)
