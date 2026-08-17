#!/usr/bin/env python3
"""Compose looping MT-32 / Roland SC-55 cues for Chaos in Kalanthia.

Renders with the ScummVM Roland SC-55 soundfont (LA-synthesis sibling of
the MT-32) and encodes Ogg Vorbis for the browser game.
"""

from __future__ import annotations

import subprocess
import sys
import wave
from pathlib import Path

import fluidsynth
import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SF2 = Path("/usr/share/scummvm/Roland_SC-55.sf2")
OUT = ROOT / "web" / "assets" / "music"
SR = 22050
ARCHIVE = "v3-urgency"

# GM programs — dry, rhythmic, no choir wash.
EP = 4
SLAP_BASS = 36
SYNTH_BASS = 38
STRINGS = 48
SYNTH_BRASS = 62
SAW_LEAD = 81
SQUARE = 80
CRYSTAL = 98
MUTED_GTR = 28

KICK, SNARE, RIDE, TOM_LO, CHH, OHH = 36, 38, 51, 41, 42, 46

Gs1, A1, B1 = 32, 33, 35
Cs2, Ds2, E2, Fs2, Gs2, A2, B2 = 37, 39, 40, 42, 44, 45, 47
Cs3, Ds3, E3, Fs3, Gs3, A3, B3 = 49, 51, 52, 54, 56, 57, 59
Cs4, Ds4, E4, Fs4, Gs4, A4, B4 = 61, 63, 64, 66, 68, 69, 71
Cs5, Ds5, E5, Fs5, Gs5 = 73, 75, 76, 78, 80


class Seq:
    def __init__(self, bpm: float):
        self.bpm = bpm
        self.ev: list[tuple] = []

    def t(self, beat: float) -> int:
        return int(beat * 60.0 / self.bpm * SR)

    def cc(self, beat: float, ch: int, ctrl: int, val: int) -> None:
        self.ev.append((self.t(beat), "cc", ch, ctrl, val))

    def prog(self, beat: float, ch: int, program: int) -> None:
        self.ev.append((self.t(beat), "prog", ch, program, 0))

    def on(self, beat: float, ch: int, pitch: int, vel: int) -> None:
        self.ev.append((self.t(beat), "on", ch, pitch, vel))

    def off(self, beat: float, ch: int, pitch: int) -> None:
        self.ev.append((self.t(beat), "off", ch, pitch, 0))

    def note(self, beat: float, dur: float, ch: int, pitch: int, vel: int) -> None:
        if dur <= 0:
            return
        self.on(beat, ch, pitch, vel)
        self.off(beat + dur, ch, pitch)

    def chord(self, beat: float, dur: float, ch: int, pitches: list[int], vel: int) -> None:
        for p in pitches:
            self.note(beat, dur, ch, p, vel)

    def setup(self, channels: dict[int, int], pans: dict[int, int] | None = None) -> None:
        for ch, program in channels.items():
            self.prog(0, ch, program)
            self.cc(0, ch, 7, 100)
            self.cc(0, ch, 11, 110)
            self.cc(0, ch, 10, (pans or {}).get(ch, 64))


def kit(s: Seq, bars: int) -> None:
    """Kick every beat, snare on 2 and 4, 16th hats. The clock."""
    for bar in range(bars):
        b = bar * 4
        for beat in range(4):
            s.note(b + beat, 0.16, 9, KICK, 88 if beat == 0 else 72)
        s.note(b + 1, 0.14, 9, SNARE, 86)
        s.note(b + 3, 0.14, 9, SNARE, 90)
        for i in range(16):
            s.note(b + i * 0.25, 0.06, 9, CHH, 52 if i % 4 == 0 else (36 if i % 2 == 0 else 24))
        if bar % 2 == 1:
            s.note(b + 3.5, 0.12, 9, OHH, 44)


def motor_bass(s: Seq, bars: int, roots: list[int], ch: int = 1) -> None:
    """Eighth-note engine. Does not rest."""
    for bar in range(bars):
        root = roots[bar % len(roots)]
        for i in range(8):
            pitch = root if i not in (3, 7) else root + 7
            s.note(bar * 4 + i * 0.5, 0.36, ch, pitch, 80 if i == 0 else 58)


def clock_strings(s: Seq, bars: int, ch: int = 6) -> None:
    """16th-note ostinato — the countdown you hear in your teeth."""
    cell = [Cs4, Gs3, Cs4, E4, Cs4, Gs3, B3, Gs3]
    for bar in range(bars):
        for i, pitch in enumerate(cell * 2):
            s.note(bar * 4 + i * 0.25, 0.18, ch, pitch, 46 if i % 4 == 0 else 32)


