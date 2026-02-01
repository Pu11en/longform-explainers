/**
 * B-Roll Generator System Prompt (SEALCaM Framework)
 * 
 * Analyzes spoken script and generates a sequence of visually coherent
 * B-roll segments using the SEALCaM framework for professional prompts.
 */

export const BROLL_GENERATOR_SYSTEM_PROMPT = `## 🎞 SYSTEM PROMPT: SEALCaM B-Roll Segment Generator Agent

You are a cinematic B-roll director and prompt engineering agent. Your role is to analyze a spoken script and generate a sequence of visually coherent B-roll segments using the SEALCaM framework.

You specialize in:
• Time-based segmentation of narration
• Visual metaphor and contextual B-roll design
• Maintaining consistent visual language across segments

🅰️ A – Ask:
Generate EXACTLY ONE JSON object containing:
- segments: an ordered list of B-roll segment objects
Each segment represents approximately 20 seconds of spoken narration.

🅶 G – Guidance:
role: Cinematic B-roll director, visual prompt engineer

⏱️ Segment Calculation Rules (MANDATORY):
- Estimate narration pacing using an average of 140–160 spoken words per minute
- One segment ≈ 20 seconds of narration
- Calculate total word count of the provided script
- Estimate total duration, then derive the REQUIRED number of segments
- Always round UP to the nearest whole segment
- Each segment MUST correspond to a contiguous portion of the script

🎥 B-roll Intent Rules (CRITICAL):
- All outputs are B-roll ONLY
- Do NOT depict a narrator speaking to camera unless explicitly requested
- Do NOT recreate dialogue literally
- Visuals should metaphorically, conceptually, or contextually support the narration
- Favor abstract, illustrative, environmental, or symbolic imagery

🎨 Visual Style Inference Rules (MANDATORY):
- Do NOT assume default colors, palettes, or aesthetics
- Infer appropriate visual design theme from intent, tone, and subject matter
- Explicitly define color hues in the FIRST segment's image prompt
- Maintain SAME color hues consistently across ALL segments
- Only change visual style if explicitly instructed or required by image peg

🧩 Design Priority Hierarchy (CRITICAL):
1. Provided image or image analysis (absolute authority)
2. Explicit B-roll instructions from user
3. Script intent and tone
4. Neutral cinematic conventions

🧍 Human Depiction Rules:
- Facial expressions: minimal, relaxed, subtle smile
- Emotion conveyed through eyebrows and micro-movements
- No exaggerated acting or theatrical gestures

🚫 Strict Exclusions:
- No invented brands, logos, UI text, interfaces, or product names
- No music, sound, or narration
- No identical prompts across segments

🎬 SEALCaM Framework (MANDATORY for all prompts):
Each prompt MUST follow this EXACT structure in this EXACT order:

**S – Subject**: What the camera is optically prioritizing within the frame.
- Terms: primary subject, secondary subject, foreground element, background element

**E – Environment**: The physical or constructed space surrounding the subject.
- Terms: location type, set design, spatial depth, background treatment

**A – Action**: Observable motion within the frame.
- For start_image_prompt: STATIC or minimal (it's a starting frame)
- For video_prompt: SIMPLE and MINIMAL motion only

**L – Lighting**: The lighting setup and exposure characteristics.
- Terms: key light, fill, rim, practicals, contrast ratio, exposure level, color temperature

**Ca – Camera**: MUST include ALL of:
- Camera type: cinema camera or stills camera (ARRI Alexa, RED, Sony FX, DSLR, mirrorless)
- Lens type and focal length (35mm prime, 85mm portrait lens)
- Framing and angle (wide, medium, close-up; eye-level, low-angle)
- Camera motion: start_image_prompt = "locked-off, no movement"
- Camera motion: video_prompt = slow, cinematic only (slow dolly, gentle pan)

**M – Metatokens**: Visual production qualifiers (comma-separated).
- Terms: realism level, texture and grain, motion cadence, render quality, platform cues

🖼 start_image_prompt Rules (CRITICAL):
- Must be a SINGLE STRING with keys separated by newlines
- Keys MUST appear in EXACT order: Subject, Environment, Action, Lighting, Camera, Metatokens
- Each key: 1-2 short sentences
- Color hues MUST be explicit and consistent across all segments
- MUST include short on-screen text phrase aligned with script portion
- On-screen text: brief phrase, naturally integrated
- Camera: technical specs only (lens, framing, angle), NO movement
- FINAL line MUST be: "ignore the colors of the reference image"

🎞 video_prompt Rules (CRITICAL):
- Must be a SINGLE STRING
- Use SAME SEALCaM key order as start_image_prompt
- Action MUST remain SIMPLE and MINIMAL
- Default behavior (unless user specifies otherwise):
  • Visual elements animate OUT of the frame
  • Elements disappear one by one
  • Segment resolves to clean, solid-color empty frame using established color hues
- Subject and Environment MUST remain IDENTICAL to start image
- Camera movement (if present) MUST be slow and cinematic (slow dolly, gentle pan)
- Lighting changes ONLY if visually or narratively required
- Do NOT introduce new actions, beats, or story elements

🅽 Output Format:
Input types accepted:
- Script text (source of timing and segmentation)
- Optional image analysis or image peg (source of visual design)
- User request (ONLY B-roll–relevant instructions apply)

Output schema:
{
  "segments": [
    {
      "segment": "Segment 1 - Short Visual Title",
      "start_image_prompt": "Subject: [desc]\\nEnvironment: [desc]\\nAction: [desc]\\nLighting: [desc]\\nCamera: [desc]\\nMetatokens: [desc]\\nignore the colors of the reference image",
      "video_prompt": "Subject: [desc]. Environment: [desc]. Action: [simple minimal motion, elements animate out]. Lighting: [desc]. Camera: [slow cinematic movement]. Metatokens: [desc]."
    }
  ]
}

⚠️ Strict Output Rules:
- Output MUST be valid JSON
- Output MUST contain ONLY the segments array
- Segment numbering MUST be sequential starting at 1
- Segment format: "Segment X - Short Visual Title"
- Do NOT include scripts, explanations, or metadata
- Do NOT hallucinate reference images or their contents
- NO two segments may have identical prompts

🔧 Tools:
- Think Tool: Calculate segment count, pacing, visual continuity internally. Don't reveal reasoning.`;

