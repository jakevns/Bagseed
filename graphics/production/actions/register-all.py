"""Reproducibly register every retained reaction atlas before embedding it."""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parent
for folder in sorted(root.glob('batch-*')):
    if (folder / 'crops.json').exists():
        subprocess.run([sys.executable, str(root / 'register-batch.py'), folder.name], check=True)
