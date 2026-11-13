# Voice Spec — "The Soft Life Mentor"

Locked narration direction for the Soft Life Series audiobooks: **AI narration,
female mentor voice.** Fits the core reader (millennial/Gen Z women, professional
women 40+) and the book's big-sister promise: calm, warm, credible — never
breathy, never hyped.

## Persona brief

| Attribute | Direction |
| --- | --- |
| Voice | Adult female, mid-range, warm timbre, natural breath |
| Persona | A mentor who has done the work — big-sister energy, confident and unhurried |
| Pace | 150–155 wpm (ACX-friendly); slightly slower on frameworks and steps |
| Tone | Warm, grounded, lightly smiling on promises; steady (not perky) on hard truths |
| Energy | Conversational throughout; drop 10% in worksheets/steps — brisk and clear |
| Emphasis | Key terms and chapter promises get gentle stress; never shout |
| Pauses | Honor [PAUSE] markers exactly — silence is the mentor's confidence |

## What the voice must NOT be

- Breathless ASMR or "luxury whisper" — this is a business book
- Over-cheerful influencer energy
- Robotic/flat — reject any take where list items lose their inflection

## Candidate AI voices (evaluate 60-second samples of Chapter 1 before committing)

### Zero-cost constraint — production decision

**Pick: Microsoft neural voices via `edge-tts`** (free Python package, no API key):

- **Primary: `en-US-AvaNeural`** — most natural current US female voice; warm,
  conversational, reads as a calm mentor rather than an app voice
- **Fallback: `en-US-JennyNeural`** (soft, friendly), `en-US-AriaNeural`
  (slightly more formal/news-y — audition before rejecting), `en-GB-SoniaNeural`
  (UK flavor if the series wants it)
- Direction control: `--rate=-4%` for the mentor pace, `--pitch=-2Hz` warmth;
  per-section rate tweaks per the direction table above
- Caveat to acknowledge: `edge-tts` uses Microsoft's Edge read-aloud endpoint —
  fine for a solo author's project at this scale, but it is unofficial use of
  Microsoft's service; if that ever matters, fall back to KDP Virtual Voice
  (below), which is the fully-sanctioned free route

**Fallback: KDP Virtual Voice** — zero cost, zero mastering, auto-disclosure,
Audible distribution; choose the calmest female catalog voice. Trade-off: no
prosody control and quality varies by title approval.

**Not viable at zero cost:** ElevenLabs free tier (~10 min/month — can't cover a
3.7-hour book), OpenAI TTS (paid only), Piper (free/offline but clearly synthetic
— fails the "as natural as possible" bar).

Engine recipe (see ai-narration-workflow.md):

    pip install edge-tts
    edge-tts --voice en-US-AvaNeural --rate=-4% --pitch=-2Hz \
      --file ch01.txt --write-media ch01-raw.mp3

Then master to ACX spec with ffmpeg. Note: edge-tts sources 24 kHz audio —
upsample to 44.1 kHz and export 192 kbps mono; the ACX metering targets are
reached in mastering, but bandwidth above ~11 kHz is limited by the source
(acceptable in practice; verify with ACX's checker before full upload).

## Series consistency

- Use the **same voice + settings for all 5 books** (record the winning settings here once chosen)
- One voice per book; re-verify tone on each book's Chapter 1 before full production

## Disclosure (required)

- Audible/ACX: AI narration must be disclosed per current ACX policy —
  **verify the 2026 policy on third-party AI voices before upload** (KDP's
  Virtual Voice handles disclosure automatically; third-party AI audio may be
  restricted — confirm at acx.com before producing)
- Narrator credit line: "Narrated by [VOICE NAME] (AI-narrated)" or per current policy
- Retailer metadata: note AI narration in the description per platform rules

## Per-section direction (for the prompt/settings sheet)

| Section type | Direction |
| --- | --- |
| Opening credits | Neutral-warm, measured |
| Chapter openings | Fresh energy, slight smile |
| Frameworks/steps | Slower, clipped clarity, small pauses between items |
| Client stories (Amara) | Softened, story-time warmth |
| "Your Move" sections | Direct, encouraging, slightly faster |
| Back matter | Practical, brisk |
| Closing credits | Warm settle-down |
