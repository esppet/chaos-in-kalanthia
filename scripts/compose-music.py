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

# GM programs that sit close to classic Sierra MT-32 / SC-55 cues.
EP = 4
SLAP_BASS = 36
SYNTH_BASS = 38
STRINGS = 48
CHOIR = 52
SYNTH_BRASS = 62
WARM_PAD = 89
HALO = 94
ATMOS = 99
SAW_LEAD = 81
SQUARE = 80
CRYSTAL = 98

# Drums (channel 9)
KICK = 36
SNARE = 38
RIDE = 51
TOM_LO = 41
TOM_MID = 47
CHH = 42
OHH = 46

# C# minor world
Gs1, A1, B1 = 32, 33, 35
Cs2, Ds2, E2, Fs2, Gs2, A2, B2 = 37, 39, 40, 42, 44, 45, 47
Cs3, Ds3, E3, Fs3, Gs3, A3, B3 = 49, 51, 52, 54, 56, 57, 59
Cs4, Ds4, E4, Fs4, Gs4, A4, B4 = 61, 63, 64, 66, 68, 69, 71
Cs5, Ds5, E5, Fs5, Gs5, A5 = 73, 75, 76, 78, 80, 81


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
            if pans and ch in pans:
                self.cc(0, ch, 10, pans[ch])
            else:
                self.cc(0, ch, 10, 64)


def groove(s: Seq, bars: int, kick_pat="x.x.", snare_pat="..x.", hat="eighth") -> None:
    """A cool, ticking kit — urgency without turning into a rock song."""
    for bar in range(bars):
        base = bar * 4
        for i, hit in enumerate(kick_pat):
            if hit == "x":
                s.note(base + i, 0.25, 9, KICK, 72 if i == 0 else 58)
        for i, hit in enumerate(snare_pat):
            if hit == "x":
                s.note(base + i, 0.2, 9, SNARE, 64)
        if hat == "eighth":
            for i in range(8):
                s.note(base + i * 0.5, 0.12, 9, CHH, 40 if i % 2 == 0 else 28)
        elif hat == "sixteenth":
            for i in range(16):
                s.note(base + i * 0.25, 0.08, 9, CHH, 36 if i % 4 == 0 else 22)


def title_cue() -> tuple[Seq, int]:
    """Off-World — swaggering action-hero theme. Same motif, more spine."""
    bpm = 100
    s = Seq(bpm)
    bars = 16
    beats = bars * 4
    s.setup(
        {
            0: EP,
            1: SLAP_BASS,
            2: SYNTH_BRASS,
            3: WARM_PAD,
            4: ATMOS,
            5: SAW_LEAD,
            6: STRINGS,
        },
        {0: 70, 1: 64, 2: 48, 3: 80, 4: 36, 5: 78, 6: 52},
    )
    s.cc(0, 9, 7, 92)

    # Driving slap-bass ostinato.
    roots = ([Cs2] * 8 + [A1] * 4 + [E2] * 4 + [B1] * 4 + [Cs2] * 4 +
             [A1] * 4 + [Fs2] * 4 + [Gs2] * 2 + [Cs2] * 2)
    # 16 bars * 4 beats of eighths = 64 notes if we do every beat... use 2 per bar.
    bass_line = []
    prog = [Cs2, Cs2, A1, A1, E2, E2, B1, B1, Cs2, Cs2, A1, A1, Fs2, Fs2, Gs2, Cs2]
    for bar, root in enumerate(prog):
        b = bar * 4
        bass_line += [(b, root), (b + 1, root), (b + 2, root + 7), (b + 3, root)]
    for start, pitch in bass_line:
        s.note(start, 0.42, 1, pitch, 74 if start % 4 == 0 else 58)

    pads = [
        (0, [Cs3, Gs3, E4], 7.6),
        (8, [A2, E3, Cs4], 7.6),
        (16, [E3, B3, Gs4], 7.6),
        (24, [B2, Fs3, Ds4], 7.6),
        (32, [Cs3, Gs3, E4], 7.6),
        (40, [A2, E3, Cs4], 7.6),
        (48, [Fs2, Cs3, A3], 7.6),
        (56, [Cs3, Gs3, E4], 7.6),
    ]
    for start, notes, dur in pads:
        s.chord(start, dur, 3, notes, 40)
        s.chord(start + 0.05, 3.5, 2, [notes[-1], notes[-1] + 3], 34)

    s.note(0, 15, 4, Cs2, 34)
    s.note(32, 15, 4, Gs2, 30)

    # Hero motif — the old figure, punched shorter.
    ep = [
        (0, 0.5, Cs4, 78),
        (0.5, 0.5, E4, 74),
        (1, 1.0, Gs4, 80),
        (2, 0.5, Fs4, 72),
        (2.5, 0.5, E4, 70),
        (3, 1.0, Cs4, 74),
        (8, 0.5, Cs4, 76),
        (8.5, 0.5, E4, 72),
        (9, 0.5, Fs4, 72),
        (9.5, 0.5, Gs4, 78),
        (10, 1.0, A4, 70),
        (11, 1.0, Gs4, 72),
        (16, 0.5, E4, 74),
        (16.5, 0.5, Gs4, 76),
        (17, 1.0, Cs5, 78),
        (18, 2.0, B4, 70),
        (24, 0.5, A4, 68),
        (24.5, 0.5, Gs4, 66),
        (25, 1.0, E4, 70),
        (26, 2.0, Cs4, 68),
        (32, 0.5, Gs4, 76),
        (33, 0.5, Cs5, 78),
        (34, 1.0, E5, 72),
        (36, 2.0, Ds5, 66),
        (40, 1.0, Cs5, 70),
        (41, 1.0, B4, 66),
        (42, 2.0, Gs4, 68),
        (48, 0.5, Fs4, 70),
        (48.5, 0.5, E4, 68),
        (49, 1.0, Cs4, 72),
        (56, 3.5, Cs4, 64),
    ]
    for start, dur, pitch, vel in ep:
        s.note(start, dur, 0, pitch, vel)

    lead = [
        (4, 1.5, Gs4, 52),
        (12, 2.0, E5, 50),
        (20, 1.5, Cs5, 54),
        (28, 2.0, B4, 48),
        (36, 1.0, A4, 50),
        (44, 2.0, Gs4, 52),
        (52, 3.0, Cs5, 48),
    ]
    for start, dur, pitch, vel in lead:
        s.note(start, dur, 5, pitch, vel)

    groove(s, bars, "x.x.", "..x.", "eighth")
    return s, beats


