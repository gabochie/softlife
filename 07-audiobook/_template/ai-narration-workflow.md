# AI Narration Workflow — Soft Life Series

Per-book pipeline: manuscript → narration script → AI voice → mastering → ACX upload.

## Pipeline

```
1. Script        python3 07-audiobook/build_narration_script.py <book-id>
                 → 07-audiobook/<book-id>/narration-script.md
                 Hand-tune every [ADAPT MANUALLY] block. No [ADAPT] may remain.

2. Segment       Split the script into audio segments at [SECTION BREAK] /
                 chapter boundaries. One file per chapter + credits files.
                 File naming: <slug>_opening.mp3, <slug>_ch01.mp3 …,
                 <slug>_closing.mp3, <slug>_retail-sample.mp3

3. Generate      Feed each segment to the chosen AI voice with the section-type
                 direction from _template/voice-spec.md. WAV/48kHz mono raw.

4. Master        Per-file, then verify per-book (spec below). ffmpeg recipe:
                   ffmpeg -i in.wav -af "highpass=f=70, lowpass=f=14000,
                   loudnorm=I=-19.5:TP=-3.5:LRA=9, speechnorm=e=5:r=0.0005:l=1"
                   -ar 44100 -ac 1 -c:a libmp3lame -b:a 192k out.mp3
                 Targets: RMS −23 to −18 dB · peaks < −3 dB · noise floor < −60 dB

5. QC            Listen start/middle/end of every file; check pacing vs [PAUSE]
                 markers, no clicks/truncation, consistent tone across files.
                 Verify every file's measured RMS/peaks (ffmpeg -af astats).

6. Credits       Opening credits first file, closing credits last file,
                 retail sample = 1–5 min best-of cut.

7. Upload        ACX (or chosen distributor) + cover + metadata. Disclose AI
                 narration per current policy (see voice-spec.md).
```

## Segment conventions

| Marker | Meaning |
| --- | --- |
| `[PAUSE 1s]` / `[PAUSE 2s]` | Insert exactly; TTS engines support breaks (ElevenLabs: `<break time="1s"/>` equivalents, or split-and-join files) |
| `[SECTION BREAK]` | End of audio file + 0.5–1s room tone head |
| `[ADAPT MANUALLY]` | Human rewrite required — block must not reach TTS |
| `[SKIP]` | Do not narrate |
| `[Part subtitle, read warmly: "..."]` | Direction note — narrate the quoted text with that direction |

## Toolchain notes (zero-cost production: edge-tts)

- **Generate** per file (see voice-spec.md for voice choice + settings):
      pip install edge-tts
      edge-tts --voice en-US-AvaNeural --rate=-4% --pitch=-2Hz \
        --file ch01.txt --write-media ch01-raw.mp3
  Honor pause markers by splitting text at `[PAUSE 1s]`/`[PAUSE 2s]`, then
  joining segments with silence: `ffmpeg -f lavfi -t 1 -i anullsrc=r=44100:cl=mono`
- **Master** to ACX spec (automated, two-pass loudnorm + verification):
      python3 07-audiobook/master.py 07-audiobook/<book-id>/audio-raw/<file>.mp3
      # → audio/<file>.mp3 · prints "PASS"/"FAIL" + measured RMS/peak, exit 1 on FAIL
  Equivalent manual ffmpeg recipe (two-pass): pass 1 measures with
  `loudnorm=I=-20.5:TP=-3.5:LRA=9:print_format=json`, pass 2 applies the
  measured values with `linear=true` — one-pass loudnorm + speechnorm does NOT
  land inside spec (verified). Targets: RMS −23 to −18 dB · peaks < −3 dB.
- **Fallback:** KDP Virtual Voice (fully sanctioned free route) if edge-tts is
  blocked or quality fails QC.
- **Paid options (future):** ElevenLabs/OpenAI TTS when budget allows — settings
  template kept in voice-spec.md.
- Keep raw vs final separated: `07-audiobook/<book-id>/audio-raw/` (unmastered
  takes) and `07-audiobook/<book-id>/audio/` (final MP3s). Never edit mastered files.
- **Disclose AI narration** on the platform per current policy (2026 — verify
  ACX terms before upload; KDP Virtual Voice handles disclosure automatically).

## ACX file spec (per file)

- MP3, 192 kbps CBR, mono, 44.1 kHz, constant
- RMS −23 to −18 dB; peak < −3 dB; noise floor < −60 dB
- Head/tail: 0.5–1 s room tone, no clicks; total runtime ≥ 1 hour (series books qualify)
- Opening credits file starts with book title; closing credits file ends the book

## Per-book checklist

- [ ] Script generated + all [ADAPT] blocks hand-tuned
- [ ] Voice chosen + settings locked into voice-spec.md (series consistency)
- [ ] AI-narration disclosure policy verified for target platform (2026)
- [ ] All chapter files generated, mastered, QC-passed
- [ ] Retail sample cut
- [ ] Runtime ≥ 1 hour; stats recorded in the book's narration-script.md header
- [ ] Upload + metadata (categories/keywords from 04-marketing)
