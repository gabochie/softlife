# 07 — Audiobook Production

Series pipeline for AI-narrated audiobooks. **Route (locked): AI narration,
female mentor voice, as natural as possible, zero cost.**

Voice: `en-US-AvaNeural` via `edge-tts` (fallback: KDP Virtual Voice).
Full voice decision + direction: `_template/voice-spec.md`.

## Status — Book 1 ✅ PRODUCED

`01-soft-life-system/`: **21 files, 3.81 finished hours, all ACX PASS**
(RMS −21.0 to −22.0 dB · peaks −3.7/−3.8 dB · 192 kbps CBR mono 44.1 kHz).
19 book files (opening-credits · intro · ch01–ch15 · back-matter · closing-credits)
+ retail-sample (1.9 min) + Ava voice-proof sample. Generated via
`generate_audio.py` (resume-safe; edge-tts is network-bound — expect ~2–4×
realtime and intermittent retries). closing-credits needed one re-master at a
hotter loudnorm target (I=−18) to clear the RMS floor.

## Workflow

```
1. python3 build_narration_script.py <book-id>     # manuscript → narration script
2. Hand-tune every [ADAPT MANUALLY] block in the script
3. Generate audio per segment (edge-tts) → audio-raw/
4. Master to ACX spec (ffmpeg)                     → audio/
5. QC every file (astats + listen)                 # RMS −23..−18 dB, peaks < −3 dB
6. Upload + disclose AI narration per platform policy
```

Per-book details and commands: `_template/ai-narration-workflow.md`.
Adaptation rules (tables, worksheets, links): `_template/adaptation-guide.md`.

## Layout

```
07-audiobook/
  build_narration_script.py      manuscript → narration script (all books)
  _template/                     voice-spec · workflow · adaptation guide · pronunciation template
  01-soft-life-system/
    narration-script.md          generated + hand-tuned script
    pronunciation-guide.md       names/terms spoken forms
    audio-raw/                   unmastered takes (gitignore if large)
    audio/                       final ACX-spec MP3s
```

## Environment (this machine — Alpine aarch64)

- `apk add --no-cache ffmpeg` (installed; ffmpeg 6.1.2 — apt does not exist here)
- `pip install edge-tts mutagen numpy` (installed) — pip wheels for some audio
  libs (lameenc, imageio-ffmpeg binaries) are unavailable on musl/arm64
- Pipeline proven end-to-end: edge-tts generation → master.py → ACX PASS

## Locked decisions

- Narrator: AI, female mentor persona ("The Soft Life Mentor" — see voice-spec.md)
- Engine: `edge-tts`, `en-US-AvaNeural`, `--rate=-4% --pitch=-2Hz`
- Cost: $0 (fallback: KDP Virtual Voice; paid engines deferred)
- Disclosure: AI narration must be disclosed per platform policy — verify
  current ACX terms before upload (Virtual Voice auto-discloses)

## Series consistency

Same voice + settings for all 5 books. Record the winning voice/settings in
`_template/voice-spec.md` and re-verify tone on each book's Chapter 1.
