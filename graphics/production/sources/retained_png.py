"""Preserve retained PNG bytes when a platform's encoder changes, not pixels."""
from pathlib import Path
from PIL import Image

def save_png(image, target):
    target = Path(target)
    if target.exists():
        try:
            with Image.open(target) as retained:
                if retained.size == image.size and retained.convert('RGBA').tobytes() == image.convert('RGBA').tobytes():
                    return
        except OSError:
            pass  # Replace an interrupted prior write from retained sources.
    temporary = target.with_suffix('.png.tmp')
    image.save(temporary, format='PNG')
    temporary.replace(target)

def save_text(text, target):
    target = Path(target)
    if target.exists() and target.read_text(encoding='utf-8') == text:
        return
    temporary = target.with_name(target.name + '.tmp')
    temporary.write_text(text, encoding='utf-8', newline='\n')
    temporary.replace(target)
