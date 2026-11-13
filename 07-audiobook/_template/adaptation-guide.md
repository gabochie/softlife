# Adaptation Guide — Manuscript → Narration Script

What the generator (`build_narration_script.py`) does, what it can't, and what
you must hand-tune before audio generation. No `[ADAPT]` block may remain in a
final script.

## Handled automatically

| Manuscript element | Script output |
| --- | --- |
| `# Chapter N: Title` headings | Spoken chapter opening, number spelled out ("Chapter Seven") |
| `---` scene breaks | `[PAUSE 2s]` |
| `- [ ]` checkbox items | Numbered spoken steps ("1. … Completed.") |
| `[text](url)` links | Link text kept, URL dropped |
| `studio.gabochie.com`, `admin@gabochie.com`, `@gideonabochie` | Spoken forms ("studio dot gabochie dot com") |
| `<!-- comments -->`, images, `## Contents` | Removed / `[SKIP]` |
| Tables, code blocks | Wrapped in `[ADAPT MANUALLY]` — never narrated as-is |
| Opening/closing credits | Generated from the book config |

## Hand-tune rules

1. **Tables** — decide per table:
   - Reference table nobody listens to → `[SKIP]` + "For the full table, see
     the book or studio dot gabochie dot com." (or the print companion)
   - Essential comparisons → rewrite as short prose or "First: X. Next: Y." beats
2. **Worksheets / fill-in templates** — narrate the prompt, not the blank:
   "Pause here. Write your answer to the question on the next line." For
   multi-part tools, add a verbal layout cue ("Numbered one to five").
3. **Automated Stack Directory & Further Reading** — name the tool + one-line
   what-for; do NOT narrate URLs beyond the domain. Add one catch-all line:
   "Every tool in this list, with links, is at studio dot gabochie dot com."
4. **Parentheticals** — keep meaning-critical ones, cut decorative ones.
5. **[TOOL] placeholders** — must be resolved or `[SKIP]`ed before scripting;
   placeholders must never be spoken.
6. **Em dashes / ellipses** — fine for TTS; split sentences longer than ~35 words.
7. **Direction notes** — keep the bracketed directions (`[read warmly: "…"]`);
   strip them when exporting plain text per segment for edge-tts.

## Export rule

Before feeding edge-tts, export each segment as plain text: headings become
spoken lines, all `[bracketed]` markers removed, blanks (`___`) deleted.

## QC the script before generation

- [ ] Zero `[ADAPT` blocks remain
- [ ] Zero `[TOOL]` / `[ISBN]` placeholders remain
- [ ] Chapter count matches the book config
- [ ] Stats header recorded (word count → est. runtime)
- [ ] Read Chapter 1 aloud (or TTS a sample) — if it reads awkwardly, the
      manuscript text, not the script, needs the fix
