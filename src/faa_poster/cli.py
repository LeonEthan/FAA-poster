import json
import shutil
from pathlib import Path
from typing import Optional

import typer
from PIL import Image
from rich.console import Console

from .imagegen import edit_image, generate_image
from .models import PosterBrief, QAReport, QACheckItem, QAScreenshots
from .prompt_builder import build_image_prompt, ImagePrompt

app = typer.Typer(help="FAA Poster — Pure Image Generation Stack")
console = Console()


@app.command()
def visualize(
    prompt_json: str = typer.Option(..., "--prompt", help="Path to image_prompt.json"),
    output: str = typer.Option("output/poster_base.png", "--output", help="Output base image path"),
):
    """Generate base poster image from prompt JSON."""
    prompt_data = ImagePrompt.model_validate_json(Path(prompt_json).read_text())
    generate_image(
        prompt=prompt_data.full_prompt,
        aspect_ratio=prompt_data.aspect_ratio,
        image_size=prompt_data.image_size,
        output_path=output,
    )


@app.command()
def edit(
    prompt_json: str = typer.Option(..., "--prompt", help="Path to image_prompt.json"),
    base_image: str = typer.Option("output/poster_base.png", "--base", help="Path to base image"),
    output: str = typer.Option("output/poster_final.png", "--output", help="Output final image path"),
):
    """Run multi-turn image editing based on edit_plan."""
    prompt_data = ImagePrompt.model_validate_json(Path(prompt_json).read_text())
    current_image = base_image

    if not prompt_data.edit_plan:
        console.print("[yellow]No edit_plan found, copying base image to output.[/yellow]")
        shutil.copy2(base_image, output)
        return

    for idx, instruction in enumerate(prompt_data.edit_plan, start=1):
        step_output = f"output/poster_step_{idx}.png"
        try:
            current_image = edit_image(
                image_path=current_image,
                instruction=instruction,
                aspect_ratio=prompt_data.aspect_ratio,
                output_path=step_output,
            )
        except Exception as e:
            console.print(f"[red]Edit step {idx} failed: {e}[/red]")
            break

    # Copy last successful step to final output
    shutil.copy2(current_image, output)
    console.print(f"[green]✓[/green] Final poster saved to {output}")


@app.command()
def check(
    image: str = typer.Option(..., "--image", help="Path to final poster image"),
    output: str = typer.Option("output/qa_report.json", "--output", help="Output QA report JSON"),
):
    """Run QA checks on final poster PNG."""
    img_path = Path(image)
    out_dir = img_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    report = QAReport(
        passed=True,
        checks={},
        screenshots=QAScreenshots(desktop=str(img_path.absolute()), mobile=str(img_path.absolute())),
        signals=[],
    )

    # Check file exists and size
    file_check = QACheckItem(passed=img_path.exists())
    if not file_check.passed:
        file_check.violations.append("Final image file not found")
        report.signals.append("image_missing")
    else:
        size_mb = img_path.stat().st_size / (1024 * 1024)
        if size_mb < 0.05:
            file_check.passed = False
            file_check.violations.append(f"File size too small ({size_mb:.2f} MB)")
            report.signals.append("image_size_too_small")
    report.checks["file_integrity"] = file_check.model_dump()

    # Check image dimensions
    dim_check = QACheckItem(passed=False)
    try:
        with Image.open(img_path) as im:
            w, h = im.size
            dim_check.passed = w >= 512 and h >= 512
            if not dim_check.passed:
                dim_check.violations.append(f"Dimensions {w}x{h} below 512px threshold")
                report.signals.append("image_resolution_low")
    except Exception as e:
        dim_check.violations.append(f"Cannot read image: {e}")
        report.signals.append("image_corrupted")
    report.checks["dimensions"] = dim_check.model_dump()

    report.passed = all(v.get("passed", False) for v in report.checks.values())

    out_path = Path(output)
    out_path.write_text(report.model_dump_json(indent=2), encoding="utf-8")
    console.print(f"[green]✓[/green] QA report written to {output}")
    if not report.passed:
        console.print(f"[yellow]⚠[/yellow] Issues found: {report.signals}")


@app.command()
def build_prompt(
    brief: str = typer.Option(..., "--brief", help="Path to brief JSON"),
    strategy: Optional[str] = typer.Option(None, "--strategy", help="Path to strategy JSON (optional)"),
    output: str = typer.Option("output/image_prompt.json", "--output", help="Output image_prompt.json path"),
):
    """Build structured image prompt from brief."""
    brief_data = PosterBrief.model_validate_json(Path(brief).read_text())
    strategy_data = None
    if strategy and Path(strategy).exists():
        strategy_data = json.loads(Path(strategy).read_text())

    image_prompt = build_image_prompt(brief_data, strategy_data)
    out_path = Path(output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(image_prompt.model_dump_json(indent=2), encoding="utf-8")
    console.print(f"[green]✓[/green] Image prompt written to {output}")


def main():
    app()


if __name__ == "__main__":
    main()
