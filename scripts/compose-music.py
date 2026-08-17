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
ARCHIVE = "v6-computer"

# GM programs — dry, no choir, no brass, no slap-bass dance kit.
FINGER_BASS = 33
SYNTH_BASS = 38
STRINGS = 48
TIMPANI = 47
MUTED_GTR = 28
SQUARE = 80
SAW_LEAD = 81
CELESTA = 8
CRYSTAL = 98
ATMOS = 99
SCI_FI = 103

KICK, RIM, SNARE, TOM_LO, TOM_FL, CHH, WOOD, CLAVE = 36, 37, 38, 41, 43, 42, 76, 75

Gs0, Cs1 = 20, 25
Gs1, A1, B1 = 32, 33, 35
Cs2, D2, Ds2, E2, Fs2, Gs2, A2, B2 = 37, 38, 39, 40, 42, 44, 45, 47
Cs3, D3, Ds3, E3, Fs3, Gs3, A3, B3 = 49, 50, 51, 52, 54, 56, 57, 59
Cs4, D4, Ds4, E4, Fs4, Gs4, A4, B4 = 61, 62, 63, 64, 66, 68, 69, 71
Cs5, D5, Ds5, E5, Fs5, Gs5, A5 = 73, 74, 75, 76, 78, 80, 81
Cs6, D6, E6, Gs6, C7 = 85, 86, 88, 92, 96


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


def heartbeat(s: Seq, bars: int, drag: float = 0.0) -> None:
    """Kick on 1, ghost on 3. A pulse, not a dance floor."""
    for bar in range(bars):
        b = bar * 4
        s.note(b, 0.22, 9, KICK, 86)
        s.note(b + 2 + drag, 0.16, 9, KICK, 50)


def rim_clock(s: Seq, bars: int, eighths: bool = False) -> None:
    """Metronome leftover minutes. Quarter or eighth rims, no backbeat snare."""
    steps = 8 if eighths else 4
    step = 4.0 / steps
    for bar in range(bars):
        for i in range(steps):
            vel = 52 if i == 0 else (34 if i % 2 == 0 else 22)
            s.note(bar * 4 + i * step, 0.05, 9, RIM, vel)


def wood_ticks(s: Seq, bars: int) -> None:
    """Off-eighth woodblock — cheap countdown, not a hi-hat grid."""
    for bar in range(bars):
        for i in (1, 3, 5, 7):
            s.note(bar * 4 + i * 0.5, 0.04, 9, WOOD, 26 if i == 1 else 18)


def impact(s: Seq, beat: float) -> None:
    s.note(beat, 0.35, 9, TOM_LO, 62)
    s.note(beat + 0.08, 0.28, 9, TOM_FL, 48)
    s.note(beat, 0.9, 3, Cs2, 44)


def pedal_bass(s: Seq, bars: int, pairs: list[tuple[int, int]], ch: int = 1) -> None:
    """Half-note pedals. Holds the floor without an eighth-note motor."""
    for bar in range(bars):
        a, b = pairs[bar % len(pairs)]
        s.note(bar * 4, 1.9, ch, a, 74)
        s.note(bar * 4 + 2, 1.7, ch, b, 60)


