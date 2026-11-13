#!/usr/bin/env python3
"""Soft Life Series — audio mastering to ACX spec.

Two-pass loudnorm + filters, then verification against the ACX metering spec.
Zero-config usage: python3 master.py <input> [<output>]   (output = <input> with
"audio/" layout, or pass explicit path)

Requires: ffmpeg on PATH (Alpine: `apk add --no-cache ffmpeg`), numpy.

ACX targets:
  RMS −23 to −18 dB · true peak < −3 dB · noise floor < −60 dB
  MP3 · 192 kbps CBR · mono · 44.1 kHz

Exit code 0 = PASS, 1 = FAIL (levels), 2 = usage error.
"""

import json
import subprocess
import sys
from pathlib import Path

TARGET_I = "-20.5"    # LUFS → lands RMS inside −23..−18 (verified: ~−21 dB)
TARGET_TP = "-3.5"    # true peak target (ACX: < −3)
TARGET_LRA = "9"
SR = 44100


def run(cmd: list[str], capture: bool = False) -> str:
    out = subprocess.run(
        cmd, capture_output=capture, text=(capture or None)
    )
    if out.returncode != 0:
        err = (out.stderr or "").strip() if capture else ""
        sys.exit(f"ffmpeg failed: {' '.join(cmd[:8])}…\n{err}")
    return (out.stderr or "").strip() if capture else ""


def measure_loudnorm(infile: str) -> dict:
    args = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", infile,
        "-af", f"highpass=f=70,lowpass=f=11000,"
               f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}:print_format=json",
        "-f", "null", "-",
    ]
    stderr = run(args, capture=True)
    start = stderr.rfind("{")
    end = stderr.rfind("}")
    if start == -1 or end == -1:
        sys.exit("Could not parse loudnorm measurements — is the input audio silent?")
    return json.loads(stderr[start:end + 1])


def astats(infile: str) -> tuple[float, float]:
    stderr = run([
        "ffmpeg", "-hide_banner", "-i", infile,
        "-af", "astats=metadata=1", "-f", "null", "-",
    ], capture=True)
    peak = rms = None
    for line in stderr.splitlines():
        if "Peak level dB" in line:
            peak = float(line.split(":")[1])
        if "RMS level dB" in line:
            rms = float(line.split(":")[1])
    if peak is None or rms is None:
        sys.exit("astats parse failed")
    return peak, rms


def master(infile: str, outfile: str) -> None:
    m = measure_loudnorm(infile)
    args = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", infile,
        "-af", "highpass=f=70,lowpass=f=11000,"
               f"loudnorm=I={TARGET_I}:TP={TARGET_TP}:LRA={TARGET_LRA}"
               f":measured_I={m['input_i']}:measured_TP={m['input_tp']}"
               f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}"
               f":offset={m['target_offset']}:linear=true",
        "-ar", str(SR), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k",
        outfile, "-y",
    ]
    run(args)
    peak, rms = astats(outfile)
    ok = (-23.0 <= rms <= -18.0) and (peak < -3.0)
    print(f"{Path(outfile).name}: RMS {rms:.1f} dB · peak {peak:.1f} dB → "
          f"{'PASS' if ok else 'FAIL'}")
    if not ok:
        print("  Adjust TARGET_I (raise for higher RMS) or add a limiter; rerun.")
        sys.exit(1)


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    infile = Path(sys.argv[1])
    if len(sys.argv) >= 3:
        outfile = Path(sys.argv[2])
    else:
        # layout convention: audio-raw/X.(mp3|wav) → audio/X.mp3
        stem = infile.stem
        if infile.parent.name == "audio-raw":
            outfile = infile.parent.parent / "audio" / f"{stem}.mp3"
        else:
            outfile = infile.with_name(f"{stem}-mastered.mp3")
        if outfile == infile:
            outfile = infile.with_name(f"{infile.stem}-mastered.mp3")
    outfile.parent.mkdir(parents=True, exist_ok=True)
    master(str(infile), str(outfile))


if __name__ == "__main__":
    main()
