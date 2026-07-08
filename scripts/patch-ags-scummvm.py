#!/usr/bin/env python3
"""Patch compiled AGS game data for ScummVM 2.8+ compatibility.

ScummVM 2.8 supports AGS format versions up to 3060114 (3.6.1.14).
Games built with AGS 3.6.3.x embed format 3060310, which ScummVM rejects
at load time even when the game does not use 3.6.3-only runtime features.

This rewrites the version integer and version string inside .ags archives.
"""
from __future__ import annotations

import argparse
import struct
import sys
from pathlib import Path

SOURCE_VERSION = 3060310
TARGET_VERSION = 3060114
SOURCE_LABEL = b"3.6.3.10"
TARGET_LABEL = b"3.6.1.14"


def patch_file(path: Path) -> None:
    data = bytearray(path.read_bytes())
    ver_count = data.count(struct.pack("<I", SOURCE_VERSION))
    label_count = data.count(SOURCE_LABEL)
    if ver_count == 0 and label_count == 0:
        if data.count(struct.pack("<I", TARGET_VERSION)):
            print(f"already patched: {path}")
            return
        raise SystemExit(f"no AGS 3.6.3.10 version markers found in {path}")

    data = data.replace(struct.pack("<I", SOURCE_VERSION), struct.pack("<I", TARGET_VERSION))
    data = data.replace(SOURCE_LABEL, TARGET_LABEL)
    path.write_bytes(data)
    print(f"patched {path} ({ver_count} version int, {label_count} version string)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", type=Path, help=".ags files or directories to scan")
    args = parser.parse_args()

    targets: list[Path] = []
    for entry in args.paths:
        if entry.is_dir():
            targets.extend(sorted(entry.rglob("*.ags")))
        elif entry.suffix.lower() == ".ags":
            targets.append(entry)

    if not targets:
        print("no .ags files found", file=sys.stderr)
        return 1

    for path in targets:
        patch_file(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())