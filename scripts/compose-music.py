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
SYNTH_BASS = 38
STRINGS = 48
CHOIR = 52
WARM_PAD = 89
HALO = 94
ATMOS = 99
SAW_LEAD = 81
SQUARE = 80
CRYSTAL = 98

# Drums (channel 9)
KICK = 36
RIDE = 51
TOM_LO = 41
TOM_MID = 47
CHH = 42

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


def title_cue() -> tuple[Seq, int]:
    """Off-World — lonely EP motif over a slow i–VI–III–VII pad."""
    bpm = 72
    s = Seq(bpm)
    bars = 16
    beats = bars * 4
    s.setup(
        {
            0: EP,
            1: SYNTH_BASS,
            2: WARM_PAD,
            3: CHOIR,
            4: ATMOS,
            5: SAW_LEAD,
            6: STRINGS,
        },
        {0: 70, 2: 54, 3: 80, 4: 40, 5: 76, 6: 50},
    )
    s.cc(0, 9, 7, 72)

    pad = [
        (0, [Cs3, Gs3, Cs4, E4]),
        (8, [A2, E3, A3, Cs4]),
        (16, [E2, B2, E3, Gs3]),
        (24, [B2, Fs3, B3, Ds4]),
        (32, [Cs3, Gs3, Cs4, E4]),
        (40, [A2, E3, A3, Cs4]),
        (48, [Fs2, Cs3, A3, Cs4]),
        (56, [Cs3, Gs3, Cs4, E4]),
    ]
    for start, notes in pad:
        s.chord(start, 7.6, 2, notes, 48)
        s.chord(start + 0.05, 7.4, 6, notes[1:], 28)

    choir = [
        (0, [Gs4, Cs5, E5], 7.5),
        (16, [Gs4, B4, E5], 7.5),
        (32, [E4, Gs4, Cs5], 7.5),
        (48, [Cs4, Gs4, Cs5], 7.5),
    ]
    for start, notes, dur in choir:
        s.chord(start, dur, 3, notes, 26)

    s.note(0, 31, 4, Cs2, 40)
    s.note(32, 31, 4, Gs2, 36)

    bass = [
        (0, Cs2, 3.5),
        (4, Cs2, 1.5),
        (6, Gs2, 1.6),
        (8, A1, 3.5),
        (12, A1, 1.5),
        (14, E2, 1.6),
        (16, E2, 3.5),
        (20, E2, 1.5),
        (22, B2, 1.6),
        (24, B1, 3.5),
        (28, B1, 1.5),
        (30, Fs2, 1.6),
        (32, Cs2, 3.5),
        (36, Cs2, 3.5),
        (40, A1, 3.5),
        (44, A1, 3.5),
        (48, Fs2, 3.5),
        (52, Fs2, 1.5),
        (54, Cs2, 1.6),
        (56, Cs2, 7.5),
    ]
    for start, pitch, dur in bass:
        s.note(start, dur, 1, pitch, 62)

    # Electric-piano motif — the "Kalanthia" figure.
    ep = [
        (0, 1.0, Cs4, 70),
        (1, 1.0, E4, 66),
        (2, 2.0, Gs4, 72),
        (4, 1.0, Fs4, 64),
        (5, 1.0, E4, 60),
        (6, 0.5, Ds4, 58),
        (6.5, 1.5, Cs4, 62),
        (8, 2.0, A3, 60),
        (10, 2.0, Gs3, 58),
        (16, 1.0, Cs4, 68),
        (17, 0.5, E4, 62),
        (17.5, 0.5, Fs4, 62),
        (18, 2.0, Gs4, 70),
        (20, 1.0, A4, 64),
        (21, 1.0, Gs4, 62),
        (22, 2.0, E4, 60),
        (24, 1.0, Ds4, 58),
        (25, 1.0, Cs4, 60),
        (26, 2.0, B3, 56),
        (32, 1.0, E4, 66),
        (33, 1.0, Gs4, 68),
        (34, 2.0, Cs5, 64),
        (36, 1.0, B4, 60),
        (37, 1.0, A4, 58),
        (38, 2.0, Gs4, 60),
        (40, 2.0, A4, 58),
        (42, 2.0, E4, 56),
        (48, 1.0, Fs4, 60),
        (49, 1.0, E4, 58),
        (50, 2.0, Cs4, 62),
        (56, 4.0, Cs4, 54),
        (60, 3.5, Gs3, 48),
    ]
    for start, dur, pitch, vel in ep:
        s.note(start, dur, 0, pitch, vel)

    lead = [
        (32, 2.0, E5, 46),
        (34, 1.0, Ds5, 42),
        (35, 1.0, Cs5, 44),
        (36, 2.0, B4, 40),
        (38, 2.0, Gs4, 42),
        (40, 3.0, A4, 40),
        (43, 1.0, Gs4, 38),
        (44, 4.0, E4, 36),
        (48, 2.0, Cs5, 40),
        (50, 2.0, Gs4, 38),
        (56, 7.0, Cs4, 32),
    ]
    for start, dur, pitch, vel in lead:
        s.note(start, dur, 5, pitch, vel)

    for bar in range(0, bars, 2):
        s.note(bar * 4, 0.4, 9, RIDE, 38)
    for bar in (0, 8):
        s.note(bar * 4, 0.6, 9, KICK, 50)
        s.note(bar * 4 + 2.0, 0.4, 9, TOM_LO, 36)

    return s, beats