def courtyard_cue() -> tuple[Seq, int]:
    """Ash Sky — clock is running. Meteor still falling. Get to Zero."""
    bpm = 116
    s = Seq(bpm)
    bars = 16
    beats = bars * 4
    s.setup(
        {
            0: EP,
            1: SYNTH_BASS,
            2: HALO,
            3: SYNTH_BRASS,
            4: ATMOS,
            5: SQUARE,
            6: WARM_PAD,
        },
        {0: 66, 2: 46, 3: 82, 4: 32, 5: 74, 6: 58},
    )
    s.cc(0, 9, 7, 96)

    # Relentless eighth-note bass — a countdown.
    roots = []
    for bar in range(bars):
        if bar % 8 < 4:
            r = Cs2
        elif bar % 8 < 6:
            r = A1
        else:
            r = Gs2 if bar % 8 == 6 else Fs2
        roots.append(r)
    for bar, root in enumerate(roots):
        for i in range(8):
            pitch = root if i != 4 else root + 7
            s.note(bar * 4 + i * 0.5, 0.38, 1, pitch, 70 if i == 0 else 50)

    pads = [
        (0, [Cs3, Gs3, E4], 15.4),
        (16, [A2, E3, Cs4], 15.4),
        (32, [Gs2, Ds3, B3], 7.6),
        (40, [Fs2, Cs3, A3], 7.6),
        (48, [Cs3, Gs3, E4], 15.4),
    ]
    for start, notes, dur in pads:
        s.chord(start, dur, 2, notes, 36)
        s.chord(start, min(dur, 4), 3, [notes[-1]], 30)

    s.note(0, 31, 4, Cs2, 40)
    s.note(32, 31, 4, Gs1, 36)

    # Staccato motif fragments — no time to linger.
    ep = [
        (0, 0.4, Gs4, 62),
        (2, 0.4, Cs5, 64),
        (4, 0.8, E4, 58),
        (8, 0.4, A4, 60),
        (10, 0.4, Gs4, 58),
        (16, 0.4, Cs4, 64),
        (16.5, 0.4, E4, 60),
        (17, 0.8, Gs4, 66),
        (24, 1.5, B3, 54),
        (32, 0.4, Gs4, 62),
        (34, 0.4, Fs4, 58),
        (36, 0.8, E4, 60),
        (40, 1.5, Cs4, 58),
        (48, 0.4, E4, 62),
        (48.5, 0.4, Gs4, 64),
        (49, 1.0, Cs5, 66),
        (56, 2.5, Cs4, 56),
    ]
    for start, dur, pitch, vel in ep:
        s.note(start, dur, 0, pitch, vel)

    lead = [
        (8, 1.2, Cs5, 44),
        (20, 1.5, E5, 42),
        (28, 1.2, B4, 40),
        (44, 2.0, Gs4, 44),
        (60, 2.5, Cs5, 40),
    ]
    for start, dur, pitch, vel in lead:
        s.note(start, dur, 5, pitch, vel)

    groove(s, bars, "x.x.", "..x.", "sixteenth")
    return s, beats


