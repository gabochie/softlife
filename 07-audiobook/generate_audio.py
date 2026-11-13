#!/usr/bin/env python3
"""Soft Life Series — audiobook audio generation (AI narration, zero cost).

Parses the hand-tuned narration script into per-file audio segments, generates
each with edge-tts (en-US-AvaNeural, female mentor settings), assembles pauses
and room tone, then masters every file to ACX spec via master.py.

Usage (from anywhere; paths resolve relative to the project root):
  python3 07-audiobook/generate_audio.py 01-soft-life-system            # all files
  python3 07-audiobook/generate_audio.py 01-soft-life-system --only ch01,opening-credits
  python3 07-audiobook/generate_audio.py 01-soft-life-system --dry-run   # text report only
  python3 07-audiobook/generate_audio.py 01-soft-life-system --retail-sample

Requires: edge-tts, pydub, numpy (pip), ffmpeg on PATH, master.py alongside.
Outputs:  07-audiobook/<book-id>/audio-raw/<slug>.wav → audio/<slug>.mp3
"""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

from pydub import AudioSegment

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "07-audiobook"
SR = 44100
VOICE = "en-US-AvaNeural"
RATE = "-4%"
PITCH = "-2Hz"

NUM_WORDS = {
    "one": "01", "two": "02", "three": "03", "four": "04", "five": "05",
    "six": "06", "seven": "07", "eight": "08", "nine": "09", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14",
    "fifteen": "15",
}

# Fill-in field tokens that must never be spoken.
TOOL_RE = re.compile(r"\[([A-Z/ ]+?) TOOL\]")
FIELD_RE = re.compile(r"\[[A-Z][A-Z0-9/ ,.'\-&()]*\]")

# "$[TOKEN]" first (currency spoken in words), then remaining tokens.
CURRENCY_MAP = {
    "HOURLY VALUE": "fifty dollars",
    "LOWER VALUE": "fifteen dollars",
    "PRICE": "a set price",
    "AMOUNT": "an amount",
    "RATE": "a rate",
}
FIELD_MAP = {
    "AUDIENCE": "your audience",
    "OUTCOME": "a specific result",
    "MECHANISM": "your method",
    "CORE OFFER": "my core offer",
    "OTHER WORK": "new work",
    "DELIVERABLE": "the deliverable",
    "DELIVERABLES": "the agreed deliverables",
    "BRIEF SUMMARY": "a brief summary",
    "NEXT STEPS": "the next steps",
    "ASCENSION OFFER": "a way to go deeper",
    "PRICE": "a set price",
    "TIME": "a set time",
    "NEXT WORKING DAY": "the next working day",
    "NUMBER": "my number",
    "RATE": "a rate",
    "GOAL": "the goal",
    "NAME": "there",
    "CLIENT NAME": "there",
    "TIMEFRAME": "a set period",
    "DAYS": "set days",
    "HOURS": "set hours",
    "DAY": "Friday",
    "TIMEZONE": "in your timezone",
    "DAYS/TIMES": "set days and times",
    "RESPONSE TIME": "one business day",
    "PROCESS": "call me directly",
    "SCHEDULING LINK": "your booking link",
    "BOOKING LINK": "your booking link",
    "LINK": "the link",
    "PROGRAM NAME": "the program",
    "DATE": "the date",
}
COMPANION_NOTE = ("If you're following along in the print edition, "
                  "the full worksheet is there.")
FIELD_MAX_WORDS = 5  # "label:" lines up to this length are form fields → dropped