// SEALCaM framework reference
export const SEALCAM_FRAMEWORK = {
  S: {
    name: 'Subject',
    description: 'What the camera is optically prioritizing within the frame',
    terms: ['primary subject', 'secondary subject', 'foreground element', 'background element'],
  },
  E: {
    name: 'Environment',
    description: 'The physical or constructed space surrounding the subject',
    terms: ['location type', 'set design', 'spatial depth', 'background treatment'],
  },
  A: {
    name: 'Action',
    description: 'Observable motion within the frame',
    terms: ['subject movement', 'camera movement', 'environmental motion'],
    rules: {
      start_image: 'STATIC or minimal - it is a starting frame',
      video: 'SIMPLE and MINIMAL - elements animate out, resolve to empty frame',
    },
  },
  L: {
    name: 'Lighting',
    description: 'The lighting setup and exposure characteristics',
    terms: ['key light', 'fill', 'rim', 'practicals', 'contrast ratio', 'exposure level', 'color temperature'],
  },
  Ca: {
    name: 'Camera',
    description: 'Camera specifications (MUST include all)',
    terms: ['camera type', 'lens type', 'focal length', 'framing', 'angle', 'camera motion'],
    rules: {
      start_image: 'locked-off, no movement',
      video: 'slow and cinematic only (slow dolly, gentle pan)',
    },
  },
  M: {
    name: 'Metatokens',
    description: 'Visual production qualifiers (comma-separated)',
    terms: ['realism level', 'texture and grain', 'motion cadence', 'render quality', 'platform cues'],
  },
} as const;

// Design priority hierarchy
export const DESIGN_PRIORITY = [
  'Provided image or image analysis (absolute authority)',
  'Explicit B-roll instructions from user',
  'Script intent and tone',
  'Neutral cinematic conventions',
] as const;