def courtyard_cue() -> tuple[Seq, int]:
    """Ash Sky — emptier, wind-scoured, meteor afterglow."""
    bpm = 64
    s = Seq(bpm)
    bars = 16
    beats = bars * 4
    s.setup(
        {
            0: EP,
            1: SYNTH_BASS,
            2: HALO,
            3: CHOIR,
            4: ATMOS,
            5: SQUARE,
            6: WARM_PAD,
        },
        {0: 62, 2: 48, 3: 86, 4: 30, 5: 78, 6: 58},
    )
    s.cc(0, 9, 7, 60)

    pad = [
        (0, [Cs3, Gs3, E4], 15.5),
        (16, [A2, E3, Cs4], 15.5),
        (32, [Fs2, Cs3, A3], 15.5),
        (48, [Cs3, Gs3, Ds4], 15.5),
    ]
    for start, notes, dur in pad:
        s.chord(start, dur, 2, notes, 42)
        s.chord(start + 0.2, dur - 0.3, 6, [n - 12 for n in notes[:2]] + notes, 30)

    s.note(0, 30, 4, Cs2, 50)
    s.note(32, 30, 4, Gs1, 44)
    s.chord(8, 14, 3, [Gs4, Cs5], 20)
    s.chord(40, 14, 3, [E4, B4], 18)

    bass = [
        (0, Cs2, 7.5),
        (8, Cs2, 7.5),
        (16, A1, 7.5),
        (24, A1, 7.5),
        (32, Fs2, 7.5),
        (40, Fs2, 3.5),
        (44, Cs2, 3.5),
        (48, Gs2, 7.5),
        (56, Cs2, 7.5),
    ]
    for start, pitch, dur in bass:
        s.note(start, dur, 1, pitch, 50)

    # Distant fragments, like a memory of the title motif.
    ep = [
        (4, 2.0, Gs4, 44),
        (8, 3.0, E4, 40),
        (16, 1.0, Cs4, 48),
        (18, 2.0, E4, 42),
        (24, 4.0, B3, 38),
        (32, 2.0, A3, 40),
        (36, 2.0, Cs4, 42),
        (40, 3.0, Gs3, 36),
        (48, 2.0, E4, 40),
        (52, 4.0, Cs4, 38),
    ]
    for start, dur, pitch, vel in ep:
        s.note(start, dur, 0, pitch, vel)

    lead = [
        (20, 4.0, Gs4, 28),
        (36, 3.0, Cs5, 26),
        (50, 6.0, E4, 24),
    ]
    for start, dur, pitch, vel in lead:
        s.note(start, dur, 5, pitch, vel)

    for bar in (0, 4, 8, 12):
        s.note(bar * 4, 0.8, 9, TOM_LO, 42)
    s.note(30, 0.5, 9, TOM_MID, 30)
    s.note(62, 0.8, 9, TOM_LO, 34)

    return s, beats


def command_cue() -> tuple[Seq, int]:
    """Dead Console — colder, leftover military clock."""
    bpm = 80
    s = Seq(bpm)
    bars = 16
    beats = bars * 4
    s.setup(
        {
            0: EP,
            1: SYNTH_BASS,
            2: CRYSTAL,
            3: CHOIR,
            4: ATMOS,
            5: SAW_LEAD,
            6: STRINGS,
        },
        {0: 68, 2: 42, 3: 84, 4: 36, 5: 74, 6: 56},
    )
    s.cc(0, 9, 7, 68)

    # Pulse bass — a dying generator.
    for beat in range(0, beats, 2):
        root = Cs2 if (beat // 8) % 4 in (0, 3) else (A1 if (beat // 8) % 4 == 1 else Fs2)
        s.note(beat, 0.7, 1, root, 58 if beat % 8 == 0 else 44)

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
        s.chord(start, dur, 2, notes, 36)
        s.chord(start, dur, 6, [n - 12 for n in notes], 32)

    s.note(0, 31, 4, Cs3, 34)
    s.note(32, 31, 4, Gs2, 32)
    s.chord(16, 14, 3, [Gs4, Cs5], 16)
    s.chord(48, 14, 3, [E4, Gs4], 16)

    ep = [
        (0, 0.5, Gs4, 50),
        (2, 0.5, Cs5, 46),
        (4, 1.0, E4, 44),
        (8, 0.5, A4, 48),
        (10, 0.5, E4, 42),
        (16, 0.5, Fs4, 46),
        (18, 0.5, Cs4, 42),
        (24, 2.0, Gs4, 44),
        (32, 0.5, Cs5, 48),
        (33, 0.5, B4, 40),
        (34, 1.0, Gs4, 44),
        (40, 2.0, A4, 40),
        (48, 0.5, Fs4, 42),
        (50, 0.5, E4, 40),
        (56, 3.0, Cs4, 44),
    ]
    for start, dur, pitch, vel in ep:
        s.note(start, dur, 0, pitch, vel)

    lead = [
        (8, 2.0, Cs5, 34),
        (24, 3.0, Gs4, 30),
        (40, 2.0, E5, 28),
        (56, 4.0, Cs5, 26),
    ]
    for start, dur, pitch, vel in lead:
        s.note(start, dur, 5, pitch, vel)

    for beat in range(0, beats, 4):
        s.note(beat, 0.15, 9, CHH, 28)
    for bar in range(0, bars, 2):
        s.note(bar * 4, 0.3, 9, KICK, 46)
    s.note(28, 0.3, 9, TOM_MID, 32)
    s.note(60, 0.4, 9, TOM_LO, 36)

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
        seconds = len(audio) / 2 / SR
        print(f"  {ogg.relative_to(ROOT)}  {seconds:.1f}s  {ogg.stat().st_size // 1024}KB")
    print("done")


if __name__ == "__main__":
    main()