def command_cue() -> tuple[Seq, int]:
    """Dead Console — cooler heist pulse. Steal the log, get out."""
    bpm = 108
    s = Seq(bpm)
    bars = 16
    beats = bars * 4
    s.setup(
        {
            0: EP,
            1: SLAP_BASS,
            2: CRYSTAL,
            3: SYNTH_BRASS,
            4: ATMOS,
            5: SAW_LEAD,
            6: STRINGS,
        },
        {0: 68, 2: 40, 3: 84, 4: 34, 5: 76, 6: 56},
    )
    s.cc(0, 9, 7, 90)

    prog = [Cs2, Cs2, A1, A1, Fs2, Fs2, Gs2, Cs2,
            Cs2, Cs2, A1, A1, Fs2, Gs2, Cs2, Cs2]
    for bar, root in enumerate(prog):
        b = bar * 4
        for i, off in enumerate((0, 0.75, 1.5, 2.0, 2.75, 3.5)):
            s.note(b + off, 0.35, 1, root if i != 2 else root + 12, 72 if i == 0 else 52)

    crystals = [
        (0, [Cs4, Gs4], 7.5),
        (8, [A3, E4], 7.5),
        (16, [Fs3, Cs4], 7.5),
        (24, [Gs3, Ds4], 7.5),
        (32, [Cs4, E4], 7.5),
        (40, [A3, Cs4], 7.5),
        (48, [Fs3, A3], 7.5),
        (56, [Cs4, Gs4], 7.5),
    ]
    for start, notes, dur in crystals:
        s.chord(start, dur, 2, notes, 38)
        s.chord(start, 2.0, 3, [notes[-1]], 32)

    s.note(0, 31, 4, Cs3, 32)
    s.note(32, 31, 4, Gs2, 30)

    ep = [
        (0, 0.35, Gs4, 64),
        (1, 0.35, Cs5, 62),
        (2, 0.7, E4, 58),
        (4, 0.35, A4, 60),
        (6, 0.7, Gs4, 58),
        (8, 0.35, Fs4, 60),
        (10, 0.35, E4, 56),
        (16, 0.35, Cs5, 64),
        (17, 0.35, B4, 56),
        (18, 1.0, Gs4, 60),
        (24, 1.5, E4, 54),
        (32, 0.35, Gs4, 66),
        (32.75, 0.35, Cs5, 64),
        (34, 0.7, E5, 58),
        (40, 1.2, A4, 56),
        (48, 0.35, Fs4, 58),
        (50, 0.35, E4, 56),
        (56, 2.5, Cs4, 58),
    ]
    for start, dur, pitch, vel in ep:
        s.note(start, dur, 0, pitch, vel)

    lead = [
        (12, 1.4, Cs5, 46),
        (28, 1.6, Gs4, 42),
        (44, 1.4, E5, 44),
        (60, 2.2, Cs5, 42),
    ]
    for start, dur, pitch, vel in lead:
        s.note(start, dur, 5, pitch, vel)

    groove(s, bars, "x.x.", "..x.", "eighth")
    s.note(14, 0.2, 9, OHH, 40)
    s.note(46, 0.2, 9, OHH, 38)
    return s, beats


def render(seq: Seq, loop_beats: int) -> np.ndarray:
    fs = fluidsynth.Synth(samplerate=SR, gain=0.42)
    sfid = fs.sfload(str(SF2))
    if sfid < 0:
        raise RuntimeError(f"Could not load {SF2}")
    fs.set_reverb(0.72, 0.28, 0.95, 0.72)
    fs.set_chorus(3, 0.9, 0.28, 7.0, 0)

    # Play the form twice so the exported loop already contains the reverb tail.
    loop_samp = seq.t(loop_beats)
    events = []
    for ev in seq.ev:
        events.append(ev)
        events.append((ev[0] + loop_samp,) + ev[1:])
    events.sort(key=lambda e: (e[0], 0 if e[1] in ("prog", "cc") else 1))

    # Program changes and CC first at t=0 before any audio.
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
    # Second loop only — reverb from the first pass is already ringing.
    start = loop_samp * 2  # stereo interleaved: 2 samples per frame
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
        [
            ffmpeg,
            "-y",
            "-i",
            str(wav),
            "-c:a",
            "libvorbis",
            "-q:a",
            "4",
            str(ogg),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> None:
    if not SF2.exists():
        sys.exit(f"Missing soundfont: {SF2}")
    OUT.mkdir(parents=True, exist_ok=True)
    cues = {
        "title": title_cue,
        "courtyard": courtyard_cue,
        "command": command_cue,
    }
    for name, builder in cues.items():
        print(f"composing {name}...")
        seq, beats = builder()
        audio = render(seq, beats)
        wav = OUT / f"{name}.wav"
        ogg = OUT / f"{name}.ogg"
        write_wav(wav, audio)
        encode_ogg(wav, ogg)
        wav.unlink()
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        norm = OUT / f"{name}-norm.ogg"
        subprocess.run(
            [
                ffmpeg, "-y", "-i", str(ogg),
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=22050",
                "-c:a", "libvorbis", "-q:a", "4", str(norm),
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        norm.replace(ogg)
        archive = OUT / "archive" / "v2-urgent"
        archive.mkdir(parents=True, exist_ok=True)
        (archive / ogg.name).write_bytes(ogg.read_bytes())
        seconds = len(audio) / 2 / SR
        print(f"  {ogg.relative_to(ROOT)}  {seconds:.1f}s  {ogg.stat().st_size // 1024}KB")
    print("done")


if __name__ == "__main__":
    main()
