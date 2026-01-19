import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def save_upload_file(upload_file, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as buffer:
        for chunk in iter(lambda: upload_file.file.read(1024 * 1024), b""):
            buffer.write(chunk)
    return destination