def title_cue() -> tuple[Seq, int]:
    """The clock is already running. No swagger."""
    bpm = 100
    s = Seq(bpm)
    bars = 16
    s.setup(
        {0: MUTED_GTR, 1: FINGER_BASS, 2: SQUARE, 3: TIMPANI, 5: SAW_LEAD, 6: STRINGS},
        {0: 58, 2: 78, 5: 70, 6: 42},
    )
    s.cc(0, 9, 7, 92)
    s.cc(0, 6, 7, 62)
    heartbeat(s, bars, drag=0.06)
    rim_clock(s, bars, eighths=False)
    wood_ticks(s, bars)
    pedal_bass(s, bars, [(Cs2, Cs2), (Cs2, D2), (Cs2, Cs2), (Gs1, A1)])

    # Thin high clock — not a melody.
    for bar in range(bars):
        s.note(bar * 4 + 0.0, 0.08, 2, Gs4, 28)
        s.note(bar * 4 + 1.0, 0.08, 2, Gs4, 18)
        s.note(bar * 4 + 2.0, 0.08, 2, A4, 24)
        s.note(bar * 4 + 3.0, 0.08, 2, Gs4, 16)

    # Descending warning, sparse. Never climbs like a hook.
    warning = [
        (0, [(0.0, 1.4, Gs3), (1.5, 2.2, E3)]),
        (4, [(0.0, 0.9, A3), (1.0, 2.6, Gs3)]),
        (8, [(0.0, 1.4, B3), (1.5, 2.2, Gs3)]),
        (12, [(0.0, 0.7, D4), (0.8, 2.8, Cs4)]),
    ]
    for bar, notes in warning:
        for off, dur, pitch in notes:
            s.note(bar * 4 + off, dur, 5, pitch, 42)
            s.note(bar * 4 + off, dur, 0, pitch - 12, 36)

    # Low fifth, two bars only — pressure, not a pad bed.
    s.chord(8 * 4, 7.5, 6, [Cs3, Gs3], 22)
    impact(s, 7 * 4 + 3.5)
    impact(s, 15 * 4 + 3.5)
    return s, bars * 4


def courtyard_cue() -> tuple[Seq, int]:
    """Outside: the sky is still falling. Faster clock, still no groove."""
    bpm = 108
    s = Seq(bpm)
    bars = 16
    s.setup(
        {0: MUTED_GTR, 1: SYNTH_BASS, 2: SQUARE, 3: TIMPANI, 5: SAW_LEAD, 6: STRINGS},
        {0: 50, 2: 74, 5: 68, 6: 38},
    )
    s.cc(0, 9, 7, 96)
    s.cc(0, 6, 7, 58)
    heartbeat(s, bars, drag=0.04)
    rim_clock(s, bars, eighths=True)
    wood_ticks(s, bars)
    pedal_bass(
        s,
        bars,
        [(Cs2, Cs2), (Cs2, D2), (Cs2, Cs2), (A1, Gs1), (Cs2, Cs2), (D2, Cs2), (Cs2, A1), (Gs1, Gs1)],
    )

    # Sixteenth ticks in the second half — time running shorter, not a drum fill.
    for bar in range(8, bars):
        for i in range(16):
            if i % 2 == 0:
                continue
            s.note(bar * 4 + i * 0.25, 0.04, 9, CHH, 16)

    # Tritone alarm, short. Far siren, not a fanfare.
    for bar in range(0, bars, 2):
        s.note(bar * 4, 0.18, 2, Gs4, 34)
        s.note(bar * 4 + 0.28, 0.32, 2, D5, 28)

    # Guitar: isolated scrapes, no riff.
    for bar in (1, 5, 9, 13):
        s.note(bar * 4 + 3.0, 0.16, 0, Gs3, 40)
        s.note(bar * 4 + 3.5, 0.22, 0, D4, 36)

    # Lead: four long falling phrases. No bounce.
    falls = [
        (0, [(0.0, 1.6, E4), (2.0, 1.7, Cs4)]),
        (4, [(0.0, 1.2, Fs4), (1.5, 2.2, D4)]),
        (8, [(0.0, 0.8, Gs4), (1.0, 1.2, E4), (2.5, 1.3, Cs4)]),
        (12, [(0.0, 1.4, A4), (1.6, 2.1, Gs4)]),
    ]
    for bar, notes in falls:
        for off, dur, pitch in notes:
            s.note(bar * 4 + off, dur, 5, pitch, 40)

    s.chord(0, 7.6, 6, [Cs3, Gs2], 18)
    s.chord(8 * 4, 7.6, 6, [D3, Gs2], 20)
    impact(s, 3 * 4 + 3.5)
    impact(s, 7 * 4 + 3.5)
    impact(s, 11 * 4 + 3.5)
    impact(s, 15 * 4 + 3.4)
    return s, bars * 4