def clean_text(text: str, report: list[str]) -> str:
    """Markdown → plain spoken text; strip/replace un-speakable tokens."""
    text = re.sub(r"^\s*#{1,6}\s+", "", text, flags=re.M)  # stray headings
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text, flags=re.S)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", text, flags=re.S)
    text = re.sub(r"`(.+?)`", r"\1", text, flags=re.S)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)  # md links → text

    def tool_sub(m):
        return f"your preferred {m.group(1).lower().strip()} tool"

    text = TOOL_RE.sub(tool_sub, text)

    for tok, words in CURRENCY_MAP.items():
        text = text.replace(f"$[{tok}]", words)

    def field_sub(m):
        tok = m.group(0)[1:-1].strip()
        if tok in FIELD_MAP:
            return FIELD_MAP[tok]
        report.append(f"UNMAPPED:{tok}   <<<   "
                      + m.string[max(0, m.start() - 40):m.end() + 20].strip())
        return ""

    text = FIELD_RE.sub(field_sub, text)
    text = re.sub(r"^> .*$", "", text, flags=re.M)  # blockquote notes
    text = re.sub(r"^\s*-{3,}\s*$", "", text, flags=re.M)
    text = text.replace("©", " copyright ")
    text = re.sub(r"[ \t]+", " ", text)

    # Line-level: drop blank form lines, fix hanging labels, add companion note
    lines = text.splitlines()
    out: list[str] = []
    drop_run = 0
    for line in lines:
        s = line.strip()
        # line that became empty after token stripping ("1.", "-", "- :")
        if s and not re.search(r"[A-Za-z]", s):
            drop_run += 1
            continue
        # score line left with a dangling "/10" or "/40" after stripping
        if re.search(r":\s*/\d+\s*$", s):
            drop_run += 1
            continue
        m = re.match(r"^(.*?):\s*$", s)
        if m:
            label = re.sub(r"^[\-\*•\d.\s]+", "", m.group(1)).strip()
            label = re.sub(r"\*", "", label)
            if len(label.split()) <= FIELD_MAX_WORDS:
                drop_run += 1
                continue
            s = s[:-1] + "."  # keep long instructions, colon → period
        if drop_run >= 3 and s:
            out.append(COMPANION_NOTE)
            drop_run = 0
        elif drop_run == 2 and s:
            out.append("(Two blanks here in the print edition.)")
            drop_run = 0
        else:
            drop_run = 0
        if s:
            out.append(s)
    return "\n\n".join(out).strip()


def parse_script(path: Path) -> list[tuple[str, str]]:
    """Split script into (slug, section text) — PART sections merged into next."""
    raw = path.read_text(encoding="utf-8")
    sections = re.split(r"^## ", raw, flags=re.M)
    files: list[tuple[str, str]] = []
    part_buf = ""
    for sec in sections[1:]:
        header = sec.splitlines()[0].strip()
        body = sec[len(header):].strip()
        if header.startswith("PART"):
            part_buf = clean_text(body, []) + "\n\n"
            continue
        if header.startswith("CHAPTER"):
            word = re.sub(r"[^a-z]", "", header.split()[1].lower())
            slug = f"ch{NUM_WORDS[word]}"
        elif header.startswith("OPENING"):
            slug = "opening-credits"
        elif header.startswith("INTRODUCTION"):
            slug = "intro"
        elif header.startswith("BACK MATTER"):
            slug = "back-matter"
        elif header.startswith("CLOSING"):
            slug = "closing-credits"
        else:
            continue  # script title / notes
        files.append((slug, part_buf + body))
        part_buf = ""
    return files


def section_to_pieces(body: str) -> list[tuple[str, float | str]]:
    """Body text → list of ("tts", text) and ("pause", seconds) pieces."""
    pieces: list[tuple[str, float | str]] = []
    tts_buf: list[str] = []

    def flush():
        if tts_buf:
            text = "\n\n".join(tts_buf).strip()
            if text:
                pieces.append(("tts", text))
            tts_buf.clear()

    for line in body.splitlines():
        stripped = line.strip()
        m = re.fullmatch(r"\[PAUSE (\d+)s\]", stripped)
        if m:
            flush()
            pieces.append(("pause", float(m.group(1))))
            continue
        if stripped == "[SECTION BREAK]":
            flush()
            pieces.append(("pause", 2.0))
            continue
        m = re.fullmatch(r"\[END OF RECORDING[^\]]*\]", stripped)
        if m:
            flush()
            pieces.append(("pause", 5.0))
            continue
        m = re.fullmatch(r'\[Part subtitle, read warmly: "([^"]+)"\]', stripped)
        if m:
            flush()
            pieces.append(("tts", m.group(1)))
            continue
        if re.fullmatch(r"\[[^\]]*\]", stripped) and stripped not in ("[SKIP]",):
            # unknown bare marker line (e.g. [SKIP — ...]) → drop, don't speak
            flush()
            continue
        if stripped == "" or stripped.startswith(">"):
            continue
        if re.fullmatch(r"-{3,}", stripped):
            continue
        if not re.search(r"[A-Za-z]", stripped):
            continue  # guard: never feed non-letter text to TTS
        tts_buf.append(stripped)
    flush()
    return pieces


