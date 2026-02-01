# Current State

## Status: 🟢 MVP Complete with Official Prompts

**Live URL**: https://longform-explainers.vercel.app
**Repo**: https://github.com/Pu11en/longform-explainers

## What's Done

### Core Features
- [x] GSD planning structure
- [x] Next.js 16 app with Tailwind
- [x] Topic submission form with advanced options
- [x] Project list with real-time status updates
- [x] Project detail page with scene breakdown

### AI Agent Prompts (Official)
- [x] **Script Generator** - AGNT framework prompt (`lib/prompts/script-generator.ts`)
  - Calculates word count before writing
  - 150 WPM timing
  - Max 5-minute segments
  - Natural human conversational tone
  - Proper JSON output structure
  
- [x] **B-Roll Generator** - SEALCaM framework prompt (`lib/prompts/broll-generator.ts`)
  - Subject, Environment, Action, Lighting, Camera, Metatokens
  - 20-second segment calculation
  - start_image_prompt (static frame)
  - video_prompt (motion from frame)

### API Integrations
- [x] OpenRouter (Gemini) - Script + B-roll generation
- [x] Fish Audio - TTS integration (ready, needs API key)
- [x] WaveSpeed InfiniTalk - Talking head video (ready, needs API key)
- [x] WaveSpeed Nano Banana - B-roll images (ready, needs API key)
- [x] WaveSpeed Kling - B-roll videos (ready, needs API key)

### Database Schema
- [x] `longform_projects` - with speech_prompt, total_minutes, target settings
- [x] `longform_scenes` - with word_count, task IDs for polling
- [x] `longform_segments` - with SEALCaM prompts (start_image_prompt, video_prompt)

## To Complete Setup

1. **Create Supabase Tables**
   - Go to: https://supabase.com/dashboard/project/swvljsixpvvcirjmflze/sql/new
   - Run the SQL from `supabase-schema.sql`

2. **Add API Keys** (in Vercel dashboard)
   - `OPENROUTER_API_KEY` - For real script generation
   - `FISH_AUDIO_API_KEY` - For voice generation
   - `WAVESPEED_API_KEY` - For video generation

## File Structure

```
src/lib/
├── prompts/
│   ├── index.ts              # Exports all prompts
│   ├── script-generator.ts   # AGNT framework prompt + types
│   └── broll-generator.ts    # SEALCaM framework prompt + types
├── script-generator.ts       # Main generation service
├── fish-audio.ts            # TTS integration
├── wavespeed.ts             # Video generation integration
└── supabase.ts              # Database client + types
```

## What's Next

### Phase 2: API Integration Testing
- [ ] Test with real OpenRouter API key
- [ ] Test Fish Audio TTS
- [ ] Test WaveSpeed video generation
- [ ] Add async job polling

### Phase 3: Polish
- [ ] File upload for avatar images
- [ ] Voice preview/selection
- [ ] Download all assets as ZIP
- [ ] Video concatenation
