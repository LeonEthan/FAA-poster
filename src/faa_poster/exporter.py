from .renderer import render_html_to_png


def export_poster(html_path: str, output_dir: str) -> dict:
    """Export a poster HTML to standard size PNGs."""
    return render_html_to_png(html_path, output_dir)
