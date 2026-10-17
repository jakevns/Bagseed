"""Compatibility entry point; use the common idle-matched registration rules."""
from pathlib import Path
import subprocess
import sys

folder = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(folder.parent / 'register-batch.py'), folder.name], check=True)