def title_cue() -> tuple[Seq, int]:
    """Mission start — hero is already moving."""
    bpm = 132
    s = Seq(bpm)
    bars = 16
    s.setup(
        {0: SYNTH_BRASS, 1: SLAP_BASS, 2: MUTED_GTR, 5: SAW_LEAD, 6: STRINGS},
        {0: 54, 2: 80, 5: 72, 6: 44},
    )
    s.cc(0, 9, 7, 100)
    motor_bass(s, bars, [Cs2, Cs2, A1, Gs2] * 4)
    clock_strings(s, bars)

    # Brass / lead unison riff — short, punched.
    riff = [
        (0.0, 0.45, Cs4), (0.5, 0.45, E4), (1.0, 0.9, Gs4),
        (2.0, 0.45, Fs4), (2.5, 0.45, E4), (3.0, 0.9, Cs4),
    ]
    for bar in (0, 2, 8, 10):
        for off, dur, pitch in riff:
            vel = 78 if off == 0 else 66
            s.note(bar * 4 + off, dur, 0, pitch, vel)
            s.note(bar * 4 + off, dur, 5, pitch + 12, vel - 18)

    # Answer phrase.
    answer = [(0.0, 0.45, A4), (0.5, 0.45, Gs4), (1.0, 0.9, E4), (2.0, 1.8, Cs4)]
    for bar in (4, 12):
        for off, dur, pitch in answer:
            s.note(bar * 4 + off, dur, 0, pitch, 70)
            s.note(bar * 4 + off, dur, 5, pitch + 12, 50)

    # Guitar scrapes on the off-beat.
    for bar in range(bars):
        s.note(bar * 4 + 1.5, 0.2, 2, Gs3, 48)
        s.note(bar * 4 + 3.5, 0.2, 2, Cs4, 50)

    kit(s, bars)
    return s, bars * 4


def courtyard_cue() -> tuple[Seq, int]:
    """The building is coming down. Run."""
    bpm = 152
    s = Seq(bpm)
    bars = 16
    s.setup(
        {0: SQUARE, 1: SYNTH_BASS, 2: SYNTH_BRASS, 5: SAW_LEAD, 6: STRINGS},
        {0: 70, 2: 48, 5: 78, 6: 40},
    )
    s.cc(0, 9, 7, 104)

    # Pedal sixteenth bass — Geiger counter / timer.
    for bar in range(bars):
        root = Cs2 if bar % 8 < 5 else (A1 if bar % 8 < 7 else Gs2)
        for i in range(16):
            s.note(bar * 4 + i * 0.25, 0.16, 1, root, 76 if i == 0 else (54 if i % 4 == 0 else 42))

    clock_strings(s, bars)

    # Alarm brass — two-note siren every other bar.
    for bar in range(0, bars, 2):
        s.note(bar * 4, 0.35, 2, Gs4, 70)
        s.note(bar * 4 + 0.5, 0.35, 2, A4, 66)
        s.note(bar * 4 + 1.0, 0.7, 2, Gs4, 68)

    # Lead: clipped, no sustain to lean on.
    shots = [
        (0, Cs5), (2, E5), (4, Gs4), (6, Cs5),
        (8, B4), (10, Gs4), (12, A4), (14, Gs4),
        (16, Cs5), (18, Fs5), (20, E5), (22, Cs5),
        (24, B4), (26, Gs4), (28, E4), (30, Cs5),
        (32, Gs4), (34, A4), (36, B4), (38, Cs5),
        (40, E5), (42, Cs5), (44, B4), (46, Gs4),
        (48, Cs5), (50, E5), (52, Gs4), (54, Cs4),
        (56, Gs4), (58, E4), (60, Cs5), (62, Gs4),
    ]
    for beat, pitch in shots:
        s.note(beat, 0.35, 5, pitch, 58)
        s.note(beat, 0.28, 0, pitch - 12, 50)

    kit(s, bars)
    return s, bars * 4


