import os
from pathlib import Path
from typing import List, Tuple
from playwright.sync_api import sync_playwright


DEFAULT_SIZES: List[Tuple[str, int, int]] = [
    ("portrait", 1080, 1350),   # 4:5 Instagram
    ("story", 1080, 1920),      # 9:16 Stories
    ("square", 1080, 1080),     # 1:1
]


def render_html_to_png(
    html_path: str,
    output_dir: str,
    sizes: List[Tuple[str, int, int]] = None,
) -> dict:
    """Screenshot an HTML file at multiple poster sizes."""
    sizes = sizes or DEFAULT_SIZES
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, width, height in sizes:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto(f"file://{os.path.abspath(html_path)}")
            page.wait_for_timeout(500)  # wait for fonts
            png_path = out / f"poster_{name}.png"
            page.screenshot(path=str(png_path), full_page=False)
            results[name] = str(png_path)
            page.close()
        browser.close()

    return results