def command_cue() -> tuple[Seq, int]:
    """Command computer: PSU hum, CRT whine, modem tones, data chatter."""
    bpm = 88
    s = Seq(bpm)
    bars = 16
    s.setup(
        {0: CRYSTAL, 1: SYNTH_BASS, 2: SQUARE, 3: SCI_FI, 4: CELESTA, 5: ATMOS},
        {0: 48, 2: 70, 3: 58, 4: 80, 5: 40},
    )
    s.cc(0, 9, 7, 64)
    s.cc(0, 1, 7, 88)
    s.cc(0, 2, 7, 78)
    s.cc(0, 5, 7, 52)

    # Power supply + fan. Never rests.
    for bar in range(bars):
        s.note(bar * 4, 3.96, 1, Cs1, 62)
        s.note(bar * 4, 3.96, 1, Gs1, 38)
        if bar % 4 >= 2:
            s.note(bar * 4, 3.96, 1, D2, 22)

    # CRT flyback. Thin, high, always on.
    for bar in range(0, bars, 4):
        s.note(bar * 4, 15.8, 2, C7, 11)
        s.note(bar * 4, 15.8, 5, Cs3, 16)

    # Cursor blink on the beat, then a dimmer echo.
    for bar in range(bars):
        s.note(bar * 4, 0.07, 2, Gs5, 32)
        s.note(bar * 4 + 2.0, 0.04, 2, Gs5, 14)
        s.note(bar * 4, 0.04, 9, CLAVE, 24)

    packets = (
        (Cs5, E5, Gs5, Cs6, Gs5, E5),
        (D5, Gs5, D6, A5, Gs5),
        (E5, E5, Cs5, Gs5, Cs6, E5, Gs4),
        (Gs5, D5, Cs6, Gs5, D5),
        (Cs6, Gs5, E5, Cs5, E5, Gs5, Cs6, E6),
        (D5, D5, Gs4, D5),
        (E6, Cs6, Gs5, E5, Cs5),
        (Gs5, A5, Gs5, D5, Cs5),
    )
    for bar in range(bars):
        if bar % 4 == 3:
            continue
        cell = packets[bar % len(packets)]
        t0 = 0.45 if bar % 2 == 0 else 1.15
        for i, pitch in enumerate(cell):
            s.note(bar * 4 + t0 + i * 0.085, 0.06, 0, pitch, 40 if i == 0 else 24)

    # Modem handshake — two-tone, not a melody.
    for bar in (0, 8):
        s.note(bar * 4 + 2.85, 0.32, 2, A4, 30)
        s.note(bar * 4 + 2.85, 0.32, 2, E5, 26)
        s.note(bar * 4 + 3.25, 0.42, 2, Gs4, 28)
        s.note(bar * 4 + 3.25, 0.42, 2, D5, 24)

    # Ready / error beeps.
    for bar in (2, 6, 10, 14):
        s.note(bar * 4 + 3.15, 0.07, 4, Cs6, 36)
        s.note(bar * 4 + 3.38, 0.11, 4, Gs5 if bar != 10 else D5, 30)

    # Drive seek.
    for bar in (4, 12):
        walk = (E4, D4, Cs4, B3, A3, Gs3) if bar == 4 else (Gs3, A3, Cs4, D4, Gs4, D4)
        for i, pitch in enumerate(walk):
            s.note(bar * 4 + 0.08 + i * 0.10, 0.07, 3, pitch, 28)

    # Head chatter.
    for bar in (1, 5, 9, 13):
        for i in range(6):
            s.note(bar * 4 + 2.15 + i * 0.07, 0.04, 9, WOOD, 16 + (i % 2) * 8)

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
    cues = {
        "title": title_cue,
        "courtyard": courtyard_cue,
        "command": command_cue,
    }
    wanted = set(sys.argv[1:] or cues)
    unknown = wanted - set(cues)
    if unknown:
        sys.exit(f"Unknown cue(s): {', '.join(sorted(unknown))}")
    for name, builder in cues.items():
        if name not in wanted:
            continue
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
                "-af",
                (
                    "loudnorm=I=-19:TP=-2.0:LRA=11,aresample=22050"
                    if name == "command"
                    else "loudnorm=I=-17:TP=-1.5:LRA=9,aresample=22050"
                ),
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