def command_cue() -> tuple[Seq, int]:
    """Steal the log. Do not linger."""
    bpm = 140
    s = Seq(bpm)
    bars = 16
    s.setup(
        {0: CRYSTAL, 1: SLAP_BASS, 2: SYNTH_BRASS, 5: SAW_LEAD, 6: STRINGS},
        {0: 42, 2: 82, 5: 74, 6: 50},
    )
    s.cc(0, 9, 7, 98)
    motor_bass(s, bars, [Cs2, Cs2, A1, Fs2, Cs2, Cs2, Gs2, Cs2])
    clock_strings(s, bars)

    # Crystal blips — computer, not a hymn.
    for bar in range(bars):
        s.note(bar * 4 + 0.75, 0.12, 0, Gs5, 44)
        s.note(bar * 4 + 1.75, 0.12, 0, Cs5, 40)
        s.note(bar * 4 + 2.75, 0.12, 0, E5, 42)

    riff = [(0.0, Cs5), (0.5, B4), (1.0, Gs4), (1.5, Cs5), (2.5, E5), (3.0, Cs5)]
    for bar in (0, 4, 8, 12):
        for off, pitch in riff:
            s.note(bar * 4 + off, 0.32, 5, pitch, 56)
            s.note(bar * 4 + off, 0.28, 2, pitch - 12, 48)

    kit(s, bars)
    return s, bars * 4


def render(seq: Seq, loop_beats: int) -> np.ndarray:
    fs = fluidsynth.Synth(samplerate=SR, gain=0.5)
    sfid = fs.sfload(str(SF2))
    if sfid < 0:
        raise RuntimeError(f"Could not load {SF2}")
    fs.set_reverb(0.18, 0.6, 0.35, 0.12)
    fs.set_chorus(1, 0.2, 0.4, 3.0, 0)

    loop_samp = seq.t(loop_beats)
    events = []
    for ev in seq.ev:
        events.append(ev)
        events.append((ev[0] + loop_samp,) + ev[1:])
    events.sort(key=lambda e: (e[0], 0 if e[1] in ("prog", "cc") else 1))

    chunks: list[np.ndarray] = []
    t = 0
    ei = 0
    end = loop_samp * 2 + seq.t(2)

    def apply(ev) -> None:
        kind = ev[1]
        ch, a, b = ev[2], ev[3], ev[4]
        if kind == "prog":
            fs.program_select(ch, sfid, 0, a)
        elif kind == "cc":
            fs.cc(ch, a, b)
        elif kind == "on":
            fs.noteon(ch, a, b)
        elif kind == "off":
            fs.noteoff(ch, a)

    while t < end:
        nxt = events[ei][0] if ei < len(events) else end
        n = min(max(nxt - t, 0), 1024)
        if n:
            chunks.append(np.asarray(fs.get_samples(n), dtype=np.int16))
            t += n
        while ei < len(events) and events[ei][0] <= t:
            apply(events[ei])
            ei += 1

    fs.delete()
    audio = np.concatenate(chunks)
    start = loop_samp * 2
    stop = start + loop_samp * 2
    loop = audio[start:stop]
    peak = max(int(np.max(np.abs(loop))), 1)
    if peak > 28000:
        loop = (loop.astype(np.int32) * 28000 // peak).astype(np.int16)
    return loop


def write_wav(path: Path, stereo: np.ndarray) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


def encode_ogg(wav: Path, ogg: Path) -> None:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [ffmpeg, "-y", "-i", str(wav), "-c:a", "libvorbis", "-q:a", "4", str(ogg)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> None:
    if not SF2.exists():
        sys.exit(f"Missing soundfont: {SF2}")
    OUT.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    archive = OUT / "archive" / ARCHIVE
    archive.mkdir(parents=True, exist_ok=True)
    for name, builder in {
        "title": title_cue,
        "courtyard": courtyard_cue,
        "command": command_cue,
    }.items():
        print(f"composing {name}...")
        seq, beats = builder()
        audio = render(seq, beats)
        wav = OUT / f"{name}.wav"
        ogg = OUT / f"{name}.ogg"
        write_wav(wav, audio)
        encode_ogg(wav, ogg)
        wav.unlink()
        norm = OUT / f"{name}-norm.ogg"
        subprocess.run(
            [
                ffmpeg, "-y", "-i", str(ogg),
                "-af", "loudnorm=I=-15:TP=-1.2:LRA=8,aresample=22050",
                "-c:a", "libvorbis", "-q:a", "4", str(norm),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        norm.replace(ogg)
        (archive / ogg.name).write_bytes(ogg.read_bytes())
        seconds = len(audio) / 2 / SR
        print(f"  {ogg.relative_to(ROOT)}  {seconds:.1f}s  {ogg.stat().st_size // 1024}KB")
    print("done")


if __name__ == "__main__":
    main()