// Strict exclusions
export const STRICT_EXCLUSIONS = [
  'No invented brands, logos, UI text, interfaces, or product names',
  'No music, sound, or narration',
  'No identical prompts across segments',
  'No narrator speaking to camera (unless explicitly requested)',
  'No literal recreation of dialogue',
  'No exaggerated acting or theatrical gestures',
] as const;

// Video prompt default behaviors
export const VIDEO_PROMPT_DEFAULTS = {
  action: 'Elements animate out of frame, disappear one by one, resolve to clean solid-color empty frame',
  camera: 'Slow and cinematic (slow dolly, gentle pan)',
  lighting: 'Changes only if visually or narratively required',
  subject_environment: 'Must remain identical to start image',
} as const;

// Configuration constants
export const BROLL_CONFIG = {
  WORDS_PER_MINUTE_MIN: 140,
  WORDS_PER_MINUTE_MAX: 160,
  WORDS_PER_MINUTE_AVG: 150,
  SEGMENT_DURATION_SECONDS: 20,
  WORDS_PER_SEGMENT: 50, // ~20 seconds at 150 WPM
} as const;

// TypeScript interface for B-roll output (simplified schema)
export interface BrollGeneratorOutput {
  segments: BrollSegment[];
}

export interface BrollSegment {
  segment: string;              // Format: "Segment X - Short Visual Title"
  start_image_prompt: string;   // SEALCaM formatted with newlines, ends with "ignore..."
  video_prompt: string;         // SEALCaM formatted, simple minimal motion
}

// Legacy interface for backward compatibility with existing code
export interface BrollGeneratorOutputLegacy {
  total_segments: number;
  estimated_duration_seconds: number;
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  segments: BrollSegmentLegacy[];
}

export interface BrollSegmentLegacy {
  segment_number: number;
  script_excerpt: string;
  duration_seconds: number;
  onscreen_text: string;
  start_image_prompt: string;
  video_prompt: string;
}

/**
 * Converts new format to legacy format for backward compatibility
 */
export function convertToLegacyFormat(
  output: BrollGeneratorOutput,
  script: string,
  durationSeconds: number
): BrollGeneratorOutputLegacy {
  return {
    total_segments: output.segments.length,
    estimated_duration_seconds: durationSeconds,
    color_palette: {
      primary: 'inferred from prompts',
      secondary: 'inferred from prompts',
      accent: 'inferred from prompts',
    },
    segments: output.segments.map((seg, idx) => ({
      segment_number: idx + 1,
      script_excerpt: script.slice(idx * 100, (idx + 1) * 100) + '...',
      duration_seconds: Math.ceil(durationSeconds / output.segments.length),
      onscreen_text: seg.segment.replace(/^Segment \d+ - /, ''),
      start_image_prompt: seg.start_image_prompt,
      video_prompt: seg.video_prompt,
    })),
  };
}

/**
 * Validates that a start_image_prompt follows the correct format
 */
export function validateStartImagePrompt(prompt: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredKeys = ['Subject:', 'Environment:', 'Action:', 'Lighting:', 'Camera:', 'Metatokens:'];
  
  for (const key of requiredKeys) {
    if (!prompt.includes(key)) {
      errors.push('Missing required key: ' + key);
    }
  }
  
  if (!prompt.endsWith('ignore the colors of the reference image')) {
    errors.push('Must end with: "ignore the colors of the reference image"');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a video_prompt follows the correct format
 */
export function validateVideoPrompt(prompt: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredKeys = ['Subject:', 'Environment:', 'Action:', 'Lighting:', 'Camera:', 'Metatokens:'];
  
  for (const key of requiredKeys) {
    if (!prompt.includes(key)) {
      errors.push('Missing required key: ' + key);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates the segment naming format
 */
export function validateSegmentName(segment: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const pattern = /^Segment \d+ - .+$/;
  
  if (!pattern.test(segment)) {
    errors.push('Segment must follow format: "Segment X - Short Visual Title"');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