def tts(text: str, out: Path) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write(text)
        txt = f.name
    backoff = [2, 5, 10, 20, 30, 45, 60, 90, 120, 120, 120]
    for attempt, wait in enumerate([0] + backoff, start=1):
        if wait:
            import time
            time.sleep(wait)
        try:
            r = subprocess.run(
                [sys.executable, "-m", "edge_tts", "--voice", VOICE,
                 f"--rate={RATE}", f"--pitch={PITCH}", "--file", txt,
                 "--write-media", str(out)],
                capture_output=True, text=True, timeout=300)
        except subprocess.TimeoutExpired:
            print(f"    edge-tts attempt {attempt} timed out", flush=True)
            continue
        if r.returncode == 0 and out.exists() and out.stat().st_size > 1000:
            return
        print(f"    edge-tts attempt {attempt} failed: "
              f"{(r.stderr or '').strip()[-150:]}", flush=True)
    sys.exit(f"TTS failed for {out.name} after {len(backoff) + 1} attempts")


def seg_norm(seg: AudioSegment) -> AudioSegment:
    return seg.set_frame_rate(SR).set_channels(1).set_sample_width(2)


def assemble(slug: str, pieces: list[tuple[str, float | str]], raw_dir: Path,
             report: list[str]) -> float:
    head = AudioSegment.silent(duration=500, frame_rate=SR).set_channels(1).set_sample_width(2)
    audio = head
    total_tts = 0.0
    for kind, val in pieces:
        if kind == "pause":
            audio += AudioSegment.silent(duration=int(val * 1000), frame_rate=SR)
            audio = audio.set_channels(1).set_sample_width(2)
            continue
        tmp = raw_dir / f"_{slug}_part{total_tts:.0f}.mp3"
        tts(clean_text(val, report), tmp)
        audio += seg_norm(AudioSegment.from_file(tmp))
        tmp.unlink()
        total_tts += 1
    audio += AudioSegment.silent(duration=700, frame_rate=SR)
    audio = audio.set_channels(1).set_sample_width(2)
    out = raw_dir / f"{slug}.wav"
    audio.export(out, format="wav")
    return len(audio) / 1000.0


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__, flush=True)
        sys.exit(2)
    book = args[0]
    only = dry = retail = False
    only_set = None
    force = False
    for a in args[1:]:
        if a == "--dry-run":
            dry = True
        elif a == "--retail-sample":
            retail = True
        elif a == "--force":
            force = True
        elif a.startswith("--only "):
            only_set = set(a[len("--only "):].split(","))

    book_dir = AUDIO_DIR / book
    script = book_dir / "narration-script.md"
    raw_dir = book_dir / "audio-raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    files = parse_script(script)

    if dry:
        total_w = 0
        for slug, body in files:
            report: list[str] = []
            text = clean_text(body, report)
            words = len(text.split())
            total_w += words
            tokens = [r.split("   <<<   ")[0] for r in report]
            print(f"{slug:>16}: {words:>6} words"
                  + (f"  · stripped: {sorted(set(tokens))}" if tokens else ""))
        print(f"\nTotal spoken words: {total_w:,}  (est. {total_w / 9400:.1f} h)", flush=True)
        return

    grand = 0.0
    for slug, body in files:
        if only_set and slug not in only_set:
            continue
        done = book_dir / "audio" / f"{slug}.mp3"
        if not force and done.exists():
            print(f"{slug:>16}: already done — skipping (use --force to redo)",
                  flush=True)
            continue
        report: list[str] = []
        pieces = section_to_pieces(body)
        dur = assemble(slug, pieces, raw_dir, report)
        grand += dur
        print(f"{slug:>16}: {dur / 60:5.1f} min · {len(pieces)} pieces"
              + (f" · stripped tokens: {sorted(set(r.split('   <<<   ')[0] for r in report))}"
                 if report else ""))
        r = subprocess.run([sys.executable, str(AUDIO_DIR / "master.py"),
                            str(raw_dir / f"{slug}.wav")], capture_output=True, text=True)
        print(r.stdout.strip() or r.stderr.strip(), flush=True)

    if retail:
        opening = AudioSegment.from_file(raw_dir / "opening-credits.wav")[:15_000]
        ch01 = AudioSegment.from_file(raw_dir / "ch01.wav")[:95_000]
        sample = opening + AudioSegment.silent(1000) + ch01
        sample = seg_norm(sample)
        rs = raw_dir / "retail-sample.wav"
        sample.export(rs, format="wav")
        r = subprocess.run([sys.executable, str(AUDIO_DIR / "master.py"), str(rs)],
                           capture_output=True, text=True)
        print("retail-sample: " + (r.stdout.strip() or r.stderr.strip()))

    print(f"\nDone — {grand / 3600:.2f} finished hours total.", flush=True)


if __name__ == "__main__":
    main()
